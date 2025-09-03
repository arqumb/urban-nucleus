#!/usr/bin/env node

/**
 * Urban Nucleus CDN Integration Setup
 * Configures Content Delivery Network for static assets
 */

const fs = require('fs');
const path = require('path');

class CDNConfigurator {
    constructor() {
        this.cdnProviders = {
            cloudflare: {
                name: 'Cloudflare',
                free: true,
                features: ['Global CDN', 'DDoS Protection', 'SSL', 'Caching'],
                setup: 'DNS-based, no code changes required'
            },
            jsdelivr: {
                name: 'jsDelivr',
                free: true,
                features: ['GitHub integration', 'NPM packages', 'Global CDN'],
                setup: 'For open source projects'
            },
            cloudinary: {
                name: 'Cloudinary',
                free: 'Limited',
                features: ['Image optimization', 'Transformations', 'Auto-format'],
                setup: 'Best for images'
            },
            aws: {
                name: 'Amazon CloudFront',
                free: 'Limited',
                features: ['Global edge locations', 'Lambda@Edge', 'High performance'],
                setup: 'Enterprise solution'
            }
        };
        
        this.init();
    }

    init() {
        console.log('⚙️ Urban Nucleus CDN Integration Setup');
        console.log('====================================\n');
        
        this.analyzeCurrentAssets();
        this.generateCDNConfigurations();
        this.createOptimizedAssetStructure();
        this.setupServiceWorker();
        this.generateImplementationGuide();
    }

    analyzeCurrentAssets() {
        console.log('📊 Analyzing current assets...');
        
        const assets = {
            images: this.findAssets('uploads/images', ['.jpg', '.jpeg', '.png', '.svg', '.webp']),
            css: this.findAssets('.', ['.css']),
            js: this.findAssets('.', ['.js']),
            fonts: this.findAssets('.', ['.woff', '.woff2', '.ttf'])
        };

        const sizes = {
            images: this.calculateTotalSize(assets.images),
            css: this.calculateTotalSize(assets.css),
            js: this.calculateTotalSize(assets.js),
            fonts: this.calculateTotalSize(assets.fonts)
        };

        console.log('📈 Asset Analysis:');
        console.log(`   Images: ${assets.images.length} files (${(sizes.images / 1024 / 1024).toFixed(2)}MB)`);
        console.log(`   CSS: ${assets.css.length} files (${(sizes.css / 1024).toFixed(1)}KB)`);
        console.log(`   JavaScript: ${assets.js.length} files (${(sizes.js / 1024).toFixed(1)}KB)`);
        console.log(`   Fonts: ${assets.fonts.length} files (${(sizes.fonts / 1024).toFixed(1)}KB)`);
        console.log(`   Total: ${((sizes.images + sizes.css + sizes.js + sizes.fonts) / 1024 / 1024).toFixed(2)}MB\n`);

        return { assets, sizes };
    }

    findAssets(directory, extensions) {
        const assets = [];
        
        if (!fs.existsSync(directory)) return assets;
        
        const files = fs.readdirSync(directory, { withFileTypes: true });
        
        files.forEach(file => {
            const fullPath = path.join(directory, file.name);
            
            if (file.isDirectory() && directory === '.') {
                // Don't recurse into subdirectories for root search
                return;
            } else if (file.isDirectory()) {
                assets.push(...this.findAssets(fullPath, extensions));
            } else if (extensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
                assets.push(fullPath);
            }
        });
        
        return assets;
    }

    calculateTotalSize(files) {
        return files.reduce((total, file) => {
            try {
                return total + fs.statSync(file).size;
            } catch (error) {
                return total;
            }
        }, 0);
    }

    generateCDNConfigurations() {
        console.log('🌐 Generating CDN configurations...');

        // Cloudflare configuration
        this.generateCloudflareConfig();
        
        // Image CDN configuration
        this.generateImageCDNConfig();
        
        // Static asset CDN configuration
        this.generateStaticAssetConfig();

        console.log('✅ CDN configurations generated\n');
    }

    generateCloudflareConfig() {
        const cloudflareConfig = {
            name: 'Cloudflare Setup',
            steps: [
                '1. Sign up for free Cloudflare account',
                '2. Add your domain to Cloudflare',
                '3. Update nameservers to Cloudflare',
                '4. Enable Auto Minify for CSS, JS, HTML',
                '5. Enable Brotli compression',
                '6. Set up Page Rules for caching'
            ],
            pageRules: [
                {
                    url: '*.css',
                    settings: {
                        'Cache Level': 'Cache Everything',
                        'Edge Cache TTL': '1 month',
                        'Browser Cache TTL': '1 month'
                    }
                },
                {
                    url: '*.js',
                    settings: {
                        'Cache Level': 'Cache Everything',
                        'Edge Cache TTL': '1 month',
                        'Browser Cache TTL': '1 month'
                    }
                },
                {
                    url: 'uploads/images/*',
                    settings: {
                        'Cache Level': 'Cache Everything',
                        'Edge Cache TTL': '1 month',
                        'Browser Cache TTL': '1 month'
                    }
                }
            ],
            optimizations: [
                'Auto Minify: ON',
                'Brotli: ON',
                'Mirage: ON (image optimization)',
                'Polish: ON (image compression)',
                'Rocket Loader: OFF (can break functionality)'
            ]
        };

        fs.writeFileSync('cloudflare-config.json', JSON.stringify(cloudflareConfig, null, 2));
    }

    generateImageCDNConfig() {
        const imageCDNConfig = {
            provider: 'Cloudinary',
            setup: {
                baseUrl: 'https://res.cloudinary.com/your-cloud-name/image/upload',
                transformations: {
                    'product-thumbnails': 'w_300,h_300,c_fill,f_auto,q_auto',
                    'product-details': 'w_800,h_800,c_fill,f_auto,q_auto',
                    'hero-images': 'w_1920,h_1080,c_fill,f_auto,q_auto',
                    'mobile-optimized': 'w_400,h_400,c_fill,f_auto,q_auto,dpr_2.0'
                }
            },
            implementation: {
                'Before': 'uploads/images/product1.jpg',
                'After': 'https://res.cloudinary.com/your-cloud-name/image/upload/w_300,h_300,c_fill,f_auto,q_auto/product1'
            }
        };

        fs.writeFileSync('image-cdn-config.json', JSON.stringify(imageCDNConfig, null, 2));
    }

    generateStaticAssetConfig() {
        const staticConfig = {
            jsDelivr: {
                baseUrl: 'https://cdn.jsdelivr.net/gh/username/urban-nucleus@main',
                usage: {
                    css: 'https://cdn.jsdelivr.net/gh/username/urban-nucleus@main/combined.min.css',
                    js: 'https://cdn.jsdelivr.net/gh/username/urban-nucleus@main/combined.min.js'
                }
            },
            githubPages: {
                baseUrl: 'https://username.github.io/urban-nucleus',
                setup: 'Push assets to gh-pages branch'
            }
        };

        fs.writeFileSync('static-cdn-config.json', JSON.stringify(staticConfig, null, 2));
    }

    createOptimizedAssetStructure() {
        console.log('📁 Creating optimized asset structure...');

        // Create CDN-ready directory structure
        const cdnDir = './cdn-assets';
        const dirs = [
            'css',
            'js',
            'images/thumbnails',
            'images/products',
            'images/hero',
            'fonts'
        ];

        if (!fs.existsSync(cdnDir)) {
            fs.mkdirSync(cdnDir);
        }

        dirs.forEach(dir => {
            const fullPath = path.join(cdnDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });

        // Copy optimized files
        if (fs.existsSync('combined.min.css')) {
            fs.copyFileSync('combined.min.css', path.join(cdnDir, 'css', 'main.min.css'));
        }

        if (fs.existsSync('combined.min.js')) {
            fs.copyFileSync('combined.min.js', path.join(cdnDir, 'js', 'main.min.js'));
        }

        console.log('✅ CDN asset structure created\n');
    }

    setupServiceWorker() {
        console.log('🔧 Setting up Service Worker for caching...');

        const serviceWorkerCode = `
// Urban Nucleus Service Worker
// Provides offline caching and performance optimization

const CACHE_NAME = 'urban-nucleus-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/combined.min.css',
    '/combined.min.js',
    '/images/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Handle static assets
    if (event.request.url.includes('.css') || 
        event.request.url.includes('.js') || 
        event.request.url.includes('/images/')) {
        
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(event.request).then((response) => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseClone));
                        }
                        return response;
                    });
                })
        );
    }
    
    // Handle API requests with network-first strategy
    else if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'cart-sync') {
        event.waitUntil(syncCart());
    }
});

async function syncCart() {
    // Sync cart data when back online
    const cartData = await getStoredCartData();
    if (cartData) {
        try {
            await fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartData)
            });
            clearStoredCartData();
        } catch (error) {
            console.log('Cart sync failed, will retry later');
        }
    }
}
`;

        fs.writeFileSync('sw.js', serviceWorkerCode);

        // Create service worker registration script
        const swRegistration = `
// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}
`;

        fs.writeFileSync('sw-register.js', swRegistration);
        console.log('✅ Service Worker created\n');
    }

    generateImplementationGuide() {
        console.log('📋 Generating implementation guide...');

        const guide = `
# Urban Nucleus CDN Implementation Guide

## 🌐 CDN Providers Comparison

### 1. Cloudflare (Recommended for beginners)
- ✅ **Free tier available**
- ✅ **Easy DNS-based setup**
- ✅ **Global CDN network**
- ✅ **DDoS protection**
- ✅ **SSL certificates**
- ⚙️ **Setup**: Change nameservers only

### 2. Cloudinary (Best for images)
- ✅ **Image optimization**
- ✅ **Auto-format (WebP, AVIF)**
- ✅ **Responsive images**
- ✅ **Real-time transformations**
- 💰 **Free**: 25GB storage, 25GB bandwidth

### 3. jsDelivr (For open source)
- ✅ **Free for public repos**
- ✅ **GitHub integration**
- ✅ **Global CDN**
- ⚠️ **Only for public projects**

## 🚀 Quick Setup Guide

### Phase 1: Cloudflare Setup (15 minutes)
1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers
4. Enable optimizations:
   - Auto Minify: CSS, JS, HTML
   - Brotli compression
   - Image optimization

### Phase 2: Image CDN (30 minutes)
1. Sign up for Cloudinary
2. Upload images to cloud
3. Update image URLs in code
4. Configure transformations

### Phase 3: Static Assets (20 minutes)
1. Upload minified CSS/JS to CDN
2. Update HTML references
3. Test loading speeds

## 📊 Expected Performance Improvements

### Before CDN:
- Loading time: 3-5 seconds
- Server load: High
- Global performance: Variable

### After CDN:
- Loading time: 1-2 seconds ⚡
- Server load: 70% reduced 📉
- Global performance: Consistent 🌍

## 🔧 Implementation Steps

### 1. Update HTML References
\`\`\`html
<!-- Before -->
<link rel="stylesheet" href="combined.min.css">
<script src="combined.min.js"></script>

<!-- After -->
<link rel="stylesheet" href="https://cdn.example.com/css/main.min.css">
<script src="https://cdn.example.com/js/main.min.js"></script>
\`\`\`

### 2. Update Image URLs
\`\`\`javascript
// Before
const imageUrl = 'uploads/images/product.jpg';

// After
const imageUrl = 'https://res.cloudinary.com/your-cloud/image/upload/w_400,f_auto,q_auto/product.jpg';
\`\`\`

### 3. Enable Service Worker
Add to your HTML head:
\`\`\`html
<script src="sw-register.js"></script>
\`\`\`

## 📈 Monitoring & Testing

### Tools to test CDN performance:
- **GTmetrix**: gtmetrix.com
- **Pingdom**: pingdom.com
- **WebPageTest**: webpagetest.org
- **Google PageSpeed**: pagespeed.web.dev

### Key metrics to monitor:
- **TTFB** (Time to First Byte): < 200ms
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1

## 🛠️ Advanced Optimizations

### 1. Resource Hints
\`\`\`html
<link rel="preconnect" href="https://cdn.example.com">
<link rel="dns-prefetch" href="//images.example.com">
\`\`\`

### 2. Critical CSS Inlining
\`\`\`html
<style>
/* Critical above-the-fold CSS */
.header { /* styles */ }
</style>
\`\`\`

### 3. Lazy Loading
\`\`\`html
<img src="placeholder.jpg" data-src="https://cdn.example.com/image.jpg" loading="lazy">
\`\`\`

## 💡 Pro Tips

1. **Use multiple CDNs** for redundancy
2. **Monitor CDN performance** regularly
3. **Keep local fallbacks** for critical assets
4. **Use HTTP/2 Push** for critical resources
5. **Implement Service Worker** for offline caching

## 🔄 Rollback Plan

If CDN causes issues:
1. Update DNS to bypass CDN
2. Revert HTML to local asset URLs
3. Monitor for 24 hours
4. Investigate and fix issues
5. Re-enable CDN gradually

## 📞 Support Resources

- Cloudflare Support: support.cloudflare.com
- Cloudinary Docs: cloudinary.com/documentation
- jsDelivr Support: github.com/jsdelivr/jsdelivr

---

**Next Steps:**
1. Choose your CDN provider
2. Follow the setup guide
3. Test performance improvements
4. Monitor and optimize

**Estimated Setup Time:** 1-2 hours
**Expected Performance Gain:** 50-70% faster loading
`;

        fs.writeFileSync('CDN_IMPLEMENTATION_GUIDE.md', guide);
        console.log('✅ Implementation guide created: CDN_IMPLEMENTATION_GUIDE.md\n');
    }
}

// Run CDN setup if called directly
if (require.main === module) {
    new CDNConfigurator();
}

module.exports = CDNConfigurator;
