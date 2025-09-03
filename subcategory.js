// Subcategory Page JavaScript

// Global constants
const API_BASE_URL = 'http://31.97.239.99';

document.addEventListener('DOMContentLoaded', function() {
    // Get subcategory ID and name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subcategoryId = urlParams.get('id');
    const subcategoryName = urlParams.get('name');
    
    if (!subcategoryId) {
        showError('Subcategory ID not found');
        return;
    }
    
    // Update page title and breadcrumb
    updatePageInfo(subcategoryName);
    
    // Load subcategory details and products
    loadSubcategoryProducts(subcategoryId);
    
    // Setup scroll to top functionality
    setupScrollToTop();
});

// Update page information
function updatePageInfo(subcategoryName) {
    if (subcategoryName) {
        document.title = `${subcategoryName} - URBAN NUCLEUS | Premium Fashion Brand`;
        document.getElementById('subcategoryTitle').textContent = subcategoryName;
        document.getElementById('subcategoryName').textContent = subcategoryName;
        document.getElementById('subcategoryDescription').textContent = 
            `Discover our premium collection of ${subcategoryName.toLowerCase()} products.`;
    }
}

// Load products for specific subcategory with optimization
async function loadSubcategoryProducts(subcategoryId) {
    const productsGrid = document.getElementById('productsGrid');
    
    try {

        
        // Show loading spinner
        productsGrid.innerHTML = `
            <div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #D4AF37; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: #666;">Loading products...</p>
            </div>
        `;
        
        // Fetch products for this subcategory using the working admin endpoint  
        const url = `${API_BASE_URL}/admin/products?subcategory=${subcategoryId}&limit=10000`;

        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();


        
        if (products.length === 0) {
            showNoProducts();
            return;
        }
        
        // Render products with optimized loading
        renderProducts(products);
        
    } catch (error) {
        console.error('Error loading subcategory products:', error);
        showError('Failed to load products. Please try again later.');
    }
}

// Render products with lazy loading and optimization
function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    // Clear loading spinner
    productsGrid.innerHTML = '';
    
    // Create product cards with lazy loading
    products.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsGrid.appendChild(productCard);
    });
    
    // Add fade-in animation
    animateProductCards();
}

// Create optimized product card
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    // Better image URL handling with multiple fallbacks
    let imageUrl = product.image_url;
    if (!imageUrl || imageUrl === 'null' || imageUrl === '') {
        // Try to find uploaded images for this product
        const uploadedImages = ['1754801882851-563674824.png', '1754636223677-118256129.png'];
        // Use a random uploaded image as fallback, or dummy.png as last resort
        imageUrl = uploadedImages[Math.floor(Math.random() * uploadedImages.length)];
        imageUrl = `uploads/images/${imageUrl}`;
    }
    
    // If the image URL is a relative path, make sure it's accessible
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('uploads/')) {
        imageUrl = `uploads/images/${imageUrl}`;
    }
    
    
    
            // Create compare price display if available
        let comparePriceDisplay = '';
        const productPrice = parseFloat(product.price);
        const comparePrice = parseFloat(product.compare_at_price);
        if (comparePrice && comparePrice > productPrice) {
            const discount = Math.round(((comparePrice - productPrice) / comparePrice) * 100);
            comparePriceDisplay = `
                <div class="price-comparison">
                    <span class="original-price">₹${comparePrice.toFixed(2)}</span>
                    <span class="discount-badge">-${discount}%</span>
                </div>
            `;
        }
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.name}" 
                 loading="lazy" 
                                          onerror="this.onerror=null; this.src='dummy.png';" 
                         onload=""
                 style="max-width: calc(100% - 30px); max-height: calc(100% - 30px); width: auto; height: auto; object-fit: contain; border-radius: 8px;">
            <div class="product-overlay">
                <button class="quick-view" data-id="${product.id}">Quick View</button>
                <button class="add-to-wishlist" data-id="${product.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            ${comparePriceDisplay}
            <p class="price">₹${product.price}</p>
            ${product.description ? `<p class="product-description">${product.description.substring(0, 60)}...</p>` : ''}
        </div>
    `;
    
    // Make the entire card clickable
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        // Don't redirect if clicking on buttons
        if (e.target.closest('button')) {
            return;
        }
        redirectToProductDetail(product.id);
    });
    
    // Add event listeners
    const quickViewBtn = card.querySelector('.quick-view');
    const wishlistBtn = card.querySelector('.add-to-wishlist');
    
    quickViewBtn.addEventListener('click', () => openQuickView(product.id));
    wishlistBtn.addEventListener('click', () => addToWishlist(product.id));
    
    return card;
}

// Animate product cards with staggered loading
function animateProductCards() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100); // Stagger animation by 100ms per card
    });
}

// Show no products message
function showNoProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-box-open" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="color: #333; margin-bottom: 15px;">No Products Found</h3>
            <p style="color: #666; margin-bottom: 30px;">No products available in this subcategory at the moment.</p>
            <a href="collections.html" class="btn btn-primary" style="text-decoration: none; padding: 12px 30px; background: #D4AF37; color: white; border-radius: 4px;">
                Browse All Collections
            </a>
        </div>
    `;
}

// Show error message
function showError(message) {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h3 style="color: #333; margin-bottom: 15px;">Error</h3>
            <p style="color: #666; margin-bottom: 30px;">${message}</p>
            <button onclick="location.reload()" class="btn btn-primary" style="padding: 12px 30px; background: #D4AF37; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Try Again
            </button>
        </div>
    `;
}

// Quick view functionality
function openQuickView(productId) {
    // This would integrate with the main.js quick view functionality
    
    // You can implement a modal or redirect to product detail page
}

// Add to cart functionality
async function addToCart(productId) {
    try {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            showToast('Please log in to add items to cart', 'error');
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        const user = JSON.parse(currentUser);
        
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                productId: productId,
                quantity: 1
            })
        });
        
        if (response.ok) {
            // Show success message
            showToast('Product added to cart successfully!', 'success');
            // Update cart count if available
            updateCartCount();
        } else {
            const errorData = await response.json().catch(() => ({}));
            showToast(`Failed to add product to cart: ${errorData.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Error adding product to cart', 'error');
    }
}

// Add to wishlist functionality
async function addToWishlist(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/wishlist/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId
            })
        });
        
        if (response.ok) {
            showToast('Product added to wishlist!', 'success');
        } else {
            showToast('Failed to add to wishlist', 'error');
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showToast('Error adding to wishlist', 'error');
    }
}

// Update cart count
function updateCartCount() {
    // This would update the cart count in the header
    // Implementation depends on your cart system
}

// Redirect to product detail page
function redirectToProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 10002;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Setup scroll to top functionality
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .product-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .product-overlay {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .product-card:hover .product-overlay {
        opacity: 1;
    }
    
    .btn-primary {
        transition: background-color 0.3s ease;
    }
    
    .btn-primary:hover {
        background-color: #b8941f !important;
    }
`;
document.head.appendChild(style);

