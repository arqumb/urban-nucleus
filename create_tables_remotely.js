// Quick script to create tables on Railway MySQL
const mysql = require('mysql2');

// Railway MySQL connection
const connection = mysql.createConnection({
  host: 'centerbeam.proxy.rlwy.net',
  port: 32551,
  user: 'urban_user',
  password: 'hYxDnEvRNmmxfMxsrUyrrqcshk1fCsxg',
  database: 'railway'
});

console.log('🔗 Connecting to Railway MySQL...');

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err);
    return;
  }
  console.log('✅ Connected to Railway MySQL!');
  
  // Create tables
  createTables();
});

function createTables() {
  const sql = `
-- 1. Users Table
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

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- 3. Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2) DEFAULT NULL,
  cost_per_item DECIMAL(10,2) DEFAULT NULL,
  image_url VARCHAR(500),
  category_id INT DEFAULT NULL,
  subcategory_id INT DEFAULT NULL,
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
  seo_description VARCHAR(255) DEFAULT NULL,
  url_handle VARCHAR(255) DEFAULT NULL,
  archived BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'draft', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Insert Sample Categories
INSERT IGNORE INTO categories (id, name, description) VALUES
(1, 'Sneakers', 'Premium and luxury sneakers'),
(2, 'Watches', 'Luxury and sport watches'),
(3, 'Perfumes', 'Designer and niche fragrances'),
(4, 'Bags', 'Luxury bags and accessories'),
(5, 'Accessories', 'Fashion accessories');

-- Insert Sample Products
INSERT IGNORE INTO products (id, name, description, price, compare_at_price, image_url, category_id, subcategory_id, status) VALUES
(1, 'AJ 1 Low x Travis Scott Fragment', 'Limited edition collaboration sneaker', 10499.00, 12999.00, 'https://4pfkicks.in/cdn/shop/files/0A88D887-95A5-4EC1-9D8E-BA10369666A7_700x.jpg', 1, NULL, 'active'),
(2, 'AJ 1 Low x Travis Scott Reverse Mocha', 'Exclusive Travis Scott collaboration', 9499.00, 11999.00, 'https://4pfkicks.in/cdn/shop/files/E1D540D9-FE88-44A4-8349-F35DA23E803F_700x.jpg', 1, NULL, 'active'),
(3, 'Yeezy Boost 350v2 Blue Tint', 'Comfortable and stylish Yeezy sneaker', 3999.00, 4999.00, 'https://4pfkicks.in/cdn/shop/files/E6FFA535-8532-44BA-9600-01B78A07E8BE_700x.jpg', 1, NULL, 'active'),
(4, 'Retro 4 x Off-White Sail', 'Premium basketball sneaker', 3999.00, 4999.00, 'https://4pfkicks.in/cdn/shop/files/8467E82B-1B44-45D4-A178-D5D168310B4E_700x.png', 1, NULL, 'active');
`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error creating tables:', err);
      return;
    }
    console.log('✅ Tables created successfully!');
    console.log('🎉 Database setup complete!');
    
    connection.end();
  });
}

