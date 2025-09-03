#!/usr/bin/env node

/**
 * Urban Nucleus Resource Minification Tool
 * Combines and minifies CSS/JS files for better performance
 */

const fs = require('fs');
const path = require('path');

// Function to combine and minify CSS files
function combineCSS() {
    console.log('🎨 Combining CSS files...');
    
    const cssFiles = [
        'style.css',
        'responsive.css'
    ];
    
    let combinedCSS = '';
    
    cssFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`📄 Adding ${file}...`);
            const content = fs.readFileSync(file, 'utf8');
            combinedCSS += `\n/* === ${file.toUpperCase()} === */\n`;
            combinedCSS += content;
        }
    });
    
    // Basic minification (remove comments and extra whitespace)
    const minifiedCSS = combinedCSS
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
        .replace(/\s*{\s*/g, '{') // Clean up braces
        .replace(/;\s*/g, ';') // Clean up semicolons
        .trim();
    
    fs.writeFileSync('combined.min.css', minifiedCSS);
    
    const originalSize = cssFiles.reduce((size, file) => {
        return size + (fs.existsSync(file) ? fs.statSync(file).size : 0);
    }, 0);
    const minifiedSize = fs.statSync('combined.min.css').size;
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ CSS combined and minified:`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(1)}KB`);
    console.log(`   Savings: ${savings}%`);
}

// Function to combine and minify JavaScript files
function combineJS() {
    console.log('⚡ Combining JavaScript files...');
    
    const jsFiles = [
        'auth-state.js',
        'main.js',
        'cart.js'
    ];
    
    let combinedJS = '';
    
    jsFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`📄 Adding ${file}...`);
            const content = fs.readFileSync(file, 'utf8');
            combinedJS += `\n/* === ${file.toUpperCase()} === */\n`;
            combinedJS += content;
            combinedJS += '\n';
        }
    });
    
    // Basic minification (remove comments and extra whitespace)
    const minifiedJS = combinedJS
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Clean up before closing braces
        .replace(/\s*{\s*/g, '{') // Clean up braces
        .trim();
    
    fs.writeFileSync('combined.min.js', minifiedJS);
    
    const originalSize = jsFiles.reduce((size, file) => {
        return size + (fs.existsSync(file) ? fs.statSync(file).size : 0);
    }, 0);
    const minifiedSize = fs.statSync('combined.min.js').size;
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ JavaScript combined and minified:`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(1)}KB`);
    console.log(`   Savings: ${savings}%`);
}

// Function to create optimized HTML templates
function createOptimizedHTML() {
    console.log('📝 Creating optimized HTML templates...');
    
    const htmlFiles = [
        'index.html',
        'product-detail.html',
        'category.html',
        'cart.html'
    ];
    
    htmlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`🔄 Optimizing ${file}...`);
            
            let content = fs.readFileSync(file, 'utf8');
            
            // Replace separate CSS files with combined version
            content = content.replace(
                /<link rel="stylesheet" href="style\.css\?v=[\d\.]+">[\s\S]*?<link rel="stylesheet" href="responsive\.css">/g,
                '<link rel="stylesheet" href="combined.min.css">'
            );
            
            // Replace separate JS files with combined version
            content = content.replace(
                /<script src="auth-state\.js\?v=[\d\.]+"><\/script>[\s\S]*?<script src="main\.js\?v=[\d\.]+"><\/script>[\s\S]*?<script src="cart\.js"><\/script>/g,
                '<script src="combined.min.js" defer></script>'
            );
            
            // Add preload hints for critical resources
            const preloadHints = `
    <!-- Preload critical resources -->
    <link rel="preload" href="combined.min.css" as="style">
    <link rel="preload" href="combined.min.js" as="script">
    <link rel="preconnect" href="http://31.97.239.99:3000">
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">`;
            
            content = content.replace(
                '<link rel="stylesheet" href="combined.min.css">',
                preloadHints + '\n    <link rel="stylesheet" href="combined.min.css">'
            );
            
            const optimizedFile = file.replace('.html', '.optimized.html');
            fs.writeFileSync(optimizedFile, content);
            
            const originalSize = fs.statSync(file).size;
            const optimizedSize = fs.statSync(optimizedFile).size;
            const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
            
            console.log(`   ✅ ${optimizedFile}: ${savings}% smaller`);
        }
    });
}

// Main execution
async function main() {
    console.log('🚀 Urban Nucleus Performance Optimization');
    console.log('==========================================\n');
    
    try {
        // Step 1: Combine and minify CSS
        combineCSS();
        
        // Step 2: Combine and minify JavaScript
        combineJS();
        
        // Step 3: Create optimized HTML versions
        createOptimizedHTML();
        
        console.log('\n🎉 Resource optimization complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Test optimized files: *.optimized.html');
        console.log('2. Run image optimization: node optimize-images.js');
        console.log('3. Update production files when ready');
        
    } catch (error) {
        console.error('❌ Error during optimization:', error);
    }
}

if (require.main === module) {
    main();
}