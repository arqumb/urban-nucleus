const mysql = require('mysql2/promise');

async function updateAllSizes() {
    const pool = mysql.createPool({
        host: '31.97.239.99',
        user: 'urban_user',
        password: '@Arqum789',
        database: 'urban_nucleus'
    });

    try {
        console.log('🔄 Updating all sizes for product 479...');
        
        // Total inventory for each size
        const totalInventory = 100;
        const sizes = ['UK-6', 'UK-6.5', 'UK-7', 'UK-7.5', 'UK-8', 'UK-8.5', 'UK-9', 'UK-10'];
        
        console.log(`📊 Setting ${totalInventory} inventory for EACH of ${sizes.length} sizes`);
        console.log(`📦 Each size will have: ${totalInventory} inventory`);
        
        // Update each size with full inventory
        for (const size of sizes) {
            const finalInventory = totalInventory;
            
            await pool.query(
                'UPDATE product_sizes SET inventory = ? WHERE product_id = ? AND size = ?',
                [finalInventory, 479, size]
            );
            
            console.log(`✅ ${size}: ${finalInventory} inventory`);
        }
        
        // Verify the updates
        const [rows] = await pool.query('SELECT * FROM product_sizes WHERE product_id = 479 ORDER BY size');
        
        console.log('\n📊 Final inventory status:');
        rows.forEach(row => {
            console.log(`${row.size}: ${row.inventory}`);
        });
        
        console.log('\n🎉 All sizes updated successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

updateAllSizes();
