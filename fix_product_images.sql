-- Fix Product Images SQL Script
-- This script updates existing products to have proper image URLs

USE urban_nucleus;

-- Update products to use the uploaded images
-- First, let's see what products we have
SELECT id, name, image_url, category_id, subcategory_id FROM products;

-- Update the existing product (ID 12) to use one of the uploaded images
UPDATE products 
SET image_url = 'uploads/images/1754801882851-563674824.png'
WHERE id = 12;

-- If you have more products, you can add them here
-- For example:
-- UPDATE products 
-- SET image_url = 'uploads/images/1754636223677-118256129.png'
-- WHERE id = [another_product_id];

-- Verify the update
SELECT id, name, image_url, category_id, subcategory_id FROM products WHERE id = 12;

-- Alternative: Update all products with null image_url to use uploaded images
-- This will assign images randomly to products that don't have them
UPDATE products 
SET image_url = CASE 
    WHEN id % 2 = 0 THEN 'uploads/images/1754801882851-563674824.png'
    ELSE 'uploads/images/1754636223677-118256129.png'
END
WHERE image_url IS NULL OR image_url = 'null' OR image_url = '';

-- Show final result
SELECT id, name, image_url, category_id, subcategory_id FROM products;
