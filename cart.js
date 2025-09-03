// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Quantity controls
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    quantityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (this.textContent === '+' && value < 10) {
                input.value = value + 1;
            } else if (this.textContent === '-' && value > 1) {
                input.value = value - 1;
            }
            
            // Here you would update cart totals via AJAX
        });
    });
    
    // Remove items
    const removeBtns = document.querySelectorAll('.remove-item');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Here you would remove the item via AJAX
            this.closest('.cart-item').remove();
            // Update cart count in header
            updateCartCount(-1);
        });
    });
    
    function updateCartCount(change) {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            let count = parseInt(cartCount.textContent) + change;
            cartCount.textContent = count > 0 ? count : 0;
        }
    }
    
    // Handle checkout button click - only if element exists
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            // Here you would normally validate the cart
            // Then redirect to checkout
            window.location.href = 'checkout.html';
        });
    }
});

// Proceed to checkout
function proceedToCheckout() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Please login to proceed to checkout');
        window.location.href = 'login.html';
        return;
    }
    
    if (window.cartItems && window.cartItems.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Navigate to checkout page
    window.location.href = 'checkout.html';
}

// Update user interface based on login status
function updateUserInterface() {
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    
    if (loginLink && signupLink) {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            // Update login link to be profile link
            loginLink.href = 'profile.html';
            loginLink.innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
            signupLink.style.display = 'none';
        } else {
            loginLink.href = 'login.html';
            loginLink.innerHTML = '<i class="fas fa-user"></i> Login';
            signupLink.style.display = 'inline';
        }
    }
}