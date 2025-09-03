-- Update orders table to include COD payment information
USE urban_nucleus;

-- Add payment method column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'upi';

-- Add COD-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_advance_paid DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_remaining_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add indexes for better performance on payment-related queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_is_cod ON orders(is_cod);
CREATE INDEX IF NOT EXISTS idx_orders_cod_advance ON orders(cod_advance_paid);

-- Update order_items table to include size information (if not already present)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT NULL;

-- Add index for order_items size
CREATE INDEX IF NOT EXISTS idx_order_items_size ON order_items(size);

-- Display current orders table structure
DESCRIBE orders;
