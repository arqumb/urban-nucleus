/**
 * Urban Nucleus Advanced Mobile Optimizations
 * Enhances mobile user experience with performance optimizations
 */

// Performance optimizations for mobile
class MobileOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTouch = 'ontouchstart' in window;
        this.connectionSpeed = this.getConnectionSpeed();
        this.init();
    }

    init() {
        this.setupViewportOptimization();
        this.setupTouchOptimizations();
        this.setupImageOptimizations();
        this.setupScrollOptimizations();
        this.setupConnectionBasedOptimizations();
        this.setupBatteryOptimizations();
        this.setupPreloadOptimizations();
    }

    // Viewport and orientation optimizations
    setupViewportOptimization() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle viewport resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleViewportResize();
            }, 250);
        });
    }

    handleOrientationChange() {
        // Recalculate layout for orientation change
        const carousels = document.querySelectorAll('.new-arrivals-container, .limited-drops-container');
        carousels.forEach(carousel => {
            if (carousel.recalculateLayout) {
                carousel.recalculateLayout();
            }
        });

        // Update product grid layouts
        this.updateProductGrids();
    }

    handleViewportResize() {
        this.isMobile = window.innerWidth <= 768;
        this.updateMobileStyles();
    }

    // Touch optimizations
    setupTouchOptimizations() {
        if (!this.isTouch) return;

        // Improve touch targets
        const touchTargets = document.querySelectorAll('button, .btn, .product-card, .nav-link');
        touchTargets.forEach(target => {
            if (this.isMobile) {
                target.style.minHeight = '44px';
                target.style.minWidth = '44px';
            }
        });

        // Add touch feedback
        this.addTouchFeedback();

        // Optimize scroll behavior
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    }

    addTouchFeedback() {
        const interactiveElements = document.querySelectorAll('button, .btn, .product-card');
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            }, { passive: true });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
        });
    }

    // Image optimizations for mobile
    setupImageOptimizations() {
        // Lazy load images with Intersection Observer
        this.setupIntersectionObserver();
        
        // Optimize image loading based on connection
        this.optimizeImageQuality();
    }

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observe all images with loading="lazy"
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    loadImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    }

    optimizeImageQuality() {
        if (this.connectionSpeed === 'slow') {
            // Use lower quality images for slow connections
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (img.src.includes('unsplash.com')) {
                    img.src = img.src.replace('&q=80', '&q=60');
                }
            });
        }
    }

    // Scroll optimizations
    setupScrollOptimizations() {
        // Passive scroll listeners
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScrollEnd();
            }, 150);
        }, { passive: true });

        // Reduce scroll animations on mobile
        if (this.isMobile) {
            document.documentElement.style.setProperty('--scroll-behavior', 'auto');
        }
    }

    handleScrollEnd() {
        // Trigger any scroll-dependent optimizations
        this.checkVisibleElements();
    }

    checkVisibleElements() {
        // Pause animations for elements not in view
        const animatedElements = document.querySelectorAll('.animated-element');
        animatedElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                element.classList.add('in-view');
            } else {
                element.classList.remove('in-view');
            }
        });
    }

    // Connection-based optimizations
    setupConnectionBasedOptimizations() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            this.connectionSpeed = this.getConnectionSpeed();
            this.applyConnectionOptimizations();
            
            connection.addEventListener('change', () => {
                this.connectionSpeed = this.getConnectionSpeed();
                this.applyConnectionOptimizations();
            });
        }
    }

    getConnectionSpeed() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) return 'unknown';
        
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') return 'fast';
        if (effectiveType === '3g') return 'medium';
        return 'slow';
    }

    applyConnectionOptimizations() {
        if (this.connectionSpeed === 'slow') {
            // Disable auto-play features
            this.disableAutoplay();
            
            // Reduce animation complexity
            this.reduceAnimations();
            
            // Defer non-critical resources
            this.deferNonCriticalResources();
        }
    }

    // Battery optimizations
    setupBatteryOptimizations() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.optimizeForBattery(battery);
                
                battery.addEventListener('levelchange', () => {
                    this.optimizeForBattery(battery);
                });
            });
        }
    }

    optimizeForBattery(battery) {
        if (battery.level < 0.2) {
            // Low battery optimizations
            this.reduceAnimations();
            this.disableAutoplay();
            this.reducePollFrequency();
        }
    }

    // Preload optimizations
    setupPreloadOptimizations() {
        // Preload critical resources after a short delay to avoid warnings
        setTimeout(() => {
            this.preloadCriticalResources();
        }, 100);
        
        // Prefetch likely next pages
        this.prefetchLikelyPages();
    }

    preloadCriticalResources() {
        // Only preload images that are visible above the fold and critical
        const criticalImages = [];
        
        // Check if header logo exists and add to preload
        const headerLogo = document.querySelector('.logo-icon');
        if (headerLogo && headerLogo.src) {
            criticalImages.push(headerLogo.src);
        }

        // Preload hero images if they exist
        const heroImages = document.querySelectorAll('.hero-slide img');
        if (heroImages.length > 0 && heroImages[0].src) {
            criticalImages.push(heroImages[0].src); // Only first hero image
        }

        criticalImages.forEach(src => {
            // Check if already preloaded to avoid duplicates
            const existingPreload = document.querySelector(`link[rel="preload"][href="${src}"]`);
            if (!existingPreload) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;
                document.head.appendChild(link);
            }
        });
    }

    prefetchLikelyPages() {
        // Prefetch product pages when hovering over product cards
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const productId = card.dataset.productId;
                if (productId) {
                    this.prefetchPage(`product-detail.html?id=${productId}`);
                }
            }, { once: true });
        });
    }

    prefetchPage(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    // Utility methods
    disableAutoplay() {
        const autoplayElements = document.querySelectorAll('[autoplay]');
        autoplayElements.forEach(element => {
            element.removeAttribute('autoplay');
        });
    }

    reduceAnimations() {
        document.documentElement.classList.add('reduce-motion');
    }

    reducePollFrequency() {
        // Reduce API polling frequency
        if (window.pollInterval) {
            clearInterval(window.pollInterval);
            window.pollInterval = setInterval(window.pollFunction, 30000); // Reduce to 30s
        }
    }

    updateProductGrids() {
        // Recalculate product grid layouts
        const grids = document.querySelectorAll('.products-grid, .new-arrivals-track');
        grids.forEach(grid => {
            grid.style.display = 'none';
            grid.offsetHeight; // Force reflow
            grid.style.display = '';
        });
    }

    updateMobileStyles() {
        // Update mobile-specific styles
        const root = document.documentElement;
        if (this.isMobile) {
            root.classList.add('mobile-device');
        } else {
            root.classList.remove('mobile-device');
        }
    }

    handleTouchStart(event) {
        // Handle touch start for better responsiveness
        const touch = event.touches[0];
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(event) {
        // Prevent overscroll bounce on iOS
        const touch = event.touches[0];
        const currentY = touch.clientY;
        
        if (document.body.scrollTop === 0 && currentY > this.touchStartY) {
            event.preventDefault();
        }
    }
}

// CSS for mobile optimizations
const mobileOptimizationCSS = `
/* Touch feedback */
.touch-active {
    transform: scale(0.98);
    opacity: 0.8;
    transition: all 0.1s ease;
}

/* Reduced motion preferences */
.reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
}

/* Mobile device optimizations */
.mobile-device {
    --scroll-behavior: auto;
}

.mobile-device .animated-element:not(.in-view) {
    animation-play-state: paused;
}

/* Enhanced touch targets */
@media (max-width: 768px) {
    button, .btn, .product-card {
        min-height: 44px;
        min-width: 44px;
    }
    
    .product-card {
        padding: 16px;
    }
    
    /* Optimize text rendering */
    body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeSpeed;
    }
}

/* Connection-based optimizations */
.slow-connection .animated-element {
    animation: none !important;
}

.slow-connection .carousel {
    scroll-behavior: auto;
}
`;

// Initialize mobile optimizer when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure all elements are rendered
        setTimeout(() => {
            new MobileOptimizer();
        }, 50);
    });
} else {
    // Page already loaded, initialize immediately
    new MobileOptimizer();
}

// Add CSS to document
const mobileOptimizationStyle = document.createElement('style');
mobileOptimizationStyle.textContent = mobileOptimizationCSS;
document.head.appendChild(mobileOptimizationStyle);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}
