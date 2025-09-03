// API Base URL
const API_BASE_URL = 'http://31.97.239.99';

// Make functions globally accessible for debugging
window.viewCategory = function(categoryId) {
    console.log('Global viewCategory called with ID:', categoryId);
    try {
        const url = `category.html?id=${categoryId}`;
        console.log('Navigating to URL:', url);
        window.location.href = url;
    } catch (error) {
        console.error('Error in global viewCategory:', error);
        alert('Navigation error: ' + error.message);
    }
};

window.viewSubcategories = function(categoryId) {
    console.log('Global viewSubcategories called with ID:', categoryId);
    try {
        const url = `category.html?id=${categoryId}&view=subcategories`;
        console.log('Navigating to URL:', url);
        window.location.href = url;
    } catch (error) {
        console.error('Error in global viewSubcategories:', error);
        alert('Navigation error: ' + error.message);
    }
};

window.viewSubcategory = function(subcategoryId, subcategoryName) {
    console.log('Global viewSubcategory called with ID:', subcategoryId, 'Name:', subcategoryName);
    try {
        const url = `subcategory.html?id=${subcategoryId}&name=${encodeURIComponent(subcategoryName)}`;
        console.log('Navigating to URL:', url);
        window.location.href = url;
    } catch (error) {
        console.error('Error in global viewSubcategory:', error);
        alert('Navigation error: ' + error.message);
    }
};

// Category icons mapping
const categoryIcons = {
    'clothing': 'fas fa-tshirt',
    'electronics': 'fas fa-mobile-alt',
    'home': 'fas fa-home',
    'garden': 'fas fa-seedling',
    'accessories': 'fas fa-gem',
    'footwear': 'fas fa-shoe-prints',
    'bags': 'fas fa-shopping-bag',
    'jewelry': 'fas fa-ring',
    'watches': 'fas fa-clock',
    'default': 'fas fa-tags'
};

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    setupMobileMenu();
});

// Load categories from backend
async function loadCategories() {
    const collectionsGrid = document.getElementById('collectionsGrid');
    
    try {
        // Show loading spinner
        collectionsGrid.innerHTML = '<div class="loading-spinner"></div>';
        
        // Fetch categories from backend
        const response = await fetch(`${API_BASE_URL}/categories`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        const categories = await response.json();
        
        if (categories.length === 0) {
            showNoCategories();
            return;
        }
        
        // Render categories
        renderCategories(categories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load collections. Please try again later.');
    }
}

// Render categories in the grid
function renderCategories(categories) {
    const collectionsGrid = document.getElementById('collectionsGrid');
    
    const categoriesHTML = categories.map(category => {
        const subcategoriesHTML = category.subcategories && category.subcategories.length > 0 
            ? renderSubcategories(category.subcategories)
            : '<p class="no-subcategories">No subcategories available</p>';
        
        // Get category image URL or fallback to icon
        const imageUrl = category.image_url || getCategoryIcon(category.name);
        const isImage = imageUrl && !imageUrl.startsWith('fas fa-');
        
        return `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-image">
                    ${isImage 
                        ? `<img src="${imageUrl.startsWith('http') ? imageUrl : API_BASE_URL + imageUrl}" alt="${category.name}" class="category-img">`
                        : `<i class="${imageUrl}"></i>`
                    }
                </div>
                <div class="category-content">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'Explore our premium collection of ' + category.name.toLowerCase() + '.'}</p>
                    
                    <div class="subcategories-list">
                        <h4>Subcategories (${category.subcategories ? category.subcategories.length : 0})</h4>
                        <div class="subcategories-grid">
                            ${subcategoriesHTML}
                        </div>
                    </div>
                    
                    <div class="category-actions">
                        <a href="category.html?id=${category.id}" class="btn-category btn-primary">View All</a>
                        <button class="btn-category btn-secondary browse-subcategories-btn" data-category-id="${category.id}">Browse Subcategories</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    collectionsGrid.innerHTML = categoriesHTML;
    
    // Debug: Log the generated HTML and check for onclick handlers
    console.log('Generated categories HTML:', categoriesHTML);
    
    // Wait a bit for DOM to be ready, then set up event listeners
    setTimeout(() => {
        console.log('Setting up event listeners after DOM update...');
        setupEventListeners();
        
        // Verify the elements exist after setup
        const browseButtons = document.querySelectorAll('.browse-subcategories-btn');
        const subcategoryItems = document.querySelectorAll('.subcategory-clickable');
        const categoryCards = document.querySelectorAll('.category-card');
        
        console.log('After setup - Found browse buttons:', browseButtons.length);
        console.log('After setup - Found subcategory items:', subcategoryItems.length);
        console.log('After setup - Found category cards:', categoryCards.length);
        
        // Test if event listeners are attached
        if (browseButtons.length > 0) {
            const firstButton = browseButtons[0];
            console.log('First button data-category-id:', firstButton.getAttribute('data-category-id'));
            console.log('First button classList:', firstButton.classList.toString());
        }
        
        if (subcategoryItems.length > 0) {
            const firstItem = subcategoryItems[0];
            console.log('First subcategory item data:', {
                id: firstItem.getAttribute('data-subcategory-id'),
                name: firstItem.getAttribute('data-subcategory-name')
            });
        }
    }, 100);
}

// Render subcategories
function renderSubcategories(subcategories) {
    if (!subcategories || subcategories.length === 0) {
        return '<p class="no-subcategories">No subcategories available</p>';
    }
    
    return subcategories.map(subcategory => `
        <div class="subcategory-item subcategory-clickable" data-subcategory-id="${subcategory.id}" data-subcategory-name="${subcategory.name}">
            ${subcategory.name}
        </div>
    `).join('');
}

// Get appropriate icon for category
function getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (name.includes(key)) {
            return icon;
        }
    }
    
    return categoryIcons.default;
}

// View all products in a category
function viewCategory(categoryId) {
    console.log('viewCategory called with ID:', categoryId);
    try {
        const url = `category.html?id=${categoryId}`;
        console.log('Navigating to URL:', url);
        window.location.href = url;
    } catch (error) {
        console.error('Error in viewCategory:', error);
        alert('Navigation error: ' + error.message);
    }
}

// View subcategories of a category
function viewSubcategories(categoryId) {
    console.log('viewSubcategories called with ID:', categoryId);
    try {
        const url = `category.html?id=${categoryId}&view=subcategories`;
        console.log('Navigating to URL:', url);
        window.location.href = url;
    } catch (error) {
        console.error('Error in viewSubcategories:', error);
        alert('Navigation error: ' + error.message);
    }
}

// View specific subcategory
function viewSubcategory(subcategoryId, subcategoryName) {
    console.log('viewSubcategory called with ID:', subcategoryId, 'Name:', subcategoryName);
    try {
        const url = `subcategory.html?id=${subcategoryId}&name=${encodeURIComponent(subcategoryName)}`;
        console.log('Navigating to URL:', url);
        window.location.href = url;
    } catch (error) {
        console.error('Error in viewSubcategory:', error);
        alert('Navigation error: ' + error.message);
    }
}

// Show no categories message
function showNoCategories() {
    const collectionsGrid = document.getElementById('collectionsGrid');
    collectionsGrid.innerHTML = `
        <div class="no-categories">
            <i class="fas fa-box-open"></i>
            <h3>No Collections Available</h3>
            <p>We're currently setting up our collections. Please check back soon!</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    const collectionsGrid = document.getElementById('collectionsGrid');
    collectionsGrid.innerHTML = `
        <div class="no-categories">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Collections</h3>
            <p>${message}</p>
            <button onclick="loadCategories()" class="btn-category btn-primary" style="margin-top: 20px;">
                Try Again
            </button>
        </div>
    `;
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// Check URL parameters for specific category
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    
    if (categoryId) {
        // Scroll to specific category
        const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (categoryElement) {
            categoryElement.scrollIntoView({ behavior: 'smooth' });
            categoryElement.style.border = '2px solid var(--accent-gold)';
        }
    }
}

// Initialize URL parameter checking after categories are loaded
setTimeout(checkUrlParams, 1000);

// Setup event listeners for buttons and subcategory items
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Add event listeners for browse subcategories buttons
    const browseButtons = document.querySelectorAll('.browse-subcategories-btn');
    console.log('Found browse buttons:', browseButtons.length);
    
    browseButtons.forEach(button => {
        const categoryId = button.getAttribute('data-category-id');
        console.log('Setting up button for category:', categoryId);
        if (categoryId) {
            button.addEventListener('click', (e) => {
                console.log('Browse subcategories button clicked for category:', categoryId);
                e.preventDefault();
                e.stopPropagation();
                viewSubcategories(categoryId);
            });
        }
    });
    
    // Add event listeners for subcategory items
    const subcategoryItems = document.querySelectorAll('.subcategory-clickable');
    console.log('Found subcategory items:', subcategoryItems.length);
    
    subcategoryItems.forEach(item => {
        const subcategoryId = item.getAttribute('data-subcategory-id');
        const subcategoryName = item.getAttribute('data-subcategory-name');
        console.log('Setting up subcategory item:', subcategoryId, subcategoryName);
        if (subcategoryId && subcategoryName) {
            item.addEventListener('click', (e) => {
                console.log('Subcategory item clicked:', subcategoryId, subcategoryName);
                e.preventDefault();
                e.stopPropagation();
                viewSubcategory(subcategoryId, subcategoryName);
            });
        }
    });
    
    // Add event listeners for category cards themselves (for debugging)
    const categoryCards = document.querySelectorAll('.category-card');
    console.log('Found category cards:', categoryCards.length);
    
    categoryCards.forEach(card => {
        const categoryId = card.getAttribute('data-category-id');
        console.log('Setting up category card:', categoryId);
        
        // Add click event to the entire card for debugging
        card.addEventListener('click', (e) => {
            console.log('Category card clicked:', categoryId);
            // Don't prevent default here as we want the View All link to work
        });
    });
    
    console.log('Event listeners setup complete');
}