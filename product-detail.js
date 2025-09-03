// Product Detail Page JavaScript
// Handles all dynamic functionality for the product detail page

// Global variables
let currentProduct = null;
let selectedSize = null;
let selectedQuantity = 1;

let productImages = [];
let productVideos = [];



// Constants
const API_BASE_URL = 'http://31.97.239.99:3000';

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProductDetail();
});



// Initialize product detail page
function initializeProductDetail() {
    // Get product ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');
    
    // If no product ID provided, use a default one for testing
    if (!productId) {
        console.log('No product ID provided, using default ID 13 for testing');
        productId = '13';
        // Update URL without reloading
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', productId);
        window.history.replaceState({}, '', newUrl);
    }
    
    // Load product details
    loadProductDetails(productId);
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize image gallery
    initializeImageGallery();
    
    // Initialize quantity button states
    updateQuantityButtons();
    
    // Set up inventory refresh mechanism
    setupInventoryRefresh(productId);
}

// Set up inventory refresh mechanism
function setupInventoryRefresh(productId) {
    console.log('🔄 Setting up inventory refresh for product:', productId);
    
            // Add refresh button to the page
        addInventoryRefreshButton();
        
        // Add debug button for testing
        addDebugButton();
        
        // Add manual test button
        addManualTestButton();
        
        // Set up periodic refresh every 30 seconds
        setInterval(() => {
            refreshInventoryOnly(productId);
        }, 30000);
    
    // Refresh inventory when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('📱 Page became visible, refreshing inventory...');
            refreshInventoryOnly(productId);
        }
    });
    
    // Refresh inventory when window gains focus
    window.addEventListener('focus', function() {
        console.log('🎯 Window gained focus, refreshing inventory...');
        refreshInventoryOnly(productId);
    });
}

// Add inventory refresh button
function addInventoryRefreshButton() {
    // Look for a good place to add the refresh button
    const inventorySection = document.querySelector('.product-info-section') || 
                            document.querySelector('.product-details') ||
                            document.querySelector('.product-availability');
    
    if (inventorySection) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'inventory-refresh-btn';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Inventory';
        refreshButton.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 8px 15px;
            font-size: 12px;
            color: #666;
            cursor: pointer;
            margin-left: 10px;
            transition: all 0.3s ease;
        `;
        
        refreshButton.addEventListener('click', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            if (productId) {
                refreshInventoryOnly(productId);
                // Add loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                this.disabled = true;
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Inventory';
                    this.disabled = false;
                }, 2000);
            }
        });
        
        // Insert the button after the inventory element
        const inventoryElement = document.getElementById('product-inventory');
        if (inventoryElement && inventoryElement.parentNode) {
            inventoryElement.parentNode.insertBefore(refreshButton, inventoryElement.nextSibling);
        } else {
            inventorySection.appendChild(refreshButton);
        }
    }
}

// Add debug button for testing inventory
function addDebugButton() {
    const inventorySection = document.querySelector('.product-info-section') || 
                            document.querySelector('.product-details') ||
                            document.querySelector('.product-availability');
    
    if (inventorySection) {
        const debugButton = document.createElement('button');
        debugButton.className = 'debug-inventory-btn';
        debugButton.innerHTML = '<i class="fas fa-bug"></i> Debug Inventory';
        debugButton.style.cssText = `
            background: #ffc107 !important;
            border: 1px solid #e0a800 !important;
            border-radius: 5px !important;
            padding: 8px 15px !important;
            font-size: 12px !important;
            color: #856404 !important;
            cursor: pointer !important;
            margin-left: 10px !important;
            transition: all 0.3s ease !important;
            font-family: inherit !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 5px !important;
        `;
        
        debugButton.addEventListener('click', function() {
            debugInventoryState();
        });
        
        // Insert the button after the refresh button
        const refreshButton = document.querySelector('.inventory-refresh-btn');
        if (refreshButton && refreshButton.parentNode) {
            refreshButton.parentNode.insertBefore(debugButton, refreshButton.nextSibling);
        } else {
            inventorySection.appendChild(debugButton);
        }
    }
}

// Debug inventory state
function debugInventoryState() {
    console.log('🐛 === INVENTORY DEBUG ===');
    console.log('Current Product:', currentProduct);
    console.log('Current Product Sizes:', currentProduct?.sizes);
    console.log('Selected Size:', selectedSize);
    
    // Check DOM elements
    const inventoryElement = document.getElementById('product-inventory');
    const availabilityElement = document.getElementById('product-availability');
    const sizesContainer = document.getElementById('product-sizes');
    
    console.log('Inventory Element:', inventoryElement);
    console.log('Availability Element:', availabilityElement);
    console.log('Sizes Container:', sizesContainer);
    
    if (sizesContainer) {
        const sizeButtons = sizesContainer.querySelectorAll('.size-option');
        console.log('Size Buttons Found:', sizeButtons.length);
        sizeButtons.forEach((btn, index) => {
            console.log(`Size Button ${index}:`, {
                size: btn.dataset.size,
                inventory: btn.dataset.inventory,
                classes: btn.className,
                disabled: btn.disabled,
                text: btn.textContent.trim()
            });
        });
    }
    
    // Test API call
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId) {
        console.log('🔄 Testing API call for product:', productId);
        fetch(`${API_BASE_URL}/products/${productId}`)
            .then(response => response.json())
            .then(data => {
                console.log('📡 API Response:', data);
                console.log('📦 Sizes from API:', data.sizes);
            })
            .catch(error => {
                console.error('❌ API Error:', error);
            });
    }
    
    console.log('🐛 === END DEBUG ===');
}

// Add manual test button for testing inventory display
function addManualTestButton() {
    const inventorySection = document.querySelector('.product-info-section') || 
                            document.querySelector('.product-details') ||
                            document.querySelector('.product-availability');
    
    if (inventorySection) {
        const testButton = document.createElement('button');
        testButton.className = 'manual-test-btn';
        testButton.innerHTML = '<i class="fas fa-vial"></i> Test Inventory Display';
        testButton.style.cssText = `
            background: #28a745 !important;
            border: 1px solid #1e7e34 !important;
            border-radius: 5px !important;
            padding: 8px 15px !important;
            font-size: 12px !important;
            color: white !important;
            cursor: pointer !important;
            margin-left: 10px !important;
            transition: all 0.3s ease !important;
            font-family: inherit !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 5px !important;
        `;
        
        testButton.addEventListener('click', function() {
            testInventoryDisplay();
        });
        
        // Insert the button after the debug button
        const debugButton = document.querySelector('.debug-inventory-btn');
        if (debugButton && debugButton.parentNode) {
            debugButton.parentNode.insertBefore(testButton, debugButton.nextSibling);
        } else {
            inventorySection.appendChild(testButton);
        }
    }
}

// Test inventory display with sample data
function testInventoryDisplay() {
    console.log('🧪 === TESTING INVENTORY DISPLAY ===');
    
    // Test data with known inventory
    const testSizes = [
        { size: 'US 7', inventory: 24 },
        { size: 'US 8', inventory: 21 },
        { size: 'US 9', inventory: 16 },
        { size: 'US 10', inventory: 18 },
        { size: 'US 11', inventory: 20 }
    ];
    
    console.log('🧪 Test sizes data:', testSizes);
    
    // Test the display function
    displayProductSizes(testSizes);
    
    console.log('🧪 === END TEST ===');
}

// Refresh only inventory data without reloading entire product
async function refreshInventoryOnly(productId) {
    try {
        console.log('🔄 Refreshing inventory for product:', productId);
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updatedProduct = await response.json();
        console.log('📦 Updated product data received:', updatedProduct);
        
        // Update current product data
        if (currentProduct) {
            currentProduct.sizes = updatedProduct.sizes || [];
            currentProduct.inventory = updatedProduct.inventory;
        }
        
        // Update inventory display
        updateInventoryDisplay(updatedProduct);
        
        // Re-render sizes with updated inventory
        if (updatedProduct.sizes && updatedProduct.sizes.length > 0) {
            console.log('🔄 Re-rendering sizes with data:', updatedProduct.sizes);
            displayProductSizes(updatedProduct.sizes);
            console.log('🔄 Re-rendered sizes with updated inventory');
        } else {
            console.log('⚠️ No sizes data found in updated product');
        }
        
        // Show success notification
        showInventoryUpdateNotification('Inventory updated successfully!');
        
        console.log('✅ Inventory refreshed successfully');
        
    } catch (error) {
        console.error('❌ Error refreshing inventory:', error);
        showInventoryUpdateNotification('Failed to update inventory', 'error');
    }
}

// Show inventory update notification
function showInventoryUpdateNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.inventory-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `inventory-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 5px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#inventory-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'inventory-notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Update inventory display with new data
function updateInventoryDisplay(product) {
    console.log('🔄 Updating inventory display with:', product);
    
    // Update total inventory count
    const inventoryElement = document.getElementById('product-inventory');
    if (inventoryElement) {
        let totalInventory = 0;
        if (product.sizes && product.sizes.length > 0) {
            // Product has sizes, sum up size inventories
            totalInventory = product.sizes.reduce((sum, size) => sum + size.inventory, 0);
        } else if (product.inventory) {
            // Product doesn't have sizes, use product-level inventory
            totalInventory = parseInt(product.inventory) || 0;
        }
        inventoryElement.textContent = totalInventory;
        console.log('📊 Updated total inventory:', totalInventory);
    }
    
    // Update availability status
    const availabilityElement = document.getElementById('product-availability');
    if (availabilityElement) {
        let totalInventory = 0;
        if (product.sizes && product.sizes.length > 0) {
            // Product has sizes, sum up size inventories
            totalInventory = product.sizes.reduce((sum, size) => sum + size.inventory, 0);
        } else if (product.inventory) {
            // Product doesn't have sizes, use product-level inventory
            totalInventory = parseInt(product.inventory) || 0;
        }
        
        if (totalInventory > 0) {
            availabilityElement.innerHTML = '<span class="in-stock">In Stock</span>';
        } else {
            availabilityElement.innerHTML = '<span class="out-of-stock">Out of Stock</span>';
        }
        console.log('📦 Updated availability status');
    }
    
    // Update size options with new inventory
    if (product.sizes && product.sizes.length > 0) {
        updateSizeOptionsInventory(product.sizes);
        console.log('👟 Updated size options inventory');
    }
    
    // Update quantity selector max value
    updateQuantitySelectorMax();
}

// Update size options inventory display
function updateSizeOptionsInventory(sizes) {
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        const sizeValue = option.getAttribute('data-size');
        const sizeData = sizes.find(s => s.size === sizeValue);
        
        if (sizeData) {
            const inventorySpan = option.querySelector('.inventory');
            if (inventorySpan) {
                if (sizeData.inventory > 0) {
                    inventorySpan.textContent = `${sizeData.inventory} left`;
                    option.classList.remove('out-of-stock');
                    option.classList.add('available');
                    option.disabled = false;
                } else {
                    inventorySpan.textContent = 'Out of stock';
                    option.classList.remove('available');
                    option.classList.add('out-of-stock');
                    option.disabled = true;
                }
            }
        }
    });
}

// Update quantity selector max value based on selected size
function updateQuantitySelectorMax() {
    const quantityInput = document.getElementById('quantity-input');
    if (!quantityInput) return;
    
    let max = 999; // Default max for products without sizes
    
    if (currentProduct) {
        if (currentProduct.sizes && currentProduct.sizes.length > 0 && selectedSize) {
            // Product has sizes and one is selected
            const sizeData = currentProduct.sizes.find(s => s.size === selectedSize);
            max = sizeData ? sizeData.inventory : 999;
        } else if (currentProduct.inventory) {
            // Product doesn't have sizes, use product-level inventory
            max = parseInt(currentProduct.inventory) || 999;
        }
        
        quantityInput.max = max;
        
        // Adjust current quantity if it exceeds max
        if (selectedQuantity > max) {
            selectedQuantity = max;
            quantityInput.value = selectedQuantity;
        }
    }
}

// Load product details from API
async function loadProductDetails(productId) {
    try {
        console.log('Loading product details for ID:', productId);
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const product = await response.json();
        console.log('Product data received:', product);
        console.log('Product sizes:', product.sizes);
        console.log('Product images:', product.images);
        console.log('All product fields:', Object.keys(product));
        console.log('Product price field:', typeof product.price, product.price);
        console.log('Product compare_at_price field:', typeof product.compare_at_price, product.compare_at_price);
        currentProduct = product;
        
        // Store images and videos
        productImages = product.images || [];
        productVideos = product.videos || [];
        console.log('Images:', productImages, 'Videos:', productVideos);
        
        // Display product information
        displayProductInfo(product);
        displayProductMedia(product);
        displayProductSizes(product.sizes || []);
        displayProductVariants(product.variants || []);
        displayProductTabs(product);
        
        // Price display completed - no debugging interference
        
        // Load related products
        loadRelatedProducts(product.category_id);
        
        // Update page title
        document.title = `${product.name} - Urban Nucleus`;
        
        // Show the product content
        const productContent = document.getElementById('productContent');
        if (productContent) {
            productContent.style.display = 'block';
            console.log('Product content displayed');
        }
        
        console.log('Product display completed');
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading product details:', error);
        showError('Failed to load product details. Please try again.');
        showLoading(false);
        
        // Show product content even on error so user can see the page structure
        const productContent = document.getElementById('productContent');
        if (productContent) {
            productContent.style.display = 'block';
        }
    }
}

// Display product information
function displayProductInfo(product) {
    console.log('Displaying product info for:', product.name);
    
    // Product title
    const titleElement = document.getElementById('product-title');
    if (titleElement) {
        titleElement.textContent = product.name;
        console.log('Title updated');
    } else {
        console.error('Title element not found');
    }
    
    // Product rating
    const ratingElement = document.getElementById('product-rating');
    if (ratingElement) {
        ratingElement.innerHTML = generateStarRating(product.rating || 4.5);
        console.log('Rating updated');
    } else {
        console.error('Rating element not found');
    }
    
    // Product price - CONSOLIDATED LOGIC
    const priceElement = document.getElementById('product-price');
    const comparePriceElement = document.getElementById('compare-price');
    const discountBadgeElement = document.getElementById('discount-badge');
    
    if (priceElement) {
        // Use parsed numbers for reliable comparison
        const parsedPrice = parseFloat(product.price);
        const parsedComparePrice = parseFloat(product.compare_at_price);
        
        console.log('💰 Price data from database:');
        console.log('   - Regular price:', product.price, '→', parsedPrice);
        console.log('   - Compare price:', product.compare_at_price, '→', parsedComparePrice);
        console.log('   - Has valid comparison:', parsedComparePrice && parsedComparePrice > parsedPrice);
        
        if (parsedComparePrice && parsedComparePrice > parsedPrice) {
            // Show current price (which is the sale price)
            priceElement.querySelector('.current-price').textContent = `₹${parsedPrice.toFixed(2)}`;
            
            // Show original price as comparison price
            if (comparePriceElement) {
                comparePriceElement.textContent = `₹${parsedComparePrice.toFixed(2)}`;
                comparePriceElement.style.display = 'inline';
            }
            
            // Show discount badge
            if (discountBadgeElement) {
                const discountPercentage = Math.round(((parsedComparePrice - parsedPrice) / parsedComparePrice) * 100);
                discountBadgeElement.textContent = `${discountPercentage}% OFF`;
                discountBadgeElement.style.display = 'inline';
            }
        } else {
            // Regular price only
            priceElement.querySelector('.current-price').textContent = `₹${parsedPrice.toFixed(2)}`;
            
            // Hide comparison price and discount badge
            if (comparePriceElement) comparePriceElement.style.display = 'none';
            if (discountBadgeElement) discountBadgeElement.style.display = 'none';
        }
    } else {
        console.error('Price element not found!');
    }
    
    // Product description
    const descriptionElement = document.getElementById('product-description');
    if (descriptionElement) descriptionElement.textContent = product.description || 'No description available.';
    
    // Product SKU
    const skuElement = document.getElementById('product-sku');
    if (skuElement) skuElement.textContent = product.sku || 'N/A';
    
    // Product category
    const categoryElement = document.getElementById('product-category');
    if (categoryElement) categoryElement.textContent = product.category_name || 'N/A';
    
    // Product availability
    const availabilityElement = document.getElementById('product-availability');
    if (availabilityElement) {
        const totalInventory = product.sizes ? product.sizes.reduce((sum, size) => sum + size.inventory, 0) : 0;
        if (totalInventory > 0) {
            availabilityElement.innerHTML = '<span class="in-stock">In Stock</span>';
        } else {
            availabilityElement.innerHTML = '<span class="out-of-stock">Out of Stock</span>';
        }
    }
    
    // Product inventory
    const inventoryElement = document.getElementById('product-inventory');
    if (inventoryElement) {
        const totalInventory = product.sizes ? product.sizes.reduce((sum, size) => sum + size.inventory, 0) : 0;
        inventoryElement.textContent = totalInventory;
    }
}

// Display product media (images and videos)
function displayProductMedia(product) {
    console.log('displayProductMedia called with product:', product);
    console.log('productImages:', productImages);
    console.log('productVideos:', productVideos);
    
    // Combine images and videos
    const allMedia = [...productImages, ...productVideos];
    console.log('allMedia:', allMedia);
    
    if (allMedia.length === 0) {
        const mainMedia = document.getElementById('main-media');
        if (mainMedia) {
            mainMedia.innerHTML = '<div class="no-media">No images available</div>';
        }
        const thumbnailsContainer = document.getElementById('media-thumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '<div class="no-media">No images available</div>';
        }
        return;
    }
    
    // Main image/video display
    const mainMedia = document.getElementById('main-media');
    if (mainMedia) {
        displayMainMedia(allMedia[0]);
    }
    
    // Thumbnails
    const thumbnailsContainer = document.getElementById('media-thumbnails');
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = allMedia.map((media, index) => {
            if (media.video_url) {
                return `
                    <img src="${media.video_url}" alt="Product ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}" data-type="video">
                `;
            } else if (media.image_url) {
                return `
                    <img src="${media.image_url}" alt="Product ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}" data-type="image">
                `;
            }
        }).join('');
        
        // Add click event to thumbnails
        const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', function() {
                // Remove active class from all thumbnails
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                // Add active class to clicked thumbnail
                this.classList.add('active');
                // Update main media
                selectMedia(index, this.dataset.type);
            });
        });
    }
}



// Display main media (image or video)
function displayMainMedia(media) {
    const mainMedia = document.getElementById('main-media');
    if (!mainMedia) return;
    
    console.log('displayMainMedia called with media:', media);
    
    if (media.video_url) {
        mainMedia.innerHTML = `
            <video src="${media.video_url}" controls class="main-video">
                Your browser does not support the video tag.
            </video>
        `;
    } else if (media.image_url) {
        mainMedia.innerHTML = `
                            <img src="${media.image_url}" alt="Product" class="main-image" onerror="this.src='uploads/images/placeholder.svg'">
            <button class="zoom-btn" onclick="openImageZoom('${media.image_url}')">
                <i class="fas fa-search-plus"></i>
            </button>
        `;
    }
}

// Select media item
function selectMedia(index, type) {
    console.log('selectMedia called with index:', index, 'type:', type);
    
    // Update main media
    const allMedia = [...productImages, ...productVideos];
    if (allMedia[index]) {
        displayMainMedia(allMedia[index]);
    }
}



// Display product sizes
function displayProductSizes(sizes) {
    console.log('displayProductSizes called with:', sizes);
    console.log('Sizes data structure:', sizes.map(s => ({ size: s.size, inventory: s.inventory, type: typeof s.inventory })));
    
    const sizesContainer = document.getElementById('product-sizes');
    console.log('sizesContainer found:', sizesContainer);
    if (!sizesContainer) {
        console.error('product-sizes container not found!');
        return;
    }
    
    if (sizes.length === 0) {
        console.log('No sizes available, showing message');
        sizesContainer.innerHTML = '<p class="no-sizes">No sizes available for this product.</p>';
        
        // Enable buttons for products without sizes (watches, bags, etc.)
        console.log('Product has no sizes - enabling buttons automatically');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const buyNowBtn = document.getElementById('buy-now-btn');
        
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            console.log('Add to cart button enabled for sizeless product');
        }
        
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            console.log('Buy now button enabled for sizeless product');
        }
        
        // Set selected size to null but still allow purchase
        selectedSize = null;
        
        // Update quantity buttons for products without sizes
        updateQuantityButtons();
        
        return;
    }
    
    console.log('Rendering size buttons for', sizes.length, 'sizes');
    
    // Process each size to ensure inventory is a number
    const processedSizes = sizes.map(size => {
        const inventory = parseInt(size.inventory) || 0;
        const isAvailable = inventory > 0;
        console.log(`Size ${size.size}: inventory=${inventory} (type: ${typeof inventory}), isAvailable=${isAvailable}`);
        console.log(`Raw size data:`, size);
        return {
            ...size,
            inventory: inventory,
            isAvailable: isAvailable
        };
    });
    
    console.log('Processed sizes:', processedSizes);
    
    sizesContainer.innerHTML = processedSizes.map(size => `
        <button class="size-option ${size.isAvailable ? 'available' : 'out-of-stock'}" 
                data-size="${size.size}" 
                data-inventory="${size.inventory}"
                ${size.isAvailable ? '' : 'disabled'}>
            ${size.size}
            ${size.isAvailable ? `<span class="inventory">${size.inventory} left</span>` : '<span class="inventory">Out of stock</span>'}
        </button>
    `).join('');
    
    // Add click event to size buttons
    const sizeButtons = sizesContainer.querySelectorAll('.size-option.available');
    console.log('Found', sizeButtons.length, 'available size buttons');
    sizeButtons.forEach(button => {
        console.log('Adding click event to size button:', button.dataset.size);
        button.addEventListener('click', function() {
            console.log('Size button clicked:', this.dataset.size);
            selectSize(this.dataset.size);
        });
    });
    
    // Log final state
    console.log('Final size buttons rendered:', sizesContainer.querySelectorAll('.size-option').length);
    console.log('Available size buttons:', sizesContainer.querySelectorAll('.size-option.available').length);
    console.log('Out of stock size buttons:', sizesContainer.querySelectorAll('.size-option.out-of-stock').length);
}

// Select product size
function selectSize(size) {
    console.log('selectSize called with size:', size);
    selectedSize = size;
    
    // Update size button states
    const sizeButtons = document.querySelectorAll('.size-option');
    console.log('Found size buttons:', sizeButtons.length);
    sizeButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.size === size) {
            btn.classList.add('selected');
            console.log('Added selected class to button:', btn.dataset.size);
        }
    });
    
    // Update quantity max based on selected size
    updateQuantityMax();
    
    // Update quantity button states
    updateQuantityButtons();
    
    // Enable add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    console.log('Add to cart button found:', addToCartBtn);
    if (addToCartBtn) {
        console.log('Button before enabling - disabled:', addToCartBtn.disabled);
        console.log('Button before enabling - computed display:', window.getComputedStyle(addToCartBtn).display);
        console.log('Button before enabling - computed visibility:', window.getComputedStyle(addToCartBtn).visibility);
        console.log('Button before enabling - computed opacity:', window.getComputedStyle(addToCartBtn).opacity);
        
        addToCartBtn.disabled = false;
        
        console.log('Button after enabling - disabled:', addToCartBtn.disabled);
        console.log('Button after enabling - computed display:', window.getComputedStyle(addToCartBtn).display);
        console.log('Button after enabling - computed visibility:', window.getComputedStyle(addToCartBtn).visibility);
        console.log('Button after enabling - computed opacity:', window.getComputedStyle(addToCartBtn).opacity);
        
        // Also enable buy now button
        const buyNowBtn = document.getElementById('buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            console.log('Buy now button enabled');
        }
        
        console.log('Add to cart button enabled successfully');
        
    } else {
        console.error('Add to cart button not found!');
    }
}

// Update quantity maximum based on selected size
function updateQuantityMax() {
    const quantityInput = document.getElementById('quantity-input');
    if (!quantityInput) return;
    
    let max = 999; // Default max for products without sizes
    
    if (currentProduct) {
        if (currentProduct.sizes && currentProduct.sizes.length > 0 && selectedSize) {
            // Product has sizes and one is selected
            const sizeData = currentProduct.sizes.find(s => s.size === selectedSize);
            max = sizeData ? sizeData.inventory : 999;
        } else if (currentProduct.inventory) {
            // Product doesn't have sizes, use product-level inventory
            max = parseInt(currentProduct.inventory) || 999;
        }
        
        quantityInput.max = max;
        
        // Adjust current quantity if it exceeds max
        if (selectedQuantity > max) {
            selectedQuantity = max;
            quantityInput.value = selectedQuantity;
        }
    }
}

// Update quantity button states (enable/disable based on current quantity)
function updateQuantityButtons() {
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('quantity-input');
    
    if (decreaseBtn) {
        // Disable decrease button when quantity is 1 or less
        decreaseBtn.disabled = selectedQuantity <= 1;
    }
    
    if (increaseBtn && quantityInput) {
        // Disable increase button when at maximum quantity
        const max = parseInt(quantityInput.max) || 999;
        increaseBtn.disabled = selectedQuantity >= max;
    }
    
    console.log('Quantity buttons updated:', {
        quantity: selectedQuantity,
        decreaseDisabled: decreaseBtn?.disabled,
        increaseDisabled: increaseBtn?.disabled,
        max: quantityInput?.max
    });
}

// Display product variants
function displayProductVariants(variants) {
    const variantsContainer = document.getElementById('product-variants');
    if (!variantsContainer || variants.length === 0) return;
    
    variantsContainer.innerHTML = variants.map(variant => `
        <div class="variant-item">
            <span class="variant-label">${variant.name}:</span>
            <span class="variant-value">${variant.value}</span>
        </div>
    `).join('');
}

// Display product tabs content
function displayProductTabs(product) {
    // Description tab
    const descriptionTab = document.getElementById('tab-description');
    if (descriptionTab) {
        descriptionTab.innerHTML = `
            <div class="tab-content">
                <p>${product.description || 'No description available.'}</p>
                ${product.features ? `<h4>Features:</h4><ul>${product.features.split(',').map(feature => `<li>${feature.trim()}</li>`).join('')}</ul>` : ''}
            </div>
        `;
    }
    
    // Specifications tab
    const specificationsTab = document.getElementById('tab-specifications');
    if (specificationsTab) {
        specificationsTab.innerHTML = `
            <div class="tab-content">
                <table class="specs-table">
                    <tr><td>Brand</td><td>${product.brand || 'N/A'}</td></tr>
                    <tr><td>Material</td><td>${product.material || 'N/A'}</td></tr>
                    <tr><td>Weight</td><td>${product.weight || 'N/A'}</td></tr>
                    <tr><td>Dimensions</td><td>${product.dimensions || 'N/A'}</td></tr>
                    <tr><td>SKU</td><td>${product.sku || 'N/A'}</td></tr>
                </table>
            </div>
        `;
    }
    
    // Reviews tab
    const reviewsTab = document.getElementById('tab-reviews');
    if (reviewsTab) {
        reviewsTab.innerHTML = `
            <div class="tab-content">
                <div class="reviews-summary">
                    <div class="rating-overview">
                        <div class="average-rating">${product.rating || 4.5}</div>
                        <div class="stars">${generateStarRating(product.rating || 4.5)}</div>
                        <div class="total-reviews">Based on ${product.review_count || 0} reviews</div>
                    </div>
                </div>
                <div class="reviews-list">
                    <p>Reviews functionality coming soon...</p>
                </div>
            </div>
        `;
    }
    
    // Shipping tab
    const shippingTab = document.getElementById('tab-shipping');
    if (shippingTab) {
        shippingTab.innerHTML = `
            <div class="tab-content">
                <h4>Shipping Information</h4>
                <ul>
                    <li>Free shipping on orders over $50</li>
                    <li>Standard delivery: 3-5 business days</li>
                    <li>Express delivery: 1-2 business days</li>
                    <li>International shipping available</li>
                </ul>
                
                <h4>Returns & Exchanges</h4>
                <ul>
                    <li>7-day return policy</li>
                    <li>Free returns for defective items</li>
                    <li>Size exchanges available</li>
                    <li>Contact customer service for assistance</li>
                </ul>
            </div>
        `;
    }
}

// Load related products
async function loadRelatedProducts(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`);
        if (!response.ok) return;
        
        const products = await response.json();
        const relatedProducts = products.filter(p => p.id !== currentProduct.id).slice(0, 4);
        
        displayRelatedProducts(relatedProducts);
        
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

// Display related products
function displayRelatedProducts(products) {
    const container = document.getElementById('related-products');
    if (!container || products.length === 0) return;
    
    container.innerHTML = products.map(product => {
        let priceDisplay = `₹${parseFloat(product.price).toFixed(2)}`;
        let priceClass = 'price';
        
        // Check if there's a compare price (sale)
        if (product.compare_at_price && product.compare_at_price > product.price) {
            priceDisplay = `₹${parseFloat(product.price).toFixed(2)}`;
            priceClass = 'price sale-price';
        }
        
        return `
            <div class="related-product">
                <a href="product-detail.html?id=${product.id}">
                    <img src="${product.image_url || 'uploads/images/placeholder.svg'}" alt="${product.name}" onerror="this.src='uploads/images/placeholder.svg'">
                    <h4>${product.name}</h4>
                    <p class="${priceClass}">${priceDisplay}</p>
                    ${product.compare_at_price && product.compare_at_price > product.price ? `<span class="sale-indicator">SALE</span>` : ''}
                </a>
            </div>
        `;
    }).join('');
}

// Initialize event listeners
function initializeEventListeners() {
    // Quantity controls
    const quantityInput = document.getElementById('quantity-input');
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            selectedQuantity = parseInt(this.value) || 1;
            updateQuantityMax();
            updateQuantityButtons();
        });
    }
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            if (selectedQuantity > 1) {
                selectedQuantity--;
                if (quantityInput) quantityInput.value = selectedQuantity;
                updateQuantityButtons();
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            // For products with sizes, use size inventory; for products without sizes, use product inventory or default
            let max = 999; // Default max for products without sizes
            
            if (currentProduct && currentProduct.sizes && currentProduct.sizes.length > 0 && selectedSize) {
                // Product has sizes and one is selected
                const sizeData = currentProduct.sizes.find(s => s.size === selectedSize);
                max = sizeData ? sizeData.inventory : 999;
            } else if (currentProduct && currentProduct.inventory) {
                // Product doesn't have sizes, use product-level inventory
                max = parseInt(currentProduct.inventory) || 999;
            }
            
            if (selectedQuantity < max) {
                selectedQuantity++;
                if (quantityInput) quantityInput.value = selectedQuantity;
                updateQuantityButtons();
            }
        });
    }
    
    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    }
    
    // Buy now button
    const buyNowBtn = document.getElementById('buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', buyNow);
    }
    
    // Add to wishlist button
    const wishlistBtn = document.getElementById('add-to-wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', addToWishlist);
    }
    
    // Add keyboard shortcuts for Buy Now (Ctrl+B or Cmd+B)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            // Check if product has sizes and none is selected
            if (currentProduct && currentProduct.sizes && currentProduct.sizes.length > 0 && !selectedSize) {
                showMessage('Please select a size first.', 'error');
            } else {
                buyNow();
            }
        }
    });
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Size guide button
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    if (sizeGuideBtn) {
        sizeGuideBtn.addEventListener('click', openSizeGuide);
    }
    

    

}

// Initialize image gallery
function initializeImageGallery() {
    // Auto-play video thumbnails on hover
    const videoThumbnails = document.querySelectorAll('.thumbnail-item[data-type="video"] video');
    videoThumbnails.forEach(video => {
        video.addEventListener('mouseenter', function() {
            this.play();
        });
        video.addEventListener('mouseleave', function() {
            this.pause();
            this.currentTime = 0;
        });
    });
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.style.display = 'none');
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Add active class to selected tab button
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

// Add to cart functionality
async function addToCart() {
    // Check if product has sizes and none is selected
    if (currentProduct && currentProduct.sizes && currentProduct.sizes.length > 0 && !selectedSize) {
        showMessage('Please select a size first.', 'error');
        return;
    }
    
    if (!currentProduct) {
        showMessage('Product information not available.', 'error');
        return;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
        showMessage('Please log in to add items to cart', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const cartItem = {
            userId: userId,
            productId: currentProduct.id,
            size: selectedSize || 'N/A', // Use 'N/A' for products without sizes
            quantity: selectedQuantity
        };
        
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartItem)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add item to cart');
        }
        
        const result = await response.json();
        showMessage('Item added to cart successfully!', 'success');
        
        // Show add to cart success modal
        openAddToCartModal();
        
        // Update cart count in header (if exists)
        updateCartCount();
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add item to cart. Please try again.', 'error');
    }
}

// Buy now functionality
function buyNow() {
    // Check if product has sizes and none is selected
    if (currentProduct && currentProduct.sizes && currentProduct.sizes.length > 0 && !selectedSize) {
        showMessage('Please select a size first.', 'error');
        return;
    }
    
    if (!currentProduct) {
        showMessage('Product information not available.', 'error');
        return;
    }
    
    // Get selected quantity
    const quantityInput = document.getElementById('quantity-input');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Prepare product data for checkout
    const productData = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: parseFloat(currentProduct.price),
        image: currentProduct.images && currentProduct.images.length > 0 && currentProduct.images[0].image_url ? currentProduct.images[0].image_url : '/uploads/images/placeholder.svg',
        size: selectedSize || 'N/A', // Use 'N/A' for products without sizes
        quantity: quantity,
        sku: currentProduct.sku || '',
        category: currentProduct.category || ''
    };
    
    console.log('🚀 Buy Now - Product data prepared:', productData);
    console.log('🖼️ Image details:', {
        hasImages: !!currentProduct.images,
        imagesLength: currentProduct.images ? currentProduct.images.length : 0,
        firstImage: currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images[0] : 'none',
        firstImageType: currentProduct.images && currentProduct.images.length > 0 ? typeof currentProduct.images[0] : 'none',
        firstImageKeys: currentProduct.images && currentProduct.images.length > 0 ? Object.keys(currentProduct.images[0]) : 'none',
        finalImage: productData.image,
        finalImageType: typeof productData.image
    });
    
    // Encode product data for URL
    const encodedData = encodeURIComponent(JSON.stringify(productData));
    
    // Redirect to checkout with product data
    window.location.href = `checkout.html?product=${encodedData}`;
}

// Function to handle multiple products for checkout (can be called from other pages)
function buyMultipleProducts(products) {
    if (!products || products.length === 0) {
        showMessage('No products selected for checkout.', 'error');
        return;
    }
    
    // Encode products data for URL
    const encodedData = encodeURIComponent(JSON.stringify(products));
    
    // Redirect to checkout with multiple products
    window.location.href = `checkout.html?products=${encodedData}`;
}

// Function to handle direct checkout without cart (for external integrations)
function directCheckout(productData) {
    if (!productData) {
        showMessage('Product data not available.', 'error');
        return;
    }
    
    // Encode product data for URL
    const encodedData = encodeURIComponent(JSON.stringify(productData));
    
    // Redirect to checkout with product data
    window.location.href = `checkout.html?product=${encodedData}`;
}

// Add to wishlist functionality
function addToWishlist() {
    // This is a placeholder - implement wishlist functionality
    showMessage('Wishlist functionality coming soon!', 'info');
}

// Open image zoom modal
function openImageZoom(imageUrl) {
    const modal = document.getElementById('image-zoom-modal');
    if (modal) {
        const modalImg = modal.querySelector('.modal-image');
        if (modalImg) {
            modalImg.src = imageUrl;
        }
        modal.style.display = 'flex';
    }
}

// Open size guide modal
function openSizeGuide() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Open add to cart success modal
function openAddToCartModal() {
    const modal = document.getElementById('add-to-cart-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Get current user ID from localStorage
function getCurrentUserId() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        return user.id;
    }
    return null;
}

// Update cart count in header
async function updateCartCount() {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            // User not logged in, set count to 0
            document.querySelectorAll('.cart-count').forEach(countElement => {
                countElement.textContent = '0';
            });
            return;
        }

        // Fetch cart count from database
        const response = await fetch(`${API_BASE_URL}/cart/${userId}`);
        if (response.ok) {
            const cartItems = await response.json();
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            
            document.querySelectorAll('.cart-count').forEach(countElement => {
                countElement.textContent = totalItems;
            });
            
            console.log('Cart count updated from database to:', totalItems);
        } else {
            console.error('Failed to fetch cart count');
            // Fallback to 0
            document.querySelectorAll('.cart-count').forEach(countElement => {
                countElement.textContent = '0';
            });
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        // Fallback to 0
        document.querySelectorAll('.cart-count').forEach(countElement => {
            countElement.textContent = '0';
        });
    }
}

// Show loading state
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

// Show message
function showMessage(message, type = 'info') {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // Add to page
    document.body.appendChild(messageElement);
    
    // Show message
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 100);
    
    // Hide and remove message
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
}

// Show error
function showError(message) {
    showMessage(message, 'error');
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Close modals with escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }
});


