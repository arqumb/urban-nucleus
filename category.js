// API Base URL
const API_BASE_URL = 'http://31.97.239.99';

// Global variables
let currentCategory = null;
let currentSubcategory = 'all';
let allProducts = [];
let currentCategoryId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCategoryData();
    setupMobileMenu();
    setupFilterListeners();
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', function() {

        loadCategoryData();
    });
    
    // Listen for URL changes from other parts of the app
    window.addEventListener('urlChanged', function() {

        loadCategoryData();
    });
});

// Load category data based on URL parameters
async function loadCategoryData() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    const viewParam = urlParams.get('view');
    
    
    
    if (!categoryId) {
        showError('Category not found');
        return;
    }
    
    // Always reload if category ID changes or if we're switching to subcategories view
    const shouldReload = currentCategoryId !== categoryId || viewParam === 'subcategories';
    
    if (!shouldReload) {

        return;
    }
    
    
    currentCategoryId = categoryId;
    currentSubcategory = 'all'; // Reset subcategory filter
    
    try {
        // Load category details
        await loadCategoryDetails(categoryId);
        
        // Load subcategories
        await loadSubcategories(categoryId);
        
        // Load products
        await loadProducts(categoryId);
        
    } catch (error) {
        console.error('Error loading category data:', error);
        showError('Failed to load category data. Please try again later.');
    }
}

// Load category details
async function loadCategoryDetails(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        
        currentCategory = categories.find(cat => cat.id == categoryId);
        
        if (!currentCategory) {
            throw new Error('Category not found');
        }
        
        // Update page title and content
        document.title = `${currentCategory.name} - URBAN NUCLEUS | Premium Fashion Brand`;
        document.getElementById('categoryTitle').textContent = currentCategory.name;
        document.getElementById('categoryName').textContent = currentCategory.name;
        document.getElementById('categoryDescription').textContent = 
            currentCategory.description || `Discover our premium collection of ${currentCategory.name.toLowerCase()}.`;
        
    } catch (error) {
        console.error('Error loading category details:', error);
        throw error;
    }
}

// Load subcategories for the category
async function loadSubcategories(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/subcategories`);
        const subcategories = await response.json();
        
        const subcategoryFilters = document.getElementById('subcategoryFilters');
        
        // Clear existing filters
        subcategoryFilters.innerHTML = '';
        
        // Always add "All Products" button first
        const allProductsBtn = document.createElement('button');
        allProductsBtn.className = 'filter-btn active';
        allProductsBtn.setAttribute('data-subcategory', 'all');
        allProductsBtn.textContent = 'All Products';
        subcategoryFilters.appendChild(allProductsBtn);
        
        // Add subcategory filter buttons
        subcategories.forEach(subcategory => {
            const filterBtn = document.createElement('button');
            filterBtn.className = 'filter-btn';
            filterBtn.setAttribute('data-subcategory', subcategory.id);
            filterBtn.textContent = subcategory.name;
            subcategoryFilters.appendChild(filterBtn);
        });
        
        // Set initial state
        currentSubcategory = 'all';
        
    } catch (error) {
        console.error('Error loading subcategories:', error);
        // Don't throw error, just show empty subcategories
    }
}

// Load products for the category
async function loadProducts(categoryId) {
    const productsGrid = document.getElementById('productsGrid');
    
    try {
        // Show loading spinner
        productsGrid.innerHTML = '<div class="loading-spinner"></div>';
        
        // Use the admin endpoint which works correctly (same as admin panel filter)
        const response = await fetch(`${API_BASE_URL}/admin/products?category=${categoryId}&limit=10000`);
        const products = await response.json();
        
        // CRITICAL: Clear any existing products from DOM and global variable
        allProducts = [];
        productsGrid.innerHTML = '';
        
        allProducts = products;
        
        if (products.length === 0) {
            showNoProducts();
            return;
        }
        
        // Render products
        renderProducts(products);

        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products. Please try again later.');
    }
}

// Render products in the grid
function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    

    
    const productsHTML = products.map(product => {
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
        
        const badge = product.status === 'sale' ? '<div class="product-badge">Sale</div>' : '';
        const subcategoryId = product.subcategory_id || '';
        

        
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

        return `
            <div class="product-card clickable" data-product-id="${product.id}" data-category-id="${product.category_id}" data-subcategory="${subcategoryId}" onclick="redirectToProductDetail(${product.id})">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" 
                         onerror="this.onerror=null; this.src='dummy.png';" 
                         onload=""
                         loading="lazy">
                    ${badge}
                </div>
                <div class="product-content">
                    <h3 class="product-title product-name">${product.name}</h3>
                    ${comparePriceDisplay}
                    <div class="product-price">₹${parseFloat(product.price).toFixed(2)}</div>
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    productsGrid.innerHTML = productsHTML;
    

}

// Setup filter listeners
function setupFilterListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn')) {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Get subcategory filter
            const subcategoryId = e.target.getAttribute('data-subcategory');
            currentSubcategory = subcategoryId;
            
            // Filter products
            filterProducts();
        }
    });
}

// Filter products based on selected subcategory
function filterProducts() {
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach((card, index) => {
        const productSubcategory = card.getAttribute('data-subcategory');
        
        if (currentSubcategory === 'all' || productSubcategory === currentSubcategory) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    
    
    // Check if any products are visible
    if (visibleCount === 0) {

        showNoProductsInSubcategory();
    } else {

        // Hide any existing "no products" message
        const noProductsMsg = document.querySelector('.no-products');
        if (noProductsMsg) {
            noProductsMsg.remove();
        }
    }
}

// Show no products message
function showNoProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    // Remove any existing "no products" message first
    const existingMsg = productsGrid.querySelector('.no-products');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create the message element
    const noProductsMsg = document.createElement('div');
    noProductsMsg.className = 'no-products';
    noProductsMsg.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10;
    `;
    
    noProductsMsg.innerHTML = `
        <i class="fas fa-box-open" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
        <h3 style="color: #333; margin-bottom: 15px;">No Products Available</h3>
        <p style="color: #666; margin-bottom: 30px;">We're currently setting up products for this category. Please check back soon!</p>
    `;
    
    // Insert the message at the beginning of the grid
    productsGrid.insertBefore(noProductsMsg, productsGrid.firstChild);
}

// Show no products in subcategory message
function showNoProductsInSubcategory() {
    const productsGrid = document.getElementById('productsGrid');
    const subcategoryName = document.querySelector('.filter-btn.active').textContent;
    
    // Remove any existing "no products" message first
    const existingMsg = productsGrid.querySelector('.no-products');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create the message element
    const noProductsMsg = document.createElement('div');
    noProductsMsg.className = 'no-products';
    noProductsMsg.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10;
    `;
    
    noProductsMsg.innerHTML = `
        <i class="fas fa-filter" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
        <h3 style="color: #333; margin-bottom: 15px;">No Products in ${subcategoryName}</h3>
        <p style="color: #666; margin-bottom: 30px;">No products available in this subcategory. Try selecting a different filter.</p>
        <button onclick="resetFilters()" class="btn-product btn-primary" style="margin-top: 20px;">
            Show All Products
        </button>
    `;
    
    // Insert the message at the beginning of the grid
    productsGrid.insertBefore(noProductsMsg, productsGrid.firstChild);
}

// Reset filters to show all products
function resetFilters() {
    const allProductsBtn = document.querySelector('[data-subcategory="all"]');
    if (allProductsBtn) {
        allProductsBtn.click();
    }
}

// Show error message
function showError(message) {
    const productsGrid = document.getElementById('productsGrid');
    
    // Remove any existing error message first
    const existingError = productsGrid.querySelector('.no-products');
    if (existingError) {
        existingError.remove();
    }
    
    // Create the error message element
    const errorMsg = document.createElement('div');
    errorMsg.className = 'no-products';
    errorMsg.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10;
    `;
    
    errorMsg.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;"></i>
        <h3 style="color: #333; margin-bottom: 15px;">Error Loading Products</h3>
        <p style="color: #666; margin-bottom: 30px;">${message}</p>
        <button onclick="location.reload()" class="btn-product btn-primary" style="margin-top: 20px;">
            Try Again
        </button>
    `;
    
    // Insert the error message at the beginning of the grid
    productsGrid.insertBefore(errorMsg, productsGrid.firstChild);
}

// Redirect to product detail page
function redirectToProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Add to cart functionality
async function addToCart(productId) {
    try {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            alert('Please log in to add items to cart');
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
        
        const result = await response.json();
        if (response.ok) {
            alert('Product added to cart successfully!');
        } else {
            alert(`Failed to add product to cart: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart');
    }
}

// Setup mobile menu
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

