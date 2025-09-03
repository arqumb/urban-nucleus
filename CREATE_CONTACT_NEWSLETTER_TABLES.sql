-- 📋 CONTACT & NEWSLETTER DATABASE SETUP
-- Run this SQL script in your MySQL database to create the required tables

USE urban_nucleus;

-- 📧 Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'unsubscribed') DEFAULT 'active',
    source VARCHAR(100) DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_newsletter_email (email),
    INDEX idx_newsletter_status (status),
    INDEX idx_newsletter_subscribed_at (subscribed_at)
);

-- 📞 Contact Form Submissions Table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance  
    INDEX idx_contact_email (email),
    INDEX idx_contact_status (status),
    INDEX idx_contact_submitted_at (submitted_at)
);

-- ✅ Verify tables were created
SELECT 'newsletter_subscribers table created' as status 
FROM information_schema.tables 
WHERE table_schema = 'urban_nucleus' AND table_name = 'newsletter_subscribers';

SELECT 'contact_submissions table created' as status 
FROM information_schema.tables 
WHERE table_schema = 'urban_nucleus' AND table_name = 'contact_submissions';

-- 📊 Show table structure
DESCRIBE newsletter_subscribers;
DESCRIBE contact_submissions;

SELECT '🎉 Setup Complete! Contact and Newsletter functionality is now ready!' as message;
