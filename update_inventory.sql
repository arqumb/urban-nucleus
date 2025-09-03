-- Update inventory for product 479 (AJ 1 High 'Palomino')
UPDATE product_sizes 
SET inventory = 15 
WHERE product_id = 479 AND size IN ('UK-7', 'UK-8', 'UK-9');

-- Update inventory for product 480 (AJ 1 HIGH 'BIO HACK')
UPDATE product_sizes 
SET inventory = 20 
WHERE product_id = 480 AND size IN ('UK-7', 'UK-8', 'UK-8.5');

-- Verify the updates
SELECT p.name, ps.size, ps.inventory 
FROM products p 
JOIN product_sizes ps ON p.id = ps.product_id 
WHERE p.id IN (479, 480) 
ORDER BY p.id, ps.size;




















