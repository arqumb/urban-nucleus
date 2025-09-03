const mysql = require('mysql2/promise');

// Database connection configuration (same as server.js)
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

async function updatePaymentSchema() {
    console.log('💳 Updating database schema for payment integration...');
    
    try {
        // Helper function to add column if it doesn't exist
        async function addColumnIfNotExists(columnName, columnDefinition) {
            try {
                const [columns] = await pool.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'urban_nucleus' 
                    AND TABLE_NAME = 'orders' 
                    AND COLUMN_NAME = ?
                `, [columnName]);
                
                if (columns.length === 0) {
                    await pool.execute(`ALTER TABLE orders ADD COLUMN ${columnName} ${columnDefinition}`);
                    console.log(`✅ Added column: ${columnName}`);
                } else {
                    console.log(`ℹ️  Column ${columnName} already exists`);
                }
            } catch (error) {
                console.error(`❌ Error adding column ${columnName}:`, error.message);
            }
        }
        
        // Add payment-related columns to orders table
        console.log('📝 Adding payment-related columns...');
        
        await addColumnIfNotExists('payment_status', "ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending'");
        await addColumnIfNotExists('razorpay_order_id', 'VARCHAR(255) NULL');
        await addColumnIfNotExists('razorpay_payment_id', 'VARCHAR(255) NULL');
        await addColumnIfNotExists('payment_verified_at', 'TIMESTAMP NULL');
        await addColumnIfNotExists('payment_amount', 'DECIMAL(10,2) NULL');
        await addColumnIfNotExists('payment_currency', "VARCHAR(10) DEFAULT 'INR'");
        await addColumnIfNotExists('payment_method', 'VARCHAR(50) NULL');
        
        // Create indexes for better performance
        console.log('🔧 Creating performance indexes...');
        
        try {
            await pool.execute(`
                CREATE INDEX idx_orders_payment_status ON orders(payment_status)
            `);
            console.log('✅ Payment status index created');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Payment status index already exists');
            } else {
                throw error;
            }
        }
        
        try {
            await pool.execute(`
                CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id)
            `);
            console.log('✅ Razorpay order ID index created');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Razorpay order ID index already exists');
            } else {
                throw error;
            }
        }
        
        try {
            await pool.execute(`
                CREATE INDEX idx_orders_razorpay_payment_id ON orders(razorpay_payment_id)
            `);
            console.log('✅ Razorpay payment ID index created');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Razorpay payment ID index already exists');
            } else {
                throw error;
            }
        }
        
        // Show updated table structure
        console.log('📋 Checking updated table structure...');
        const [tableStructure] = await pool.execute('DESCRIBE orders');
        
        console.log('\n📊 ORDERS TABLE STRUCTURE:');
        console.log('============================');
        tableStructure.forEach(column => {
            console.log(`${column.Field.padEnd(25)} | ${column.Type.padEnd(20)} | ${column.Null.padEnd(8)} | ${column.Default || 'NULL'}`);
        });
        
        console.log('\n✅ Database schema updated successfully!');
        console.log('💳 Payment integration database setup complete.');
        
    } catch (error) {
        console.error('❌ Error updating database schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the update
updatePaymentSchema();
