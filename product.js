document.addEventListener('DOMContentLoaded', function() {
    // Product Modal
    const productModal = document.getElementById('productModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    const productForm = document.getElementById('productForm');
    const uploadArea = document.getElementById('uploadArea');
    const productImages = document.getElementById('productImages');
    const imagePreview = document.getElementById('imagePreview');
    
    // Open modal for adding new product
    addProductBtn.addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        productForm.reset();
        imagePreview.innerHTML = '';
        productModal.classList.add('show');
    });
    
    // Close modal
    function closeModal() {
        productModal.classList.remove('show');
    }
    
    cancelBtn.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Open modal for editing product
    const editButtons = document.querySelectorAll('.action-btn.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('modalTitle').textContent = 'Edit Product';
            
            // In a real app, you would populate the form with product data
            document.getElementById('productName').value = 'Silk Evening Gown';
            document.getElementById('productSku').value = 'UN-SEG-BLK';
            document.getElementById('productCategory').value = 'women';
            document.getElementById('productPrice').value = '12999';
            document.getElementById('productStock').value = '15';
            document.getElementById('productStatus').value = 'active';
            document.getElementById('productDescription').value = 'A luxurious silk evening gown with intricate detailing and a flowing silhouette. Perfect for special occasions and black-tie events.';
            
            // Simulate image preview
            imagePreview.innerHTML = `
                <img src="../images/product-1.jpg" alt="Product Image">
                <img src="../images/product-1-alt1.jpg" alt="Product Image">
                <img src="../images/product-1-alt2.jpg" alt="Product Image">
            `;
            
            productModal.classList.add('show');
        });
    });
    
    // Delete product
    const deleteButtons = document.querySelectorAll('.action-btn.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this product?')) {
                // In a real app, you would make an API call to delete the product
                const productRow = this.closest('tr');
                productRow.style.opacity = '0';
                setTimeout(() => {
                    productRow.remove();
                    showNotification('Product deleted successfully');
                }, 300);
            }
        });
    });
    
    // Image upload
    uploadArea.addEventListener('click', function() {
        productImages.click();
    });
    
    productImages.addEventListener('change', function() {
        const files = this.files;
        if (files.length > 0) {
            imagePreview.innerHTML = '';
            for (let i = 0; i < files.length; i++) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    imagePreview.appendChild(img);
                }
                reader.readAsDataURL(files[i]);
            }
        }
    });
    
    // Drag and drop for images
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--accent-color)';
        this.style.backgroundColor = 'rgba(192, 160, 128, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.style.borderColor = 'var(--border-color)';
        this.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--border-color)';
        this.style.backgroundColor = 'transparent';
        
        productImages.files = e.dataTransfer.files;
        const event = new Event('change');
        productImages.dispatchEvent(event);
    });
    
    // Form submission
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // In a real app, you would submit the form data to your backend
        const formData = new FormData(this);
        console.log('Form submitted:', Object.fromEntries(formData));
        
        closeModal();
        showNotification('Product saved successfully');
    });
    
    // Filter products
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    categoryFilter.addEventListener('change', filterProducts);
    statusFilter.addEventListener('change', filterProducts);
    
    function filterProducts() {
        const categoryValue = categoryFilter.value;
        const statusValue = statusFilter.value;
        const rows = document.querySelectorAll('.products-table tbody tr');
        
        rows.forEach(row => {
            const rowCategory = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const rowStatus = row.querySelector('.status').classList[1];
            
            const categoryMatch = categoryValue === 'all' || rowCategory.includes(categoryValue);
            const statusMatch = statusValue === 'all' || rowStatus === statusValue;
            
            if (categoryMatch && statusMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
});