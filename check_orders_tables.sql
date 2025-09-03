-- Check if required tables exist and have data
USE urban_nucleus;

-- Check orders table
SELECT 'orders' as table_name, COUNT(*) as record_count FROM orders;

-- Check users table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users;

-- Check order_items table
SELECT 'order_items' as table_name, COUNT(*) as record_count FROM order_items;

-- Check products table
SELECT 'products' as table_name, COUNT(*) as record_count FROM products;

-- Check table structure
DESCRIBE orders;
DESCRIBE users;
DESCRIBE order_items;
DESCRIBE products;

-- Check if there are any orders
SELECT * FROM orders LIMIT 5;

-- Check if there are any users
SELECT id, username, email FROM users LIMIT 5;


















