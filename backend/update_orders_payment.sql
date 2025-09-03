-- Update orders table to support Razorpay payment tracking
-- Add payment-related columns if they don't exist

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);

-- Show the updated table structure
DESCRIBE orders;
