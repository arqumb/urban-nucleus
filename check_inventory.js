const mysql = require('mysql2/promise');

async function checkInventory() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'urban_user',
        password: '@Arqum789',
        database: 'urban_nucleus'
    });

    try {
        console.log('🔍 Checking inventory for product 479...');
        
        const [rows] = await pool.query('SELECT * FROM product_sizes WHERE product_id = 479 ORDER BY size');
        
        console.log('📊 Current inventory status:');
        rows.forEach(row => {
            console.log(`${row.size}: ${row.inventory} (ID: ${row.id})`);
        });
        
        // Check if UK-7 was updated
        const [uk7Row] = await pool.query('SELECT * FROM product_sizes WHERE product_id = 479 AND size = "UK-7"');
        if (uk7Row.length > 0) {
            console.log(`\n🎯 UK-7 specific check: ${uk7Row[0].inventory}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkInventory();






















