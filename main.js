// Urban Nucleus - Optimized Main JavaScript
// Tailored specifically for the website's actual functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Urban Nucleus - Main.js loaded successfully');
    
    // Initialize all core functionality
    initializeScrollToTop();
    initializeMobileMenu();
    initializeProductInteractions();
    initializeCarousels();
    initializeAnnouncementBar();
    initializeProductGalleries();
    initializeFormEnhancements();
    initializeUIEnhancements();
    
    console.log('All Urban Nucleus functionality initialized');
});

// ==================== SCROLL TO TOP ====================
function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (!scrollToTopBtn) return;
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.style.display = 'none';
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Smooth scroll to top
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==================== MOBILE MENU ====================
function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close menu when clicking outside
    if (mobileMenu) {
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && 
                !mobileMenuBtn.contains(event.target) && 
                mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ==================== PRODUCT INTERACTIONS ====================
function initializeProductInteractions() {
    // Quick View functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.quick-view')) {
            e.preventDefault();
            const btn = e.target.closest('.quick-view');
            const productId = btn.getAttribute('data-product-id');
            
            if (productId) {
                openQuickView(productId);
            }
        }
    });

    // Add to Cart functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.add-to-cart-btn');
            const productId = btn.getAttribute('data-product-id');
            
            if (productId) {
                addToCart(productId, btn);
            }
        }
    });

    // Add to Wishlist functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-wishlist')) {
            e.preventDefault();
            const btn = e.target.closest('.add-to-wishlist');
            const productId = btn.getAttribute('data-product-id');
            
            if (productId) {
                toggleWishlist(productId, btn);
            }
        }
    });

    // Buy Now functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.buy-now-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.buy-now-btn');
            const productId = btn.getAttribute('data-product-id');
            
            if (productId) {
                buyNow(productId);
            }
        }
    });

    // Product card hover effects
    document.querySelectorAll('.product-card, .drop-product-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ==================== QUICK VIEW MODAL ====================
function openQuickView(productId) {
    const modal = document.querySelector('.quick-view-modal');
    const modalContent = modal.querySelector('.quick-view-product');
    
    if (!modal || !modalContent) return;
    
    // Show loading state
    modalContent.innerHTML = '<div class="loading-spinner">Loading product details...</div>';
    modal.style.display = 'block';
    
    // Fetch product details
    fetch(`http://31.97.239.99:3000/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            modalContent.innerHTML = `
                <div class="quick-view-content">
                    <div class="quick-view-image">
                        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'uploads/images/placeholder.png'}" alt="${product.name}">
                    </div>
                    <div class="quick-view-details">
                        <h3>${product.name}</h3>
                        <p class="price">₹${product.price}</p>
                        <div class="quick-view-actions">
                            <button class="btn-primary" onclick="window.location.href='product-detail.html?id=${product.id}'">View Details</button>
                            <button class="btn-dark" onclick="addToCart('${product.id}', this)">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            modalContent.innerHTML = '<div class="error-message">Unable to load product details. Please try again.</div>';
        });
}

// Close quick view modal
function closeQuickView() {
    const modal = document.querySelector('.quick-view-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==================== CART FUNCTIONALITY ====================
function addToCart(productId, button) {
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;
    
    // Get product details
    fetch(`http://31.97.239.99:3000/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            // Add to cart logic (integrate with your cart system)
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : 'uploads/images/placeholder.png',
                quantity: 1
            };
            
            // Store in localStorage or send to backend
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(cartItem);
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            // Show success message
            showNotification('success', 'Added to Cart', `${product.name} has been added to your cart!`);
            
            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            showNotification('error', 'Error', 'Failed to add product to cart. Please try again.');
            
            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;
        });
}

async function updateCartCount() {
    try {
        // Get current user ID
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            // User not logged in, set count to 0
            document.querySelectorAll('.cart-count').forEach(countElement => {
                countElement.textContent = '0';
            });
            return;
        }

        const user = JSON.parse(currentUser);
        const userId = user.id;

        // Fetch cart count from database
        const response = await fetch(`http://31.97.239.99:3000/cart/${userId}`);
        if (response.ok) {
            const cartItems = await response.json();
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            
            document.querySelectorAll('.cart-count').forEach(countElement => {
                countElement.textContent = totalItems;
            });
            
            console.log('Cart count updated from database to:', totalItems);
        } else {
            console.error('Failed to fetch cart count');
            // Fallback to localStorage
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            
            document.querySelectorAll('.cart-count').forEach(countElement => {
                countElement.textContent = totalItems;
            });
            
            console.log('Cart count updated from localStorage fallback to:', totalItems);
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        // Fallback to localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        document.querySelectorAll('.cart-count').forEach(countElement => {
            countElement.textContent = totalItems;
        });
        
        console.log('Cart count updated from error fallback to:', totalItems);
    }
}

// ==================== WISHLIST FUNCTIONALITY ====================
function toggleWishlist(productId, button) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isInWishlist = wishlist.includes(productId);
    
    if (isInWishlist) {
        wishlist = wishlist.filter(id => id !== productId);
        button.classList.remove('active');
        showNotification('info', 'Removed from Wishlist', 'Product removed from your wishlist');
    } else {
        wishlist.push(productId);
        button.classList.add('active');
        showNotification('success', 'Added to Wishlist', 'Product added to your wishlist');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// ==================== BUY NOW FUNCTIONALITY ====================
function buyNow(productId) {
    fetch(`http://31.97.239.99:3000/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            const productData = {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.images && product.images.length > 0 ? product.images[0] : 'uploads/images/placeholder.png',
                quantity: 1,
                sku: product.sku || '',
                category: product.category || ''
            };
            
            const encodedData = encodeURIComponent(JSON.stringify(productData));
            window.location.href = `checkout.html?product=${encodedData}`;
        })
        .catch(error => {
            console.error('Error with buy now:', error);
            showNotification('error', 'Error', 'Failed to process buy now. Please try again.');
        });
}

// ==================== CAROUSELS ====================
function initializeCarousels() {
    // Testimonials Carousel
    initializeTestimonialsCarousel();
    
    // New Arrivals Carousel
    initializeNewArrivalsCarousel();
    
    // Hero Slider
    initializeHeroSlider();
}

function initializeTestimonialsCarousel() {
    const testimonialContainer = document.querySelector('.testimonials-container');
    if (!testimonialContainer) return;
    
    let currentSlide = 0;
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.testimonial-dot');
    const totalSlides = slides.length;
    
    if (totalSlides === 0) return;
    
    function showTestimonialSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    function nextTestimonialSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showTestimonialSlide(currentSlide);
    }
    
    function prevTestimonialSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showTestimonialSlide(currentSlide);
    }
    
    // Navigation buttons
    const nextBtn = document.querySelector('.next-testimonial');
    const prevBtn = document.querySelector('.prev-testimonial');
    
    if (nextBtn) nextBtn.addEventListener('click', nextTestimonialSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevTestimonialSlide);
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showTestimonialSlide(currentSlide);
        });
    });
    
    // Auto-slide
    setInterval(nextTestimonialSlide, 5000);
    
    // Initialize
    showTestimonialSlide(0);
}

function initializeNewArrivalsCarousel() {
    const newArrivalsContainer = document.querySelector('.new-arrivals-container');
    if (!newArrivalsContainer) return;
    
    // This will be handled by the specific page's JavaScript
    // Just ensure the container exists
    console.log('New Arrivals carousel container found');
}

function initializeHeroSlider() {
    // Hero slider is now handled in index.html with API integration
    // This function is kept for compatibility but functionality moved to index.html
    console.log('Hero slider initialization handled in index.html');
}

// ==================== ANNOUNCEMENT BAR ====================
function initializeAnnouncementBar() {
    const announcementBar = document.querySelector('.announcement-bar');
    if (!announcementBar) return;
    
    // Close button functionality
    const closeBtn = announcementBar.querySelector('.announcement-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            announcementBar.style.display = 'none';
            localStorage.setItem('announcementClosed', 'true');
        });
    }
    
    // Check if user previously closed it
    if (localStorage.getItem('announcementClosed') === 'true') {
        announcementBar.style.display = 'none';
    }
}

// ==================== PRODUCT GALLERIES ====================
function initializeProductGalleries() {
    // Product image gallery functionality
    document.querySelectorAll('.product-gallery').forEach(gallery => {
        const mainImage = gallery.querySelector('.main-image');
        const thumbnails = gallery.querySelectorAll('.thumbnail');
        
        if (mainImage && thumbnails.length > 0) {
            thumbnails.forEach(thumbnail => {
                thumbnail.addEventListener('click', function() {
                    const newSrc = this.getAttribute('data-src');
                    if (newSrc) {
                        mainImage.src = newSrc;
                        
                        // Update active thumbnail
                        thumbnails.forEach(thumb => thumb.classList.remove('active'));
                        this.classList.add('active');
                    }
                });
            });
        }
    });
}

// ==================== FORM ENHANCEMENTS ====================
function initializeFormEnhancements() {
    // Form validation
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showNotification('error', 'Validation Error', 'Please fill in all required fields.');
            }
        });
    });
    
    // Quantity controls
    document.querySelectorAll('.quantity-controls').forEach(control => {
        const minusBtn = control.querySelector('.quantity-minus');
        const plusBtn = control.querySelector('.quantity-plus');
        const input = control.querySelector('.quantity-input');
        
        if (minusBtn && plusBtn && input) {
            minusBtn.addEventListener('click', function() {
                const currentValue = parseInt(input.value) || 1;
                if (currentValue > 1) {
                    input.value = currentValue - 1;
                }
            });
            
            plusBtn.addEventListener('click', function() {
                const currentValue = parseInt(input.value) || 1;
                input.value = currentValue + 1;
            });
        }
    });
    
    // Size selection
    document.querySelectorAll('.size-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from siblings
            this.parentNode.querySelectorAll('.size-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Add active class to clicked option
            this.classList.add('active');
        });
    });
}

// ==================== UI ENHANCEMENTS ====================
function initializeUIEnhancements() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Collection item hover effects
    document.querySelectorAll('.collection-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Social links hover effects
    document.querySelectorAll('.social-links a').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.1)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Footer links hover effects
    document.querySelectorAll('.footer-col ul li a').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.paddingLeft = '20px';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.paddingLeft = '15px';
        });
    });
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(type, title, message, duration = 5000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10002;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        cursor: pointer;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <div>
                <strong>${title}</strong>
                <div style="font-size: 0.9em; opacity: 0.9;">${message}</div>
            </div>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
    
    // Click to dismiss
    notification.addEventListener('click', function() {
        this.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 300);
    });
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== GLOBAL FUNCTIONS ====================
// Make key functions available globally
window.closeQuickView = closeQuickView;
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.buyNow = buyNow;
window.showNotification = showNotification;
window.updateCartCount = updateCartCount;

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});