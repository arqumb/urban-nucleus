-- Urban Nucleus E-commerce Database Setup
-- Run these commands in MySQL to create all necessary tables

USE urban_nucleus;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
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

-- Insert sample categories
INSERT IGNORE INTO categories (id, name) VALUES
(1, 'Sneakers'),
(2, 'Watches'),
(3, 'Perfumes'),
(4, 'Bags'),
(5, 'Accessories');

-- Insert sample subcategories
INSERT IGNORE INTO subcategories (category_id, name) VALUES
(1, 'Running'),
(1, 'Casual'),
(1, 'Basketball'),
(1, 'Luxury'),
(2, 'Luxury'),
(2, 'Sport'),
(2, 'Casual'),
(2, 'Smart'),
(3, 'Men'),
(3, 'Women'),
(3, 'Unisex'),
(3, 'Niche'),
(4, 'Backpacks'),
(4, 'Handbags'),
(4, 'Wallets'),
(4, 'Luggage'),
(5, 'Jewelry'),
(5, 'Belts'),
(5, 'Sunglasses'),
(5, 'Hats');

-- 4. Cart Table
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 7. Products Table (Shopify-like fields)
-- First, create the products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Then add the additional columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subcategory_id INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_per_item DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS continue_selling BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS product_type VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vendor VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS collections VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tags VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seo_description VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS url_handle VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add foreign key constraints
ALTER TABLE products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE products 
ADD CONSTRAINT fk_products_subcategory 
FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

-- 8. Product Images Table (multiple images per product, file or URL)
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  position INT DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 9. Product Videos Table (multiple videos per product, file or URL)
CREATE TABLE IF NOT EXISTS product_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  video_url VARCHAR(500) DEFAULT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  position INT DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 10. Product Variants Table (for different options like size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  option_name VARCHAR(100) NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  sku VARCHAR(100) DEFAULT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  inventory INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 11. Product Sizes Table
CREATE TABLE IF NOT EXISTS product_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL,
  inventory INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 12. Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist_item (user_id, product_id)
);

-- Insert sample products if they don't exist
INSERT IGNORE INTO products (id, name, description, price, image_url, category_id, subcategory_id) VALUES
(1, 'AJ 1 Low x Travis Scott Fragment', 'Limited edition collaboration sneaker', 10499.00, 'https://4pfkicks.in/cdn/shop/files/0A88D887-95A5-4EC1-9D8E-BA10369666A7_700x.jpg?v=1745920980', 1, 2),
(2, 'AJ 1 Low x Travis Scott Reverse Mocha', 'Exclusive Travis Scott collaboration', 9499.00, 'https://4pfkicks.in/cdn/shop/files/E1D540D9-FE88-44A4-8349-F35DA23E803F_700x.jpg?v=1745921345', 1, 2),
(3, 'Yeezy Boost 350v2 Blue Tint', 'Comfortable and stylish sneaker', 3999.00, 'https://4pfkicks.in/cdn/shop/files/E6FFA535-8532-44BA-9600-01B78A07E8BE_700x.jpg?v=1745919074', 1, 1),
(4, 'Retro 4 x Off-White Sail', 'Premium basketball sneaker', 3999.00, 'https://4pfkicks.in/cdn/shop/files/8467E82B-1B44-45D4-A178-D5D168310B4E_700x.png?v=1745919630', 1, 3),
(5, 'Rolex Submariner', 'Luxury diving watch', 250000.00, 'https://via.placeholder.com/300x300/000000/ffffff?text=Rolex+Submariner', 2, 4),
(6, 'Apple Watch Series 9', 'Smart watch with health features', 45000.00, 'https://via.placeholder.com/300x300/000000/ffffff?text=Apple+Watch', 2, 7),
(7, 'Chanel N°5', 'Classic women\'s perfume', 8500.00, 'https://via.placeholder.com/300x300/FFD700/000000?text=Chanel+N5', 3, 9),
(8, 'Louis Vuitton Neverfull', 'Iconic luxury handbag', 120000.00, 'https://via.placeholder.com/300x300/8B4513/ffffff?text=LV+Neverfull', 4, 13);

-- Update existing products with categories if they don't have one
UPDATE products SET category_id = 1 WHERE category_id IS NULL LIMIT 10;

-- Insert sample product sizes
INSERT IGNORE INTO product_sizes (product_id, size, inventory) VALUES
(1, 'US 7', 10), (1, 'US 8', 15), (1, 'US 9', 20), (1, 'US 10', 18), (1, 'US 11', 12),
(2, 'US 7', 8), (2, 'US 8', 12), (2, 'US 9', 16), (2, 'US 10', 14), (2, 'US 11', 10),
(3, 'US 7', 15), (3, 'US 8', 20), (3, 'US 9', 25), (3, 'US 10', 22), (3, 'US 11', 18),
(4, 'US 7', 12), (4, 'US 8', 16), (4, 'US 9', 20), (4, 'US 10', 18), (4, 'US 11', 14),
(13, 'US 7', 10), (13, 'US 8', 15), (13, 'US 9', 20), (13, 'US 10', 18), (13, 'US 11', 12),
(14, 'US 7', 8), (14, 'US 8', 12), (14, 'US 9', 16), (14, 'US 10', 14), (14, 'US 11', 10);

-- ========== PERFORMANCE OPTIMIZATION INDEXES ==========

-- Indexes for faster product queries
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_category_subcategory ON products(category_id, subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_category_created ON products(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_created ON products(subcategory_id, created_at DESC);

-- Indexes for product images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(position);
CREATE INDEX IF NOT EXISTS idx_product_images_url ON product_images(image_url);

-- Indexes for product videos
CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_position ON product_videos(position);
CREATE INDEX IF NOT EXISTS idx_product_videos_url ON product_videos(video_url);

-- Indexes for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Indexes for cart and orders
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Indexes for wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- Indexes for subcategories
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- ========== ADDITIONAL PERFORMANCE OPTIMIZATIONS ==========

-- Add covering indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_covering ON products(id, name, price, category_id, subcategory_id, created_at, updated_at);

-- Index for updated_at ordering (important for admin view)
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- Composite index for category + updated_at queries
CREATE INDEX IF NOT EXISTS idx_products_category_updated ON products(category_id, updated_at DESC);

-- Composite index for subcategory + updated_at queries
CREATE INDEX IF NOT EXISTS idx_products_subcategory_updated ON products(subcategory_id, updated_at DESC);

-- ========== ANALYZE TABLES FOR OPTIMIZATION ==========
-- Run these commands after creating indexes to update statistics
-- ANALYZE TABLE products;
-- ANALYZE TABLE product_images;
-- ANALYZE TABLE product_variants;
-- ANALYZE TABLE categories;
-- ANALYZE TABLE subcategories; 