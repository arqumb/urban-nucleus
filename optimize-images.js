#!/usr/bin/env node

/**
 * Urban Nucleus Image Optimization Tool
 * Automatically optimizes images for web performance
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOAD_DIR = './uploads/images';
const OPTIMIZED_DIR = './uploads/optimized';

// Image optimization settings
const OPTIMIZATION_SETTINGS = {
    // Product images
    product: {
        width: 800,
        height: 800,
        quality: 85,
        formats: ['webp', 'jpg']
    },
    // Thumbnails
    thumbnail: {
        width: 300,
        height: 300,
        quality: 80,
        formats: ['webp', 'jpg']
    },
    // Hero images
    hero: {
        width: 1920,
        height: 1080,
        quality: 90,
        formats: ['webp', 'jpg']
    },
    // Category images
    category: {
        width: 600,
        height: 400,
        quality: 85,
        formats: ['webp', 'jpg']
    }
};

async function optimizeImage(inputPath, outputDir, settings) {
    try {
        const filename = path.basename(inputPath, path.extname(inputPath));
        const results = [];

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate optimized versions for each format
        for (const format of settings.formats) {
            const outputPath = path.join(outputDir, `${filename}.${format}`);
            
            let pipeline = sharp(inputPath)
                .resize(settings.width, settings.height, {
                    fit: 'cover',
                    position: 'center'
                });

            if (format === 'webp') {
                pipeline = pipeline.webp({ quality: settings.quality });
            } else if (format === 'jpg' || format === 'jpeg') {
                pipeline = pipeline.jpeg({ quality: settings.quality, progressive: true });
            } else if (format === 'png') {
                pipeline = pipeline.png({ quality: settings.quality, progressive: true });
            }

            await pipeline.toFile(outputPath);
            
            const stats = fs.statSync(outputPath);
            results.push({
                format: format,
                path: outputPath,
                size: stats.size
            });
        }

        return results;
    } catch (error) {
        console.error(`❌ Error optimizing ${inputPath}:`, error.message);
        return [];
    }
}

async function optimizeAllImages() {
    console.log('🚀 Starting image optimization...');
    
    if (!fs.existsSync(UPLOAD_DIR)) {
        console.error('❌ Upload directory not found:', UPLOAD_DIR);
        return;
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file)
    );

    console.log(`📸 Found ${imageFiles.length} images to optimize`);

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let processedCount = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(UPLOAD_DIR, file);
        const originalStats = fs.statSync(inputPath);
        totalOriginalSize += originalStats.size;

        console.log(`\n🔄 Processing: ${file} (${(originalStats.size / 1024 / 1024).toFixed(2)}MB)`);

        // Determine image type and settings
        let settings = OPTIMIZATION_SETTINGS.product; // Default
        
        if (file.includes('hero') || file.includes('slide')) {
            settings = OPTIMIZATION_SETTINGS.hero;
        } else if (file.includes('category')) {
            settings = OPTIMIZATION_SETTINGS.category;
        } else if (file.includes('thumb')) {
            settings = OPTIMIZATION_SETTINGS.thumbnail;
        }

        const outputDir = path.join(OPTIMIZED_DIR, settings === OPTIMIZATION_SETTINGS.hero ? 'hero' : 
                                   settings === OPTIMIZATION_SETTINGS.category ? 'category' : 
                                   settings === OPTIMIZATION_SETTINGS.thumbnail ? 'thumbnails' : 'products');

        const results = await optimizeImage(inputPath, outputDir, settings);
        
        if (results.length > 0) {
            processedCount++;
            const optimizedSize = results.reduce((sum, r) => sum + r.size, 0);
            totalOptimizedSize += optimizedSize;
            
            console.log(`✅ Optimized to ${results.length} formats:`);
            results.forEach(result => {
                const sizeMB = (result.size / 1024 / 1024).toFixed(2);
                const savings = ((originalStats.size - result.size) / originalStats.size * 100).toFixed(1);
                console.log(`   - ${result.format}: ${sizeMB}MB (${savings}% smaller)`);
            });
        }
    }

    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    console.log(`\n🎉 Optimization Complete!`);
    console.log(`📊 Processed: ${processedCount}/${imageFiles.length} images`);
    console.log(`💾 Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`💾 Optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🚀 Total savings: ${totalSavings}% (${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)}MB)`);
}

// Helper function to generate responsive image HTML
function generateResponsiveImageHTML(imageName, alt, className = '') {
    const name = path.basename(imageName, path.extname(imageName));
    return `
<picture class="${className}">
    <source srcset="uploads/optimized/products/${name}.webp" type="image/webp">
    <source srcset="uploads/optimized/products/${name}.jpg" type="image/jpeg">
    <img src="uploads/images/${imageName}" alt="${alt}" loading="lazy">
</picture>`;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        optimizeImage,
        optimizeAllImages,
        generateResponsiveImageHTML,
        OPTIMIZATION_SETTINGS
    };
}

// Run optimization if called directly
if (require.main === module) {
    optimizeAllImages().catch(console.error);
}