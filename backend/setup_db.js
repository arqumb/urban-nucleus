const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'urban_user',
  password: '@Arqum789',
  database: 'urban_nucleus',
  port: 3306
});

async function setupDatabase() {
  console.log('Setting up Urban Nucleus database...');
  
  try {
    // Create categories table
    console.log('1. Creating categories table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    console.log('✅ Categories table created!');
    
    // Create subcategories table
    console.log('2. Creating subcategories table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Subcategories table created!');
    
    // Create products table (if not exists)
    console.log('3. Creating products table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100),
        inventory INT DEFAULT 0,
        status ENUM('active', 'draft', 'archived') DEFAULT 'active',
        category_id INT DEFAULT NULL,
        subcategory_id INT DEFAULT NULL,
        compare_at_price DECIMAL(10,2) DEFAULT NULL,
        cost_per_item DECIMAL(10,2) DEFAULT NULL,
        sku VARCHAR(100) DEFAULT NULL,
        barcode VARCHAR(100) DEFAULT NULL,
        track_inventory BOOLEAN DEFAULT TRUE,
        continue_selling BOOLEAN DEFAULT FALSE,
        weight DECIMAL(10,2) DEFAULT NULL,
        product_type VARCHAR(100) DEFAULT NULL,
        vendor VARCHAR(100) DEFAULT NULL,
        collections VARCHAR(255) DEFAULT NULL,
        tags VARCHAR(255) DEFAULT NULL,
        seo_title VARCHAR(255) DEFAULT NULL,
        seo_meta_description VARCHAR(255) DEFAULT NULL,
        seo_url_handle VARCHAR(255) DEFAULT NULL,
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Products table created!');
    
    // Create product_images table
    console.log('4. Creating product_images table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        file_path VARCHAR(500) DEFAULT NULL,
        position INT DEFAULT 1,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Product images table created!');
    
    // Create product_videos table
    console.log('5. Creating product_videos table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS product_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        video_url VARCHAR(500) DEFAULT NULL,
        file_path VARCHAR(500) DEFAULT NULL,
        position INT DEFAULT 1,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Product videos table created!');
    
    // Create product_sizes table
    console.log('6. Creating product_sizes table...');
    await pool.promise().query('DROP TABLE IF EXISTS product_sizes');
    await pool.promise().query(`
      CREATE TABLE product_sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        size VARCHAR(50) NOT NULL,
        inventory INT DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Product sizes table created!');
    
    // Create users table
    console.log('7. Creating users table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created!');
    
    // Create cart table
    console.log('8. Creating cart table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Cart table created!');
    
    // Create orders table
    console.log('9. Creating orders table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        shipping_address TEXT,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Orders table created!');
    
    // Create order_items table
    console.log('10. Creating order_items table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Order items table created!');
    
    // Create collections table
    console.log('11. Creating collections table...');
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('category', 'subcategory', 'manual') NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        url_handle VARCHAR(255) UNIQUE NOT NULL,
        category_id INT DEFAULT NULL,
        subcategory_id INT DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        seo_title VARCHAR(255) DEFAULT NULL,
        seo_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Collections table created!');
    
    // Add sample categories
    console.log('12. Adding sample categories...');
    const [existingCategories] = await pool.promise().query('SELECT * FROM categories');
    if (existingCategories.length === 0) {
      await pool.promise().query('INSERT INTO categories (name) VALUES (?)', ['Clothing']);
      await pool.promise().query('INSERT INTO categories (name) VALUES (?)', ['Electronics']);
      await pool.promise().query('INSERT INTO categories (name) VALUES (?)', ['Home & Garden']);
      await pool.promise().query('INSERT INTO categories (name) VALUES (?)', ['Sports']);
      await pool.promise().query('INSERT INTO categories (name) VALUES (?)', ['Books']);
      console.log('✅ Sample categories added!');
    } else {
      console.log('✅ Categories already exist!');
    }
    
    // Add sample subcategories
    console.log('13. Adding sample subcategories...');
    const [clothingCategory] = await pool.promise().query('SELECT id FROM categories WHERE name = ?', ['Clothing']);
    if (clothingCategory.length > 0) {
      const clothingId = clothingCategory[0].id;
      await pool.promise().query('INSERT INTO subcategories (category_id, name) VALUES (?, ?)', [clothingId, 'T-Shirts']);
      await pool.promise().query('INSERT INTO subcategories (category_id, name) VALUES (?, ?)', [clothingId, 'Jeans']);
      await pool.promise().query('INSERT INTO subcategories (category_id, name) VALUES (?, ?)', [clothingId, 'Dresses']);
      console.log('✅ Sample subcategories added!');
    }
    
    // Add admin user
    console.log('14. Adding admin user...');
    const [existingAdmin] = await pool.promise().query('SELECT * FROM users WHERE email = ?', ['bubere908@gmail.com']);
    if (existingAdmin.length === 0) {
      await pool.promise().query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
        ['Admin', 'bubere908@gmail.com', '@Arqum789']);
      console.log('✅ Admin user added!');
    } else {
      console.log('✅ Admin user already exists!');
    }
    
    // Add sample product sizes
    console.log('15. Adding sample product sizes...');
    const [existingSizes] = await pool.promise().query('SELECT * FROM product_sizes LIMIT 1');
    if (existingSizes.length === 0) {
      // Get existing product IDs
      const [products] = await pool.promise().query('SELECT id FROM products LIMIT 10');
      if (products.length > 0) {
        const sizeValues = [];
        const sizes = ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'];
        
        products.forEach(product => {
          sizes.forEach(size => {
            sizeValues.push([product.id, size, Math.floor(Math.random() * 20) + 10]);
          });
        });
        
        if (sizeValues.length > 0) {
          await pool.promise().query('INSERT INTO product_sizes (product_id, size, inventory) VALUES ?', [sizeValues]);
          console.log('✅ Sample product sizes added!');
        }
      }
    } else {
      console.log('✅ Product sizes already exist!');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('All tables created and sample data added.');
    console.log('You can now use the admin panel at: http://31.97.239.99/admin.html');
    console.log('Admin Login: bubere908@gmail.com / @Arqum789');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Error details:', error);
  }
  
  process.exit(0);
}

setupDatabase(); 