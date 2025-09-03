const mysql = require('mysql2');

// Use the same database connection as server.js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'urban_user',
  password: '@Arqum789',
  database: 'urban_nucleus',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createTables() {
  console.log('🚀 Creating Contact and Newsletter tables...');

  try {
    // Create newsletter subscribers table
    console.log('📧 Creating newsletter_subscribers table...');
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

    console.log('✅ newsletter_subscribers table created successfully');

    // Create contact submissions table
    console.log('📞 Creating contact_submissions table...');
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

    console.log('✅ contact_submissions table created successfully');

    // Add indexes for better performance
    console.log('🔧 Creating indexes...');
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
          if (err && err.code !== 'ER_DUP_KEYNAME') reject(err);
          else resolve(results);
        });
      });
    }

    console.log('✅ Indexes created successfully');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = await new Promise((resolve, reject) => {
      pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'urban_nucleus' 
        AND table_name IN ('newsletter_subscribers', 'contact_submissions')
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('📋 Tables found:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });

    console.log('');
    console.log('🎉 SUCCESS! Contact and Newsletter tables are ready!');
    console.log('');
    console.log('📝 You can now:');
    console.log('   • Test newsletter subscription on homepage');
    console.log('   • Test contact form on contact page');
    console.log('   • View submissions at:');
    console.log('     - http://31.97.239.99:3000/admin/newsletter-subscribers');
    console.log('     - http://31.97.239.99:3000/admin/contact-submissions');
    console.log('');
    console.log('📧 All forms will use: urban.nucleus@gmail.com');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Database access denied. Please check:');
      console.log('   • MySQL server is running');
      console.log('   • Username/password are correct');
      console.log('   • Database "urban_nucleus" exists');
    }
  } finally {
    pool.end();
  }
}

// Run the table creation
createTables();
