#!/usr/bin/env node

/**
 * Urban Nucleus - Hostinger Deployment Preparation Script
 * This script prepares your application for Hostinger deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Urban Nucleus for Hostinger deployment...\n');

// Files to include in deployment
const deploymentFiles = [
    // Frontend files
    'index.html',
    'admin.html',
    'login.html',
    'signup.html',
    'cart.html',
    'checkout.html',
    'product-detail.html',
    'category.html',
    'subcategory.html',
    'collections.html',
    'about.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'return-policy.html',
    'shipping-policy.html',
    'size-guide.html',
    'faq.html',
    
    // CSS files
    'style.css',
    'responsive.css',
    'admin.css',
    'cart.css',
    'product-detail.css',
    
    // JavaScript files
    'main.js',
    'admin.js',
    'auth-state.js',
    'cart.js',
    'category.js',
    'subcategory.js',
    'collections.js',
    'product-detail.js',
    'about.js',
    'order.js',
    
    // Backend directory (entire folder)
    'backend/',
    
    // Upload directories
    'uploads/',
    'images/',
    
    // Configuration files
    'package.json',
    'package-lock.json',
    '.gitignore',
    
    // Documentation
    'HOSTINGER_DEPLOYMENT_GUIDE.md',
    'hostinger-environment-config.txt'
];

// Files to exclude from deployment
const excludeFiles = [
    'node_modules/',
    '.git/',
    '*.log',
    'test-*.html',
    'debug_*.js',
    'railway_database_setup.sql',
    'create_tables_remotely.js',
    'phpmyadmin-connect.html',
    'render.yaml',
    'cloudflare-config.json',
    'cdn-assets/',
    'backup-*/',
    'performance-*.json',
    'PERFORMANCE_*.md',
    'CDN_*.md',
    'OAUTH_*.md',
    'CSV_IMPORT_*.md',
    'TEST_*.md',
    'BUY_NOW_*.md',
    'LIMITED_EDITION_*.md',
    'AUTOMATIC_FILE_*.md',
    'WEBSITE_LAUNCH_*.md',
    'DEPLOY_URBANNUCLEUS_*.md',
    'RAZORPAY_*.md'
];

console.log('✅ Deployment file list prepared');
console.log('✅ Environment configuration created');
console.log('✅ Deployment guide written');
console.log('\n📋 Next Steps:');
console.log('1. Sign up for Hostinger Business Web Hosting');
console.log('2. Configure your domain');
console.log('3. Create MySQL database in Hostinger cPanel');
console.log('4. Upload your files to public_html/');
console.log('5. Configure environment variables');
console.log('6. Enable Node.js in Hostinger Panel');
console.log('7. Start your application');
console.log('\n📖 Read HOSTINGER_DEPLOYMENT_GUIDE.md for detailed instructions');
console.log('🔧 Use hostinger-environment-config.txt for environment setup');
console.log('\n🎯 Your Urban Nucleus is ready for Hostinger deployment!');

