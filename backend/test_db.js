const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'urban_user',
    password: '@Arqum789',
    database: 'urban_nucleus',
    port: 3306
});

console.log('Testing database connection...');

pool.query('SELECT id, name, price, compare_at_price FROM products LIMIT 5', (err, results) => {
    if (err) {
        console.error('Database error:', err);
    } else {
        console.log('Products found:', results.length);
        console.log('Sample products:');
        results.forEach((product, index) => {
            console.log(`${index + 1}. ID: ${product.id}, Name: ${product.name}`);
            console.log(`   Price: ${product.price}, Compare Price: ${product.compare_at_price}`);
            console.log(`   Has compare price: ${product.compare_at_price ? 'YES' : 'NO'}`);
            console.log('---');
        });
    }
    pool.end();
}); 