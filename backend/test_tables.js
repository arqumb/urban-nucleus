const mysql = require('mysql2');

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

async function testTables() {
  console.log('🔍 Testing database tables...');

  try {
    // Check if tables exist
    const tables = await new Promise((resolve, reject) => {
      pool.query(`
        SELECT table_name, table_rows 
        FROM information_schema.tables 
        WHERE table_schema = 'urban_nucleus' 
        AND table_name IN ('newsletter_subscribers', 'contact_submissions')
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('📋 Database Tables Status:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name} - ${table.table_rows || 0} rows`);
    });

    // Test newsletter subscribers table structure
    const newsletterStructure = await new Promise((resolve, reject) => {
      pool.query('DESCRIBE newsletter_subscribers', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('\n📧 newsletter_subscribers table structure:');
    newsletterStructure.forEach(field => {
      console.log(`   • ${field.Field} (${field.Type})`);
    });

    // Test contact submissions table structure  
    const contactStructure = await new Promise((resolve, reject) => {
      pool.query('DESCRIBE contact_submissions', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('\n📞 contact_submissions table structure:');
    contactStructure.forEach(field => {
      console.log(`   • ${field.Field} (${field.Type})`);
    });

    console.log('\n🎉 SUCCESS! Both tables are ready for use!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Restart your backend server (node server.js)');
    console.log('   2. Test newsletter signup on homepage');
    console.log('   3. Test contact form on contact page');
    console.log('\n📧 All forms configured for: urban.nucleus@gmail.com');

  } catch (error) {
    console.error('❌ Error testing tables:', error);
  } finally {
    pool.end();
  }
}

testTables();
