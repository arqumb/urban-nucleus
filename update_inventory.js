const mysql = require('mysql2/promise');

async function updateInventory() {
    const pool = mysql.createPool({
        host: '31.97.239.99',
        user: 'urban_user',
        password: '@Arqum789',
        database: 'urban_nucleus'
    });

    try {
        console.log('🔄 Updating inventory for products 479 and 480...');
        
        // Update inventory for product 479 (AJ 1 High 'Palomino')
        await pool.query(
            'UPDATE product_sizes SET inventory = 15 WHERE product_id = 479 AND size IN (?, ?, ?)',
            ['UK-7', 'UK-8', 'UK-9']
        );
        console.log('✅ Updated inventory for product 479');
        
        // Update inventory for product 480 (AJ 1 HIGH 'BIO HACK')
        await pool.query(
            'UPDATE product_sizes SET inventory = 20 WHERE product_id = 480 AND size IN (?, ?, ?)',
            ['UK-7', 'UK-8', 'UK-8.5']
        );
        console.log('✅ Updated inventory for product 480');
        
        // Verify the updates
        const [results] = await pool.query(`
            SELECT p.name, ps.size, ps.inventory 
            FROM products p 
            JOIN product_sizes ps ON p.id = ps.product_id 
            WHERE p.id IN (479, 480) 
            ORDER BY p.id, ps.size
        `);
        
        console.log('\n📊 Updated Inventory Results:');
        results.forEach(row => {
            console.log(`${row.name} - ${row.size}: ${row.inventory}`);
        });
        
        console.log('\n🎉 Inventory update completed successfully!');
        
    } catch (error) {
        console.error('❌ Error updating inventory:', error);
    } finally {
        await pool.end();
    }
}

updateInventory();




















