const mysql = require('mysql2');

// Database connection
const pool = mysql.createPool({
    host: '31.97.239.99',
    user: 'urban_user',
    password: '@Arqum789',
    database: 'urban_nucleus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function debugDropProducts() {
    try {
        console.log('🔍 Debugging Limited Drop Products...\n');
        
        // 1. Check what's in the limited_edition_drops table
        console.log('📋 1. Limited Edition Drops:');
        const [drops] = await pool.promise().query('SELECT * FROM limited_edition_drops');
        console.table(drops);
        
        // 2. Check what products are associated with drops
        console.log('\n📦 2. Products in Limited Drops:');
        const [dropProducts] = await pool.promise().query(`
            SELECT 
                ledp.drop_id,
                ledp.product_id,
                ledp.position,
                p.id as product_id,
                p.name as product_name,
                p.image_url as product_image,
                p.price as product_price
            FROM limited_edition_drop_products ledp
            INNER JOIN products p ON ledp.product_id = p.id
            ORDER BY ledp.drop_id, ledp.position
        `);
        console.table(dropProducts);
        
        // 3. Check the original products table for these products
        console.log('\n🖼️ 3. Original Product Images:');
        if (dropProducts.length > 0) {
            const productIds = dropProducts.map(dp => dp.product_id);
            const [originalProducts] = await pool.promise().query(`
                SELECT id, name, image_url, price
                FROM products 
                WHERE id IN (${productIds.join(',')})
                ORDER BY id
            `);
            console.table(originalProducts);
        }
        
        // 4. Check if there are any products with NULL image_url
        console.log('\n❌ 4. Products with NULL Images:');
        const [nullImages] = await pool.promise().query(`
            SELECT id, name, image_url, price
            FROM products 
            WHERE image_url IS NULL OR image_url = ''
        `);
        if (nullImages.length > 0) {
            console.table(nullImages);
        } else {
            console.log('✅ No products with NULL images found');
        }
        
        // 5. Check the API endpoint response
        console.log('\n🌐 5. Testing API Endpoint:');
        const [apiTest] = await pool.promise().query(`
            SELECT 
                led.id as drop_id,
                led.title,
                led.description,
                led.start_date,
                led.end_date,
                led.is_active,
                p.id as product_id,
                p.name as product_name,
                p.price as product_price,
                p.image_url as product_image,
                ledp.position
            FROM limited_edition_drops led
            LEFT JOIN limited_edition_drop_products ledp ON led.id = ledp.drop_id
            LEFT JOIN products p ON ledp.product_id = p.id
            WHERE led.is_active = 1 
            AND led.start_date <= NOW() 
            AND led.end_date >= NOW()
            ORDER BY ledp.position ASC
        `);
        console.table(apiTest);
        
        // 6. Check if there are any duplicate entries
        console.log('\n🔄 6. Checking for Duplicate Entries:');
        const [duplicates] = await pool.promise().query(`
            SELECT 
                drop_id, 
                product_id, 
                COUNT(*) as count
            FROM limited_edition_drop_products 
            GROUP BY drop_id, product_id 
            HAVING COUNT(*) > 1
        `);
        if (duplicates.length > 0) {
            console.table(duplicates);
        } else {
            console.log('✅ No duplicate entries found');
        }
        
        // 7. Check the exact data being sent to frontend
        console.log('\n🎯 7. Frontend API Response Simulation:');
        const [frontendData] = await pool.promise().query(`
            SELECT 
                p.id, 
                p.name, 
                p.price, 
                p.image_url, 
                ledp.position
            FROM limited_edition_drop_products ledp
            INNER JOIN products p ON ledp.product_id = p.id
            WHERE ledp.drop_id = 1
            ORDER BY ledp.position ASC
        `);
        
        const frontendResponse = {
            active: true,
            drop: drops[0] || {},
            products: frontendData.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image_url: p.image_url
            }))
        };
        
        console.log('Frontend API Response:');
        console.log(JSON.stringify(frontendResponse, null, 2));
        
        // 8. Check if images actually exist on disk
        console.log('\n💾 8. Image File Existence Check:');
        const fs = require('fs');
        const path = require('path');
        
        for (const product of frontendData) {
            if (product.image_url) {
                const imagePath = path.join(__dirname, '..', product.image_url);
                const exists = fs.existsSync(imagePath);
                console.log(`${product.name}: ${product.image_url} - ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        pool.end();
    }
}

debugDropProducts();
































