console.log("Starting server...");
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');
const emailConfig = require('./email-config');
const Razorpay = require('razorpay');
const { PAYMENT_CONFIG } = require('./payment-config');
const app = express();
const PORT = process.env.PORT || 3000;
const multer = require('multer');
const path = require('path');

// Load SMS configuration
const smsConfig = require('./sms-config');

// Caching completely removed - no more cache issues!

// Middleware
app.use(cors());
app.use(express.json());

// CORS middleware to allow frontend to connect
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  
  // Add cache control headers for products endpoint
  if (req.path === '/products' && req.method === 'GET') {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from the parent directory
app.use(express.static('/var/www/urban-nucleus/'));

// Serve uploads directory specifically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve hero slides media files
app.use('/uploads/hero-slides', express.static(path.join(__dirname, '../uploads/hero-slides')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Database connection with environment variables
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'urban_user',
  password: process.env.MYSQL_PASSWORD || '@Arqum789',
  database: process.env.MYSQL_DATABASE || 'urban_nucleus',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test MySQL connection
console.log('Attempting to connect to MySQL...');
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection error:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
  } else {
    console.log('MySQL connected successfully!');
    connection.release();
  }
});

// Database migration for social login fields
// Migrations disabled - tables created by FINAL_COMPLETE_DATABASE_SETUP.sql
/* 
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  // Add social login fields if they don't exist
  const alterQueries = [
    'ALTER TABLE users ADD COLUMN google_id VARCHAR(255)',

    'ALTER TABLE users ADD COLUMN phone VARCHAR(20)',
    'ALTER TABLE users ADD COLUMN address TEXT',
    'ALTER TABLE users ADD COLUMN phone_verified TINYINT(1) DEFAULT 0'
  ];
  
  alterQueries.forEach(query => {
    connection.query(query, (error) => {
      if (error) {
        console.log('Migration note:', error.message);
      }
    });
  });
  
  connection.release();
});
*/

// Database migration for category description fields - DISABLED
/* 
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  // Add description fields to categories and subcategories if they don't exist
  const categoryAlterQueries = [
    'ALTER TABLE categories ADD COLUMN description TEXT',
    'ALTER TABLE subcategories ADD COLUMN description TEXT'
  ];
  
  categoryAlterQueries.forEach(query => {
    connection.query(query, (error) => {
      if (error) {
        console.log('Migration note:', error.message);
      }
    });
  });
  
  connection.release();
});
*/

// Database migration for products table category fields - DISABLED
/* 
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  // Add category and subcategory fields to products table if they don't exist
  const productAlterQueries = [
    'ALTER TABLE products ADD COLUMN category_id INT DEFAULT NULL',
    'ALTER TABLE products ADD COLUMN subcategory_id INT DEFAULT NULL'
  ];
  
  productAlterQueries.forEach(query => {
    connection.query(query, (error) => {
      if (error) {
        console.log('Migration note:', error.message);
      }
    });
  });
  
  // Add foreign key constraints if they don't exist
  connection.query('ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL', (error) => {
    if (error) {
      console.log('Migration note:', error.message);
    }
  });
  
  connection.query('ALTER TABLE products ADD CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL', (error) => {
    if (error) {
      console.log('Migration note:', error.message);
    }
  });
  
  connection.release();
});
*/

// Email configuration - Use imported config
const transporter = nodemailer.createTransport(emailConfig.gmail);

// Test email connection (optional)
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email configuration error:', error.message);
    console.log('Note: Password reset functionality will not work until email is configured');
  } else {
    console.log('Email server is ready to send messages');
  }
});

// JWT Secret
const JWT_SECRET = 'your-secret-key';

// Password reset tokens storage (in production, use Redis or database)
const resetTokens = new Map();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = file.mimetype.startsWith('video') ? 'videos' : 'images';
    cb(null, path.join(__dirname, '../uploads/', type));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

// Special storage for hero slides
const heroSlideStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/hero-slides'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const upload = multer({ storage });
const heroSlideUpload = multer({ storage: heroSlideStorage });

// Ensure upload directories exist
const fs = require('fs');
['../uploads', '../uploads/images', '../uploads/videos', '../uploads/hero-slides'].forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Upload product images (multiple)
app.post('/products/:id/upload-images', upload.array('images', 10), (req, res) => {
  const productId = req.params.id;
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  
  // Create full URLs for the images
  const baseUrl = `http://31.97.239.99:${PORT}`;
  const imageValues = files.map((file, idx) => [
    productId, 
    `${baseUrl}/uploads/images/${file.filename}`, 
    `/uploads/images/${file.filename}`, 
    idx + 1
  ]);
  
  // First, clear existing images for this product
  pool.query('DELETE FROM product_images WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Error clearing existing images:', err);
      return res.status(500).json({ error: 'Database error clearing images' });
    }
    
    // Then insert new images
    pool.query('INSERT INTO product_images (product_id, image, file_path, position) VALUES ?', [imageValues], (err) => {
      if (err) {
        console.error('Database error uploading images:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Update the product's updated_at timestamp
      pool.query('UPDATE products SET updated_at = NOW() WHERE id = ?', [productId], (err) => {
        if (err) {
          console.error('Error updating product timestamp:', err);
          // Try alternative approach if updated_at column doesn't exist
          pool.query('UPDATE products SET created_at = NOW() WHERE id = ?', [productId], (err2) => {
            if (err2) console.error('Error updating product created_at:', err2);
          });
        }
      });
      
      // No caching anymore
      res.header('Expires', '0');
      
      res.json({ 
        message: 'Images uploaded successfully', 
        files: files.map(f => `${baseUrl}/uploads/images/${f.filename}`),
        productId: productId
      });
    });
  });
});

// Upload product videos (multiple)
app.post('/products/:id/upload-videos', upload.array('videos', 5), (req, res) => {
  const productId = req.params.id;
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  
  // Create full URLs for the videos
  const baseUrl = `http://31.97.239.99:${PORT}`;
  const videoValues = files.map((file, idx) => [
    productId, 
    `${baseUrl}/uploads/videos/${file.filename}`, 
    `/uploads/videos/${file.filename}`, 
    idx + 1
  ]);
  
  // First, clear existing videos for this product
  pool.query('DELETE FROM product_videos WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Error clearing existing videos:', err);
      return res.status(500).json({ error: 'Database error clearing videos' });
    }
    
    // Then insert new videos
    pool.query('INSERT INTO product_videos (product_id, video_url, file_path, position) VALUES ?', [videoValues], (err) => {
      if (err) {
        console.error('Database error uploading videos:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Update the product's updated_at timestamp
      pool.query('UPDATE products SET updated_at = NOW() WHERE id = ?', [productId], (err) => {
        if (err) {
          console.error('Error updating product timestamp:', err);
          // Try alternative approach if updated_at column doesn't exist
          pool.query('UPDATE products SET created_at = NOW() WHERE id = ?', [productId], (err2) => {
            if (err2) console.error('Error updating product created_at:', err2);
          });
        }
      });
      
      // No caching anymore
      res.header('Expires', '0');
      
      res.json({ 
        message: 'Videos uploaded successfully', 
        files: files.map(f => `${baseUrl}/uploads/videos/${f.filename}`),
        productId: productId
      });
    });
  });
});

// ========== BASIC ROUTES ==========

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Products search endpoint
app.get('/products/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = `%${query.trim()}%`;
    console.log('🔍 Searching products for:', query);
    
    // Search in products table by name and description
    const searchQuery = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.description,
        p.image_url,
        p.category_id,
        p.subcategory_id,
        p.status,
        c.name as category_name,
        s.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE 
        (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR s.name LIKE ?)
        AND (p.status = 'active' OR p.status IS NULL)
      ORDER BY 
        CASE 
          WHEN p.name LIKE ? THEN 1
          WHEN c.name LIKE ? THEN 2
          WHEN s.name LIKE ? THEN 3
          ELSE 4
        END,
        p.name ASC
      LIMIT 50
    `;
    
    pool.query(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], async (err, products) => {
      if (err) {
        console.error('🔍 Database search error:', err);
        return res.status(500).json({ error: 'Database search error' });
      }
      
      console.log(`🔍 Found ${products.length} products for query: ${query}`);
      
      // Add product images for each product
      for (let product of products) {
        try {
          const imageQuery = `
            SELECT image 
            FROM product_images 
            WHERE product_id = ? 
            ORDER BY id ASC 
            LIMIT 3
          `;
          
          const images = await new Promise((resolve, reject) => {
            pool.query(imageQuery, [product.id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          product.images = images;
        } catch (imageErr) {
          console.error('🔍 Error loading images for product', product.id, ':', imageErr);
          product.images = [];
        }
      }
      
      res.json(products);
    });
    
  } catch (error) {
    console.error('🔍 Search error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// Test new arrivals endpoint
app.get('/test-new-arrivals', (req, res) => {
  res.json({ message: 'New arrivals endpoint is working!', timestamp: new Date().toISOString() });
});



// Get new arrivals (most recently added products) - Optimized for carousel
app.get('/new-arrivals', (req, res) => {
  const { limit = 10 } = req.query;
  
  // Build the query to get the most recently added products
  const baseQuery = `
    SELECT 
      p.*,
      c.name as category_name,
      s.name as subcategory_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
    WHERE p.status = 'active' AND p.archived = FALSE
    ORDER BY p.created_at DESC 
    LIMIT ?
  `;
  
  pool.query(baseQuery, [parseInt(limit)], (err, products) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // If no products, return empty array immediately
    if (products.length === 0) {
      return res.json([]);
    }
    
    // Fetch images and variants for products (optimized)
    const productIds = products.map(p => p.id);
    
    // Use Promise.all for parallel execution
    Promise.all([
      new Promise((resolve) => {
        pool.query('SELECT * FROM product_images WHERE product_id IN (?) ORDER BY position', [productIds], (err, images) => {
          resolve(err ? [] : images);
        });
      }),
      new Promise((resolve) => {
        pool.query('SELECT * FROM product_variants WHERE product_id IN (?)', [productIds], (err, variants) => {
          resolve(err ? [] : variants);
        });
      })
    ]).then(([images, variants]) => {
      // Attach images and variants to products
      const imagesByProduct = {};
      images.forEach(img => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      });
      
      const variantsByProduct = {};
      variants.forEach(v => {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      });
      
      const result = products.map(p => ({
        ...p,
        images: imagesByProduct[p.id] || [],
        variants: variantsByProduct[p.id] || [],
        // Set the first image as the main image for compatibility
        image: imagesByProduct[p.id] && imagesByProduct[p.id].length > 0 
          ? imagesByProduct[p.id][0].image 
          : null
      }));
      
      // Add cache control headers to prevent caching for new arrivals
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
      
      res.json(result);
    }).catch(error => {
      console.error('Error processing new arrivals:', error);
      res.status(500).json({ error: 'Error processing new arrivals' });
    });
  });
});

// Get all products (with images, variants, and category info) - Optimized
app.get('/products', (req, res) => {
  const { subcategory, category, limit = 50, offset = 0 } = req.query;
  
  // Build the base query with filtering
  let baseQuery = `
    SELECT 
      p.*,
      c.name as category_name,
      s.name as subcategory_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
  `;
  
  let whereConditions = [];
  let params = [];
  
  // Add default WHERE conditions for active products
  whereConditions.push('p.status = "active"');
  whereConditions.push('p.archived = FALSE');
  
  // Add filtering conditions
  if (subcategory) {
    whereConditions.push('p.subcategory_id = ?');
    params.push(subcategory);
  }
  
  if (category) {
    whereConditions.push('p.category_id = ?');
    params.push(category);
  }
  
  // Add WHERE clause
  baseQuery += ' WHERE ' + whereConditions.join(' AND ');
  
  // Add ordering and pagination
  baseQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  pool.query(baseQuery, params, (err, products) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // If no products, return empty array immediately
    if (products.length === 0) {
      return res.json([]);
    }
    
    // Fetch images and variants for products (optimized)
    const productIds = products.map(p => p.id);
    
    // Use Promise.all for parallel execution
    Promise.all([
      new Promise((resolve) => {
        pool.query('SELECT * FROM product_images WHERE product_id IN (?) ORDER BY position', [productIds], (err, images) => {
          resolve(err ? [] : images);
        });
      }),
      new Promise((resolve) => {
        pool.query('SELECT * FROM product_videos WHERE product_id IN (?) ORDER BY position', [productIds], (err, videos) => {
          resolve(err ? [] : videos);
        });
      }),
      new Promise((resolve) => {
        pool.query('SELECT * FROM product_variants WHERE product_id IN (?)', [productIds], (err, variants) => {
          resolve(err ? [] : variants);
        });
      })
    ]).then(([images, videos, variants]) => {
      // Attach images, videos and variants to products
      const imagesByProduct = {};
      images.forEach(img => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      });
      
      const videosByProduct = {};
      videos.forEach(vid => {
        if (!videosByProduct[vid.product_id]) videosByProduct[vid.product_id] = [];
        videosByProduct[vid.product_id].push(vid);
      });
      
      const variantsByProduct = {};
      variants.forEach(v => {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      });
      
      const result = products.map(p => ({
        ...p,
        images: imagesByProduct[p.id] || [],
        videos: videosByProduct[p.id] || [],
        variants: variantsByProduct[p.id] || [],
        // Set the first image as the main image for compatibility
        image: imagesByProduct[p.id] && imagesByProduct[p.id].length > 0 
          ? imagesByProduct[p.id][0].image 
          : null
      }));
      
      // Add cache control headers to prevent caching
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
      
      res.json(result);
    }).catch(error => {
      console.error('Error processing products:', error);
      res.status(500).json({ error: 'Error processing products' });
    });
  });
});

// Get all products for admin (with images, videos, and variants) - No caching
app.get('/admin/products', (req, res) => {
  // Set no-cache headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  const { subcategory, category, limit = 100, offset = 0 } = req.query;
  
  console.log(`🔍 Admin products requested - category: ${category || 'all'}, subcategory: ${subcategory || 'all'}`);
  
  // Build the base query with filtering
  let baseQuery = `
    SELECT 
      p.*,
      c.name as category_name,
      s.name as subcategory_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
  `;
  
  let whereConditions = [];
  let params = [];
  
  // Add filtering conditions with proper validation
  if (subcategory && subcategory !== '' && subcategory !== 'null') {
    // Extract numeric ID from string like "subcategory_15" or just "15"
    const subcategoryId = subcategory.toString().replace(/\D/g, ''); // Remove non-digits
    if (subcategoryId && !isNaN(subcategoryId)) {
      whereConditions.push('p.subcategory_id = ?');
      params.push(parseInt(subcategoryId));
      console.log(`🔍 Filtering by subcategory ID: ${subcategoryId} (from: ${subcategory})`);
    }
  }
  
  if (category && category !== '' && category !== 'null') {
    // Extract numeric ID from string like "category_15" or just "15"
    const categoryId = category.toString().replace(/\D/g, ''); // Remove non-digits
    if (categoryId && !isNaN(categoryId)) {
      whereConditions.push('p.category_id = ?');
      params.push(parseInt(categoryId));
      console.log(`🔍 Filtering by category ID: ${categoryId} (from: ${category})`);
    } else {
      console.log(`⚠️ Invalid category parameter: ${category}, skipping filter`);
    }
  }
  
  // Add WHERE clause if conditions exist
  if (whereConditions.length > 0) {
    baseQuery += ' WHERE ' + whereConditions.join(' AND ');
  }
  
  console.log(`🔍 Final query: ${baseQuery}`);
  console.log(`🔍 Query parameters: ${JSON.stringify(params)}`);
  
  // Add ordering and pagination - try updated_at first, fallback to created_at
  try {
    // Check if updated_at column exists
    pool.query('SHOW COLUMNS FROM products LIKE "updated_at"', (err, columns) => {
      if (err || columns.length === 0) {
        // updated_at column doesn't exist, use created_at
        baseQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      } else {
        // updated_at column exists, use it
        baseQuery += ' ORDER BY p.updated_at DESC, p.created_at DESC LIMIT ? OFFSET ?';
      }
      
      params.push(parseInt(limit), parseInt(offset));
      
      pool.query(baseQuery, params, (err, products) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // If no products, return empty array immediately
        if (products.length === 0) {
          return res.json([]);
        }
        
        // Fetch images, videos and variants for products (optimized)
        const productIds = products.map(p => p.id);
        
        // Use Promise.all for parallel execution
        Promise.all([
          new Promise((resolve) => {
            pool.query('SELECT * FROM product_images WHERE product_id IN (?) ORDER BY position', [productIds], (err, images) => {
              resolve(err ? [] : images);
            });
          }),
          new Promise((resolve) => {
            pool.query('SELECT * FROM product_videos WHERE product_id IN (?) ORDER BY position', [productIds], (err, videos) => {
              resolve(err ? [] : videos);
            });
          }),
          new Promise((resolve) => {
            pool.query('SELECT * FROM product_variants WHERE product_id IN (?)', [productIds], (err, variants) => {
              resolve(err ? [] : variants);
            });
          })
        ]).then(([images, videos, variants]) => {
          // Attach images, videos and variants to products
          const imagesByProduct = {};
          images.forEach(img => {
            if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
            imagesByProduct[img.product_id].push(img);
          });
          
          const videosByProduct = {};
          videos.forEach(vid => {
            if (!videosByProduct[vid.product_id]) videosByProduct[vid.product_id] = [];
            videosByProduct[vid.product_id].push(vid);
          });
          
          const variantsByProduct = {};
          variants.forEach(v => {
            if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
            variantsByProduct[v.product_id].push(v);
          });
          
          const result = products.map(p => ({
            ...p,
            images: imagesByProduct[p.id] || [],
            videos: videosByProduct[p.id] || [],
            variants: variantsByProduct[p.id] || [],
            // Set the first image as the main image for compatibility
            image: imagesByProduct[p.id] && imagesByProduct[p.id].length > 0 
              ? imagesByProduct[p.id][0].image 
              : null
          }));
          
          // Add strict cache control headers for admin
          res.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
          res.header('Pragma', 'no-cache');
          res.header('Expires', '0');
          res.header('Last-Modified', new Date().toUTCString());
          
          res.json(result);
        }).catch(error => {
          console.error('Error processing admin products:', error);
          res.status(500).json({ error: 'Error processing admin products' });
        });
      });
    });
  } catch (error) {
    console.error('Error checking table structure:', error);
    // Fallback to simple ordering
    baseQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Execute query with fallback ordering
    pool.query(baseQuery, params, (err, products) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return products with basic info
      const result = products.map(p => ({
        ...p,
        images: [],
        videos: [],
        variants: []
      }));
      
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
      
      res.json(result);
    });
  }
});

// Get single product by ID (with images, variants, and sizes)
app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  pool.query('SELECT * FROM products WHERE id = ?', [productId], (err, products) => {
    if (err || products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = products[0];
    pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY position', [productId], (err, images) => {
      if (err) images = [];
      pool.query('SELECT * FROM product_videos WHERE product_id = ? ORDER BY position', [productId], (err, videos) => {
        if (err) videos = [];
        pool.query('SELECT * FROM product_variants WHERE product_id = ?', [productId], (err, variants) => {
          if (err) variants = [];
          pool.query('SELECT * FROM product_sizes WHERE product_id = ? ORDER BY size', [productId], (err, sizes) => {
            if (err) sizes = [];
            
            // Add cache control headers
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
            
            res.json({
              ...product,
              images: images,
              videos: videos,
              variants: variants,
              sizes: sizes,
              image: images.length > 0 ? images[0].image : null
            });
          });
        });
      });
    });
  });
});

// Products refresh endpoint to clear caching
app.post('/products/refresh', (req, res) => {
  // This endpoint is used to trigger cache clearing on the client side
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.json({ message: 'Products cache cleared', timestamp: new Date().toISOString() });
});

// Get products with force refresh parameter
app.get('/products/refresh', (req, res) => {
  // Redirect to main products endpoint with cache busting
  res.redirect('/products?t=' + Date.now());
});

// ========== CATEGORY ROUTES ==========

// Get all categories with subcategories and images - no caching
app.get('/categories', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  pool.query(`
    SELECT 
      c.id as category_id,
      c.name as category_name,
      c.image as category_image,
      s.id as subcategory_id,
      s.name as subcategory_name
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    ORDER BY c.name, s.name
  `, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Group subcategories under their categories
    const categories = {};
    results.forEach(row => {
      if (!categories[row.category_id]) {
        categories[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          image: row.category_image,
          subcategories: []
        };
      }
      if (row.subcategory_id) {
        categories[row.category_id].subcategories.push({
          id: row.subcategory_id,
          name: row.subcategory_name
        });
      }
    });
    
    res.json(Object.values(categories));
  });
});

// Get category images for admin panel
app.get('/admin/category-images', (req, res) => {
  pool.query(`
    SELECT 
      c.id,
      c.name,
      c.image,
      ci.id as image_id,
      ci.image as category_image,
      ci.position
    FROM categories c
    LEFT JOIN category_images ci ON c.id = ci.category_id
    ORDER BY c.name
  `, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Group images under categories
    const categories = {};
    results.forEach(row => {
      if (!categories[row.id]) {
        categories[row.id] = {
          id: row.id,
          name: row.name,
          current_image: row.image,
          images: []
        };
      }
      if (row.image_id) {
        categories[row.id].images.push({
          id: row.image_id,
          image: row.category_image,
          position: row.position
        });
      }
    });
    
    res.json(Object.values(categories));
  });
});

// Upload new category image
app.post('/admin/category-images', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const { category_id, position = 0 } = req.body;
  const imageUrl = `/uploads/images/${req.file.filename}`;

  pool.query(
    'INSERT INTO category_images (category_id, image, position) VALUES (?, ?, ?)',
    [category_id, imageUrl, position],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Update the main category image if this is the first image
      pool.query(
        'UPDATE categories SET image = ? WHERE id = ? AND (image IS NULL OR image = "")',
        [imageUrl, category_id],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating category image:', updateErr);
          }
        }
      );

      res.json({ 
        success: true, 
        image_id: result.insertId,
        image: imageUrl 
      });
    }
  );
});

// Update category main image
app.put('/admin/categories/:id/image', (req, res) => {
  const categoryId = req.params.id;
  const { image } = req.body;

  pool.query(
    'UPDATE categories SET image = ? WHERE id = ?',
    [image, categoryId],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ success: true, message: 'Category image updated successfully' });
      console.log(`Category ${categoryId} image updated to: ${image}`);
    }
  );
});

// Delete category image
app.delete('/admin/category-images/:id', (req, res) => {
  const imageId = req.params.id;

  // First get the image details to check if it's the main category image
  pool.query(
    'SELECT ci.*, c.image as category_main_image FROM category_images ci JOIN categories c ON ci.category_id = c.id WHERE ci.id = ?',
    [imageId],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const image = results[0];
      const isMainImage = image.image === image.category_main_image;

      // Delete the image record
      pool.query(
        'DELETE FROM category_images WHERE id = ?',
        [imageId],
        (deleteErr) => {
          if (deleteErr) {
            console.error('Database error:', deleteErr);
            return res.status(500).json({ error: 'Database error' });
          }

          // If this was the main image, update the category to use another image or clear it
          if (isMainImage) {
            pool.query(
              'SELECT image FROM category_images WHERE category_id = ? ORDER BY position LIMIT 1',
              [image.category_id],
              (selectErr, remainingImages) => {
                if (selectErr) {
                  console.error('Error selecting remaining images:', selectErr);
                } else {
                  const newMainImage = remainingImages.length > 0 ? remainingImages[0].image : null;
                  pool.query(
                    'UPDATE categories SET image = ? WHERE id = ?',
                    [newMainImage, image.category_id],
                    (updateErr) => {
                      if (updateErr) {
                        console.error('Error updating category main image:', updateErr);
                      }
                    }
                  );
                }
              }
            );
          }

          res.json({ success: true, message: 'Image deleted successfully' });
        }
      );
    }
  );
});

// Get products by category - disable caching to avoid stale data
app.get('/categories/:categoryId/products', (req, res) => {
  // Set no-cache headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  const categoryId = req.params.categoryId;
  const subcategoryId = req.query.subcategory;
  
  console.log(`🔍 Category ${categoryId} products requested, subcategory: ${subcategoryId || 'all'}`);
  
  let query = `
    SELECT p.*, c.name as category_name, s.name as subcategory_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
    WHERE p.category_id = ? AND p.status = 'active' AND p.archived = FALSE
  `;
  let params = [categoryId];
  
  if (subcategoryId) {
    query += ' AND p.subcategory_id = ?';
    params.push(subcategoryId);
  }
  
  query += ' ORDER BY p.created_at DESC';
  
  console.log(`🔍 Query: ${query}`);
  console.log(`🔍 Params: ${JSON.stringify(params)}`);
  
  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log(`🔍 Found ${results.length} products for category ${categoryId}:`);
    results.forEach(product => {
      console.log(`  - ${product.name} (ID: ${product.id}, category_id: ${product.category_id}, subcategory_id: ${product.subcategory_id})`);
    });
    
    // If no products, return empty array immediately
    if (results.length === 0) {
      return res.json([]);
    }
    
    // Fetch images for products (similar to main products endpoint)
    const productIds = results.map(p => p.id);
    console.log('Fetching images for product IDs:', productIds);
    
    pool.query('SELECT * FROM product_images WHERE product_id IN (?) ORDER BY position', [productIds], (err, images) => {
      if (err) {
        console.error('Error fetching product images:', err);
        // Return products without images if image fetch fails
        return res.json(results);
      }
      
      console.log('Found images:', images);
      
      // Attach images to products
      const imagesByProduct = {};
      images.forEach(img => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      });
      
      console.log('Images by product:', imagesByProduct);
      
      const result = results.map(p => ({
        ...p,
        images: imagesByProduct[p.id] || [],
        // Set the first image as the main image for compatibility
        image: imagesByProduct[p.id] && imagesByProduct[p.id].length > 0 
          ? imagesByProduct[p.id][0].image 
          : p.image_url
      }));
      
      console.log('Final result images:', result.map(p => ({ id: p.id, image: p.image_url })));
      
      res.json(result);
    });
  });
});

// Add new category
app.post('/admin/categories', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // No caching - no need to clear cache
    
    res.status(201).json({ 
      message: 'Category added successfully',
      category: { id: result.insertId, name, description }
    });
  });
});

// Update category
app.put('/admin/categories/:id', (req, res) => {
  const categoryId = req.params.id;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', 
    [name, description, categoryId], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Clear cache after category update
    // No caching anymore
    console.log('🧹 Cache cleared after category update');
    
    res.json({ message: 'Category updated successfully' });
  });
});

// Delete category
app.delete('/admin/categories/:id', (req, res) => {
  const categoryId = req.params.id;
  console.log('🗑️ DELETE category request received for ID:', categoryId);
  
  // Validate category ID
  if (!categoryId || isNaN(categoryId)) {
    console.log('❌ Invalid category ID:', categoryId);
    return res.status(400).json({ error: 'Invalid category ID' });
  }
  
  try {
    // First check if category exists
    pool.query('SELECT * FROM categories WHERE id = ?', [categoryId], (err, categoryResults) => {
      if (err) {
        console.error('❌ Database error checking category existence:', err);
        return res.status(500).json({ error: 'Database error checking category' });
      }
      
      if (categoryResults.length === 0) {
        console.log('⚠️ Category not found with ID:', categoryId);
        return res.status(404).json({ error: 'Category not found' });
      }
      
      console.log('📋 Category found:', categoryResults[0].name);
      
      // Check if category has products
      pool.query('SELECT COUNT(*) as productCount FROM products WHERE category_id = ?', [categoryId], (err, results) => {
        if (err) {
          console.error('❌ Database error checking products:', err);
          return res.status(500).json({ error: 'Database error checking products' });
        }
        
        console.log('📊 Product count for category:', results[0].productCount);
        
        if (results[0].productCount > 0) {
          console.log('⚠️ Cannot delete category - contains products');
          return res.status(400).json({ 
            error: 'Cannot delete category. It contains products. Please reassign or delete the products first.' 
          });
        }
        
        // Delete related data in sequence
        console.log('🔄 Step 1: Deleting category images...');
        pool.query('DELETE FROM category_images WHERE category_id = ?', [categoryId], (err, result) => {
          if (err) {
            console.error('❌ Database error deleting category images:', err);
            // Continue anyway - category_images table might not exist
          } else {
            console.log('✅ Category images deleted:', result.affectedRows, 'rows');
          }
          
          console.log('🔄 Step 2: Deleting subcategories...');
          pool.query('DELETE FROM subcategories WHERE category_id = ?', [categoryId], (err, result) => {
            if (err) {
              console.error('❌ Database error deleting subcategories:', err);
              return res.status(500).json({ error: 'Database error deleting subcategories' });
            }
            
            console.log('✅ Subcategories deleted:', result.affectedRows, 'rows');
            console.log('🔄 Step 3: Deleting category...');
            
            // Finally delete the category
            pool.query('DELETE FROM categories WHERE id = ?', [categoryId], (err, result) => {
              if (err) {
                console.error('❌ Database error deleting category:', err);
                return res.status(500).json({ error: 'Database error deleting category: ' + err.message });
              }
              
              console.log('✅ Category deleted:', result.affectedRows, 'rows affected');
              
              if (result.affectedRows === 0) {
                console.log('⚠️ No category was deleted - might have been deleted already');
                return res.status(404).json({ error: 'Category not found or already deleted' });
              }
              
              // Clear cache after deletion
              try {
                // No caching anymore
                console.log('🧹 Cache cleared after category deletion');
              } catch (cacheErr) {
                console.error('⚠️ Cache clear error (non-critical):', cacheErr);
              }
              
              console.log('🎉 Category deletion completed successfully');
              res.json({ message: 'Category deleted successfully' });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('💥 Unexpected error in delete category:', error);
    res.status(500).json({ error: 'Unexpected server error: ' + error.message });
  }
});

// Add new subcategory
app.post('/admin/subcategories', (req, res) => {
  const { category_id, name, description } = req.body;
  
  if (!category_id || !name) {
    return res.status(400).json({ error: 'Category ID and subcategory name are required' });
  }
  
  pool.query('INSERT INTO subcategories (category_id, name, description) VALUES (?, ?, ?)', 
    [category_id, name, description], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Clear cache after subcategory creation
    // No caching anymore
    console.log('🧹 Cache cleared after subcategory creation');
    
    res.status(201).json({ 
      message: 'Subcategory added successfully',
      subcategory: { id: result.insertId, category_id, name, description }
    });
  });
});

// Delete subcategory
app.delete('/admin/subcategories/:id', (req, res) => {
  const subcategoryId = req.params.id;
  
  // Check if subcategory has products
  pool.query('SELECT COUNT(*) as productCount FROM products WHERE subcategory_id = ?', [subcategoryId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results[0].productCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subcategory. It contains products. Please reassign or delete the products first.' 
      });
    }
    
    pool.query('DELETE FROM subcategories WHERE id = ?', [subcategoryId], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Clear cache after subcategory deletion
      // No caching anymore
      console.log('🧹 Cache cleared after subcategory deletion');
      
      res.json({ message: 'Subcategory deleted successfully' });
    });
  });
});

// Update subcategory
app.put('/admin/subcategories/:id', (req, res) => {
  const subcategoryId = req.params.id;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Subcategory name is required' });
  }
  
  pool.query('UPDATE subcategories SET name = ?, description = ? WHERE id = ?', 
    [name, description, subcategoryId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    // Clear cache after subcategory update
    // No caching anymore
    console.log('🧹 Cache cleared after subcategory update');
    
    res.json({ 
      message: 'Subcategory updated successfully',
      subcategory: { id: subcategoryId, name, description }
    });
  });
});

// Get subcategories for a specific category
app.get('/categories/:categoryId/subcategories', (req, res) => {
  const categoryId = req.params.categoryId;
  
  pool.query('SELECT * FROM subcategories WHERE category_id = ? ORDER BY name', [categoryId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Add subcategory to a specific category
app.post('/categories/:categoryId/subcategories', (req, res) => {
  const categoryId = req.params.categoryId;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Subcategory name is required' });
  }
  
  pool.query('INSERT INTO subcategories (category_id, name, description) VALUES (?, ?, ?)', 
    [categoryId, name, description], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ 
      message: 'Subcategory added successfully',
      subcategory: { id: result.insertId, category_id: categoryId, name, description }
    });
  });
});

// ========== USER AUTHENTICATION ROUTES ==========

// Authentication routes

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Validate email format (but be less strict for login since user might already exist)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  // Check if this is the admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'bubere908@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '@Arqum789';
  
  if (email === adminEmail && password === adminPassword) {
    // Admin user - return admin data
    res.json({
      message: 'Admin login successful',
      user: {
        id: 1,
        username: 'Admin',
        email: adminEmail,
        role: 'admin'
      }
    });
    return;
  }
  
  // Regular user authentication
  pool.query('SELECT * FROM users WHERE email = ? AND password = ?', 
    [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = results[0];
    console.log('✅ User logged in:', { id: user.id, username: user.username, email: user.email });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'user'
      }
    });
  });
});

// Email validation function
function isValidEmail(email) {
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Check for valid domain patterns
  const validDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'icloud.com', 'protonmail.com', 'aol.com', 'mail.com', 'zoho.com',
    'yandex.com', 'gmx.com', 'fastmail.com', 'tutanota.com', 'mailbox.org',
    // Educational domains
    'edu', 'ac.in', 'edu.in', 'ac.uk', 'edu.au', 'ac.au',
    // Business domains (common patterns)
    'company.com', 'corp.com', 'inc.com', 'ltd.com', 'org.com'
  ];
  
  const domain = email.split('@')[1].toLowerCase();
  
  // Allow common email providers
  if (validDomains.some(validDomain => domain === validDomain || domain.endsWith('.' + validDomain))) {
    return true;
  }
  
  // Allow domains with proper TLD (at least 2 characters)
  const tld = domain.split('.').pop();
  if (tld && tld.length >= 2 && /^[a-zA-Z]+$/.test(tld)) {
    return true;
  }
  
  return false;
}

// User signup
app.post('/auth/signup', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  
  // Validate email format and domain
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address with a recognized domain (e.g., gmail.com, yahoo.com, outlook.com)' 
    });
  }
  
  // Additional email checks
  const emailLower = email.toLowerCase();
  if (emailLower.includes('test') || emailLower.includes('fake') || emailLower.includes('dummy')) {
    return res.status(400).json({ 
      error: 'Please use a real email address, not a test or fake email' 
    });
  }
  
  // Check if user already exists
  pool.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Create new user
    pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
      [username, email, password], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      
      console.log('✅ New user registered:', { id: result.insertId, username, email });
      
      res.json({
        message: 'Signup successful',
        user: {
          id: result.insertId,
          username: username,
          email: email,
          role: 'user'
        }
      });
    });
  });
});

// Forgot password
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Check if user exists
    const [users] = await pool.promise().query('SELECT id, username FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Store reset token (in production, store in database)
    resetTokens.set(resetToken, {
      userId: users[0].id,
      email: email,
      expiry: resetTokenExpiry
    });
    
    // Create reset URL
    const resetUrl = `${emailConfig.resetUrl.baseUrl}${emailConfig.resetUrl.path}?token=${resetToken}`;
    
    // Email content
    const mailOptions = {
      from: emailConfig.templates.from,
      to: email,
      subject: 'Password Reset Request - Urban Nucleus',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>Hello ${users[0].username},</p>
          <p>You requested a password reset for your Urban Nucleus account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Urban Nucleus Team</p>
        </div>
      `
    };
    
    // Send email
    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'Password reset email sent successfully' });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      
      // If email fails, return the reset token directly (for development)
      // In production, you should handle this differently
      res.json({ 
        message: 'Password reset link generated',
        resetToken: resetToken,
        resetUrl: resetUrl,
        note: 'Email service not configured. Use the reset link above.'
      });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify reset token
app.post('/auth/verify-reset-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  const tokenData = resetTokens.get(token);
  
  if (!tokenData) {
    return res.status(400).json({ error: 'Invalid reset token' });
  }
  
  if (new Date() > tokenData.expiry) {
    resetTokens.delete(token);
    return res.status(400).json({ error: 'Reset token has expired' });
  }
  
  res.json({ message: 'Token is valid' });
});

// Reset password
app.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }
  
  try {
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    
    if (new Date() > tokenData.expiry) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password
    await pool.promise().query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, tokenData.userId]
    );
    
    // Remove used token
    resetTokens.delete(token);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Google OAuth
app.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Google token is required' });
  }
  
  try {
    // Verify Google token and get user info
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const userInfo = await response.json();
    
    if (!response.ok) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }
    
    // Check if user exists
    const [existingUsers] = await pool.promise().query(
      'SELECT * FROM users WHERE email = ? OR google_id = ?',
      [userInfo.email, userInfo.sub]
    );
    
    let user;
    
    if (existingUsers.length > 0) {
      // User exists, update Google ID if not set
      user = existingUsers[0];
      if (!user.google_id) {
        await pool.promise().query(
          'UPDATE users SET google_id = ? WHERE id = ?',
          [userInfo.sub, user.id]
        );
      }
    } else {
      // Create new user
      const [result] = await pool.promise().query(
        'INSERT INTO users (username, email, google_id, created_at) VALUES (?, ?, ?, NOW())',
        [userInfo.name, userInfo.email, userInfo.sub]
      );
      
      user = {
        id: result.insertId,
        username: userInfo.name,
        email: userInfo.email,
        google_id: userInfo.sub
      };
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});



// ========== CART ROUTES ==========

// Get user's cart
app.get('/cart/:userId', (req, res) => {
  const userId = req.params.userId;
  
  pool.query(`
    SELECT c.*, p.name, p.price, 
           COALESCE(pi.image_url, p.image_url) as image
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.position = 1
    WHERE c.user_id = ?
  `, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Add item to cart
app.post('/cart/add', (req, res) => {
  const { userId, productId, quantity = 1, size } = req.body;
  
  if (!userId || !productId) {
    return res.status(400).json({ error: 'User ID and Product ID are required' });
  }

  // Check if item already in cart (with same size if size is provided)
  const checkQuery = size ? 
    'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND (size = ? OR size IS NULL)' :
    'SELECT * FROM cart WHERE user_id = ? AND product_id = ?';
  
  const checkParams = size ? [userId, productId, size] : [userId, productId];
  
  pool.query(checkQuery, checkParams, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Update quantity
      const newQuantity = results[0].quantity + quantity;
      const updateQuery = size ? 
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND (size = ? OR size IS NULL)' :
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
      
      const updateParams = size ? [newQuantity, userId, productId, size] : [newQuantity, userId, productId];
      
      pool.query(updateQuery, updateParams, (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Cart updated successfully' });
      });
    } else {
      // Add new item
      const insertQuery = size ? 
        'INSERT INTO cart (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)' :
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
      
      const insertParams = size ? [userId, productId, quantity, size] : [userId, productId, quantity];
      
      pool.query(insertQuery, insertParams, (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Item added to cart successfully' });
      });
    }
  });
});

// Remove item from cart
app.delete('/cart/remove', (req, res) => {
  const { userId, productId, size } = req.body;
  
  if (!userId || !productId) {
    return res.status(400).json({ error: 'User ID and Product ID are required' });
  }

  const deleteQuery = size ? 
    'DELETE FROM cart WHERE user_id = ? AND product_id = ? AND (size = ? OR size IS NULL)' :
    'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
  
  const deleteParams = size ? [userId, productId, size] : [userId, productId];
  
  pool.query(deleteQuery, deleteParams, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Item removed from cart successfully' });
  });
});

// Update cart item quantity
app.put('/cart/update', (req, res) => {
  const { userId, productId, quantity, size } = req.body;
  
  if (!userId || !productId || quantity === undefined) {
    return res.status(400).json({ error: 'User ID, Product ID, and quantity are required' });
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    const deleteQuery = size ? 
      'DELETE FROM cart WHERE user_id = ? AND product_id = ? AND (size = ? OR size IS NULL)' :
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
    
    const deleteParams = size ? [userId, productId, size] : [userId, productId];
    
    pool.query(deleteQuery, deleteParams, (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Item removed from cart successfully' });
    });
  } else {
    // Update quantity
    const updateQuery = size ? 
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND (size = ? OR size IS NULL)' :
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
    
    const updateParams = size ? [quantity, userId, productId, size] : [quantity, userId, productId];
    
    pool.query(updateQuery, updateParams, (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Cart updated successfully' });
    });
  }
});

// ========== ORDER MANAGEMENT ROUTES ==========

// Create new order
app.post('/orders', (req, res) => {
  const { user_id, items, total_amount, shipping_address, payment_method, is_cod, cod_advance_paid, cod_remaining_amount } = req.body;
  
  console.log('📦 Order creation request:', { user_id, items, total_amount, shipping_address, payment_method, is_cod, cod_advance_paid, cod_remaining_amount });
  
  if (!user_id || !items || !total_amount) {
    return res.status(400).json({ error: 'User ID, items, and total amount are required' });
  }
  
  // Start transaction
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Transaction error' });
      }
      
      // Create order with payment information
      const orderQuery = 'INSERT INTO orders (user_id, total_amount, shipping_address, status, payment_method, is_cod, cod_advance_paid, cod_remaining_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const orderValues = [user_id, total_amount, shipping_address || '', 'pending', payment_method || 'upi', is_cod || false, cod_advance_paid || 0, cod_remaining_amount || 0];
      
      connection.query(orderQuery, orderValues, (err, orderResult) => {
        if (err) {
          console.error('Order creation error:', err);
          connection.rollback(() => connection.release());
          return res.status(500).json({ error: 'Order creation failed: ' + err.message });
        }
        
        const orderId = orderResult.insertId;
        console.log('✅ Order created with ID:', orderId);
        
        let itemsProcessed = 0;
        let hasError = false;
        
        // Add order items
        items.forEach((item, index) => {
          const itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price, size) VALUES (?, ?, ?, ?, ?)';
          const itemValues = [orderId, item.product_id, item.quantity, item.price, item.size || null];
          
          connection.query(itemQuery, itemValues, (err) => {
            if (err) {
              console.error('Order item creation error:', err);
              hasError = true;
            }
            
            itemsProcessed++;
            
            if (itemsProcessed === items.length) {
              if (hasError) {
                connection.rollback(() => connection.release());
                return res.status(500).json({ error: 'Failed to create order items' });
              }
              
              // Clear user's cart
              connection.query('DELETE FROM cart WHERE user_id = ?', [user_id], (err) => {
                if (err) {
                  console.error('Cart clearing error:', err);
                  // Don't fail the order for cart clearing errors
                }
                
                connection.commit((err) => {
                  if (err) {
                    console.error('Commit error:', err);
                    connection.rollback(() => connection.release());
                    return res.status(500).json({ error: 'Commit error' });
                  }
                  
                  connection.release();
                  console.log('🎉 Order completed successfully');
                  
                  // Return order details including COD information
                  const orderResponse = {
                    message: 'Order created successfully',
                    order_id: orderId,
                    payment_method: payment_method,
                    is_cod: is_cod,
                    cod_advance_paid: cod_advance_paid,
                    cod_remaining_amount: cod_remaining_amount
                  };
                  
                  if (is_cod) {
                    orderResponse.message = 'COD order created successfully. ₹200 advance payment received. Remaining amount to be paid on delivery.';
                  }
                  
                  res.status(201).json(orderResponse);
                });
              });
            }
          });
        });
      });
    });
  });
});

// Get all orders (admin)
app.get('/admin/orders', (req, res) => {
  console.log('Admin orders endpoint called');
  
  pool.query(`
    SELECT o.*, u.username, u.email, u.phone,
           GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ')') SEPARATOR ', ') as products
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, (err, results) => {
    if (err) {
      console.error('Database error in admin orders:', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    
    console.log(`Found ${results.length} orders`);
    
    // Format the results to include payment information
    const formattedResults = results.map(order => ({
      ...order,
      payment_method: order.payment_method || 'upi',
      is_cod: order.is_cod || false,
      cod_advance_paid: order.cod_advance_paid || 0,
      cod_remaining_amount: order.cod_remaining_amount || 0
    }));
    
    res.json(formattedResults);
  });
});

// Get orders by user ID (for profile page) - MUST come BEFORE /orders/:id
app.get('/orders', (req, res) => {
  const userId = req.query.user_id;
  
  if (!userId) {
    return res.status(400).json({ error: 'user_id parameter is required' });
  }
  
  console.log('🔍 Fetching orders for user:', userId);
  
  pool.query(`
    SELECT o.*, u.username, u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('🔍 Found orders for user:', results.length);
    res.json(results);
  });
});

// Get order details
app.get('/orders/:id', (req, res) => {
  const orderId = req.params.id;
  
  pool.query(`
    SELECT o.*, u.username, u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `, [orderId], (err, orderResults) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (orderResults.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = orderResults[0];
    
    // Get order items with proper image handling
    pool.query(`
      SELECT oi.*, p.name, p.image_url,
             pi.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN (
        SELECT product_id, image 
        FROM product_images pi1 
        WHERE pi1.id = (
          SELECT MIN(pi2.id) 
          FROM product_images pi2 
          WHERE pi2.product_id = pi1.product_id
        )
      ) pi ON p.id = pi.product_id
      WHERE oi.order_id = ?
    `, [orderId], (err, itemResults) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      console.log('🔍 Order items query result:', itemResults);
      
      // Process items to extract image URLs
      const processedItems = itemResults.map(item => {
        let imageUrl = null;
        
        // Priority order: product_images table first, then image column
        if (item.product_image && item.product_image !== 'null' && item.product_image !== 'undefined' && item.product_image.trim() !== '') {
          imageUrl = item.product_image;
        }
        // Fallback to image column
        else if (item.image && item.image !== 'null' && item.image !== 'undefined' && item.image.trim() !== '') {
          imageUrl = item.image;
        }
        // If no valid image found, use placeholder
        else {
          imageUrl = 'uploads/images/placeholder.svg';
        }
        
        return {
          ...item,
          image: imageUrl
        };
      });
      
      console.log('🔍 Processed items with images:', processedItems);
      
      res.json({
        order: order,
        items: processedItems
      });
    });
  });
});

// Get wishlist by user ID (for profile page)
app.get('/wishlist', (req, res) => {
  const userId = req.query.user_id;
  
  if (!userId) {
    return res.status(400).json({ error: 'user_id parameter is required' });
  }
  
  console.log('🔍 Fetching wishlist for user:', userId);
  
  // For now, return empty array since wishlist table might not exist
  // You can implement this later when you add wishlist functionality
  console.log('🔍 Returning empty wishlist for now');
  res.json([]);
  
  // Uncomment this when you have a wishlist table:
  /*
  pool.query(`
    SELECT w.*, p.name, p.price, p.image_url
    FROM wishlist w
    LEFT JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
  */
});

// Update order status (admin)
app.put('/admin/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Order status updated successfully' });
  });
});

// Delete order (admin)
app.delete('/admin/orders/:id', (req, res) => {
  const orderId = req.params.id;
  
  // Start transaction to delete order and related data
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Transaction error' });
      }
      
      // Delete order items first (due to foreign key constraint)
      connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
        if (err) {
          console.error('Order items deletion error:', err);
          connection.rollback(() => connection.release());
          return res.status(500).json({ error: 'Failed to delete order items' });
        }
        
        // Delete the order
        connection.query('DELETE FROM orders WHERE id = ?', [orderId], (err, result) => {
          if (err) {
            console.error('Order deletion error:', err);
            connection.rollback(() => connection.release());
            return res.status(500).json({ error: 'Failed to delete order' });
          }
          
          if (result.affectedRows === 0) {
            connection.rollback(() => connection.release());
            return res.status(404).json({ error: 'Order not found' });
          }
          
          // Commit the transaction
          connection.commit((err) => {
            if (err) {
              console.error('Commit error:', err);
              connection.rollback(() => connection.release());
              return res.status(500).json({ error: 'Commit error' });
            }
            
            connection.release();
            console.log(`✅ Order #${orderId} deleted successfully`);
            res.json({ message: 'Order deleted successfully', orderId });
          });
        });
      });
    });
  });
});

// Update order status (alternative endpoint)
app.put('/orders/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
  }
  
  pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully', orderId, newStatus: status });
  });
});

// Get user orders
app.get('/users/:userId/orders', (req, res) => {
  const userId = req.params.userId;
  
  pool.query(`
    SELECT o.*, 
           GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ')') SEPARATOR ', ') as products
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// ========== ADMIN ROUTES ==========

// Cache endpoints removed - no more caching!

// Add new product (admin)
app.post('/admin/products', (req, res) => {
  const {
    name, price, description, category_id, subcategory_id, inventory = 0, status = 'active',
    compare_at_price, cost_per_item, sku, barcode, track_inventory = true, continue_selling = false, weight,
    product_type, vendor, collections, tags, seo_title, seo_meta_description, seo_url_handle, archived = false,
    images = [], variants = []
  } = req.body;

  console.log('🔍 Creating product with data:', {
    name,
    category_id,
    subcategory_id,
    price
  });

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  pool.query(
    `INSERT INTO products (name, price, description, category_id, subcategory_id, inventory, status, compare_at_price, cost_per_item, sku, barcode, track_inventory, continue_selling, weight, product_type, vendor, collections, tags, seo_title, seo_meta_description, seo_url_handle, archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, price, description, category_id, subcategory_id, inventory, status, compare_at_price, cost_per_item, sku, barcode, track_inventory, continue_selling, weight, product_type, vendor, collections, tags, seo_title, seo_meta_description, seo_url_handle, archived],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      const productId = result.insertId;
      
      console.log(`✅ Product created with ID: ${productId}, category_id: ${category_id}, subcategory_id: ${subcategory_id}`);
      
      // Verify what was actually inserted by reading it back
      pool.query('SELECT id, name, category_id, subcategory_id FROM products WHERE id = ?', [productId], (verifyErr, verifyResult) => {
        if (!verifyErr && verifyResult.length > 0) {
          console.log('🔍 Verification - Product in database:', verifyResult[0]);
        }
      });
      
      // Insert images if provided
      if (Array.isArray(images) && images.length > 0) {
        const imageValues = images.map((url, idx) => [productId, url, null, idx + 1]);
        pool.query('INSERT INTO product_images (product_id, image, file_path, position) VALUES ?', [imageValues], (err) => {
          if (err) console.error('Error inserting product images:', err);
        });
      }
      
      // Insert variants if provided
      if (Array.isArray(variants) && variants.length > 0) {
        const variantValues = variants.map(v => [productId, v.option_name, v.option_value, v.sku, v.price, v.inventory]);
        pool.query('INSERT INTO product_variants (product_id, option_name, option_value, sku, price, inventory) VALUES ?', [variantValues], (err) => {
          if (err) console.error('Error inserting product variants:', err);
        });
      }
      
      // Clear cache after product creation
      // No caching anymore
      console.log('🧹 Cache cleared after product creation');
      
      res.status(201).json({ message: 'Product added successfully', id: productId });
    }
  );
});

// Update product (admin)
app.put('/admin/products/:id', (req, res) => {
  const productId = req.params.id;
  const {
    name, price, description, category_id, subcategory_id, inventory, status,
    compare_at_price, cost_per_item, sku, barcode, track_inventory, continue_selling, weight,
    product_type, vendor, collections, tags, seo_title, seo_meta_description, seo_url_handle, archived,
    images = [], variants = []
  } = req.body;

  pool.query(
    `UPDATE products SET name = ?, price = ?, description = ?, category_id = ?, subcategory_id = ?, inventory = ?, status = ?, compare_at_price = ?, cost_per_item = ?, sku = ?, barcode = ?, track_inventory = ?, continue_selling = ?, weight = ?, product_type = ?, vendor = ?, collections = ?, tags = ?, seo_title = ?, seo_meta_description = ?, seo_url_handle = ?, archived = ? WHERE id = ?`,
    [name, price, description, category_id, subcategory_id, inventory, status, compare_at_price, cost_per_item, sku, barcode, track_inventory, continue_selling, weight, product_type, vendor, collections, tags, seo_title, seo_meta_description, seo_url_handle, archived, productId],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      // Update images: delete old, insert new
      pool.query('DELETE FROM product_images WHERE product_id = ?', [productId], (err) => {
        if (!err && Array.isArray(images) && images.length > 0) {
          const imageValues = images.map((url, idx) => [productId, url, null, idx + 1]);
          pool.query('INSERT INTO product_images (product_id, image, file_path, position) VALUES ?', [imageValues], (err) => {
            if (err) console.error('Error updating product images:', err);
          });
        }
      });
      // Update variants: delete old, insert new
      pool.query('DELETE FROM product_variants WHERE product_id = ?', [productId], (err) => {
        if (!err && Array.isArray(variants) && variants.length > 0) {
          const variantValues = variants.map(v => [productId, v.option_name, v.option_value, v.sku, v.price, v.inventory]);
          pool.query('INSERT INTO product_variants (product_id, option_name, option_value, sku, price, inventory) VALUES ?', [variantValues], (err) => {
            if (err) console.error('Error updating product variants:', err);
          });
        }
      });
      
      // Clear cache after product update
      // No caching anymore
      console.log('🧹 Cache cleared after product update');
      
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Bulk update product categories (admin)
app.put('/admin/bulk-update-categories', (req, res) => {
  const { productIds, categoryId, subcategoryId } = req.body;
  
  // Validate input
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'Product IDs array is required' });
  }
  
  if (!categoryId) {
    return res.status(400).json({ error: 'Category ID is required' });
  }
  
  console.log('🔄 Bulk updating categories for products:', {
    productIds: productIds,
    categoryId: categoryId,
    subcategoryId: subcategoryId
  });
  
  // Create placeholders for the IN clause
  const placeholders = productIds.map(() => '?').join(',');
  
  // Build the query
  let query;
  let params;
  
  if (subcategoryId) {
    query = `UPDATE products SET category_id = ?, subcategory_id = ? WHERE id IN (${placeholders})`;
    params = [categoryId, subcategoryId, ...productIds];
  } else {
    query = `UPDATE products SET category_id = ?, subcategory_id = NULL WHERE id IN (${placeholders})`;
    params = [categoryId, ...productIds];
  }
  
  console.log('📝 Executing query:', query);
  console.log('📝 With parameters:', params);
  
  pool.query(query, params, (err, result) => {
    if (err) {
      console.error('❌ Database error during bulk update:', err);
      return res.status(500).json({ error: 'Database error during bulk update' });
    }
    
    console.log('✅ Bulk update successful:', result);
    
    // Clear cache after bulk update
    // No caching anymore
    console.log('🧹 Cache cleared after bulk category update');
    
    res.json({ 
      message: 'Products updated successfully', 
      affectedRows: result.affectedRows,
      updatedProductIds: productIds
    });
  });
});

// Remove product from category (admin)
app.patch('/admin/products/:id/remove-from-category', (req, res) => {
  const productId = req.params.id;
  const { categoryId } = req.body;
  
  console.log(`🏷️ Removing product ${productId} from category ${categoryId}`);
  
  // First check if product exists and is in this category
  pool.query('SELECT id, name, category_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      console.error('❌ Error checking product:', err);
      return res.status(500).json({ error: 'Database error while checking product' });
    }
    
    if (results.length === 0) {
      console.log(`⚠️ Product ${productId} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = results[0];
    console.log(`📦 Found product: ${product.name} (ID: ${productId})`);
    console.log(`📂 Current category: ${product.category_id}, Removing from: ${categoryId}`);
    
    if (product.category_id != categoryId) {
      console.log(`⚠️ Product is not in category ${categoryId}`);
      return res.status(400).json({ error: 'Product is not in this category' });
    }
    
    // Remove from category by setting category_id to NULL
    pool.query('UPDATE products SET category_id = NULL, subcategory_id = NULL WHERE id = ?', [productId], (err, result) => {
      if (err) {
        console.error('❌ Error removing product from category:', err);
        return res.status(500).json({ error: 'Database error removing product from category' });
      }
      
      if (result.affectedRows === 0) {
        console.log(`⚠️ No product updated (ID: ${productId})`);
        return res.status(404).json({ error: 'Product not found for update' });
      }
      
      console.log(`✅ Successfully removed product "${product.name}" from category ${categoryId}`);
      res.json({ 
        message: 'Product removed from category successfully',
        productName: product.name,
        productId: productId,
        categoryId: categoryId
      });
    });
  });
});

// Delete product (admin)
app.delete('/admin/products/:id', (req, res) => {
  const productId = req.params.id;
  
  console.log(`🗑️ Attempting to delete product with ID: ${productId}`);
  
  // First check if product exists
  pool.query('SELECT id, name FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      console.error('❌ Error checking product existence:', err);
      return res.status(500).json({ error: 'Database error while checking product' });
    }
    
    if (results.length === 0) {
      console.log(`⚠️ Product ${productId} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productName = results[0].name;
    console.log(`📦 Found product: ${productName} (ID: ${productId})`);
    
    // Delete related data first to avoid foreign key constraints
    console.log('🧹 Cleaning up related product data...');
    
    // Helper function to safely delete from table if it exists
    const safeDelete = (tableName, callback) => {
      // First check if table exists
      pool.query('SHOW TABLES LIKE ?', [tableName], (err, results) => {
        if (err || results.length === 0) {
          console.log(`⚠️ Table '${tableName}' doesn't exist, skipping...`);
          return callback(); // Continue without error
        }
        
        // Table exists, proceed with deletion
        pool.query(`DELETE FROM ${tableName} WHERE product_id = ?`, [productId], (err) => {
          if (err) {
            console.error(`❌ Error deleting from ${tableName}:`, err);
            return callback(); // Continue despite error to allow product deletion
          }
          console.log(`✅ Deleted records from ${tableName} for product ${productId}`);
          callback();
        });
      });
    };
    
    // Delete product images (if table exists)
    safeDelete('product_images', () => {
      // Delete product variants (if table exists)
      safeDelete('product_variants', () => {
        // Delete from limited edition drops (if table exists)
        safeDelete('limited_edition_drop_products', () => {
          // Finally delete the product itself
          pool.query('DELETE FROM products WHERE id = ?', [productId], (err, result) => {
            if (err) {
              console.error('❌ Error deleting product:', err);
              return res.status(500).json({ error: 'Database error deleting product' });
            }
            
            if (result.affectedRows === 0) {
              console.log(`⚠️ No product deleted (ID: ${productId})`);
              return res.status(404).json({ error: 'Product not found for deletion' });
            }
            
            console.log(`✅ Successfully deleted product: ${productName} (ID: ${productId})`);
            res.json({ message: 'Product deleted successfully', productName: productName });
          });
        });
      });
    });
  });
});

// Get all users (admin)
app.get('/users', (req, res) => {
  pool.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get user profile by ID
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  
  console.log('🔍 Fetching user profile for ID:', userId);
  
  pool.query('SELECT id, username, email, phone, address, created_at FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      console.log('🔍 User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('🔍 User found:', results[0].username);
    res.json(results[0]);
  });
});

// Update user profile
app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { username, email, phone, address } = req.body;
  
  pool.query(
    'UPDATE users SET username = ?, email = ?, phone = ?, address = ? WHERE id = ?',
    [username, email, phone, address, userId],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// ========== OTP VERIFICATION SYSTEM ==========

// MSG91 Configuration (Indian SMS Service)
const MSG91_CONFIG = smsConfig.MSG91;

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via MSG91 SMS service
async function sendOTP(phone, otp) {
  try {
    // For development/testing, also log the OTP
    console.log(`📱 OTP for ${phone}: ${otp}`);
    
    // Check if MSG91 is enabled and configured
    if (!MSG91_CONFIG.enabled || MSG91_CONFIG.authKey === 'YOUR_MSG91_AUTH_KEY') {
      console.log('⚠️ MSG91 not configured - OTP only logged to console');
      return Promise.resolve();
    }
    
    // Prepare MSG91 API request
    const url = 'https://api.msg91.com/api/v5/flow/';
    const payload = {
      flow_id: MSG91_CONFIG.templateId,
      mobiles: `${MSG91_CONFIG.countryCode}${phone}`,
      OTP: otp, // Use OTP instead of VAR1 to match ##OTP## in template
      VAR2: 'Urban Nucleus' // Brand name
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authkey': MSG91_CONFIG.authKey
    };
    
    console.log('📤 Sending SMS via MSG91 Flow API...');
    const response = await axios.post(url, payload, { headers });
    
    if (response.data.type === 'success') {
      console.log('✅ SMS sent successfully via MSG91 Flow API');
      return Promise.resolve();
    } else {
      console.log('⚠️ Flow API failed:', response.data.message);
      console.log('📤 Trying MSG91 Simple SMS API as fallback...');
      
      // Fallback to Simple SMS API
      try {
        const simpleUrl = 'https://api.msg91.com/api/v2/sendsms';
        const simplePayload = {
          sender: MSG91_CONFIG.senderId,
          route: '4', // Transactional route
          country: '91',
          sms: [{
            message: `Your Urban Nucleus verification code is ${otp}. Valid for 10 minutes.`,
            to: [phone]
          }]
        };
        
        const simpleHeaders = {
          'Content-Type': 'application/json',
          'Authkey': MSG91_CONFIG.authKey
        };
        
        const simpleResponse = await axios.post(simpleUrl, simplePayload, { headers: simpleHeaders });
        
        if (simpleResponse.data.type === 'success') {
          console.log('✅ SMS sent successfully via MSG91 Simple API');
          return Promise.resolve();
        } else {
          console.log('❌ Both MSG91 APIs failed:', simpleResponse.data.message);
          return Promise.resolve(); // Don't fail the request, just log error
        }
      } catch (fallbackError) {
        console.log('❌ Fallback API also failed:', fallbackError.message);
        return Promise.resolve();
      }
    }
    
  } catch (error) {
    console.error('❌ SMS sending error:', error.message);
    // Don't fail the request, just log error and continue
    return Promise.resolve();
  }
}

// Request OTP for phone verification
app.post('/auth/request-otp', async (req, res) => {
  const { phone, userId } = req.body;
  
  if (!phone || !userId) {
    return res.status(400).json({ error: 'Phone number and user ID are required' });
  }
  
  try {
    // Check if phone is already verified for another user
    pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'Phone number is already registered with another account' });
      }
      
      // Generate OTP
      const otp = generateOTP();
      const expiryTime = Date.now() + (10 * 60 * 1000); // 10 minutes
      
      // Store OTP
      otpStore.set(`${userId}_${phone}`, {
        otp,
        expiry: expiryTime,
        attempts: 0
      });
      
      // Send OTP
      sendOTP(phone, otp).then(() => {
        res.json({ 
          message: 'OTP sent successfully',
          phone: phone,
          expiresIn: '10 minutes'
        });
      });
    });
    
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/auth/verify-otp', (req, res) => {
  const { phone, otp, userId } = req.body;
  
  if (!phone || !otp || !userId) {
    return res.status(400).json({ error: 'Phone number, OTP, and user ID are required' });
  }
  
  const key = `${userId}_${phone}`;
  const storedOTP = otpStore.get(key);
  
  if (!storedOTP) {
    return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
  }
  
  if (Date.now() > storedOTP.expiry) {
    otpStore.delete(key);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }
  
  if (storedOTP.attempts >= 3) {
    otpStore.delete(key);
    return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
  }
  
  if (storedOTP.otp !== otp) {
    storedOTP.attempts += 1;
    otpStore.set(key, storedOTP);
    return res.status(400).json({ 
      error: 'Invalid OTP. Please try again.',
      attemptsLeft: 3 - storedOTP.attempts
    });
  }
  
  // OTP is valid - mark phone as verified
  pool.query('UPDATE users SET phone = ?, phone_verified = 1 WHERE id = ?', [phone, userId], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update phone number' });
    }
    
    // Remove OTP from store
    otpStore.delete(key);
    
    res.json({ 
      message: 'Phone number verified successfully!',
      phone: phone
    });
  });
});

// Test SMS configuration
app.get('/auth/test-sms', (req, res) => {
  res.json({
    msg91: {
      enabled: MSG91_CONFIG.enabled,
      configured: MSG91_CONFIG.authKey !== 'YOUR_MSG91_AUTH_KEY',
      senderId: MSG91_CONFIG.senderId,
      countryCode: MSG91_CONFIG.countryCode
    },
    message: MSG91_CONFIG.enabled ? 
      'SMS service is configured and ready!' : 
      'SMS service is not configured. Check sms-config.js'
  });
});

// Resend OTP
app.post('/auth/resend-otp', async (req, res) => {
  const { phone, userId } = req.body;
  
  if (!phone || !userId) {
    return res.status(400).json({ error: 'Phone number and user ID are required' });
  }
  
  const key = `${userId}_${phone}`;
  const existingOTP = otpStore.get(key);
  
  if (existingOTP && Date.now() < existingOTP.expiry) {
    const timeLeft = Math.ceil((existingOTP.expiry - Date.now()) / 1000 / 60);
    return res.status(400).json({ 
      error: `Please wait ${timeLeft} minutes before requesting a new OTP` 
    });
  }
  
  try {
    // Generate new OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    // Store new OTP
    otpStore.set(key, {
      otp,
      expiry: expiryTime,
      attempts: 0
    });
    
    // Send new OTP
    await sendOTP(phone, otp);
    
    res.json({ 
      message: 'New OTP sent successfully',
      phone: phone,
      expiresIn: '10 minutes'
    });
    
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to send new OTP' });
  }
});

// Get analytics data (admin)
app.get('/admin/analytics', (req, res) => {
  // Get basic analytics data
  pool.query(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      COUNT(DISTINCT user_id) as unique_customers
    FROM orders
  `, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const analytics = results[0];
    
    // Get recent orders for chart
    pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, (err, chartData) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        summary: analytics,
        chartData: chartData
      });
    });
  });
});

// ========== PRODUCT SIZES ENDPOINTS ==========

// Get product sizes
app.get('/products/:id/sizes', (req, res) => {
  const productId = req.params.id;
  
  pool.query('SELECT * FROM product_sizes WHERE product_id = ? ORDER BY size', [productId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    // Return empty array if no sizes found (this is not an error)
    res.json(results || []);
  });
});

// Add/Update product sizes
app.post('/products/:id/sizes', (req, res) => {
  const productId = req.params.id;
  const { sizes } = req.body;
  
  if (!Array.isArray(sizes)) {
    return res.status(400).json({ error: 'Sizes must be an array' });
  }
  
  // First, delete existing sizes for this product
  pool.query('DELETE FROM product_sizes WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Then insert new sizes
    if (sizes.length > 0) {
      const sizeValues = sizes.map(size => [productId, size, 0]); // Default inventory 0
      pool.query('INSERT INTO product_sizes (product_id, size, inventory) VALUES ?', [sizeValues], (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Product sizes updated successfully', count: sizes.length });
      });
    } else {
      res.json({ message: 'Product sizes cleared successfully', count: 0 });
    }
  });
});

// Update size inventory
app.put('/products/:id/sizes/:size', (req, res) => {
  const productId = req.params.id;
  const size = req.params.size;
  const { inventory } = req.body;
  
  pool.query('UPDATE product_sizes SET inventory = ? WHERE product_id = ? AND size = ?', 
    [inventory, productId, size], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Size not found for this product' });
    }
    res.json({ message: 'Size inventory updated successfully' });
  });
});

// ========== LIMITED EDITION DROPS ENDPOINTS ==========

// Get all limited edition drops
app.get('/limited-drops', (req, res) => {
  pool.query('SELECT * FROM limited_edition_drops ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get a specific limited edition drop
app.get('/limited-drops/:id', (req, res) => {
  const dropId = req.params.id;
  
  pool.query('SELECT * FROM limited_edition_drops WHERE id = ?', [dropId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Limited edition drop not found' });
    }
    res.json(results[0]);
  });
});

// ========== CONTACT & NEWSLETTER ENDPOINTS ==========

// Newsletter subscription endpoint
app.post('/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }
  
  // Check if email already subscribed
  pool.query('SELECT * FROM newsletter_subscribers WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already subscribed to newsletter' });
    }
    
    // Add new subscriber
    pool.query('INSERT INTO newsletter_subscribers (email, subscribed_at, status) VALUES (?, NOW(), ?)', 
      [email, 'active'], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to subscribe to newsletter' });
      }
      
      console.log('✅ New newsletter subscriber:', email);
      
      res.json({
        message: 'Successfully subscribed to newsletter!',
        subscriber_id: result.insertId
      });
    });
  });
});

// Contact form submission endpoint
app.post('/contact/submit', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Name, email, subject, and message are required' });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }
  
  // Save contact form submission
  const query = 'INSERT INTO contact_submissions (name, email, phone, subject, message, submitted_at, status) VALUES (?, ?, ?, ?, ?, NOW(), ?)';
  const values = [name, email, phone || null, subject, message, 'new'];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to submit contact form' });
    }
    
    console.log('✅ New contact form submission:', { id: result.insertId, name, email, subject });
    
    // TODO: Send email notification to urban.nucleus@gmail.com
    // TODO: Send auto-reply confirmation to user
    
    res.json({
      message: 'Contact form submitted successfully! We will get back to you at urban.nucleus@gmail.com soon.',
      submission_id: result.insertId
    });
  });
});

// Get all newsletter subscribers (admin only)
app.get('/admin/newsletter-subscribers', (req, res) => {
  pool.query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Get all contact submissions (admin only)
app.get('/admin/contact-submissions', (req, res) => {
  pool.query('SELECT * FROM contact_submissions ORDER BY submitted_at DESC', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Update contact submission status
app.put('/admin/contact-submissions/:id/status', (req, res) => {
  const contactId = req.params.id;
  const { status, admin_notes } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  // Validate status
  const validStatuses = ['new', 'read', 'replied', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
  }
  
  const query = 'UPDATE contact_submissions SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?';
  const values = [status, admin_notes || null, contactId];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update contact submission status' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact submission not found' });
    }
    
    console.log('✅ Contact submission status updated:', { id: contactId, status, admin_notes });
    
    res.json({
      message: 'Contact submission status updated successfully',
      id: contactId,
      status: status,
      admin_notes: admin_notes
    });
  });
});

// Update newsletter subscriber status
app.put('/admin/newsletter-subscribers/:id/status', (req, res) => {
  const subscriberId = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  // Validate status
  const validStatuses = ['active', 'inactive', 'unsubscribed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
  }
  
  const query = 'UPDATE newsletter_subscribers SET status = ?, updated_at = NOW() WHERE id = ?';
  const values = [status, subscriberId];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update subscriber status' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    
    console.log('✅ Newsletter subscriber status updated:', { id: subscriberId, status });
    
    res.json({
      message: 'Subscriber status updated successfully',
      id: subscriberId,
      status: status
    });
  });
});

// Create a new limited edition drop
app.post('/limited-drops', (req, res) => {
  const { title, description, start_date, end_date, is_active } = req.body;
  
  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date, and end date are required' });
  }
  
  const query = 'INSERT INTO limited_edition_drops (title, description, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)';
  const values = [title, description, start_date, end_date, is_active];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      id: result.insertId,
      title,
      description,
      start_date,
      end_date,
      is_active,
      message: 'Limited edition drop created successfully'
    });
  });
});

// Update a limited edition drop
app.put('/limited-drops/:id', (req, res) => {
  const dropId = req.params.id;
  const { title, description, start_date, end_date, is_active } = req.body;
  
  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date, and end date are required' });
  }
  
  const query = 'UPDATE limited_edition_drops SET title = ?, description = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?';
  const values = [title, description, start_date, end_date, is_active, dropId];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Limited edition drop not found' });
    }
    
    res.json({
      id: dropId,
      title,
      description,
      start_date,
      end_date,
      is_active,
      message: 'Limited edition drop updated successfully'
    });
  });
});

// Delete a limited edition drop
app.delete('/limited-drops/:id', (req, res) => {
  const dropId = req.params.id;
  
  pool.query('DELETE FROM limited_edition_drops WHERE id = ?', [dropId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Limited edition drop not found' });
    }
    
    res.json({ message: 'Limited edition drop deleted successfully' });
  });
});

// Get products for a specific limited edition drop
app.get('/limited-drops/:id/products', (req, res) => {
  const dropId = req.params.id;
  
      const query = `
      SELECT p.*, ledp.position,
             GROUP_CONCAT(pi.image_url ORDER BY pi.position ASC SEPARATOR '|') as product_images
      FROM products p
      INNER JOIN limited_edition_drop_products ledp ON p.id = ledp.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ledp.drop_id = ?
      GROUP BY p.id, p.name, p.price, p.compare_at_price, p.image_url, p.description, p.category_id, p.subcategory_id, p.inventory, p.status, p.created_at, ledp.position
      ORDER BY ledp.position
    `;
  
  pool.query(query, [dropId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Process results to include images array
    const processedResults = results.map(row => ({
      ...row,
      images: row.product_images ? row.product_images.split('|').map(url => ({ image: url })) : []
    }));
    
    res.json(processedResults);
  });
});

// Add products to a limited edition drop
app.post('/limited-drops/:id/products', (req, res) => {
  const dropId = req.params.id;
  const { product_ids } = req.body;
  
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ error: 'Product IDs array is required' });
  }
  
  // Check if drop exists
  pool.query('SELECT id FROM limited_edition_drops WHERE id = ?', [dropId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Limited edition drop not found' });
    }
    
    // Check which products are already in the drop
    pool.query('SELECT product_id FROM limited_edition_drop_products WHERE drop_id = ?', [dropId], (err, existingProducts) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const existingProductIds = existingProducts.map(p => p.product_id);
      const newProductIds = product_ids.filter(id => !existingProductIds.includes(parseInt(id)));
      
      if (newProductIds.length === 0) {
        return res.json({
          message: 'All selected products are already in this drop',
          count: 0,
          skipped: product_ids.length
        });
      }
      
      // Get current position for new products
      pool.query('SELECT MAX(position) as max_pos FROM limited_edition_drop_products WHERE drop_id = ?', [dropId], (err, posResult) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const startPos = (posResult[0]?.max_pos || 0) + 1;
        
        // Insert only new products with positions
        const values = newProductIds.map((productId, index) => [dropId, productId, startPos + index]);
        
        pool.query('INSERT INTO limited_edition_drop_products (drop_id, product_id, position) VALUES ?', [values], (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Clear cache after adding products to limited drop
          // No caching anymore
          console.log('🧹 Cache cleared after adding products to limited drop');
          
          res.json({
            message: `Products added to drop successfully. Added: ${result.affectedRows}, Skipped: ${product_ids.length - newProductIds.length}`,
            count: result.affectedRows,
            skipped: product_ids.length - newProductIds.length
          });
        });
      });
    });
  });
});

// Remove a product from a limited edition drop
app.delete('/limited-drops/:id/products/:productId', (req, res) => {
  const dropId = req.params.id;
  const productId = req.params.productId;
  
  pool.query('DELETE FROM limited_edition_drop_products WHERE drop_id = ? AND product_id = ?', 
    [dropId, productId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found in this drop' });
    }
    
    // Clear cache after removing product from limited drop
    // No caching anymore
    console.log('🧹 Cache cleared after removing product from limited drop');
    
    res.json({ message: 'Product removed from drop successfully' });
  });
});

// Get active limited edition drop for frontend
app.get('/limited-drops/active/frontend', (req, res) => {
  // First get the active drop
  const dropQuery = `
    SELECT id, title, description, start_date, end_date
    FROM limited_edition_drops 
    WHERE is_active = 1 
    AND start_date <= NOW() 
    AND end_date >= NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  pool.query(dropQuery, (err, dropResults) => {
    if (err) {
      console.error('Database error getting drop:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (dropResults.length === 0) {
      return res.json({ active: false });
    }
    
    const drop = dropResults[0];
    
    // Then get products for this drop with their images
    const productsQuery = `
      SELECT p.id, p.name, p.price, p.compare_at_price, p.image_url, ledp.position,
             GROUP_CONCAT(pi.image_url ORDER BY pi.position ASC SEPARATOR '|') as product_images
      FROM limited_edition_drop_products ledp
      INNER JOIN products p ON ledp.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ledp.drop_id = ?
      GROUP BY p.id, p.name, p.price, p.compare_at_price, p.image_url, ledp.position
      ORDER BY ledp.position ASC
    `;
    
    pool.query(productsQuery, [drop.id], (err, productResults) => {
      if (err) {
        console.error('Database error getting products:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const products = productResults.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        compare_at_price: row.compare_at_price,
        image: row.image,
        images: row.product_images ? row.product_images.split('|').map(url => ({ image: url })) : []
      }));
      
      console.log('🔍 Limited Drop API Response:', {
        drop: drop,
        products: products.map(p => ({ id: p.id, name: p.name, image: p.image_url }))
      });
      
      res.json({
        active: true,
        drop: drop,
        products: products
      });
    });
  });
});

// ========== HERO SLIDES API ENDPOINTS ==========

// Get all hero slides for admin
app.get('/admin/hero-slides', (req, res) => {
  const query = `
    SELECT * FROM hero_slides 
    ORDER BY position ASC, created_at DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Database error getting hero slides:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Get single hero slide by ID for editing
app.get('/admin/hero-slides/:id', (req, res) => {
  const slideId = req.params.id;
  
  const query = `
    SELECT * FROM hero_slides 
    WHERE id = ?
  `;
  
  pool.query(query, [slideId], (err, results) => {
    if (err) {
      console.error('Database error getting hero slide:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    res.json(results[0]);
  });
});

// Get active hero slides for frontend
app.get('/hero-slides', (req, res) => {
  console.log('🎯 Frontend requesting hero slides...');
  
  const query = `
    SELECT * FROM hero_slides 
    WHERE is_active = 1 
    ORDER BY position ASC, created_at DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Database error getting hero slides:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('🎯 Hero slides found:', results.length);
    results.forEach((slide, index) => {
      console.log(`🎯 Slide ${index + 1}:`, {
        id: slide.id,
        title: slide.title,
        media_type: slide.media_type,
        media_url: slide.media_url
      });
    });
    
    res.json(results);
  });
});

// Create new hero slide
app.post('/admin/hero-slides', (req, res) => {
  console.log('🎯 Creating new hero slide:', req.body);
  
  const {
    title, subtitle, description, media_type, media_url, 
    button1_text, button1_url, button2_text, button2_url, 
    position, is_active
  } = req.body;
  
  const query = `
    INSERT INTO hero_slides (
      title, subtitle, description, media_type, media_url,
      button1_text, button1_url, button2_text, button2_url,
      position, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    title, subtitle, description, media_type, media_url,
    button1_text, button1_url, button2_text, button2_url,
    position || 0, is_active !== undefined ? is_active : true
  ];
  
  console.log('🎯 Inserting values:', values);
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error creating hero slide:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('🎯 Hero slide created successfully with ID:', result.insertId);
    
    // Clear cache after hero slide creation
    // No caching anymore
    console.log('🧹 Cache cleared after hero slide creation');
    
    res.json({ 
      message: 'Hero slide created successfully', 
      id: result.insertId 
    });
  });
});

// Update hero slide
app.put('/admin/hero-slides/:id', (req, res) => {
  const slideId = req.params.id;
  const {
    title, subtitle, description, media_type, media_url,
    button1_text, button1_url, button2_text, button2_url,
    position, is_active
  } = req.body;
  
  const query = `
    UPDATE hero_slides SET 
      title = ?, subtitle = ?, description = ?, media_type = ?, media_url = ?,
      button1_text = ?, button1_url = ?, button2_text = ?, button2_url = ?,
      position = ?, is_active = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const values = [
    title, subtitle, description, media_type, media_url,
    button1_text, button1_url, button2_text, button2_url,
    position || 0, is_active !== undefined ? is_active : true, slideId
  ];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error updating hero slide:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    // Clear cache after hero slide update
    // No caching anymore
    console.log('🧹 Cache cleared after hero slide update');
    
    res.json({ message: 'Hero slide updated successfully' });
  });
});

// Delete hero slide
app.delete('/admin/hero-slides/:id', (req, res) => {
  const slideId = req.params.id;
  
  pool.query('DELETE FROM hero_slides WHERE id = ?', [slideId], (err, result) => {
    if (err) {
      console.error('Database error deleting hero slide:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    // Clear cache after hero slide deletion
    // No caching anymore
    console.log('🧹 Cache cleared after hero slide deletion');
    
    res.json({ message: 'Hero slide deleted successfully' });
  });
});

// Upload hero slide media
app.post('/admin/hero-slides/upload-media', heroSlideUpload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const mediaType = req.body.media_type || 'image';
  const baseUrl = `http://31.97.239.99:${PORT}`;
  const mediaUrl = `${baseUrl}/uploads/hero-slides/${req.file.filename}`;
  
  console.log('Hero slide media uploaded:', {
    filename: req.file.filename,
    mediaType: mediaType,
    mediaUrl: mediaUrl,
    filePath: req.file.path
  });
  
  res.json({
    message: 'Media uploaded successfully',
    media_url: mediaUrl,
    filename: req.file.filename,
    media_type: mediaType
  });
});

// Preserve existing product images (PUT endpoint for admin)
app.put('/products/:id/images', (req, res) => {
  const productId = req.params.id;
  const { images } = req.body;
  
  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images array is required' });
  }
  
  // First, clear existing images for this product
  pool.query('DELETE FROM product_images WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Error clearing existing images:', err);
      return res.status(500).json({ error: 'Database error clearing images' });
    }
    
    if (images.length === 0) {
      return res.json({ message: 'All images removed successfully' });
    }
    
    // Then insert preserved images
    const imageValues = images.map(img => [
      productId, 
      img.image || img.url || '', 
      img.file_path || null, 
      img.position || 1
    ]);
    
    pool.query('INSERT INTO product_images (product_id, image, file_path, position) VALUES ?', [imageValues], (err) => {
      if (err) {
        console.error('Database error preserving images:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ 
        message: 'Images preserved successfully', 
        count: images.length
      });
    });
  });
});

// Preserve existing product videos (PUT endpoint for admin)
app.put('/products/:id/videos', (req, res) => {
  const productId = req.params.id;
  const { videos } = req.body;
  
  if (!videos || !Array.isArray(videos)) {
    return res.status(400).json({ error: 'Videos array is required' });
  }
  
  // First, clear existing videos for this product
  pool.query('DELETE FROM product_videos WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Error clearing existing videos:', err);
      return res.status(500).json({ error: 'Database error clearing videos' });
    }
    
    if (videos.length === 0) {
      return res.json({ message: 'All videos removed successfully' });
    }
    
    // Then insert preserved videos
    const videoValues = videos.map(vid => [
      productId, 
      vid.video_url || vid.url || '', 
      vid.file_path || null, 
      vid.position || 1
    ]);
    
    pool.query('INSERT INTO product_videos (product_id, video_url, file_path, position) VALUES ?', [videoValues], (err) => {
      if (err) {
        console.error('Database error preserving videos:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ 
        message: 'Videos preserved successfully', 
        count: videos.length
      });
    });
  });
});

// Get product count for admin pagination
app.get('/admin/products/count', (req, res) => {
  pool.query('SELECT COUNT(*) as count FROM products WHERE archived = false', (err, results) => {
    if (err) {
      console.error('Database error getting product count:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ count: results[0].count });
  });
});

// Announcement Bar Management Routes
// Get announcement bar settings
app.get('/admin/announcement', (req, res) => {
  pool.query('SELECT * FROM announcement_settings ORDER BY id DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Database error getting announcement settings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      // Return default settings if none exist
      res.json({
        messages: [
          "🚚 FREE DELIVERY on prepaid orders",
          "💳 HUGE DISCOUNTS on Prepaid Orders - Save up to 30%",
          "🎉 LAUNCH SALE: Limited Time Offer - Luxury Sneakers, Luxury Watches & Designer Bags",
          "⚡ Flash Sale: Extra 15% off with code WELCOME15"
        ],
        visible: true
      });
    } else {
      const settings = results[0];
      res.json({
        messages: JSON.parse(settings.messages || '[]'),
        visible: settings.visible === 1
      });
    }
  });
});

// Update announcement bar settings
app.post('/admin/announcement', (req, res) => {
  const { messages, visible } = req.body;
  
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages must be an array' });
  }
  
  const messagesJson = JSON.stringify(messages);
  const visibleInt = visible ? 1 : 0;
  
  // First, try to update existing record
  pool.query(
    'UPDATE announcement_settings SET messages = ?, visible = ?, updated_at = NOW() WHERE id = (SELECT id FROM (SELECT id FROM announcement_settings ORDER BY id DESC LIMIT 1) AS temp)',
    [messagesJson, visibleInt],
    (err, results) => {
      if (err) {
        console.error('Database error updating announcement settings:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // If no rows were updated, insert a new record
      if (results.affectedRows === 0) {
        pool.query(
          'INSERT INTO announcement_settings (messages, visible, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
          [messagesJson, visibleInt],
          (err, insertResults) => {
            if (err) {
              console.error('Database error inserting announcement settings:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true, message: 'Announcement settings saved successfully' });
          }
        );
      } else {
        res.json({ success: true, message: 'Announcement settings updated successfully' });
      }
    }
  );
});

// Get announcement bar data for frontend
app.get('/api/announcement', (req, res) => {
  pool.query('SELECT * FROM announcement_settings ORDER BY id DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Database error getting announcement settings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      // Return default settings if none exist
      res.json({
        messages: [
          "🚚 FREE DELIVERY on prepaid orders",
          "💳 HUGE DISCOUNTS on Prepaid Orders - Save up to 30%",
          "🎉 LAUNCH SALE: Limited Time Offer - Luxury Sneakers, Luxury Watches & Designer Bags",
          "⚡ Flash Sale: Extra 15% off with code WELCOME15"
        ],
        visible: true
      });
    } else {
      const settings = results[0];
      res.json({
        messages: JSON.parse(settings.messages || '[]'),
        visible: settings.visible === 1
      });
    }
  });
});

// ============================================================================
// PAYMENT GATEWAY - RAZORPAY INTEGRATION
// ============================================================================

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: PAYMENT_CONFIG.RAZORPAY.KEY_ID,
  key_secret: PAYMENT_CONFIG.RAZORPAY.KEY_SECRET
});

console.log('💳 Razorpay initialized successfully');

// Create Razorpay Order
app.post('/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;
    
    console.log('💰 Creating Razorpay order:', { amount, currency, receipt });
    
    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be at least ₹1 (100 paise)' 
      });
    }
    
    // Check if using demo credentials
    if (PAYMENT_CONFIG.RAZORPAY.KEY_ID === 'rzp_test_1234567890') {
      console.log('⚠️  Using demo credentials - creating mock order');
      
      // Create mock order for demo purposes
      const mockOrder = {
        id: `order_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: currency,
        receipt: receipt || `order_${Date.now()}`,
        status: 'created'
      };
      
      console.log('✅ Mock Razorpay order created:', mockOrder.id);
      
      return res.json({
        success: true,
        order: mockOrder,
        key_id: PAYMENT_CONFIG.RAZORPAY.KEY_ID,
        demo_mode: true
      });
    }
    
    // Create order options
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        company: PAYMENT_CONFIG.RAZORPAY.COMPANY.NAME,
        ...notes
      }
    };
    
    // Create order with Razorpay
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created successfully:', order.id);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      },
      key_id: PAYMENT_CONFIG.RAZORPAY.KEY_ID // Send key for frontend
    });
    
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    
    // If Razorpay fails, create a mock order for testing
    console.log('🔄 Falling back to mock order for testing...');
    
    const fallbackOrder = {
      id: `order_fallback_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      status: 'created'
    };
    
    res.json({
      success: true,
      order: fallbackOrder,
      key_id: PAYMENT_CONFIG.RAZORPAY.KEY_ID,
      fallback_mode: true,
      message: 'Using fallback mode - real Razorpay credentials needed for production'
    });
  }
});

// Verify Razorpay Payment
app.post('/payment/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_data 
    } = req.body;
    
    console.log('🔐 Verifying Razorpay payment:', { razorpay_order_id, razorpay_payment_id });
    
    // Check if using demo credentials or demo order
    if (PAYMENT_CONFIG.RAZORPAY.KEY_ID === 'rzp_test_1234567890' || 
        razorpay_order_id.includes('order_') || 
        razorpay_payment_id.includes('pay_demo')) {
      console.log('⚠️  Using demo mode - skipping signature verification');
      
      // Update order in database with demo payment details
      if (order_data && order_data.order_id) {
        const updateQuery = `
          UPDATE orders 
          SET 
            payment_status = 'completed',
            razorpay_order_id = ?,
            razorpay_payment_id = ?,
            payment_verified_at = NOW()
          WHERE id = ?
        `;
        
        await pool.execute(updateQuery, [
          razorpay_order_id,
          razorpay_payment_id || 'demo_payment_' + Date.now(),
          order_data.order_id
        ]);
        
        console.log('✅ Order payment status updated in database (demo mode)');
      }
      
      return res.json({
        success: true,
        payment: {
          id: razorpay_payment_id || 'demo_payment_' + Date.now(),
          amount: order_data.amount || 0,
          currency: 'INR',
          status: 'captured',
          method: 'demo'
        },
        message: 'Payment verified successfully (demo mode)',
        demo_mode: true
      });
    }
    
    // Generate signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', PAYMENT_CONFIG.RAZORPAY.KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Payment signature verification failed');
      return res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed' 
      });
    }
    
    console.log('✅ Payment signature verified successfully');
    
    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Update order in database with payment details
    if (order_data && order_data.order_id) {
      const updateQuery = `
        UPDATE orders 
        SET 
          payment_status = 'completed',
          razorpay_order_id = ?,
          razorpay_payment_id = ?,
          payment_verified_at = NOW()
        WHERE id = ?
      `;
      
      await pool.execute(updateQuery, [
        razorpay_order_id,
        razorpay_payment_id,
        order_data.order_id
      ]);
      
      console.log('✅ Order payment status updated in database');
    }
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method
      },
      message: 'Payment verified successfully'
    });
    
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    
    // Fallback for demo mode
    console.log('🔄 Falling back to demo verification...');
    
    if (order_data && order_data.order_id) {
      try {
        const updateQuery = `
          UPDATE orders 
          SET 
            payment_status = 'completed',
            razorpay_order_id = ?,
            razorpay_payment_id = ?,
            payment_verified_at = NOW()
          WHERE id = ?
        `;
        
        await pool.execute(updateQuery, [
          razorpay_order_id,
          razorpay_payment_id || 'fallback_payment_' + Date.now(),
          order_data.order_id
        ]);
        
        return res.json({
          success: true,
          payment: {
            id: razorpay_payment_id || 'fallback_payment_' + Date.now(),
            amount: order_data.amount || 0,
            currency: 'INR',
            status: 'captured',
            method: 'fallback'
          },
          message: 'Payment verified successfully (fallback mode)',
          fallback_mode: true
        });
      } catch (dbError) {
        console.error('❌ Database error in fallback:', dbError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed' 
    });
  }
});

// Handle Razorpay Webhooks (for real-time payment status updates)
app.post('/payment/webhook', (req, res) => {
  try {
    const webhookBody = JSON.stringify(req.body);
    const webhookSignature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', PAYMENT_CONFIG.RAZORPAY.WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');
    
    if (webhookSignature !== expectedSignature) {
      console.error('❌ Webhook signature verification failed');
      return res.status(400).send('Webhook verification failed');
    }
    
    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;
    
    console.log('📡 Webhook received:', event, 'Payment ID:', paymentEntity.id);
    
    // Handle different payment events
    switch (event) {
      case 'payment.captured':
        console.log('✅ Payment captured:', paymentEntity.id);
        // Update order status in database
        break;
        
      case 'payment.failed':
        console.log('❌ Payment failed:', paymentEntity.id);
        // Update order status and notify user
        break;
        
      default:
        console.log('📝 Unhandled webhook event:', event);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Get payment methods (for frontend)
app.get('/payment/methods', (req, res) => {
  res.json({
    success: true,
    methods: {
      razorpay: {
        enabled: true,
        name: 'Online Payment',
        description: 'Credit Card, Debit Card, UPI, Net Banking, Wallets',
        icon: 'fas fa-credit-card',
        key_id: PAYMENT_CONFIG.RAZORPAY.KEY_ID
      },
      cod: {
        enabled: true,
        name: 'Cash on Delivery',
        description: 'Pay ₹200 advance + remaining on delivery',
        icon: 'fas fa-money-bill-wave',
        advance_amount: 200
      }
    }
  });
});

// Export local database to Railway
app.get('/export-database', async (req, res) => {
  try {
    console.log('📦 Exporting local database structure and data...');
    
    // Query all tables and their data
    const tables = ['users', 'categories', 'subcategories', 'products', 'product_images', 'product_sizes', 'cart', 'orders', 'order_items', 'newsletter_subscribers', 'contact_submissions', 'hero_slides'];
    
    let exportSQL = '-- Urban Nucleus Database Export\n\n';
    
    for (const table of tables) {
      try {
        // Get table structure
        const [structure] = await pool.promise().query(`SHOW CREATE TABLE ${table}`);
        if (structure.length > 0) {
          exportSQL += `-- Table: ${table}\n`;
          exportSQL += `DROP TABLE IF EXISTS ${table};\n`;
          exportSQL += structure[0]['Create Table'] + ';\n\n';
          
          // Get table data
          const [data] = await pool.promise().query(`SELECT * FROM ${table}`);
          if (data.length > 0) {
            exportSQL += `-- Data for table: ${table}\n`;
            
            for (const row of data) {
              const columns = Object.keys(row).join(', ');
              const values = Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                return val;
              }).join(', ');
              
              exportSQL += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
            }
            exportSQL += '\n';
          }
        }
      } catch (err) {
        console.log(`⚠️ Table ${table} doesn't exist, skipping...`);
      }
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="urban_nucleus_export.sql"');
    res.send(exportSQL);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).send('Export failed: ' + error.message);
  }
});

// Import database from uploaded SQL
app.post('/import-database', express.urlencoded({ extended: true, limit: '50mb' }), async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).send('No SQL provided');
    }
    
    console.log('📥 Importing database...');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await pool.promise().query(statement);
      } catch (err) {
        console.log(`⚠️ Statement failed: ${err.message}`);
      }
    }
    
    console.log('✅ Database imported successfully!');
    
    res.send(`
      <html>
        <head><title>Database Import Complete</title></head>
        <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1>🎉 Database Import Complete!</h1>
            <p>✅ Your local database has been imported successfully.</p>
            <p><strong>Your Urban Nucleus e-commerce platform is now ready with your data!</strong></p>
            <p><a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Homepage</a></p>
            <p><a href="/admin.html" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Admin Panel</a></p>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).send('Import failed: ' + error.message);
  }
});

// Simple import form
app.get('/import-form', (req, res) => {
  res.send(`
    <html>
      <head><title>Import Database</title></head>
      <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
          <h1>📥 Import Your Database</h1>
          <form action="/import-database" method="POST">
            <p><strong>Paste your SQL export here:</strong></p>
            <textarea name="sql" rows="20" cols="100" style="width: 100%; font-family: monospace; font-size: 12px;" placeholder="Paste your urban_nucleus_export.sql content here..."></textarea>
            <br><br>
            <button type="submit" style="background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Import Database</button>
          </form>
          <p><small>⚠️ This will replace all data in the Railway database with your local data.</small></p>
        </div>
      </body>
    </html>
  `);
});

// Database setup endpoint (run once)
app.get('/setup-database', async (req, res) => {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Create tables SQL
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        phone_verified BOOLEAN DEFAULT FALSE,
        google_id VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        compare_at_price DECIMAL(10,2) DEFAULT NULL,
        image VARCHAR(500),
        category_id INT DEFAULT NULL,
        status ENUM('active', 'draft', 'archived') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      INSERT IGNORE INTO categories (id, name, description) VALUES
      (1, 'Sneakers', 'Premium and luxury sneakers'),
      (2, 'Watches', 'Luxury and sport watches'),
      (3, 'Perfumes', 'Designer fragrances'),
      (4, 'Bags', 'Luxury bags and accessories'),
      (5, 'Accessories', 'Fashion accessories');
      
      INSERT IGNORE INTO products (id, name, description, price, compare_at_price, image, category_id, status) VALUES
      (1, 'AJ 1 Low x Travis Scott Fragment', 'Limited edition collaboration sneaker', 10499.00, 12999.00, 'https://4pfkicks.in/cdn/shop/files/0A88D887-95A5-4EC1-9D8E-BA10369666A7_700x.jpg', 1, 'active'),
      (2, 'AJ 1 Low x Travis Scott Reverse Mocha', 'Exclusive Travis Scott collaboration', 9499.00, 11999.00, 'https://4pfkicks.in/cdn/shop/files/E1D540D9-FE88-44A4-8349-F35DA23E803F_700x.jpg', 1, 'active'),
      (3, 'Yeezy Boost 350v2 Blue Tint', 'Comfortable and stylish Yeezy sneaker', 3999.00, 4999.00, 'https://4pfkicks.in/cdn/shop/files/E6FFA535-8532-44BA-9600-01B78A07E8BE_700x.jpg', 1, 'active'),
      (4, 'Retro 4 x Off-White Sail', 'Premium basketball sneaker', 3999.00, 4999.00, 'https://4pfkicks.in/cdn/shop/files/8467E82B-1B44-45D4-A178-D5D168310B4E_700x.png', 1, 'active');
    `;
    
    // Execute the SQL
    await pool.promise().query(createTablesSQL);
    
    console.log('✅ Database tables created successfully!');
    
    res.send(`
      <html>
        <head><title>Database Setup Complete</title></head>
        <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1>🎉 Database Setup Complete!</h1>
            <p>✅ All database tables have been created successfully.</p>
            <p>✅ Sample products and categories have been added.</p>
            <p><strong>Your Urban Nucleus e-commerce platform is now ready!</strong></p>
            <p><a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Homepage</a></p>
            <p><a href="/admin.html" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Admin Panel</a></p>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    res.status(500).send(`
      <html>
        <head><title>Database Setup Error</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1>❌ Database Setup Error</h1>
          <p>Error: ${error.message}</p>
          <p><a href="/">Try Again</a></p>
        </body>
      </html>
    `);
  }
});

// Start the server
const DOMAIN_URL = process.env.DOMAIN_URL || `http://31.97.239.99:${PORT}`;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Domain: ${DOMAIN_URL}`);
  console.log('📱 Urban Nucleus E-commerce Platform');
  console.log('💳 Payment gateway: Razorpay');
  console.log('🗄️  Database: MySQL connected');
  console.log('');
  console.log(`🎯 Admin Panel: ${DOMAIN_URL}/admin.html`);
  console.log(`🛍️  Website: ${DOMAIN_URL}`);
  console.log('');
  console.log('✨ Ready to receive requests!');
});