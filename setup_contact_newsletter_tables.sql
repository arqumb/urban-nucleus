-- Database setup for Contact and Newsletter functionality
-- Run this SQL to create the necessary tables

-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'unsubscribed') DEFAULT 'active',
    source VARCHAR(100) DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at);

CREATE INDEX idx_contact_email ON contact_submissions(email);
CREATE INDEX idx_contact_status ON contact_submissions(status);
CREATE INDEX idx_contact_submitted_at ON contact_submissions(submitted_at);

-- Insert some sample data (optional)
-- INSERT INTO newsletter_subscribers (email, status) VALUES 
-- ('test@example.com', 'active'),
-- ('demo@example.com', 'active');

-- INSERT INTO contact_submissions (name, email, subject, message, status) VALUES 
-- ('John Doe', 'john@example.com', 'Product Inquiry', 'I would like to know more about your Yeezy collection.', 'new'),
-- ('Jane Smith', 'jane@example.com', 'Order Support', 'I need help with my recent order.', 'new');

SELECT 'Contact and Newsletter tables created successfully!' as result;
