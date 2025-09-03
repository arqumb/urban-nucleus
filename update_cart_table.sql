-- Update cart table to include size column
USE urban_nucleus;

-- Add size column to cart table
ALTER TABLE cart ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT NULL;

-- Add index for better performance on size queries
CREATE INDEX IF NOT EXISTS idx_cart_size ON cart(size);

-- Add composite index for user_id, product_id, and size
CREATE INDEX IF NOT EXISTS idx_cart_user_product_size ON cart(user_id, product_id, size);

-- Update order_items table to include size
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT NULL;

-- Add index for order_items size
CREATE INDEX IF NOT EXISTS idx_order_items_size ON order_items(size);

-- Add status column to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'sale', 'out_of_stock') DEFAULT 'active';

-- Add inventory column to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory INT DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(inventory);

-- Update existing products to have default status
UPDATE products SET status = 'active' WHERE status IS NULL;
UPDATE products SET inventory = 100 WHERE inventory IS NULL;

-- Insert some sample sizes for existing products
INSERT IGNORE INTO product_sizes (product_id, size, inventory) VALUES
(1, 'US 7', 10),
(1, 'US 8', 15),
(1, 'US 9', 20),
(1, 'US 10', 18),
(1, 'US 11', 12),
(2, 'US 7', 8),
(2, 'US 8', 12),
(2, 'US 9', 16),
(2, 'US 10', 14),
(2, 'US 11', 10),
(3, 'US 7', 15),
(3, 'US 8', 20),
(3, 'US 9', 25),
(3, 'US 10', 22),
(3, 'US 11', 18),
(4, 'US 7', 12),
(4, 'US 8', 16),
(4, 'US 9', 20),
(4, 'US 10', 18),
(4, 'US 11', 14);

-- Update product inventory based on sizes
UPDATE products p 
SET p.inventory = (
    SELECT COALESCE(SUM(ps.inventory), 0) 
    FROM product_sizes ps 
    WHERE ps.product_id = p.id
)
WHERE p.id IN (1, 2, 3, 4);
