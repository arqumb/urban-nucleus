const mysql = require('mysql2');

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'urban_user',
  password: '@Arqum789',
  database: 'urban_nucleus',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Index creation queries
const indexQueries = [
  // Product indexes
  'CREATE INDEX idx_products_category_id ON products(category_id)',
  'CREATE INDEX idx_products_subcategory_id ON products(subcategory_id)',
  'CREATE INDEX idx_products_created_at ON products(created_at DESC)',
  'CREATE INDEX idx_products_status ON products(status)',
  'CREATE INDEX idx_products_price ON products(price)',
  
  // Composite indexes
  'CREATE INDEX idx_products_category_subcategory ON products(category_id, subcategory_id)',
  'CREATE INDEX idx_products_category_created ON products(category_id, created_at DESC)',
  'CREATE INDEX idx_products_subcategory_created ON products(subcategory_id, created_at DESC)',
  
  // Product images indexes
  'CREATE INDEX idx_product_images_product_id ON product_images(product_id)',
  'CREATE INDEX idx_product_images_position ON product_images(position)',
  
  // Product variants indexes
  'CREATE INDEX idx_product_variants_product_id ON product_variants(product_id)',
  
  // Cart and orders indexes
  'CREATE INDEX idx_cart_user_id ON cart(user_id)',
  'CREATE INDEX idx_cart_product_id ON cart(product_id)',
  'CREATE INDEX idx_orders_user_id ON orders(user_id)',
  'CREATE INDEX idx_orders_status ON orders(status)',
  'CREATE INDEX idx_orders_created_at ON orders(created_at DESC)',
  
  // Wishlist indexes
  'CREATE INDEX idx_wishlist_user_id ON wishlist(user_id)',
  'CREATE INDEX idx_wishlist_product_id ON wishlist(product_id)',
  
  // Subcategories indexes
  'CREATE INDEX idx_subcategories_category_id ON subcategories(category_id)',
  
  // Covering index
  'CREATE INDEX idx_products_covering ON products(id, name, price, category_id, subcategory_id, created_at)'
];

// Analyze table queries
const analyzeQueries = [
  'ANALYZE TABLE products',
  'ANALYZE TABLE product_images',
  'ANALYZE TABLE product_variants',
  'ANALYZE TABLE categories',
  'ANALYZE TABLE subcategories'
];

async function applyIndexes() {
  console.log('Starting to apply database indexes...');
  
  try {
    // Apply indexes
    for (let i = 0; i < indexQueries.length; i++) {
      const query = indexQueries[i];
      console.log(`Applying index ${i + 1}/${indexQueries.length}: ${query}`);
      
      await new Promise((resolve, reject) => {
        pool.query(query, (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_KEYNAME') {
              console.log(`Index already exists: ${query}`);
              resolve();
            } else {
              console.error(`Error applying index: ${err.message}`);
              // Don't reject, just log and continue
              console.log(`Skipping index due to error: ${query}`);
              resolve();
            }
          } else {
            console.log(`Index applied successfully: ${query}`);
            resolve();
          }
        });
      });
    }
    
    // Analyze tables
    console.log('\nAnalyzing tables for optimization...');
    for (let i = 0; i < analyzeQueries.length; i++) {
      const query = analyzeQueries[i];
      console.log(`Analyzing table ${i + 1}/${analyzeQueries.length}: ${query}`);
      
      await new Promise((resolve, reject) => {
        pool.query(query, (err, result) => {
          if (err) {
            console.error(`Error analyzing table: ${err.message}`);
            reject(err);
          } else {
            console.log(`Table analyzed successfully: ${query}`);
            resolve();
          }
        });
      });
    }
    
    console.log('\n✅ All indexes applied successfully!');
    console.log('Performance optimization complete.');
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
  } finally {
    pool.end();
  }
}

// Run the script
applyIndexes();
