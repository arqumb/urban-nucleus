/**
 * Urban Nucleus Preload Optimizer
 * Prevents unnecessary preload warnings and optimizes resource loading
 */

class PreloadOptimizer {
    constructor() {
        this.preloadedResources = new Set();
        this.init();
    }

    init() {
        // Immediately prevent problematic preloads
        this.preventProblematicPreloads();
        
        // Monitor for unused preloads
        this.monitorPreloadUsage();
        
        // Clean up unused preloads after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.cleanupUnusedPreloads();
            }, 3000); // Wait 3 seconds after load
        });
    }

    preventProblematicPreloads() {
        // Override any attempts to preload urban-nucleus-logo.svg
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'link') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    // Prevent preload of urban-nucleus-logo.svg
                    if (name === 'href' && value && value.includes('urban-nucleus-logo.svg') && 
                        element.rel === 'preload') {
                        console.log('🚫 Blocked preload of urban-nucleus-logo.svg');
                        return; // Don't set the href
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
    }

    monitorPreloadUsage() {
        // Track when preloaded resources are actually used
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name && this.preloadedResources.has(entry.name)) {
                    console.log(`✅ Preloaded resource used: ${entry.name}`);
                }
            }
        });

        if ('PerformanceObserver' in window) {
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    cleanupUnusedPreloads() {
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        
        preloadLinks.forEach(link => {
            const href = link.href;
            const isUsed = this.isResourceUsed(href);
            
            if (!isUsed) {
                console.log(`⚠️ Removing unused preload: ${href}`);
                link.remove();
            }
        });

        // Check for any apple-touch-icon optimizations
        console.log('✅ Preload cleanup completed');
    }

    isResourceUsed(href) {
        // Check if resource is actually used in the page
        const images = document.querySelectorAll('img');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const scripts = document.querySelectorAll('script[src]');
        
        // Check images
        for (const img of images) {
            if (img.src === href || img.srcset?.includes(href)) {
                return true;
            }
        }
        
        // Check stylesheets
        for (const css of stylesheets) {
            if (css.href === href) {
                return true;
            }
        }
        
        // Check scripts
        for (const script of scripts) {
            if (script.src === href) {
                return true;
            }
        }
        
        return false;
    }

    // Utility method to safely preload resources
    static safePreload(href, as, onlyIfVisible = true) {
        // Don't preload if resource doesn't exist or is already preloaded
        const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
        if (existing) return;

        // For images, check if they're visible or will be visible soon
        if (as === 'image' && onlyIfVisible) {
            const img = document.querySelector(`img[src="${href}"]`);
            if (img) {
                const rect = img.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight + 100; // 100px buffer
                if (!isVisible) return; // Don't preload off-screen images
            }
        }

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        link.href = href;
        
        // Add error handling
        link.onerror = () => {
            console.warn(`Failed to preload: ${href}`);
            link.remove();
        };
        
        document.head.appendChild(link);
        console.log(`🚀 Safely preloaded: ${href}`);
    }
}

// Preload optimizer initialized below

// Initialize preload optimizer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PreloadOptimizer();
    });
} else {
    new PreloadOptimizer();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.PreloadOptimizer = PreloadOptimizer;
}
