// Shared authentication state management for all pages
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure DOM is fully loaded
    setTimeout(() => {
        checkLoginState();
    }, 100);
    
    // Also check login state when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(() => {
                checkLoginState();
            }, 100);
        }
    });
    
    // Check login state when window gains focus
    window.addEventListener('focus', function() {
        setTimeout(() => {
            checkLoginState();
        }, 100);
    });
});

// Check login state and update header
async function checkLoginState() {
    console.log('Checking login state...');
    const currentUser = localStorage.getItem('currentUser');
    const headerIcons = document.querySelector('.header-icons');
    
    console.log('Current user from localStorage:', currentUser);
    console.log('Header icons element:', headerIcons);
    
    if (!headerIcons) {
        console.error('Header icons element not found!');
        return;
    }
    
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            console.log('User data:', user);
            
            // Update header to show user info instead of login/signup
            headerIcons.innerHTML = `
                <a href="profile.html" class="user-info">
                    <i class="fas fa-user"></i> 
                    <span class="user-name">${user.username || user.email}</span>
                </a>
                <a href="#" onclick="logout()" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
                <button type="button" id="searchBtn" style="background: none; border: none; color: inherit; font-size: inherit; cursor: pointer; padding: 0;">
                    <i class="fas fa-search"></i>
                </button>
                <a href="cart.html" class="cart-icon"><i class="fas fa-shopping-bag"></i><span class="cart-count">0</span></a>
            `;
            console.log('Updated header for logged-in user');
            
            // Reinitialize search functionality after header update
            setTimeout(() => {
                reinitializeSearchFunctionality();
                initializeSearchModalFunctionality();
            }, 100);
            
            // Update cart count after header is rebuilt
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            } else {
                // Fallback: update cart count manually from database
                try {
                    const currentUser = localStorage.getItem('currentUser');
                    if (currentUser) {
                        const user = JSON.parse(currentUser);
                        const response = await fetch(`http://31.97.239.99/cart/${user.id}`);
                        if (response.ok) {
                            const cartItems = await response.json();
                            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                            document.querySelectorAll('.cart-count').forEach(countElement => {
                                countElement.textContent = totalItems;
                            });
                            console.log('Cart count updated from database fallback to:', totalItems);
                        } else {
                            // Final fallback to localStorage
                            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                            document.querySelectorAll('.cart-count').forEach(countElement => {
                                countElement.textContent = totalItems;
                            });
                        }
                    } else {
                        document.querySelectorAll('.cart-count').forEach(countElement => {
                            countElement.textContent = '0';
                        });
                    }
                } catch (error) {
                    console.error('Error in fallback cart count:', error);
                    document.querySelectorAll('.cart-count').forEach(countElement => {
                        countElement.textContent = '0';
                    });
                }
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('currentUser');
            checkLoginState(); // Retry with cleared data
        }
    } else {
        // Show login/signup buttons
        headerIcons.innerHTML = `
            <a href="login.html"><i class="fas fa-user"></i> Login</a>
            <a href="signup.html"><i class="fas fa-user-plus"></i> Sign Up</a>
            <button type="button" id="searchBtn" style="background: none; border: none; color: inherit; font-size: inherit; cursor: pointer; padding: 0;">
                <i class="fas fa-search"></i>
            </button>
            <a href="cart.html" class="cart-icon"><i class="fas fa-shopping-bag"></i><span class="cart-count">0</span></a>
        `;
        console.log('Updated header for logged-out user');
        
        // Reinitialize search functionality after header update
        setTimeout(() => {
            reinitializeSearchFunctionality();
            initializeSearchModalFunctionality();
        }, 100);
        
        // Update cart count after header is rebuilt
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        } else {
            // Fallback: update cart count manually from database
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const response = await fetch(`http://31.97.239.99/cart/${user.id}`);
                    if (response.ok) {
                        const cartItems = await response.json();
                        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                        document.querySelectorAll('.cart-count').forEach(countElement => {
                            countElement.textContent = totalItems;
                        });
                        console.log('Cart count updated from database fallback to:', totalItems);
                    } else {
                        // Final fallback to localStorage
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                        document.querySelectorAll('.cart-count').forEach(countElement => {
                            countElement.textContent = totalItems;
                        });
                    }
                } else {
                    document.querySelectorAll('.cart-count').forEach(countElement => {
                        countElement.textContent = '0';
                    });
                }
            } catch (error) {
                console.error('Error in fallback cart count:', error);
                document.querySelectorAll('.cart-count').forEach(countElement => {
                    countElement.textContent = '0';
                });
            }
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    checkLoginState(); // Update header
    showMessage('Logged out successfully', 'success');
}

// Show message function
function showMessage(message, type) {
    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.className = 'message-container';
        document.body.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.className = `message-container ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message-container';
    }, 3000);
}

// Debug function - call this from browser console to check login state
function debugLoginState() {
    console.log('=== LOGIN STATE DEBUG ===');
    console.log('localStorage currentUser:', localStorage.getItem('currentUser'));
    console.log('localStorage authToken:', localStorage.getItem('authToken'));
    console.log('Header icons element:', document.querySelector('.header-icons'));
    console.log('Header icons HTML:', document.querySelector('.header-icons')?.innerHTML);
    checkLoginState();
    console.log('=== END DEBUG ===');
}

// Function to reinitialize search functionality after header updates
function reinitializeSearchFunctionality() {
    console.log('🔍 Reinitializing search functionality...');
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
        const searchBtn = document.getElementById('searchBtn');
        const searchModal = document.getElementById('searchModal');
        const closeSearchBtn = document.getElementById('closeSearchBtn');
        const searchInput = document.getElementById('searchInput');
        const performSearchBtn = document.getElementById('performSearchBtn');
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const suggestionButtons = document.querySelectorAll('.suggestion-btn');
        
        console.log('🔍 Search elements check:', {
            searchBtn: !!searchBtn,
            searchModal: !!searchModal,
            closeSearchBtn: !!closeSearchBtn
        });
        
        // Only add event listeners if the search button exists and doesn't already have them
        if (searchBtn && searchModal && !searchBtn.dataset.searchInitialized) {
            console.log('🔍 Adding search event listeners...');
            
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Search button clicked! Opening modal...');
                
                searchModal.style.display = 'flex';
                searchModal.classList.add('show');
                
                setTimeout(() => {
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
            });
            
            // Mark as initialized
            searchBtn.dataset.searchInitialized = 'true';
            console.log('🔍 Search functionality initialized successfully');
        } else if (!searchBtn) {
            console.warn('🔍 Search button not found, search functionality not initialized');
        } else if (searchBtn.dataset.searchInitialized) {
            console.log('🔍 Search functionality already initialized');
        }
    }, 50);
}

// Function to initialize complete search modal functionality
function initializeSearchModalFunctionality() {
    console.log('🔍 Initializing complete search modal functionality...');
    
    const searchModal = document.getElementById('searchModal');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const performSearchBtn = document.getElementById('performSearchBtn');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    // Close search modal
    if (closeSearchBtn && searchModal && !closeSearchBtn.dataset.closeInitialized) {
        closeSearchBtn.addEventListener('click', function() {
            console.log('🔍 Closing search modal...');
            searchModal.classList.remove('show');
            setTimeout(() => {
                searchModal.style.display = 'none';
            }, 300);
        });
        closeSearchBtn.dataset.closeInitialized = 'true';
    }
    
    // Close modal when clicking outside
    if (searchModal && !searchModal.dataset.outsideClickInitialized) {
        searchModal.addEventListener('click', function(e) {
            if (e.target === searchModal) {
                closeSearchBtn?.click();
            }
        });
        searchModal.dataset.outsideClickInitialized = 'true';
    }
    
    // Perform search function
    async function performSearch(query) {
        if (!query || query.trim() === '') {
            return;
        }
        
        console.log('🔍 Performing search for:', query);
        
        try {
            const response = await fetch(`http://31.97.239.99/products/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const results = await response.json();
            console.log('🔍 Search results:', results);
            displaySearchResults(results);
        } catch (error) {
            console.error('❌ Search error:', error);
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `
                    <div class="search-no-results">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 20px;"></i>
                        <h3>Search Error</h3>
                        <p>Unable to perform search. Please try again.</p>
                    </div>
                `;
            }
        }
    }
    
    // Display search results
    function displaySearchResults(results) {
        if (!searchResultsContainer) return;
        
        if (!results || results.length === 0) {
            searchResultsContainer.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                    <h3>No products found</h3>
                    <p>Try different keywords or browse our collections.</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = results.map(product => `
            <div class="search-result-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
                <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}" class="search-result-image" loading="lazy">
                <div class="search-result-info">
                    <div class="search-result-name">${product.name}</div>
                    <div class="search-result-price">₹${product.price}</div>
                </div>
            </div>
        `).join('');
        
        searchResultsContainer.innerHTML = `
            <div class="search-results-grid">
                ${resultsHTML}
            </div>
        `;
    }
    
    // Search input events
    if (searchInput && performSearchBtn && !performSearchBtn.dataset.searchInitialized) {
        performSearchBtn.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });
        
        performSearchBtn.dataset.searchInitialized = 'true';
        searchInput.dataset.searchInitialized = 'true';
    }
    
    // Suggestion buttons
    suggestionButtons.forEach(btn => {
        if (!btn.dataset.suggestionInitialized) {
            btn.addEventListener('click', function() {
                const query = this.getAttribute('data-query');
                if (searchInput) {
                    searchInput.value = query;
                }
                performSearch(query);
            });
            btn.dataset.suggestionInitialized = 'true';
        }
    });
}

// Make functions available globally
window.checkLoginState = checkLoginState;
window.logout = logout;
window.showMessage = showMessage;
window.debugLoginState = debugLoginState;
window.reinitializeSearchFunctionality = reinitializeSearchFunctionality;
window.initializeSearchModalFunctionality = initializeSearchModalFunctionality;

// Force check login state - call this from console if needed
window.forceCheckLoginState = function() {
    console.log('=== FORCE CHECKING LOGIN STATE ===');
    checkLoginState();
    console.log('=== END FORCE CHECK ===');
};

// Initialize auth state and cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure header and main.js are loaded
    setTimeout(() => {
        checkLoginState();
        
        // Also update cart count on initial load with retry mechanism
        let retryCount = 0;
        const maxRetries = 10;
        
        async function tryUpdateCartCount() {
            if (typeof updateCartCount === 'function') {
                await updateCartCount();
                console.log('Cart count updated via main.js function');
            } else if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(tryUpdateCartCount, 100);
            } else {
                // Fallback: update cart count manually from database
                console.log('Using fallback cart count update');
                try {
                    const currentUser = localStorage.getItem('currentUser');
                    if (currentUser) {
                        const user = JSON.parse(currentUser);
                        const response = await fetch(`http://31.97.239.99/cart/${user.id}`);
                        if (response.ok) {
                            const cartItems = await response.json();
                            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                            document.querySelectorAll('.cart-count').forEach(countElement => {
                                countElement.textContent = totalItems;
                            });
                            console.log('Cart count updated from database fallback to:', totalItems);
                        } else {
                            // Final fallback to localStorage
                            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                            document.querySelectorAll('.cart-count').forEach(countElement => {
                                countElement.textContent = totalItems;
                            });
                        }
                    } else {
                        document.querySelectorAll('.cart-count').forEach(countElement => {
                            countElement.textContent = '0';
                        });
                    }
                } catch (error) {
                    console.error('Error in fallback cart count:', error);
                    document.querySelectorAll('.cart-count').forEach(countElement => {
                        countElement.textContent = '0';
                    });
                }
            }
        }
        
        tryUpdateCartCount();
        
        // Also initialize search functionality immediately
        setTimeout(() => {
            if (typeof reinitializeSearchFunctionality === 'function') {
                reinitializeSearchFunctionality();
            }
            if (typeof initializeSearchModalFunctionality === 'function') {
                initializeSearchModalFunctionality();
            }
        }, 200);
    }, 100);
});
