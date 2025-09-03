const mysql = require('mysql2');

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'urban_user',
  password: '@Arqum789',
  database: 'urban_nucleus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupContactNewsletterTables() {
  console.log('🚀 Setting up Contact and Newsletter tables...');

  try {
    // Create newsletter subscribers table
    await new Promise((resolve, reject) => {
      pool.query(`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status ENUM('active', 'inactive', 'unsubscribed') DEFAULT 'active',
          source VARCHAR(100) DEFAULT 'website',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('✅ Newsletter subscribers table created');

    // Create contact submissions table
    await new Promise((resolve, reject) => {
      pool.query(`
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
        )
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('✅ Contact submissions table created');

    // Add indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)',
      'CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status)',
      'CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at)',
      'CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email)',
      'CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status)',
      'CREATE INDEX IF NOT EXISTS idx_contact_submitted_at ON contact_submissions(submitted_at)'
    ];

    for (const indexQuery of indexes) {
      await new Promise((resolve, reject) => {
        pool.query(indexQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    }

    console.log('✅ Indexes created');

    console.log('🎉 Contact and Newsletter tables setup completed successfully!');
    console.log('');
    console.log('📋 Tables created:');
    console.log('   • newsletter_subscribers - Stores email subscriptions');
    console.log('   • contact_submissions - Stores contact form submissions');
    console.log('');
    console.log('🔑 Admin endpoints available:');
    console.log('   • GET /admin/newsletter-subscribers - View all newsletter subscribers');
    console.log('   • GET /admin/contact-submissions - View all contact form submissions');
    console.log('');
    console.log('📝 API endpoints available:');
    console.log('   • POST /newsletter/subscribe - Subscribe to newsletter');
    console.log('   • POST /contact/submit - Submit contact form');

  } catch (error) {
    console.error('❌ Error setting up tables:', error);
  } finally {
    pool.end();
  }
}

// Run the setup
setupContactNewsletterTables();
