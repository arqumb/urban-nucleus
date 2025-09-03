-- Add sample product sizes data
USE urban_nucleus;

-- Insert sample product sizes
INSERT IGNORE INTO product_sizes (product_id, size, inventory) VALUES
(1, 'US 7', 10), (1, 'US 8', 15), (1, 'US 9', 20), (1, 'US 10', 18), (1, 'US 11', 12),
(2, 'US 7', 8), (2, 'US 8', 12), (2, 'US 9', 16), (2, 'US 10', 14), (2, 'US 11', 10),
(3, 'US 7', 15), (3, 'US 8', 20), (3, 'US 9', 25), (3, 'US 10', 22), (3, 'US 11', 18),
(4, 'US 7', 12), (4, 'US 8', 16), (4, 'US 9', 20), (4, 'US 10', 18), (4, 'US 11', 14),
(13, 'US 7', 10), (13, 'US 8', 15), (13, 'US 9', 20), (13, 'US 10', 18), (13, 'US 11', 12),
(14, 'US 7', 8), (14, 'US 8', 12), (14, 'US 9', 16), (14, 'US 10', 14), (14, 'US 11', 10);

-- Verify the data was inserted
SELECT * FROM product_sizes ORDER BY product_id, size;

-- Limited Edition Drops Table
USE urban_nucleus;

-- Create limited edition drops table
CREATE TABLE IF NOT EXISTS limited_edition_drops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create limited edition drop products table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS limited_edition_drop_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drop_id INT NOT NULL,
  product_id INT NOT NULL,
  position INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drop_id) REFERENCES limited_edition_drops(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_drop_product (drop_id, product_id)
);

-- Insert sample limited edition drop
INSERT INTO limited_edition_drops (title, description, start_date, end_date) VALUES
('Summer 2024 Limited Collection', 'Exclusive summer drops with premium quality', 
 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Add limited_edition column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS limited_edition BOOLEAN DEFAULT FALSE;

-- Add limited_edition_drop_id to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS limited_edition_drop_id INT DEFAULT NULL;

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_limited_edition_drop 
FOREIGN KEY (limited_edition_drop_id) REFERENCES limited_edition_drops(id) ON DELETE SET NULL;


