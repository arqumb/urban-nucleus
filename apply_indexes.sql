-- Apply database changes for Urban Nucleus E-commerce
-- Run this script to fix product media fetching issues

USE urban_nucleus;

-- Add updated_at column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update existing products to have updated_at set to created_at
UPDATE products 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add additional indexes for better media query performance
CREATE INDEX IF NOT EXISTS idx_product_images_url ON product_images(image_url);
CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_position ON product_videos(position);
CREATE INDEX IF NOT EXISTS idx_product_videos_url ON product_videos(video_url);

-- Add index for updated_at ordering (important for admin view)
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- Update covering index to include updated_at
DROP INDEX IF EXISTS idx_products_covering ON products;
CREATE INDEX IF NOT EXISTS idx_products_covering ON products(id, name, price, category_id, subcategory_id, created_at, updated_at);

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category_updated ON products(category_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_updated ON products(subcategory_id, updated_at DESC);

-- Analyze tables for optimization
ANALYZE TABLE products;
ANALYZE TABLE product_images;
ANALYZE TABLE product_videos;
ANALYZE TABLE categories;
ANALYZE TABLE subcategories;

-- Verify the changes
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'urban_nucleus' 
AND TABLE_NAME = 'products'
AND COLUMN_NAME IN ('created_at', 'updated_at');

-- Show indexes on products table
SHOW INDEX FROM products;

