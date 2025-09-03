const mysql = require('mysql2');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'urban_user',
    password: '@Arqum789',
    database: 'urban_nucleus',
    port: 3306
});

// CSV Import Configuration
const CSV_CONFIG = {
    // Shopify standard column mappings
    columns: {
        handle: 'Handle',
        title: 'Title',
        body_html: 'Body (HTML)',
        vendor: 'Vendor',
        product_type: 'Product Type',
        tags: 'Tags',
        published: 'Published',
        option1_name: 'Option1 Name',
        option1_value: 'Option1 Value',
        option2_name: 'Option2 Name',
        option2_value: 'Option2 Value',
        option3_name: 'Option3 Name',
        option3_value: 'Option3 Value',
        variant_sku: 'Variant SKU',
        variant_grams: 'Variant Grams',
        variant_inventory_tracker: 'Variant Inventory Tracker',
        variant_inventory_quantity: 'Variant Inventory Quantity',
        variant_inventory_policy: 'Variant Inventory Policy',
        variant_fulfillment_service: 'Variant Fulfillment Service',
        variant_price: 'Variant Price',
        variant_compare_at_price: 'Variant Compare At Price',
        variant_requires_shipping: 'Variant Requires Shipping',
        variant_taxable: 'Variant Taxable',
        variant_barcode: 'Variant Barcode',
        image_src: 'Image Src',
        image_position: 'Image Position',
        gift_card: 'Gift Card',
        google_shopping_google_product_category: 'Google Shopping / Google Product Category',
        seo_title: 'SEO Title',
        seo_description: 'SEO Description',
        google_shopping_gender: 'Google Shopping / Gender',
        google_shopping_age_group: 'Google Shopping / Age Group',
        google_shopping_mpn: 'Google Shopping / MPN',
        google_shopping_adwords_grouping: 'Google Shopping / AdWords Grouping',
        google_shopping_adwords_labels: 'Google Shopping / AdWords Labels',
        google_shopping_condition: 'Google Shopping / Condition',
        google_shopping_custom_product: 'Google Shopping / Custom Product',
        google_shopping_custom_label_0: 'Google Shopping / Custom Label 0',
        google_shopping_custom_label_1: 'Google Shopping / Custom Label 1',
        google_shopping_custom_label_2: 'Google Shopping / Custom Label 2',
        google_shopping_custom_label_3: 'Google Shopping / Custom Label 3',
        google_shopping_custom_label_4: 'Google Shopping / Custom Label 4',
        variant_image: 'Variant Image',
        variant_weight_unit: 'Variant Weight Unit',
        variant_tax_code: 'Variant Tax Code',
        cost_per_item: 'Cost per item',
        price_international: 'Price / International',
        compare_at_price_international: 'Compare At Price / International',
        weight_international: 'Weight / International',
        inventory_quantity_international: 'Inventory Quantity / International'
    }
};

// Import Statistics
let importStats = {
    totalRows: 0,
    productsCreated: 0,
    productsUpdated: 0,
    categoriesCreated: 0,
    imagesProcessed: 0,
    errors: [],
    startTime: null,
    endTime: null
};

// Main import function
async function importProductsFromCSV(filePath) {
    console.log('🚀 Starting CSV import process...');
    importStats.startTime = new Date();
    
    try {
        // Validate file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`CSV file not found: ${filePath}`);
        }

        // Read and parse CSV
        const products = await parseCSVFile(filePath);
        console.log(`📊 Parsed ${products.length} rows from CSV`);

        // Group products by handle (Shopify groups variants under same product)
        const groupedProducts = groupProductsByHandle(products);
        console.log(`🏷️ Found ${Object.keys(groupedProducts).length} unique products`);

        // Process each product
        for (const [handle, productData] of Object.entries(groupedProducts)) {
            try {
                await processProduct(handle, productData);
            } catch (error) {
                console.error(`❌ Error processing product ${handle}:`, error.message);
                importStats.errors.push({
                    product: handle,
                    error: error.message
                });
            }
        }

        importStats.endTime = new Date();
        const duration = (importStats.endTime - importStats.startTime) / 1000;
        
        console.log('\n🎉 Import completed!');
        console.log(`⏱️ Duration: ${duration.toFixed(2)} seconds`);
        console.log(`📈 Statistics:`, importStats);
        
        return importStats;

    } catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    }
}

// Parse CSV file
function parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Group products by handle (Shopify groups variants)
function groupProductsByHandle(products) {
    const grouped = {};
    
    products.forEach(row => {
        const handle = row[CSV_CONFIG.columns.handle] || row['Handle'];
        if (!handle) return;
        
        if (!grouped[handle]) {
            grouped[handle] = {
                basic: {},
                variants: [],
                images: []
            };
        }
        
        // Extract basic product info from first row
        if (Object.keys(grouped[handle].basic).length === 0) {
            grouped[handle].basic = {
                handle: handle,
                title: row[CSV_CONFIG.columns.title] || row['Title'],
                body_html: row[CSV_CONFIG.columns.body_html] || row['Body (HTML)'],
                vendor: row[CSV_CONFIG.columns.vendor] || row['Vendor'],
                product_type: row[CSV_CONFIG.columns.product_type] || row['Product Type'],
                tags: row[CSV_CONFIG.columns.tags] || row['Tags'],
                published: row[CSV_CONFIG.columns.published] || row['Published'],
                seo_title: row[CSV_CONFIG.columns.seo_title] || row['SEO Title'],
                seo_description: row[CSV_CONFIG.columns.seo_description] || row['SEO Description']
            };
        }
        
        // Extract variant info
        const variant = {
            sku: row[CSV_CONFIG.columns.variant_sku] || row['Variant SKU'],
            price: parseFloat(row[CSV_CONFIG.columns.variant_price] || row['Variant Price']) || 0,
            compare_at_price: parseFloat(row[CSV_CONFIG.columns.variant_compare_at_price] || row['Variant Compare At Price']) || null,
            inventory_quantity: parseInt(row[CSV_CONFIG.columns.variant_inventory_quantity] || row['Variant Inventory Quantity']) || 0,
            weight: parseFloat(row[CSV_CONFIG.columns.variant_grams] || row['Variant Grams']) || null,
            barcode: row[CSV_CONFIG.columns.variant_barcode] || row['Variant Barcode'],
            option1_name: row[CSV_CONFIG.columns.option1_name] || row['Option1 Name'],
            option1_value: row[CSV_CONFIG.columns.option1_value] || row['Option1 Value'],
            option2_name: row[CSV_CONFIG.columns.option2_name] || row['Option2 Name'],
            option2_value: row[CSV_CONFIG.columns.option2_value] || row['Option2 Value'],
            option3_name: row[CSV_CONFIG.columns.option3_name] || row['Option3 Name'],
            option3_value: row[CSV_CONFIG.columns.option3_value] || row['Option3 Value']
        };
        
        if (variant.sku || variant.price > 0) {
            grouped[handle].variants.push(variant);
        }
        
        // Extract image info
        const imageSrc = row[CSV_CONFIG.columns.image_src] || row['Image Src'];
        const imagePosition = parseInt(row[CSV_CONFIG.columns.image_position] || row['Image Position']) || 1;
        
        if (imageSrc && !grouped[handle].images.find(img => img.src === imageSrc)) {
            grouped[handle].images.push({
                src: imageSrc,
                position: imagePosition
            });
        }
    });
    
    return grouped;
}

// Process individual product
async function processProduct(handle, productData) {
    const { basic, variants, images } = productData;
    
    console.log(`🔄 Processing product: ${basic.title || handle}`);
    
    // Create or get category
    let categoryId = null;
    let subcategoryId = null;
    
    if (basic.product_type) {
        categoryId = await getOrCreateCategory(basic.product_type);
    }
    
    // Create product
    const productId = await createProduct(basic, categoryId, subcategoryId);
    
    // Create variants
    for (const variant of variants) {
        await createProductVariant(productId, variant);
    }
    
    // Create product sizes (from variants)
    const sizes = variants
        .filter(v => v.option1_name && v.option1_name.toLowerCase().includes('size'))
        .map(v => v.option1_value)
        .filter(Boolean);
    
    for (const size of sizes) {
        await createProductSize(productId, size, 0); // Default inventory 0
    }
    
    // Process images
    for (const image of images) {
        await createProductImage(productId, image.src, image.position);
    }
    
    importStats.productsCreated++;
    console.log(`✅ Created product: ${basic.title || handle} (ID: ${productId})`);
}

// Create or get category
async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    
    try {
        // Check if category exists
        const [existing] = await pool.promise().query(
            'SELECT id FROM categories WHERE name = ?',
            [categoryName]
        );
        
        if (existing.length > 0) {
            return existing[0].id;
        }
        
        // Create new category
        const [result] = await pool.promise().query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [categoryName, `Imported from Shopify: ${categoryName}`]
        );
        
        importStats.categoriesCreated++;
        console.log(`🏷️ Created category: ${categoryName}`);
        
        return result.insertId;
        
    } catch (error) {
        console.error(`❌ Error with category ${categoryName}:`, error.message);
        return null;
    }
}

// Create product
async function createProduct(basic, categoryId, subcategoryId) {
    try {
        const [result] = await pool.promise().query(`
            INSERT INTO products (
                name, description, price, category_id, subcategory_id,
                vendor, product_type, tags, seo_title, seo_meta_description,
                seo_url_handle, status, track_inventory, continue_selling
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            basic.title || 'Untitled Product',
            basic.body_html || '',
            0, // Will be updated with variant prices
            categoryId,
            subcategoryId,
            basic.vendor || '',
            basic.product_type || '',
            basic.tags || '',
            basic.seo_title || '',
            basic.seo_description || '',
            basic.handle || '', // Use handle as seo_url_handle
            basic.published === 'true' ? 'active' : 'draft',
            true,
            false
        ]);
        
        return result.insertId;
        
    } catch (error) {
        throw new Error(`Failed to create product: ${error.message}`);
    }
}

// Create product variant
async function createProductVariant(productId, variant) {
    try {
        // Update product price if this variant has a higher price
        if (variant.price > 0) {
            await pool.promise().query(
                'UPDATE products SET price = ? WHERE id = ? AND (price = 0 OR price < ?)',
                [variant.price, productId, variant.price]
            );
        }
        
        // Create variant record
        if (variant.option1_name && variant.option1_value) {
            await pool.promise().query(`
                INSERT INTO product_variants (
                    product_id, option_name, option_value, sku, price, inventory
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                productId,
                variant.option1_name,
                variant.option1_value,
                variant.sku || null,
                variant.price || 0,
                variant.inventory_quantity || 0
            ]);
        }
        
    } catch (error) {
        console.error(`❌ Error creating variant for product ${productId}:`, error.message);
    }
}

// Create product size
async function createProductSize(productId, size, inventory) {
    try {
        await pool.promise().query(`
            INSERT INTO product_sizes (product_id, size, inventory) VALUES (?, ?, ?)
        `, [productId, size, inventory]);
        
    } catch (error) {
        console.error(`❌ Error creating size for product ${productId}:`, error.message);
    }
}

// Create product image
async function createProductImage(productId, imageSrc, position) {
    try {
        await pool.promise().query(`
            INSERT INTO product_images (product_id, image_url, position) VALUES (?, ?, ?)
        `, [productId, imageSrc, position]);
        
        importStats.imagesProcessed++;
        
    } catch (error) {
        console.error(`❌ Error creating image for product ${productId}:`, error.message);
    }
}

// Export functions
module.exports = {
    importProductsFromCSV,
    getImportStats: () => importStats,
    resetImportStats: () => {
        importStats = {
            totalRows: 0,
            productsCreated: 0,
            productsUpdated: 0,
            categoriesCreated: 0,
            imagesProcessed: 0,
            errors: [],
            startTime: null,
            endTime: null
        };
    }
};

// CLI usage (if run directly)
if (require.main === module) {
    const csvFile = process.argv[2];
    
    if (!csvFile) {
        console.log('Usage: node csv_import.js <path-to-csv-file>');
        console.log('Example: node csv_import.js ../shopify_products.csv');
        process.exit(1);
    }
    
    importProductsFromCSV(csvFile)
        .then(stats => {
            console.log('\n🎉 Import completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Import failed:', error);
            process.exit(1);
        });
}
