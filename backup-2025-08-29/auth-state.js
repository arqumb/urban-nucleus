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
                <a href="#"><i class="fas fa-search"></i></a>
                <a href="cart.html" class="cart-icon"><i class="fas fa-shopping-bag"></i><span class="cart-count">0</span></a>
            `;
            console.log('Updated header for logged-in user');
            
            // Update cart count after header is rebuilt
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            } else {
                // Fallback: update cart count manually from database
                try {
                    const currentUser = localStorage.getItem('currentUser');
                    if (currentUser) {
                        const user = JSON.parse(currentUser);
                        const response = await fetch(`http://31.97.239.99:3000/cart/${user.id}`);
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
            <a href="#"><i class="fas fa-search"></i></a>
            <a href="cart.html" class="cart-icon"><i class="fas fa-shopping-bag"></i><span class="cart-count">0</span></a>
        `;
        console.log('Updated header for logged-out user');
        
        // Update cart count after header is rebuilt
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        } else {
            // Fallback: update cart count manually from database
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const response = await fetch(`http://31.97.239.99:3000/cart/${user.id}`);
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

// Make functions available globally
window.checkLoginState = checkLoginState;
window.logout = logout;
window.showMessage = showMessage;
window.debugLoginState = debugLoginState;

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
                        const response = await fetch(`http://31.97.239.99:3000/cart/${user.id}`);
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
    }, 100);
});
