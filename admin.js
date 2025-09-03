// Admin Dashboard JavaScript
const API_BASE_URL = 'http://31.97.239.99';
let currentSection = 'dashboard';
let currentProductId = null;

// Global variable to store current sort option
let currentSort = 'created_desc';

// Sort products function
function sortProducts() {
    const sortValue = document.getElementById('productSort')?.value;
    if (!sortValue || !allProducts.length) return;
    
    console.log('Sorting products by:', sortValue);
    currentSort = sortValue;
    
    // Sort the allProducts array in place
    sortProductsData(allProducts, sortValue);
    
    // Reset to first page after sorting
    currentPage = 1;
    
    // Recalculate pagination with sorted products
    calculatePagination();
    
    // Update products count
    updateProductsCount(allProducts.length);
    
    // Render current page of sorted products
    renderProductsGrid(getCurrentPageProducts());
    
    // Update pagination controls
    renderPagination();
}

// Sort products data based on sort value
function sortProductsData(products, sortValue) {
    switch (sortValue) {
        case 'name_asc':
            products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name_desc':
            products.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'created_desc':
            products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            break;
        case 'created_asc':
            products.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            break;
        case 'price_asc':
            products.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
            break;
        case 'price_desc':
            products.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
            break;
        case 'status_asc':
            products.sort((a, b) => {
                const statusOrder = { 'active': 0, 'draft': 1, 'archived': 2 };
                return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            });
            break;
        case 'inventory_desc':
            products.sort((a, b) => (parseInt(b.inventory) || 0) - (parseInt(a.inventory) || 0));
            break;
        case 'inventory_asc':
            products.sort((a, b) => (parseInt(a.inventory) || 0) - (parseInt(b.inventory) || 0));
            break;
        default:
            // Default to newest first
            products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
}

// Update products count display
function updateProductsCount(count) {
    const countElement = document.getElementById('products-count');
    if (countElement) {
        countElement.textContent = `${count} product${count !== 1 ? 's' : ''}`;
    }
}

// Define loadCategoryProducts early so it's available for HTML onclick handlers
window.loadCategoryProducts = async function() {
    console.log('🔍 loadCategoryProducts called (early definition)');
    const bulkProductsGrid = document.getElementById('bulkProductsGrid');
    if (!bulkProductsGrid) {
        console.log('❌ bulkProductsGrid not found');
        return;
    }
    
    try {
        bulkProductsGrid.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';
        
        let url = `${API_BASE_URL}/admin/products?limit=10000`;
        
        const bulkCategoryFilter = document.getElementById('bulkCategoryFilter');
        if (bulkCategoryFilter && bulkCategoryFilter.value) {
            url += `&category=${bulkCategoryFilter.value}`;
            console.log(`🔍 Selected bulk category: ${bulkCategoryFilter.value}`);
        }
        
        console.log(`🔍 Loading products for bulk operations with URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            // Get the error details
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const products = await response.json();
        
        if (products.length === 0) {
            bulkProductsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-box-open"></i><br><br>No products found for the selected filters.</div>';
            return;
        }
        
        bulkProductsGrid.innerHTML = products.map(product => `
            <div class="bulk-product-card" data-product-id="${product.id}" data-category="${product.category_id || ''}" data-subcategory="${product.subcategory_id || ''}">
                <input type="checkbox" value="${product.id}" onchange="toggleBulkProductSelection(${product.id})">
                <div class="bulk-product-image">
                    <img src="${product.image_url || 'uploads/images/placeholder.svg'}" alt="${product.name}" onerror="this.src='uploads/images/placeholder.svg'">
                </div>
                <div class="bulk-product-info">
                    <h4>${product.name}</h4>
                    <p class="category-info">Category: <strong>${product.category_name || 'Unknown'}</strong></p>
                    <p class="subcategory-info">Subcategory: <strong>${product.subcategory_name || 'None'}</strong></p>
                    <p class="price">₹${product.price}</p>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Updated bulk products grid with ${products.length} filtered products`);
        
    } catch (error) {
        console.error('Error loading products for bulk operations:', error);
        bulkProductsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Error loading products. Please try again.</div>';
    }
};

console.log('✅ Early loadCategoryProducts function defined and attached to window');

// Pagination Variables
let currentPage = 1;
let itemsPerPage = 50;
let allProducts = [];
let totalPages = 1;

// Utility Functions
function showMessage(message, type = 'info') {
    // Create a simple message display
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10002;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            messageDiv.style.background = '#34c759';
            break;
        case 'error':
            messageDiv.style.background = '#ff3b30';
            break;
        case 'warning':
            messageDiv.style.background = '#ff9500';
            break;
        default:
            messageDiv.style.background = '#007aff';
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Convenience functions for different notification types
function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showWarning(message) {
    showMessage(message, 'warning');
}

function showInfo(message) {
    showMessage(message, 'info');
}

function showWarning(message) {
    showMessage(message, 'warning');
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'check-circle';
        case 'error':
            return 'exclamation-triangle';
        case 'warning':
            return 'exclamation-circle';
        default:
            return 'info-circle';
    }
}

// Check if user is logged in and is admin
function checkAdminAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    if (user.email !== 'bubere908@gmail.com' || user.role !== 'admin') {
        showError('Access Denied. Admin privileges required.');
        setTimeout(() => {
        window.location.href = 'login.html';
        }, 3000);
        return;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Cleanup orphaned files
async function cleanupOrphanedFiles() {
    if (!confirm('This will permanently delete all files that are not linked to any products. Are you sure you want to continue?')) {
        return;
    }
    
    const statusDiv = document.getElementById('cleanup-status');
    statusDiv.innerHTML = '<div class="loading">🔄 Scanning for orphaned files...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/cleanup-orphaned-files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let statusHTML = `
                <div class="success-message">
                    <h4>✅ Cleanup Completed Successfully!</h4>
                    <div class="cleanup-stats">
                        <p><strong>Total Files Scanned:</strong> ${result.totalFiles}</p>
                        <p><strong>Orphaned Files Found:</strong> ${result.orphanedFiles}</p>
                        <p><strong>Files Deleted:</strong> ${result.deletedFiles}</p>
                        <p><strong>Failed Deletions:</strong> ${result.failedDeletions}</p>
                    </div>
                </div>
            `;
            
            if (result.orphanedFilesList && result.orphanedFilesList.length > 0) {
                statusHTML += `
                    <div class="deleted-files-list">
                        <h5>Deleted Files:</h5>
                        <ul>
                            ${result.orphanedFilesList.map(file => `<li>${file}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            statusDiv.innerHTML = statusHTML;
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 10000);
            
        } else {
            const error = await response.json();
            statusDiv.innerHTML = `<div class="error-message">❌ Error: ${error.error || 'Failed to cleanup files'}</div>`;
        }
        
    } catch (error) {
        console.error('Error during cleanup:', error);
        statusDiv.innerHTML = '<div class="error-message">❌ Error: Failed to connect to server</div>';
    }
}

// Cleanup orphaned images
async function cleanupOrphanedImages() {
    if (!confirm('This will remove database references to images that no longer exist on disk. Are you sure you want to continue?')) {
        return;
    }
    
    const statusDiv = document.getElementById('cleanup-status');
    statusDiv.innerHTML = '<div class="loading">🔄 Scanning for orphaned image references...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/cleanup-orphaned-images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let statusHTML = `
                <div class="success-message">
                    <h4>✅ Image Cleanup Completed Successfully!</h4>
                    <div class="cleanup-stats">
                        <p><strong>Orphaned Images Found:</strong> ${result.orphanedFound}</p>
                        <p><strong>References Cleaned:</strong> ${result.cleaned}</p>
                    </div>
                </div>
            `;
            
            statusDiv.innerHTML = statusHTML;
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 10000);
            
        } else {
            const error = await response.json();
            statusDiv.innerHTML = `<div class="error-message">❌ Error: ${error.error || 'Failed to cleanup orphaned images'}</div>`;
        }
        
    } catch (error) {
        console.error('Error during image cleanup:', error);
        statusDiv.innerHTML = '<div class="error-message">❌ Error: Failed to connect to server</div>';
    }
}

// Debug function to check specific image
async function checkImageExists(filename) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/check-image/${filename}`);
        if (response.ok) {
            const result = await response.json();
            console.log(`Image ${filename}:`, result);
            return result;
        }
    } catch (error) {
        console.error('Error checking image:', error);
    }
    return null;
}

// Fix broken images from CSV import
async function fixBrokenImages() {
    if (!confirm('This will remove all broken image references that are causing flickering. This is specifically for fixing CSV import issues. Continue?')) {
        return;
    }
    
    const statusDiv = document.getElementById('cleanup-status');
    statusDiv.innerHTML = '<div class="loading">🔧 Fixing broken image references...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/fix-broken-images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let statusHTML = `
                <div class="success-message">
                    <h4>✅ Broken Images Fixed Successfully!</h4>
                    <div class="cleanup-stats">
                        <p><strong>Total Images Checked:</strong> ${result.totalChecked}</p>
                        <p><strong>Broken References Fixed:</strong> ${result.fixedCount}</p>
                    </div>
                </div>
            `;
            
            if (result.fixedCount > 0) {
                statusHTML += `
                    <div class="info-message">
                        <p><strong>🎯 What was fixed:</strong></p>
                        <p>• Removed ${result.fixedCount} broken image references</p>
                        <p>• This will stop image flickering in drops and product pages</p>
                        <p>• Products will now display without broken image errors</p>
                        <p>• Refresh your drops page to see the fix</p>
                    </div>
                `;
            } else {
                statusHTML += `
                    <div class="info-message">
                    <p><strong>⚠️ No broken images found in product_images table!</strong></p>
                    <p>The issue might be in the products table itself.</p>
                    <p>Try the "Force Cleanup All Images" button below.</p>
                </div>
                `;
            }
            
            statusDiv.innerHTML = statusHTML;
            
            // Auto-hide after 15 seconds
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 15000);
            
        } else {
            const error = await response.json();
            statusDiv.innerHTML = `<div class="error-message">❌ Error: ${error.error || 'Failed to fix broken images'}</div>`;
        }
        
    } catch (error) {
        console.error('Error fixing broken images:', error);
        statusDiv.innerHTML = '<div class="error-message">❌ Error: Failed to connect to server</div>';
    }
}

// Force cleanup all images (more aggressive)
async function forceCleanupImages() {
    if (!confirm('⚠️ WARNING: This will aggressively clean ALL broken image references from your entire database, including products table. This will fix the flickering issue but may remove some image references. Continue?')) {
        return;
    }
    
    const statusDiv = document.getElementById('cleanup-status');
    statusDiv.innerHTML = '<div class="loading">🧹 Force cleaning all broken images...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/force-cleanup-images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let statusHTML = `
                <div class="success-message">
                    <h4>✅ Force Cleanup Completed!</h4>
                    <div class="cleanup-stats">
                        <p><strong>Total Items Checked:</strong> ${result.totalChecked}</p>
                        <p><strong>Broken References Fixed:</strong> ${result.fixedCount}</p>
                    </div>
                </div>
            `;
            
            if (result.fixedCount > 0) {
                statusHTML += `
                    <div class="info-message">
                        <p><strong>🎯 What was fixed:</strong></p>
                        <p>• Cleaned ${result.fixedCount} broken image references</p>
                        <p>• Fixed products table image fields</p>
                        <p>• Fixed product_images table references</p>
                        <p>• This should completely stop image flickering</p>
                        <p><strong>🔄 Please refresh your drops page now!</strong></p>
                    </div>
                `;
            } else {
                statusHTML += `
                    <div class="info-message">
                        <p><strong>✅ No broken images found!</strong></p>
                        <p>All image references are valid.</p>
                    </div>
                `;
            }
            
            statusDiv.innerHTML = statusHTML;
            
            // Auto-hide after 20 seconds
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 20000);
            
        } else {
            const error = await response.json();
            statusDiv.innerHTML = `<div class="error-message">❌ Error: ${error.error || 'Failed to force cleanup images'}</div>`;
        }
        
    } catch (error) {
        console.error('Error force cleaning images:', error);
        statusDiv.innerHTML = '<div class="error-message">❌ Error: Failed to connect to server</div>';
    }
}

// CSV Import functionality
function setupCSVImport() {
    const csvFileInput = document.getElementById('csvFileInput');
    const selectedFileName = document.getElementById('selectedFileName');
    const importCsvBtn = document.getElementById('importCsvBtn');
    
    if (csvFileInput) {
        csvFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedFileName.textContent = `Selected: ${file.name}`;
                selectedFileName.style.display = 'inline';
                importCsvBtn.disabled = false;
            } else {
                selectedFileName.textContent = '';
                selectedFileName.style.display = 'none';
                importCsvBtn.disabled = true;
            }
        });
    }
}

// Import CSV function
async function importCSV() {
    const csvFileInput = document.getElementById('csvFileInput');
    const importStatus = document.getElementById('import-status');
    const importCsvBtn = document.getElementById('importCsvBtn');
    
    if (!csvFileInput.files[0]) {
        showWarning('File Required', 'Please select a CSV file first');
        return;
    }
    
    if (!confirm('This will import all products from the CSV file. This may take several minutes for large files. Continue?')) {
        return;
    }
    
    // Disable button and show loading
    importCsvBtn.disabled = true;
    importCsvBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
    
    const formData = new FormData();
    formData.append('csvFile', csvFileInput.files[0]);
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/import-csv`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let statusHTML = `
                <div class="success-message">
                    <h4>✅ CSV Import Completed Successfully!</h4>
                    <div class="import-stats">
                        <p><strong>Products Created:</strong> ${result.statistics.productsCreated}</p>
                        <p><strong>Categories Created:</strong> ${result.statistics.categoriesCreated}</p>
                        <p><strong>Images Processed:</strong> ${result.statistics.imagesProcessed}</p>
                        <p><strong>Duration:</strong> ${((result.statistics.endTime - result.statistics.startTime) / 1000).toFixed(2)} seconds</p>
                    </div>
                </div>
            `;
            
            if (result.statistics.errors && result.statistics.errors.length > 0) {
                statusHTML += `
                    <div class="import-errors">
                        <h5>⚠️ Errors Encountered:</h5>
                        <ul>
                            ${result.statistics.errors.map(error => `<li>${error.product}: ${error.error}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            importStatus.innerHTML = statusHTML;
            
            // Reset form
            csvFileInput.value = '';
            selectedFileName.textContent = '';
            selectedFileName.style.display = 'none';
            
            // Refresh products list
            if (currentSection === 'products') {
                // Reload all products to get the new ones from CSV
                await loadProducts();
            }
            
            // Auto-hide after 15 seconds
            setTimeout(() => {
                importStatus.innerHTML = '';
            }, 15000);
            
        } else {
            const error = await response.json();
            importStatus.innerHTML = `<div class="error-message">❌ Import failed: ${error.error}</div>`;
        }
        
    } catch (error) {
        console.error('Error during CSV import:', error);
        importStatus.innerHTML = '<div class="error-message">❌ Error: Failed to connect to server</div>';
    } finally {
        // Re-enable button
        importCsvBtn.disabled = false;
        importCsvBtn.innerHTML = '<i class="fas fa-download"></i> Start Import';
    }
}

// Bulk Operations functionality
let selectedProducts = new Set();

function selectAllProducts() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedProducts.add(checkbox.value);
    });
    updateBulkDeleteButton();
}

function deselectAllProducts() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        selectedProducts.delete(checkbox.value);
    });
    updateBulkDeleteButton();
}

function toggleProductSelection(productId) {
    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
    } else {
        selectedProducts.add(productId);
    }
    updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const selectedCount = document.getElementById('selectedCount');
    
    if (bulkDeleteBtn && selectedCount) {
        selectedCount.textContent = selectedProducts.size;
        bulkDeleteBtn.disabled = selectedProducts.size === 0;
    }
}

async function bulkDeleteProducts() {
    if (selectedProducts.size === 0) {
        showBulkStatus('No products selected for deletion.', 'error');
        return;
    }

    const confirmed = confirm(`⚠️ Are you sure you want to delete ${selectedProducts.size} products?\n\nThis will permanently remove:\n• All selected products\n• Product variants and sizes\n• Product images and videos\n• Associated physical files\n\nThis action cannot be undone!`);
    
    if (!confirmed) return;

    const bulkStatus = document.getElementById('bulk-status');
    bulkStatus.innerHTML = '<div class="loading">🔄 Deleting products...</div>';
    
    try {
        const productIds = Array.from(selectedProducts);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const productId of productIds) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    successCount++;
                    selectedProducts.delete(productId);
                } else {
                    errorCount++;
                    const errorData = await response.json();
                    errors.push(`Product ID ${productId}: ${errorData.message || 'Unknown error'}`);
                }
            } catch (error) {
                errorCount++;
                errors.push(`Product ID ${productId}: ${error.message}`);
            }
        }

        // Update UI
        updateBulkDeleteButton();
        
        // Show results
        let statusHtml = `<div class="success-message">✅ Successfully deleted ${successCount} products</div>`;
        if (errorCount > 0) {
            statusHtml += `<div class="error-message">❌ Failed to delete ${errorCount} products</div>`;
            if (errors.length > 0) {
                statusHtml += '<div class="error-details"><strong>Errors:</strong><ul>';
                errors.forEach(error => {
                    statusHtml += `<li>${error}</li>`;
                });
                statusHtml += '</ul></div>';
            }
        }
        
        bulkStatus.innerHTML = statusHtml;
        
        // Refresh products list if we're on the products tab
        if (currentSection === 'products') {
            // Refresh current page with pagination
            refreshCurrentPage();
            
            // Update dashboard stats
            document.getElementById('total-products').textContent = allProducts.length;
        }
        
    } catch (error) {
        bulkStatus.innerHTML = `<div class="error-message">❌ Bulk deletion failed: ${error.message}</div>`;
    }
}

function showBulkStatus(message, type = 'info') {
    const bulkStatus = document.getElementById('bulk-status');
    if (bulkStatus) {
        const className = type === 'error' ? 'error-message' : type === 'success' ? 'success-message' : 'info-message';
        bulkStatus.innerHTML = `<div class="${className}">${message}</div>`;
    }
}

// Pagination Functions
function calculatePagination() {
    totalPages = Math.ceil(allProducts.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages);
    if (currentPage < 1) currentPage = 1;
    
    console.log('Pagination calculated:', {
        totalProducts: allProducts.length,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages,
        currentPage: currentPage
    });
}

function getCurrentPageProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allProducts.slice(startIndex, endIndex);
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    console.log('Rendering pagination:', {
        paginationContainer: !!paginationContainer,
        allProductsLength: allProducts.length,
        currentPage: currentPage,
        totalPages: totalPages
    });
    
    if (!paginationContainer || allProducts.length === 0) {
        if (paginationContainer) paginationContainer.style.display = 'none';
        console.log('Hiding pagination - no container or no products');
        return;
    }
    
    paginationContainer.style.display = 'block';
    
    // Update info
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, allProducts.length);
    
    // Check if we might have more products than what's loaded
    let infoText = `Showing ${startIndex}-${endIndex} of ${allProducts.length} products`;
    
    // Add warning if we might be hitting backend limits
    if (allProducts.length >= 100) {
        infoText += ' (⚠️ Backend limit may apply - showing first 100 products)';
    }
    
    paginationInfo.innerHTML = infoText;
    
    // Add load more button if we're hitting backend limits
    if (allProducts.length >= 100) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn-secondary load-more-btn';
        loadMoreBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load More Products';
        loadMoreBtn.onclick = loadMoreProducts;
        loadMoreBtn.style.marginTop = '10px';
        
        // Only add the button if it's not already there
        if (!document.querySelector('.load-more-btn')) {
            paginationInfo.appendChild(document.createElement('br'));
            paginationInfo.appendChild(loadMoreBtn);
        }
    }
    
    // Update navigation buttons
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    // Generate page numbers
    let pageNumbersHTML = '';
    
    if (totalPages <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
            pageNumbersHTML += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
        }
    } else {
        // Show first page
        pageNumbersHTML += `<span class="page-number ${1 === currentPage ? 'active' : ''}" onclick="goToPage(1)">1</span>`;
        
        if (currentPage > 3) {
            pageNumbersHTML += '<span class="page-number dots">...</span>';
        }
        
        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
            pageNumbersHTML += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
        }
        
        if (currentPage < totalPages - 2) {
            pageNumbersHTML += '<span class="page-number dots">...</span>';
        }
        
        // Show last page
        if (totalPages > 1) {
            pageNumbersHTML += `<span class="page-number ${totalPages === currentPage ? 'active' : ''}" onclick="goToPage(${totalPages})">${totalPages}</span>`;
        }
    }
    
    pageNumbers.innerHTML = pageNumbersHTML;
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProductsGrid(getCurrentPageProducts());
    renderPagination();
    
    // Scroll to top of products section
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function goToPreviousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

function changeItemsPerPage() {
    const select = document.getElementById('items-per-page');
    itemsPerPage = parseInt(select.value);
    currentPage = 1; // Reset to first page
    calculatePagination();
    renderProductsGrid(getCurrentPageProducts());
    renderPagination();
}

function refreshCurrentPage() {
    if (allProducts.length > 0) {
        // Recalculate pagination in case total count changed
        calculatePagination();
        
        // If current page is now beyond total pages, go to last page
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        // Render current page products
        renderProductsGrid(getCurrentPageProducts());
        renderPagination();
    }
}

// Load more products when backend limit is reached
async function loadMoreProducts() {
    try {
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
        
        // Try to load more products with a higher offset
        let url = `${API_BASE_URL}/admin/products?limit=10000&offset=${allProducts.length}`;
        
        // Add category filter if selected (prioritize main filters)
        const mainCategorySelect = document.getElementById('mainCategoryFilter');
        const categorySelect = document.getElementById('categoryFilter');
        if (mainCategorySelect && mainCategorySelect.value) {
            url += `&category=${mainCategorySelect.value}`;
        } else if (categorySelect && categorySelect.value) {
            url += `&category=${categorySelect.value}`;
        }
        
        // Add subcategory filter if selected (prioritize main filters)
        const mainSubcategorySelect = document.getElementById('mainSubcategoryFilter');
        const subcategorySelect = document.getElementById('subcategoryFilter');
        if (mainSubcategorySelect && mainSubcategorySelect.value) {
            url += `&subcategory=${mainSubcategorySelect.value}`;
        } else if (subcategorySelect && subcategorySelect.value) {
            url += `&subcategory=${subcategorySelect.value}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (response.ok) {
            const moreProducts = await response.json();
            
            if (moreProducts.length > 0) {
                // Add new products to the existing array
                allProducts = [...allProducts, ...moreProducts];
                
                // Refresh pagination
                refreshCurrentPage();
                
                showMessage(`Loaded ${moreProducts.length} more products!`, 'success');
            } else {
                showMessage('No more products to load.', 'info');
            }
        } else {
            showMessage('Failed to load more products.', 'error');
        }
        
    } catch (error) {
        console.error('Error loading more products:', error);
        showMessage('Error loading more products: ' + error.message, 'error');
    } finally {
        // Re-enable the button
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load More Products';
        }
    }
}

// Clear product form completely
function clearProductForm() {
    const form = document.getElementById('productForm');
    form.reset();
    
    // Clear stored original product data
    window.originalProductData = null;
    
    // Clear media inputs
    const imageUrlInputs = document.getElementById('imageUrlInputs');
    const videoUrlInputs = document.getElementById('videoUrlInputs');
    
    if (imageUrlInputs) {
        imageUrlInputs.innerHTML = `
            <div class="url-input-group">
                <input type="url" name="image_url" placeholder="Image URL" class="form-control">
                <button type="button" class="btn-secondary" onclick="addImageInput()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }
    
    if (videoUrlInputs) {
        videoUrlInputs.innerHTML = `
            <div class="url-input-group">
                <input type="url" name="video_url" placeholder="Video URL" class="form-control">
                <button type="button" class="btn-secondary" onclick="addVideoInput()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }
    
    // Clear file inputs
    clearFileInputs();
    
    // Clear size inputs
    const sizeInputs = document.getElementById('sizeInputs');
    if (sizeInputs) {
        sizeInputs.innerHTML = `
            <div class="custom-size-group">
                <input type="text" placeholder="Custom size (e.g., One Size, Small, Large)" class="form-control">
                <button type="button" class="btn-secondary" onclick="addCustomSizeInput()">
                    <i class="fas fa-plus"></i> Add More
                </button>
            </div>
        `;
    }
    
    // Clear all size checkboxes
    document.querySelectorAll('.size-checkbox input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset size system tabs to default (US)
    showSizeSystem('us');
    
    // Hide selected sizes display
    const selectedSizesDisplay = document.getElementById('selectedSizesDisplay');
    if (selectedSizesDisplay) {
        selectedSizesDisplay.style.display = 'none';
    }
    
    // Clear size inventory display
    const inventoryDisplay = document.getElementById('size-inventory-display');
    if (inventoryDisplay) {
        inventoryDisplay.remove();
    }
}

// Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    checkAdminAuth();
    
    // Navigation event listeners
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // File upload previews
    setupFileUploads();
    
    // Setup CSV import
    setupCSVImport();
    
    // Initialize dashboard
    loadDashboardData();
    loadCategories();
    
    // Also load categories management data for immediate access
    console.log('Admin panel initialized, loading categories management data...');
    loadCategoriesManagement();
    
    // Test categories loading for product form
    console.log('Testing categories loading for product form...');
    setTimeout(() => {
        console.log('Testing loadCategories function...');
        loadCategories();
    }, 500);
});

function switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    // Update title
    document.getElementById('section-title').textContent = getSectionTitle(section);
    currentSection = section;

    // Clear bulk selection when switching sections
    if (section !== 'products') {
        selectedProducts.clear();
        updateBulkDeleteButton();
    }

    // Load section data
    loadSectionData(section);
    
    // Reset pagination when switching to products
    if (section === 'products') {
        currentPage = 1;
    }
}

function getSectionTitle(section) {
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        orders: 'Orders',
        customers: 'Customers',
        categories: 'Categories',
        analytics: 'Analytics',
        announcement: 'Announcement Bar',
        settings: 'Settings'
    };
    return titles[section] || 'Dashboard';
}

function loadSectionData(section) {
    console.log('🔧 loadSectionData called with section:', section);
    
    switch(section) {
        case 'dashboard':
            console.log('📊 Loading dashboard...');
            loadDashboardData();
            break;
        case 'products':
            console.log('📦 Loading products...');
            loadProducts();
            break;
        case 'orders':
            console.log('📋 Loading orders...');
            // Don't call displayOrders here - let loadOrders handle it
            loadOrders();
            break;
        case 'customers':
            console.log('👥 Loading customers...');
            loadCustomers();
            break;
        case 'categories':
            console.log('🏷️ Loading categories...');
            loadCategoriesManagement();
            // Also load categories for the filter dropdowns
            loadCategories();
            // Load all products initially in the filter section
            setTimeout(() => {
                loadCategoryProducts();
            }, 500);
            break;
        case 'category-images':
            console.log('🖼️ Loading category images...');
            loadCategoryImages();
            break;
        case 'analytics':
            console.log('📈 Loading analytics...');
            loadAnalytics();
            break;
        case 'hero-slides':
            console.log('🖼️ Loading hero slides...');
            loadHeroSlides();
            break;
        case 'limited-drops':
            console.log('🔥 Loading limited drops...');
            loadLimitedDrops();
            loadProductsForSelector();
            break;
        case 'announcement':
            console.log('📢 Loading announcement management...');
            loadAnnouncementMessages();
            break;
        case 'settings':
            console.log('⚙️ Loading settings...');
            // Load settings if needed
            break;
        default:
            console.log('❓ Unknown section:', section);
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [productsRes, ordersRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/products?limit=10000`),
            fetch(`${API_BASE_URL}/admin/orders`),
            fetch(`${API_BASE_URL}/users`)
        ]);

        const products = await productsRes.json();
        const orders = await ordersRes.json();
        const users = await usersRes.json();

        // Update stats
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-orders').textContent = orders.length;
        document.getElementById('total-customers').textContent = users.length;

        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Products Functions
async function loadProducts() {
    try {
        console.log('Loading products for admin...');
        
        // Add cache busting parameter and strict cache control headers  
        // Build URL with category/subcategory filters
        let url = `${API_BASE_URL}/admin/products?limit=10000`;
        
        // Add category filter if selected (prioritize main filters)
        const mainCategorySelect = document.getElementById('mainCategoryFilter');
        const categorySelect = document.getElementById('categoryFilter');
        if (mainCategorySelect && mainCategorySelect.value) {
            url += `&category=${mainCategorySelect.value}`;
        } else if (categorySelect && categorySelect.value) {
            url += `&category=${categorySelect.value}`;
        }
        
        // Add subcategory filter if selected (prioritize main filters)
        const mainSubcategorySelect = document.getElementById('mainSubcategoryFilter');
        const subcategorySelect = document.getElementById('subcategoryFilter');
        if (mainSubcategorySelect && mainSubcategorySelect.value) {
            url += `&subcategory=${mainSubcategorySelect.value}`;
        } else if (subcategorySelect && subcategorySelect.value) {
            url += `&subcategory=${subcategorySelect.value}`;
        }
        
        console.log(`🔍 Loading products with URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products loaded:', products.length);
        
        // Store all products for pagination
        allProducts = products;
        
        // Apply current sorting to the products
        const sortValue = document.getElementById('productSort')?.value || currentSort;
        sortProductsData(allProducts, sortValue);
        
        // Update products count display
        updateProductsCount(products.length);
        
        // Get total count for better pagination info
        try {
            const countResponse = await fetch(`${API_BASE_URL}/admin/products/count`);
            if (countResponse.ok) {
                const countData = await countResponse.json();
                const totalCount = countData.total;
                
                // If we got fewer products than the total count, it means there's a backend limit
                if (products.length < totalCount) {
                    console.log(`Backend returned ${products.length} products out of ${totalCount} total products`);
                    console.log('This may be due to backend pagination limits');
                }
            }
        } catch (countError) {
            console.warn('Could not fetch total product count:', countError);
        }
        
        // Reset to first page when loading new products
        currentPage = 1;
        
        // Calculate pagination with sorted products
        calculatePagination();
        
        // Render current page of sorted products
        renderProductsGrid(getCurrentPageProducts());
        
        // Render pagination controls
        renderPagination();
        
        // Update dashboard stats
        document.getElementById('total-products').textContent = products.length;
        
        // Reset bulk selection when products are loaded
        selectedProducts.clear();
        updateBulkDeleteButton();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Error loading products: ' + error.message, 'error');
    }
}

function renderProductsGrid(products) {
    const grid = document.getElementById('products-grid');
    
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No Products Available</h3>
                <p>Start by adding your first product!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => {
        // Get the first image URL from the images array or fallback to image_url
        const imageUrl = (product.images && product.images.length > 0) 
            ? product.images[0].image_url 
            : (product.image_url || null);
        
        // Get video count
        const videoCount = product.videos ? product.videos.length : 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-checkbox">
                    <input type="checkbox" class="product-checkbox" value="${product.id}" onchange="toggleProductSelection(${product.id})">
                </div>
                <div class="product-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.src='dummy.png'">` : '<i class="fas fa-image"></i>'}
                    ${videoCount > 0 ? `<div class="video-badge"><i class="fas fa-video"></i> ${videoCount}</div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">₹${product.price}</div>
                    <div class="product-meta">
                        <span>${product.category_name || product.subcategory_name || 'No Category'}</span>
                        <span class="status-badge ${product.status}">${product.status}</span>
                    </div>
                    <div class="product-details">
                        <div class="product-type">${product.product_type || 'No Type'}</div>
                        <div class="product-sku">${product.sku || 'No SKU'}</div>
                        <div class="product-inventory">Inventory: ${product.inventory || 0}</div>
                        <div class="product-media">
                            <span class="media-count">
                                <i class="fas fa-image"></i> ${product.images ? product.images.length : 0}
                            </span>
                            ${videoCount > 0 ? `<span class="media-count"><i class="fas fa-video"></i> ${videoCount}</span>` : ''}
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-secondary" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-secondary" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Orders Functions
let allOrders = [];
let filteredOrders = [];
let selectedOrders = new Set();
const ordersPerPage = 20;

function loadOrders() {
    console.log('🚀 Loading orders...');
    
    // Prevent multiple simultaneous calls
    if (window.isLoadingOrders) {
        console.log('⏸️ Orders already loading, skipping duplicate call');
        return;
    }
    
    window.isLoadingOrders = true;
    
    const API_BASE_URL = 'http://31.97.239.99';
    const url = `${API_BASE_URL}/admin/orders`;
    
    showOrdersLoading();
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`✅ Loaded ${data.length} orders successfully`);
            
            // Update global variables
            allOrders = data;
            filteredOrders = data;
            window.allOrders = data;
            window.filteredOrders = data;
            
            // Update statistics
            updateOrdersStatistics();
            
            // Set up filter event listeners now that orders are loaded
            setupFilterEventListeners();
            
            // Now call displayOrders with the loaded data
            displayOrders();
        })
        .catch(error => {
            console.error('❌ Error loading orders:', error);
            showOrdersError(error.message);
        })
        .finally(() => {
            window.isLoadingOrders = false;
        });
}

function showOrdersLoading() {
    console.log('🔄 Showing orders loading state');
        const table = document.getElementById('orders-table');
    if (!table) {
        console.error('❌ orders-table element not found!');
        return;
    }
    
    // Clear any existing content first
    table.innerHTML = '';
    
    // Add loading state
        table.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading orders...</p>
            </div>
    `;
    console.log('✅ Loading state displayed');
}

function showOrdersError(message) {
    console.log('❌ Showing orders error:', message);
    const table = document.getElementById('orders-table');
    if (!table) {
        console.error('❌ orders-table element not found in showOrdersError!');
        return;
    }
    table.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 60px 20px; color: #dc3545;">
            <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 16px;"></i>
            <p>${message}</p>
            <button class="btn-primary" onclick="loadOrders()" style="margin-top: 16px;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
    console.log('✅ Error state displayed');
}

function updateOrdersStatistics() {
    const stats = {
        pending: allOrders.filter(o => o.status === 'pending').length,
        processing: allOrders.filter(o => o.status === 'processing').length,
        shipped: allOrders.filter(o => o.status === 'shipped').length,
        delivered: allOrders.filter(o => o.status === 'delivered').length,
        revenue: allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    };
    
    document.getElementById('pendingOrders').textContent = stats.pending;
    document.getElementById('processingOrders').textContent = stats.processing;
    document.getElementById('shippedOrders').textContent = stats.shipped;
    document.getElementById('deliveredOrders').textContent = stats.delivered;
    document.getElementById('totalRevenue').textContent = `₹${stats.revenue.toLocaleString()}`;
}

function displayOrders() {
    console.log('🎨 displayOrders function called');
    console.log('📊 Current data:', { allOrders: allOrders.length, filteredOrders: filteredOrders.length, currentPage });
    
    // Check if orders are still loading
    if (allOrders.length === 0 && filteredOrders.length === 0) {
        console.log('⏳ Orders still loading, showing loading state...');
        const table = document.getElementById('orders-table');
        if (table) {
            table.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading orders...</p>
                </div>
            `;
        }
        return;
    }
    
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    console.log('📄 Page orders:', { startIndex, endIndex, pageOrdersCount: pageOrders.length });
    
    const table = document.getElementById('orders-table');
    if (!table) {
        console.error('❌ orders-table element not found in displayOrders!');
        return;
    }
    
    if (pageOrders.length === 0) {
        console.log('📭 No orders to display, showing empty state');
        table.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; color: #6d7175;">
                <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px; color: #c9cccf;"></i>
                <p>No orders found matching your criteria</p>
                <button class="btn-secondary" onclick="clearFilters()" style="margin-top: 16px;">
                    <i class="fas fa-times"></i> Clear Filters
                </button>
            </div>
        `;
        return;
    }
    
    console.log('📋 Rendering orders table with', pageOrders.length, 'orders');
    
    // Render the professional orders table
    table.innerHTML = `
        <table>
                    <thead>
                        <tr>
                    <th><input type="checkbox" id="select-all-orders" onchange="toggleSelectAll(this)"></th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Products</th>
                            <th>Amount</th>
                            <th>Status</th>
                    <th>Payment</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                ${pageOrders.map(order => `
                            <tr>
                                <td>
                            <input type="checkbox" class="order-checkbox" value="${order.id}" onchange="toggleOrderSelection(${order.id})">
                        </td>
                        <td>
                            <span class="order-id">#${order.id}</span>
                                </td>
                                <td>
                                    <div class="customer-info">
                                <strong>${order.username || 'Guest'}</strong><br>
                                <small>${order.email || 'N/A'}</small><br>
                                <small>${order.phone || 'N/A'}</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="products-list">
                                ${formatOrderProducts(order.products)}
                                    </div>
                                </td>
                                <td>
                            <strong>₹${parseFloat(order.total_amount).toLocaleString()}</strong>
                                </td>
                                <td>
                            <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                                </td>
                                <td>
                            <span class="payment-method-badge payment-${order.payment_method.toLowerCase()}">
                                ${order.payment_method.toUpperCase() === 'UPI' ? 'UPI (PREPAID)' : order.payment_method.toUpperCase()}
                                ${order.is_cod ? '<br><small>COD</small>' : ''}
                            </span>
                        </td>
                        <td>
                            <small>${new Date(order.created_at).toLocaleDateString()}</small>
                                </td>
                                <td>
                                    <div class="order-actions">
                                <button class="btn-small btn-primary" onclick="viewOrderDetails(${order.id})" title="View Details">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                <button class="btn-small btn-secondary" onclick="editOrder(${order.id})" title="Edit Order">
                                    <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-small btn-danger" onclick="deleteOrder(${order.id})" title="Delete Order">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                <div style="margin-top: 5px;">
                                    <select onchange="quickUpdateStatus(${order.id}, this.value, this)" style="padding: 4px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; width: 100px;">
                                        <option value="">Quick Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
    `;
    
    console.log('✅ Orders table rendered successfully');
    
    // Force remove any loading states
    const loadingStates = table.querySelectorAll('.loading-state');
    loadingStates.forEach(loading => loading.remove());
    
    updatePagination();
    updateSelectedOrdersCount();
}

function formatOrderProducts(productsString) {
    if (!productsString) return '<span class="no-products">No products</span>';
    
    const products = productsString.split(', ');
    return products.map(product => `
        <div class="product-item">
            <div class="product-details">
                <div class="product-name">${product}</div>
            </div>
        </div>
    `).join('');
}

function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const pagination = document.getElementById('ordersPagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    displayOrders();
}

function filterOrders() {
    console.log('🔍 filterOrders called');
    
    // Don't filter if orders haven't loaded yet
    if (allOrders.length === 0) {
        console.log('⏸️ Orders not loaded yet, skipping filter');
        return;
    }
    
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const paymentFilter = document.getElementById('payment-filter').value;
    
    console.log('🔍 Filtering with:', { statusFilter, dateFilter, paymentFilter });
    
    filteredOrders = allOrders.filter(order => {
        let matches = true;
        
        // Status filter
        if (statusFilter && statusFilter !== 'all') {
            matches = matches && order.status === statusFilter;
        }
        
        // Date filter
        if (dateFilter && dateFilter !== 'all') {
            const orderDate = new Date(order.created_at);
            const now = new Date();
            
            switch(dateFilter) {
                case 'today':
                    matches = matches && isSameDay(orderDate, now);
                    break;
                case 'week':
                    matches = matches && isSameWeek(orderDate, now);
                    break;
                case 'month':
                    matches = matches && isSameMonth(orderDate, now);
                    break;
                case 'quarter':
                    matches = matches && isSameQuarter(orderDate, now);
                    break;
            }
        }
        
        // Payment filter
        if (paymentFilter && paymentFilter !== 'all') {
            matches = matches && order.payment_method === paymentFilter;
        }
        
        return matches;
    });
    
    console.log('🔍 Filtered orders:', filteredOrders.length, 'out of', allOrders.length);
    
    currentPage = 1; // Reset to first page
    displayOrders();
}

function sortOrders(sortBy) {
    console.log('🔍 sortOrders called with:', sortBy);
    
    // Don't sort if orders haven't loaded yet
    if (allOrders.length === 0) {
        console.log('⏸️ Orders not loaded yet, skipping sort');
        return;
    }
    
    if (!sortBy || sortBy === 'newest') {
        filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
        filteredOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'amount-high') {
        filteredOrders.sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount));
    } else if (sortBy === 'amount-low') {
        filteredOrders.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
    }
    
    console.log('🔍 Orders sorted by:', sortBy);
    displayOrders();
}

function searchOrders() {
    console.log('🔍 searchOrders called');
    
    // Don't search if orders haven't loaded yet
    if (allOrders.length === 0) {
        console.log('⏸️ Orders not loaded yet, skipping search');
        return;
    }
    
    const searchTerm = document.getElementById('orders-search').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => {
            return (
                order.id.toString().includes(searchTerm) ||
                (order.username && order.username.toLowerCase().includes(searchTerm)) ||
                (order.email && order.email.toLowerCase().includes(searchTerm)) ||
                (order.phone && order.phone.includes(searchTerm)) ||
                order.status.toLowerCase().includes(searchTerm) ||
                order.payment_method.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    console.log('🔍 Search results:', filteredOrders.length, 'out of', allOrders.length);
    
    currentPage = 1;
    displayOrders();
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('paymentFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('sortFilter').value = 'newest';
    document.getElementById('orderSearch').value = '';
    
    filteredOrders = [...allOrders];
    currentPage = 1;
    displayOrders();
}

function toggleOrderSelection(orderId) {
    if (selectedOrders.has(orderId)) {
        selectedOrders.delete(orderId);
    } else {
        selectedOrders.add(orderId);
    }
    updateSelectedOrdersCount();
}

function toggleSelectAll(checkbox) {
    if (!checkbox) return;
    
    const checkboxes = document.querySelectorAll('.order-checkbox');
    const isChecked = checkbox.checked;
    
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        const orderId = parseInt(cb.value);
        
        if (isChecked) {
            selectedOrders.add(orderId);
        } else {
            selectedOrders.delete(orderId);
        }
    });
    
    updateSelectedOrdersCount();
}

function selectAllOrders() {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    if (checkboxes.length === 0) {
        showWarning('No orders available to select');
        return;
    }
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        const orderId = parseInt(checkbox.value);
        selectedOrders.add(orderId);
    });
    updateSelectedOrdersCount();
}

function deselectAllOrders() {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    if (checkboxes.length === 0) {
        showWarning('No orders available to deselect');
        return;
    }
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        const orderId = parseInt(checkbox.value);
        selectedOrders.delete(orderId);
    });
    updateSelectedOrdersCount();
}

function updateSelectedOrdersCount() {
    const count = selectedOrders.size;
    console.log('📊 Updating selected orders count:', count);
    
    // Update the count display in all buttons
    const countElements = document.querySelectorAll('#selectedOrdersCount');
    countElements.forEach(element => {
        element.textContent = count;
    });
    
    // Update button states
    const bulkStatusBtn = document.getElementById('bulkStatusBtn');
    const bulkDeleteBtn = document.getElementById('ordersBulkDeleteBtn');
    
    if (bulkStatusBtn) bulkStatusBtn.disabled = count === 0;
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = count === 0;
    
    console.log('✅ Updated count to:', count);
}

function bulkUpdateStatus() {
    if (selectedOrders.size === 0) return;
    
    const newStatus = prompt('Enter new status (pending/processing/shipped/delivered/cancelled):');
    if (!newStatus) return;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
        showError('Invalid Status', 'Please use: pending, processing, shipped, delivered, or cancelled');
        return;
    }
    
    // Update all selected orders
    const promises = Array.from(selectedOrders).map(orderId => 
        updateOrderStatus(orderId, newStatus.toLowerCase())
    );
    
    Promise.all(promises).then(() => {
        showSuccess('Orders Updated', `Successfully updated ${selectedOrders.size} orders to ${newStatus}`);
        selectedOrders.clear();
        updateSelectedOrdersCount();
        loadOrders(); // Reload to show updated data
    }).catch(error => {
        console.error('Error updating orders:', error);
        showError('Update Failed', 'Some orders failed to update. Please try again.');
    });
}

function exportOrders() {
    const csvContent = generateOrdersCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



// Delete selected orders
async function deleteSelectedOrders() {
    alert('🗑️ deleteSelectedOrders function called!'); // Simple alert to confirm function is called
    console.log('🗑️ deleteSelectedOrders called');
    console.log('📊 selectedOrders size:', selectedOrders.size);
    console.log('📋 selectedOrders content:', Array.from(selectedOrders));
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    
    if (selectedOrders.size === 0) {
        showWarning('Please select orders to delete');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedOrders.size} selected order(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
        console.log('❌ User cancelled deletion');
        return;
    }
    
    console.log('✅ User confirmed deletion, proceeding...');
    
    try {
        const promises = Array.from(selectedOrders).map(orderId => {
            const deleteUrl = `${API_BASE_URL}/admin/orders/${orderId}`;
            console.log(`🗑️ Deleting order ${orderId} from URL: ${deleteUrl}`);
            return fetch(deleteUrl, {
                method: 'DELETE'
            });
        });
        
        console.log('📤 Sending delete requests...');
        const results = await Promise.all(promises);
        console.log('📊 Delete results:', results);

        // Check each result individually
        results.forEach((result, index) => {
            const orderId = Array.from(selectedOrders)[index];
            console.log(`📋 Order ${orderId} delete result:`, {
                status: result.status,
                statusText: result.statusText,
                ok: result.ok
            });
        });

        const hardErrorResults = results.filter(r => !(r.ok || r.status === 404));
        const successCount = results.filter(r => r.ok).length;
        const notFoundCount = results.filter(r => r.status === 404).length; // treat as already deleted
        const totalProcessed = successCount + notFoundCount;
        const errorCount = hardErrorResults.length;

        console.log(`✅ Deleted: ${successCount}, 🗂️ Already deleted/not found: ${notFoundCount}, ❌ Failed: ${errorCount}`);

        if (totalProcessed > 0) {
            const parts = [];
            if (successCount > 0) parts.push(`deleted ${successCount}`);
            if (notFoundCount > 0) parts.push(`${notFoundCount} already removed`);
            showSuccess(`Orders ${parts.join(', ')}.`);

            // Clear selection and refresh
            selectedOrders.clear();
            updateSelectedOrdersCount();
            loadOrders();
        }

        if (errorCount > 0) {
            showError(`Failed to delete ${errorCount} order(s). Please try again.`);
        }
        
    } catch (error) {
        console.error('❌ Error deleting orders:', error);
        showError('Failed to delete orders. Please try again.');
    }
}

// Make function globally accessible
window.deleteSelectedOrders = deleteSelectedOrders;

// Add event listener to delete button when page loads
document.addEventListener('DOMContentLoaded', function() {
    const deleteBtn = document.getElementById('ordersBulkDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            console.log('🔘 Delete button clicked via event listener');
            deleteSelectedOrders();
        });
    }
});

// Simple test function to check if button clicks work
function testDeleteButton() {
    console.log('🧪 Test delete button clicked!');
    alert('Delete button is working!');
}

// Test if deleteSelectedOrders function exists
function testDeleteFunctionExists() {
    console.log('🧪 Testing if deleteSelectedOrders function exists...');
    if (typeof deleteSelectedOrders === 'function') {
        console.log('✅ deleteSelectedOrders function exists!');
        alert('deleteSelectedOrders function exists and is callable!');
    } else {
        console.log('❌ deleteSelectedOrders function does NOT exist!');
        alert('deleteSelectedOrders function is missing!');
    }
}

// Direct test of delete function
function testDeleteDirectly() {
    console.log('🧪 Testing delete function directly...');
    try {
        // Try to call the function directly
        deleteSelectedOrders();
        console.log('✅ deleteSelectedOrders called successfully!');
    } catch (error) {
        console.error('❌ Error calling deleteSelectedOrders:', error);
        alert('Error calling deleteSelectedOrders: ' + error.message);
    }
}

function generateOrdersCSV() {
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Products', 'Payment Method', 'Total Amount', 'Status', 'Date', 'Shipping Address'];
    const rows = filteredOrders.map(order => [
        order.id,
        order.username || 'Guest',
        order.email || 'N/A',
        order.phone || 'N/A',
        order.products || 'N/A',
        order.payment_method || 'N/A',
        order.total_amount,
        order.status,
        new Date(order.created_at).toLocaleString(),
        order.shipping_address || 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Date utility functions
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function isSameWeek(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((d1 - d2) / oneDay));
    return diffDays < 7;
}

function isSameMonth(date1, date2) {
    return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}

function isSameQuarter(date1, date2) {
    const quarter1 = Math.floor(date1.getMonth() / 3);
    const quarter2 = Math.floor(date2.getMonth() / 3);
    return quarter1 === quarter2 && date1.getFullYear() === date2.getFullYear();
}

function setupOrdersEventListeners() {
    // Add any additional event listeners if needed
}

// Debug functions removed - orders system is now working properly

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const orderData = await response.json();
        
        const { order, items } = orderData;
        
        console.log('📦 Order data received:', order);
        console.log('📦 Order items received:', items);
        console.log('🖼️ Image URLs:', items.map(item => ({ name: item.name, image_url: item.image_url })));
        
        // Create enhanced modal content
        const modalContent = `
            <div class="order-details-modal">
                <div class="modal-header">
                    <h2>Order #${order.id} Details</h2>
                    <button class="close-btn" onclick="closeOrderModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-info-grid">
                        <div class="order-section">
                            <h3>Customer Information</h3>
                            <div class="info-item">
                                <strong>Name:</strong> ${order.username || 'Guest'}
                            </div>
                            <div class="info-item">
                                <strong>Email:</strong> ${order.email || 'N/A'}
                            </div>
                            <div class="info-item">
                                <strong>Phone:</strong> ${order.phone || 'N/A'}
                            </div>
                            <div class="info-item">
                                <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}
                            </div>
                        </div>
                        
                        <div class="order-section">
                            <h3>Order Summary</h3>
                            <div class="info-item">
                                <strong>Total Amount:</strong> ₹${parseFloat(order.total_amount).toLocaleString()}
                            </div>
                            <div class="info-item">
                                <strong>Status:</strong> 
                                <span class="status-badge status-${order.status}">${order.status}</span>
                                <div style="margin-top: 10px;">
                                    <select id="status-update-${order.id}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                                        <option value="">Update Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button class="btn-small btn-primary" onclick="updateOrderStatusFromModal(${order.id})" style="padding: 6px 12px; font-size: 12px;">
                                        <i class="fas fa-save"></i> Update
                                    </button>
                                </div>
                            </div>
                            <div class="info-item">
                                <strong>Payment Method:</strong> 
                                <span class="payment-method-badge ${order.payment_method || 'upi'}">
                                    ${(order.payment_method || 'upi').toUpperCase() === 'UPI' ? 'UPI (PREPAID)' : (order.payment_method || 'upi').toUpperCase()}
                                </span>
                            </div>
                            ${order.is_cod ? `
                                <div class="info-item">
                                    <strong>COD Advance Paid:</strong> ₹${order.cod_advance_paid || 200}
                                </div>
                                <div class="info-item">
                                    <strong>COD Remaining:</strong> ₹${order.cod_remaining_amount || 0}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="order-section">
                            <h3>Shipping Information</h3>
                            <div class="info-item">
                                <strong>Address:</strong>
                                <div class="address-text">${order.shipping_address || 'No address provided'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-items-section">
                        <h3>Order Items (${items.length})</h3>
                        ${items.some(item => !item.image_url) ? `
                            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px; color: #856404;">
                                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                                <strong>Note:</strong> Some products don't have images. To improve the admin experience, please upload product images in the Products section.
                            </div>
                        ` : ''}
                        <div class="items-grid">
                                    ${items.map(item => `
                                <div class="order-item-card">
                                    <div class="item-image">
                                                    ${item.image_url && item.image_url !== 'null' && item.image_url !== 'undefined' && item.image_url.trim() !== '' ? 
                                            `<img src="${item.image_url.startsWith('http') ? item.image_url : API_BASE_URL + '/' + item.image_url}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik02MCA2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2EMiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjYwIiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+">` : 
                                            `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik02MCA2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MFY2MEM2MCA2MCA2MCA2MCA2MCA2EMiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjYwIiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjR4IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+" alt="No Image">`
                                                    }
                                                </div>
                                    <div class="item-details">
                                        <h4 class="item-name">${item.name}</h4>
                                        <div class="item-info">
                                            <span class="item-size"><strong>Size:</strong> ${item.size || 'N/A'}</span>
                                            <span class="item-quantity"><strong>Qty:</strong> ${item.quantity}</span>
                                            <span class="item-price"><strong>Price:</strong> ₹${parseFloat(item.price).toFixed(2)}</span>
                                            <span class="item-subtotal"><strong>Total:</strong> ₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                    `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="printOrder(${order.id})">
                        <i class="fas fa-print"></i> Print Order
                    </button>
                    <button class="btn-primary" onclick="closeOrderModal()">Close</button>
                </div>
            </div>
        `;
        
        // Show modal
        showModal(modalContent);
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showMessage('Error loading order details: ' + error.message, 'error');
    }
}

// Show modal function
function showModal(content) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'orderModal';
    modal.innerHTML = content;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Add event listener to close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeOrderModal();
        }
    });
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.remove();
    }
}

// Print order function
function printOrder(orderId) {
    // Open the print-friendly order page in a new window
    window.open(`order-print.html?id=${orderId}`, '_blank');
}

// Customers Functions
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const customers = await response.json();
        
        const table = document.getElementById('customers-table');
        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f6f6f7;">
                        <th style="padding: 12px; text-align: left;">ID</th>
                        <th style="padding: 12px; text-align: left;">Username</th>
                        <th style="padding: 12px; text-align: left;">Email</th>
                        <th style="padding: 12px; text-align: left;">Joined Date</th>
                        <th style="padding: 12px; text-align: left;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(customer => `
                        <tr style="border-bottom: 1px solid #e1e3e5;">
                            <td style="padding: 12px;">${customer.id}</td>
                            <td style="padding: 12px;">${customer.username}</td>
                            <td style="padding: 12px;">${customer.email}</td>
                            <td style="padding: 12px;">${new Date(customer.created_at).toLocaleDateString()}</td>
                            <td style="padding: 12px;">
                                <button class="btn-secondary" onclick="viewCustomerDetails(${customer.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Analytics Functions
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/analytics`);
        const analytics = await response.json();
        
        const content = document.getElementById('analytics-content');
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e1e3e5;">
                    <h3>Sales Overview</h3>
                    <div style="text-align: center; padding: 40px; color: #6d7175;">
                        <i class="fas fa-chart-bar" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Sales chart will be displayed here</p>
                    </div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e1e3e5;">
                    <h3>Top Products</h3>
                    <div style="text-align: center; padding: 40px; color: #6d7175;">
                        <i class="fas fa-chart-pie" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Product performance chart will be displayed here</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Category/Subcategory Functions
// Global function to load categories for product form
window.loadCategories = async function() {
    try {
        console.log('=== LOADING CATEGORIES FOR PRODUCT FORM ===');
        console.log('API Base URL:', API_BASE_URL);
        console.log('Full categories URL:', `${API_BASE_URL}/categories`);
        
        const response = await fetch(`${API_BASE_URL}/categories`);
        console.log('Categories response status:', response.status);
        console.log('Categories response ok:', response.ok);
        
        if (response.ok) {
            const categories = await response.json();
            console.log('Categories data received:', categories);
            console.log('Categories count:', categories.length);
            console.log('Categories type:', typeof categories);
            console.log('Categories is array:', Array.isArray(categories));
            
            const categorySelect = document.getElementById('categorySelect');
            console.log('Category select element found:', !!categorySelect);
            
            if (!categorySelect) {
                console.error('Category select element not found! DOM might not be ready yet.');
                console.log('Available elements with "category" in ID:');
                document.querySelectorAll('[id*="category"]').forEach(el => {
                    console.log('- Element ID:', el.id, 'Tag:', el.tagName);
                });
                return;
            }
            
            console.log('Category select element found, populating...');
            console.log('Before population - innerHTML length:', categorySelect.innerHTML.length);
            
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            
            if (categories.length === 0) {
                console.log('No categories found in database');
                categorySelect.innerHTML = '<option value="">No categories available</option>';
                return;
            }
            
            categories.forEach((category, index) => {
                console.log(`Processing category ${index + 1}:`, category);
                console.log('Category ID:', category.id);
                console.log('Category Name:', category.name);
                console.log('Category structure:', JSON.stringify(category, null, 2));
                
                if (category.id && category.name) {
                    const optionHtml = `<option value="${category.id}">${category.name}</option>`;
                    categorySelect.innerHTML += optionHtml;
                    console.log('Category option added successfully:', optionHtml);
                } else {
                    console.warn('Category missing ID or name:', category);
                }
            });
            
            console.log('After population - innerHTML length:', categorySelect.innerHTML.length);
            console.log('Final dropdown HTML:', categorySelect.innerHTML);
            console.log('Categories dropdown populated successfully');
        } else {
            console.error('Failed to load categories:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
        
        console.log('=== CATEGORIES LOADING COMPLETED ===');
    } catch (error) {
        console.error('Error loading categories:', error);
        console.error('Error stack:', error.stack);
    }
};

function openCategoryModal() {
    document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryDescription').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Add New Category';
    document.getElementById('saveCategoryBtn').textContent = 'Save Category';
    document.getElementById('saveCategoryBtn').onclick = saveCategory;
}

async function saveCategory() {
    const name = document.getElementById('newCategoryName').value;
    const description = document.getElementById('newCategoryDescription').value;
    
    if (!name) {
        alert('Category name is required');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });

        if (response.ok) {
            closeCategoryModal();
            loadCategoriesManagement();
            loadCategories(); // Refresh product form categories
            refreshIndexPage(); // Refresh index.html category menu
            alert('Category created successfully! The Collections dropdown on index.html will be updated. If index.html is open in another tab, please refresh it to see the changes immediately.');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to create category');
        }
    } catch (error) {
        console.error('Error creating category:', error);
        alert('Error creating category');
    }
}

function openSubcategoryModal() {
    const categoryId = document.getElementById('categorySelect').value;
    if (!categoryId) {
        alert('Please select a category first');
        return;
    }
    document.getElementById('subcategoryModal').classList.add('active');
}

// Open subcategory modal for a specific category (from category management)
function openSubcategoryModalForCategory(categoryId, categoryName) {
    // Store the category ID and name for use in saveSubcategory
    window.currentCategoryId = categoryId;
    window.currentCategoryName = categoryName;
    
    // Update modal title to show which category we're adding to
    document.querySelector('#subcategoryModal .modal-header h2').textContent = `Add Subcategory to ${categoryName}`;
    
    document.getElementById('subcategoryModal').classList.add('active');
}

function closeSubcategoryModal() {
    document.getElementById('subcategoryModal').classList.remove('active');
    document.getElementById('newSubcategoryName').value = '';
    
    // Reset modal title
    document.querySelector('#subcategoryModal .modal-header h2').textContent = 'Add New Subcategory';
    
    // Clear stored category information
    window.currentCategoryId = null;
    window.currentCategoryName = null;
    
    // Clear editing information
    window.editingSubcategoryId = null;
    window.editingSubcategoryName = null;
}

async function saveSubcategory() {
    const name = document.getElementById('newSubcategoryName').value;
    
    // Check if we're editing an existing subcategory
    if (window.editingSubcategoryId) {
        // Update existing subcategory
        try {
            const response = await fetch(`${API_BASE_URL}/admin/subcategories/${window.editingSubcategoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                closeSubcategoryModal();
                loadCategoriesManagement();
                loadCategories(); // Refresh product form categories
                alert('Subcategory updated successfully!');
            } else {
                alert('Failed to update subcategory');
            }
        } catch (error) {
            console.error('Error updating subcategory:', error);
            alert('Error updating subcategory');
        }
        return;
    }
    
    // Create new subcategory
    // Get category ID from either the product form or the category management section
    let categoryId = document.getElementById('categorySelect').value;
    
    // If no categoryId from product form, check if we're adding from category management
    if (!categoryId && window.currentCategoryId) {
        categoryId = window.currentCategoryId;
    }
    
    if (!name || !categoryId) {
        alert('Please enter a subcategory name and select a category');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/subcategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            closeSubcategoryModal();
            
            // Refresh the appropriate section based on where we came from
            if (window.currentCategoryId) {
                // We came from category management, refresh the categories grid
                loadCategoriesManagement();
                // Clear the stored category info
                window.currentCategoryId = null;
                window.currentCategoryName = null;
            } else {
                // We came from product form, refresh subcategories dropdown
                loadSubcategories(categoryId);
            }
            
            alert('Subcategory created successfully!');
        } else {
            alert('Failed to create subcategory');
        }
    } catch (error) {
        console.error('Error creating subcategory:', error);
        alert('Error creating subcategory');
    }
}

async function loadSubcategories(categoryId) {
    try {
        console.log('Loading subcategories for category:', categoryId);
        
        if (!categoryId) {
            console.log('No category ID provided, clearing subcategories');
            const subcategorySelect = document.getElementById('subcategorySelect');
            if (subcategorySelect) {
                subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
            }
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/subcategories`);
        console.log('Subcategories response status:', response.status);
        
        if (response.ok) {
            const subcategories = await response.json();
            console.log('Subcategories data received:', subcategories);
            console.log('Subcategories count:', subcategories.length);
            
            const subcategorySelect = document.getElementById('subcategorySelect');
            if (!subcategorySelect) {
                console.error('Subcategory select element not found!');
                return;
            }
            
            console.log('Subcategory select element found, populating...');
            subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
            
            if (subcategories.length === 0) {
                console.log('No subcategories found for this category');
                subcategorySelect.innerHTML = '<option value="">No subcategories available</option>';
                return;
            }
            
            subcategories.forEach(subcategory => {
                console.log('Adding subcategory option:', subcategory);
                subcategorySelect.innerHTML += `<option value="${subcategory.id}">${subcategory.name}</option>`;
            });
            
            console.log('Subcategories dropdown populated successfully');
        } else {
            console.error('Failed to load subcategories:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Error loading subcategories:', error);
    }
}

// Bulk product selection for categories
let bulkSelectedProducts = new Set();

// Load categories for management section
async function loadCategoriesManagement() {
    try {
        console.log('Loading categories for management...');
        const response = await fetch(`${API_BASE_URL}/categories`);
        console.log('Categories response status:', response.status);
        
        if (response.ok) {
            const categories = await response.json();
            console.log('Categories loaded:', categories);
            console.log('Categories count:', categories.length);
            
            if (categories.length === 0) {
                console.log('No categories found in database');
                // Show a message that no categories exist
                const grid = document.getElementById('categoriesGrid');
                if (grid) {
                    grid.innerHTML = `
                        <div class="no-categories">
                            <i class="fas fa-folder-open"></i>
                            <h3>No Categories Available</h3>
                            <p>Start by adding your first category!</p>
                            <button class="btn-primary" onclick="openCategoryModal()">
                                <i class="fas fa-plus"></i> Add Category
                            </button>
                        </div>
                    `;
                }
                return;
            }
            
            await renderCategoriesGrid(categories);
        } else {
            console.error('Failed to load categories:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    
    // Load categories and subcategories for bulk operations dropdowns
    await loadBulkCategoryOptions();
}

// Load categories and subcategories for bulk operations
async function loadBulkCategoryOptions() {
    try {
        // Load categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            const bulkTargetCategorySelector = document.getElementById('bulkTargetCategorySelector');
            const bulkTargetSubcategorySelector = document.getElementById('bulkTargetSubcategorySelector');
            const bulkCategoryFilter = document.getElementById('bulkCategoryFilter');
            
            if (bulkTargetCategorySelector && bulkTargetSubcategorySelector && bulkCategoryFilter) {
                // Clear existing options
                bulkTargetCategorySelector.innerHTML = '<option value="">Choose target category...</option>';
                bulkTargetSubcategorySelector.innerHTML = '<option value="">Choose target subcategory...</option>';
                bulkCategoryFilter.innerHTML = '<option value="">All Categories</option>';
                
                // Add categories
                categories.forEach(category => {
                    // Target selector uses category_ prefix for bulk operations
                    const option1 = document.createElement('option');
                    option1.value = `category_${category.id}`;
                    option1.textContent = `📁 ${category.name}`;
                    bulkTargetCategorySelector.appendChild(option1);
                    
                    // Filter dropdown uses just the ID for backend queries
                    const option2 = document.createElement('option');
                    option2.value = category.id;
                    option2.textContent = `📁 ${category.name}`;
                    bulkCategoryFilter.appendChild(option2);
                });
                
                // Load subcategories for each category
                for (const category of categories) {
                    try {
                        const subResponse = await fetch(`${API_BASE_URL}/categories/${category.id}/subcategories`);
                        if (subResponse.ok) {
                            const subcategories = await subResponse.json();
                            
                            subcategories.forEach(sub => {
                                const option = document.createElement('option');
                                option.value = `subcategory_${sub.id}`;
                                option.textContent = `📂 ${category.name} > ${sub.name}`;
                                bulkTargetSubcategorySelector.appendChild(option);
                            });
                        }
                    } catch (error) {
                        console.error('Error loading subcategories for category:', error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading bulk category options:', error);
    }
}

// Load all products for bulk operations
async function loadAllProductsForBulk() {
    try {
        document.getElementById('bulkProductsGrid').innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading all products...</div>';
        
        console.log('🔄 Loading all products for bulk operations...');
        
        // Use admin endpoint with high limit to get all products
        const response = await fetch(`${API_BASE_URL}/admin/products?limit=10000`);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const products = await response.json();
            console.log('📦 Products loaded:', products.length);
            console.log('📋 First few products:', products.slice(0, 3));
            
            // Store products globally for filtering
            window.bulkAllProducts = products;
            
            displayBulkProducts(products);
            showMessage(`Successfully loaded ${products.length} products for bulk operations`, 'success');
        } else {
            const errorText = await response.text();
            console.error('❌ Response not OK:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error loading all products:', error);
        document.getElementById('bulkProductsGrid').innerHTML = '<p>Error loading products. Please try again.</p>';
        showMessage('Error loading products. Please try again.', 'error');
    }
}

// Display bulk products in grid
function displayBulkProducts(products) {
    const grid = document.getElementById('bulkProductsGrid');
    
    console.log('🎨 Displaying products:', products.length);
    console.log('🎯 Grid element:', grid);
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    // Clear bulk selection
    bulkSelectedProducts.clear();
    updateBulkSelectionUI();
    
    const productHTML = products.map(product => `
        <div class="bulk-product-card" data-product-id="${product.id}" data-category="${product.category_id || ''}" data-subcategory="${product.subcategory_id || ''}">
            <input type="checkbox" 
                   value="${product.id}" 
                   onchange="toggleBulkProductSelection(${product.id})">
            <div class="bulk-product-image">
                                <img src="${product.image_url || product.images?.[0]?.image_url || 'uploads/images/placeholder.svg'}"
                     alt="${product.name}"
                     onerror="this.src='uploads/images/placeholder.svg'">
            </div>
            <div class="bulk-product-info">
                <h5>${product.name}</h5>
                <p>${product.description ? product.description.substring(0, 60) + '...' : 'No description'}</p>
                <div class="bulk-product-price">₹${parseFloat(product.price || 0).toLocaleString()}</div>
                <div class="bulk-product-category">
                    <small>Current: ${product.category_name || 'Uncategorized'}${product.subcategory_name ? ` > ${product.subcategory_name}` : ''}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('📝 Generated HTML length:', productHTML.length);
    grid.innerHTML = productHTML;
    console.log('✅ Products displayed in grid');
}

// Filter bulk products by search and category
function filterBulkProducts() {
    if (!window.bulkAllProducts) return;
    
    const searchTerm = document.getElementById('bulkProductSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('bulkCategoryFilter').value;
    
    let filteredProducts = window.bulkAllProducts.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !categoryFilter || product.category_id == categoryFilter.replace('category_', '');
        
        return matchesSearch && matchesCategory;
    });
    
    displayBulkProducts(filteredProducts);
}

// Toggle bulk product selection
function toggleBulkProductSelection(productId) {
    console.log('🔄 Toggling product selection:', productId);
    
    if (bulkSelectedProducts.has(productId)) {
        bulkSelectedProducts.delete(productId);
        console.log('❌ Removed product from selection');
    } else {
        bulkSelectedProducts.add(productId);
        console.log('✅ Added product to selection');
    }
    
    console.log('📊 Current selection size:', bulkSelectedProducts.size);
    updateBulkSelectionUI();
}

// Select all bulk products
function selectAllBulkProducts() {
    const checkboxes = document.querySelectorAll('#bulkProductsGrid input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        bulkSelectedProducts.add(parseInt(checkbox.value));
    });
    updateBulkSelectionUI();
}

// Deselect all bulk products
function deselectAllBulkProducts() {
    const checkboxes = document.querySelectorAll('#bulkProductsGrid input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    bulkSelectedProducts.clear();
    updateBulkSelectionUI();
}

// Update bulk selection UI
function updateBulkSelectionUI() {
    const selectedCount = document.getElementById('bulkSelectedCount');
    const bulkAddBtn = document.getElementById('bulkAddBtn');
    
    console.log('🔄 Updating bulk selection UI...');
    console.log('📊 Selected count element:', selectedCount);
    console.log('🔘 Bulk add button element:', bulkAddBtn);
    console.log('📦 Current selection size:', bulkSelectedProducts.size);
    
    if (selectedCount) {
        selectedCount.textContent = bulkSelectedProducts.size;
        console.log('✅ Updated selected count display');
    }
    
    if (bulkAddBtn) {
        const shouldDisable = bulkSelectedProducts.size === 0;
        bulkAddBtn.disabled = shouldDisable;
        console.log('🔘 Button disabled state:', shouldDisable);
    } else {
        console.log('❌ Bulk add button not found!');
    }
    
    // Update visual selection state
    document.querySelectorAll('#bulkProductsGrid .bulk-product-card').forEach(card => {
        const productId = parseInt(card.dataset.productId);
        if (bulkSelectedProducts.has(productId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    console.log('✅ Bulk selection UI updated');
}

// Add selected products to target category/subcategory
async function addSelectedProductsToCategory() {
    const targetCategorySelector = document.getElementById('bulkTargetCategorySelector');
    const targetSubcategorySelector = document.getElementById('bulkTargetSubcategorySelector');
    const targetCategoryValue = targetCategorySelector.value;
    const targetSubcategoryValue = targetSubcategorySelector.value;
    
    if (!targetCategoryValue && !targetSubcategoryValue) {
        showMessage('Please select a target category or subcategory.', 'error');
        return;
    }
    
    if (bulkSelectedProducts.size === 0) {
        showMessage('Please select at least one product to add.', 'error');
        return;
    }
    
            const confirmed = confirm(`Are you sure you want to add ${bulkSelectedProducts.size} product(s) to the selected target?\n\nThis will update the category/subcategory assignment for all selected products.`);
        
        if (!confirmed) return;
        
        try {
            const productIds = Array.from(bulkSelectedProducts);
            let targetCategoryId = null;
            let targetSubcategoryId = null;
            let successCount = 0;
            let errorCount = 0;
            
            if (targetCategoryValue) {
                targetCategoryId = targetCategoryValue.replace('category_', '');
            }
            
            if (targetSubcategoryValue) {
                targetSubcategoryId = targetSubcategoryValue.replace('subcategory_', '');
            }
            
            // Use the new bulk update endpoint
        try {
            console.log('🔄 Starting bulk category update...');
            console.log('📊 Target category ID:', targetCategoryId);
            console.log('📊 Target subcategory ID:', targetSubcategoryId);
            console.log('📦 Product IDs to update:', productIds);
            
            const bulkUpdateData = {
                productIds: productIds,
                categoryId: targetCategoryId,
                subcategoryId: targetSubcategoryId
            };
            
            console.log('📤 Sending bulk update data:', bulkUpdateData);
            
            const response = await fetch(`${API_BASE_URL}/admin/bulk-update-categories`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bulkUpdateData)
            });
            
            console.log('📡 Bulk update response:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                successCount = result.affectedRows || productIds.length;
                console.log(`✅ Bulk update successful: ${successCount} products updated`);
            } else {
                const errorText = await response.text();
                console.error('❌ Bulk update failed:', response.status, errorText);
                errorCount = productIds.length;
            }
        } catch (error) {
            console.error('❌ Error in bulk update:', error);
            errorCount = productIds.length;
        }
        
        // Show results
        if (successCount > 0) {
            showMessage(`Successfully added ${successCount} product(s) to the target category/subcategory.${errorCount > 0 ? ` ${errorCount} product(s) failed to update.` : ''}`, 'success');
            
            // Clear selection and refresh
            bulkSelectedProducts.clear();
            updateBulkSelectionUI();
            
            // Refresh the categories display
            loadCategoriesManagement();
            
            // Reload all products to show updated categories
            loadAllProductsForBulk();
        } else {
            showMessage(`Failed to add any products. ${errorCount} error(s) occurred.`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding products to category:', error);
        showMessage('Error adding products to category. Please try again.', 'error');
    }
}

// Render categories grid for management
async function renderCategoriesGrid(categories) {
    console.log('Rendering categories grid with:', categories);
    const grid = document.getElementById('categoriesGrid');
    if (!grid) {
        console.error('Categories grid element not found!');
        return;
    }
    
    console.log('Categories grid element found, clearing content...');
    grid.innerHTML = '';
    
    for (const category of categories) {
        console.log('Processing category:', category);
        // Fetch products for this category using the SAME endpoint as the filter (which works correctly)
        let products = [];
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products?category=${category.id}&limit=10000`);
            if (response.ok) {
                products = await response.json();
                console.log(`📊 Category ${category.name} has ${products.length} products (using admin endpoint)`);
            }
        } catch (error) {
            console.error('Error fetching products for category:', error);
        }
        
        // Fetch subcategories for this category
        let subcategories = [];
        try {
            const subResponse = await fetch(`${API_BASE_URL}/categories/${category.id}/subcategories`);
            if (subResponse.ok) {
                subcategories = await subResponse.json();
            }
        } catch (error) {
            console.error('Error fetching subcategories for category:', error);
        }
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-header">
                <h3>${category.name}</h3>
                <div class="category-actions">
                    <button class="btn-icon" onclick="editCategory(${category.id}, '${category.name}', '${category.description || ''}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteCategory(${category.id}, '${category.name}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="category-content">
                <p class="category-description">${category.description || 'No description'}</p>
                
                <!-- Products Section -->
                <div class="products-section">
                    <h4>Products (${products.length})</h4>
                    ${products.length > 0 ? 
                        `<div class="products-list">
                            ${products.map(product => `
                                <div class="product-item">
                                    <div class="product-info">
                                        <span class="product-name">${product.name}</span>
                                        <span class="product-price">₹${product.price}</span>
                                    </div>
                                    <div class="product-actions">
                                        <button class="btn-icon small" onclick="editProduct(${product.id})" title="Edit Product">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon small delete" onclick="removeProductFromCategory(${product.id}, ${category.id})" title="Remove from Category">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>` : 
                        '<p class="no-products">No products in this category</p>'
                    }
                </div>
                
                <!-- Subcategories Section -->
                <div class="subcategories-section">
                    <div class="subcategories-header">
                        <h4>Subcategories (${subcategories.length})</h4>
                        <button class="btn-secondary small" onclick="openSubcategoryModalForCategory(${category.id}, '${category.name}')" title="Add Subcategory">
                            <i class="fas fa-plus"></i> Add Subcategory
                        </button>
                    </div>
                    ${subcategories.length > 0 ? 
                        `<div class="subcategories-list">
                            ${subcategories.map(sub => `
                                <div class="subcategory-item">
                                    <span class="subcategory-name">${sub.name}</span>
                                    <div class="subcategory-actions">
                                        <button class="btn-icon small" onclick="editSubcategory(${sub.id}, '${sub.name}')" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon small delete" onclick="deleteSubcategory(${sub.id}, '${sub.name}')" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>` : 
                        '<p class="no-subcategories">No subcategories</p>'
                    }
                </div>
            </div>
        `;
        grid.appendChild(categoryCard);
    }
}

// Edit category
function editCategory(id, name, description) {
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('newCategoryName').value = name;
    document.getElementById('newCategoryDescription').value = description;
    document.getElementById('saveCategoryBtn').textContent = 'Update Category';
    document.getElementById('saveCategoryBtn').onclick = () => updateCategory(id);
    document.getElementById('categoryModal').classList.add('active');
}

// Update category
async function updateCategory(id) {
    const name = document.getElementById('newCategoryName').value;
    const description = document.getElementById('newCategoryDescription').value;
    
    if (!name) {
        alert('Category name is required');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });

        if (response.ok) {
            closeCategoryModal();
            loadCategoriesManagement();
            loadCategories(); // Refresh product form categories
            refreshIndexPage(); // Refresh index.html category menu
            alert('Category updated successfully!');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to update category');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        alert('Error updating category');
    }
}

// Delete category
async function deleteCategory(id, name) {
    console.log('🗑️ Delete category called:', { id, name });
    
    if (!confirm(`Are you sure you want to delete the category "${name}"? This will also delete all its subcategories.`)) {
        console.log('❌ User cancelled deletion');
        return;
    }

    try {
        console.log('📤 Sending delete request to:', `${API_BASE_URL}/admin/categories/${id}`);
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
            method: 'DELETE'
        });

        console.log('📡 Delete response status:', response.status);
        console.log('📡 Delete response ok:', response.ok);

        if (response.ok) {
            console.log('✅ Delete successful, refreshing UI...');
            loadCategoriesManagement();
            loadCategories(); // Refresh product form categories
            refreshIndexPage(); // Refresh index.html category menu
            alert('Category deleted successfully! The Collections dropdown on index.html will be updated. If index.html is open in another tab, please refresh it to see the changes immediately.');
        } else {
            console.log('❌ Delete failed, parsing error...');
            const errorText = await response.text();
            console.log('📄 Error response text:', errorText);
            
            let error;
            try {
                error = JSON.parse(errorText);
            } catch (e) {
                error = { error: errorText };
            }
            console.log('📋 Parsed error:', error);
            alert(error.error || 'Failed to delete category');
        }
    } catch (error) {
        console.error('💥 Exception during delete:', error);
        alert('Error deleting category: ' + error.message);
    }
}

// Edit subcategory
function editSubcategory(id, name) {
    // Store the subcategory info for editing
    window.editingSubcategoryId = id;
    window.editingSubcategoryName = name;
    
    // Update modal title and populate form
    document.querySelector('#subcategoryModal .modal-header h2').textContent = 'Edit Subcategory';
    document.getElementById('newSubcategoryName').value = name;
    
    document.getElementById('subcategoryModal').classList.add('active');
}

// Delete subcategory
async function deleteSubcategory(id, name) {
    if (!confirm(`Are you sure you want to delete the subcategory "${name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/subcategories/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCategoriesManagement();
            loadSubcategories(document.getElementById('categorySelect').value);
            refreshIndexPage(); // Refresh index.html category menu
            alert('Subcategory deleted successfully! The Collections dropdown on index.html will be updated. If index.html is open in another tab, please refresh it to see the changes immediately.');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to delete subcategory');
        }
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        alert('Error deleting subcategory');
    }
}

// Function to refresh index.html page category menu
function refreshIndexPage() {
    // Set a flag in localStorage to notify index.html to refresh
    localStorage.setItem('refreshCategories', Date.now().toString());
    
    // Try to refresh the index.html page if it's open
    try {
        // Check if index.html is open in another tab/window
        if (window.opener && !window.opener.closed) {
            // If admin is opened from index.html, refresh the opener
            if (window.opener.refreshCategoryMenu) {
                window.opener.refreshCategoryMenu();
            }
        }
        
        // Also try to refresh any iframe that might contain index.html
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentWindow && iframe.contentWindow.refreshCategoryMenu) {
                    iframe.contentWindow.refreshCategoryMenu();
                }
            } catch (e) {
                // Cross-origin error, ignore
            }
        });
        
        // Try to refresh all open windows/tabs with index.html
        if (window.parent && window.parent !== window) {
            try {
                if (window.parent.refreshCategoryMenu) {
                    window.parent.refreshCategoryMenu();
                }
            } catch (e) {
                // Cross-origin error, ignore
            }
        }
        
        // Show success message with instructions
        console.log('Category updated! If index.html is open in another tab, please refresh it to see the changes.');
        
    } catch (e) {
        console.log('Could not refresh index.html automatically. Please refresh the page manually.');
    }
}

// Category change event
document.getElementById('categorySelect').addEventListener('change', function() {
    const categoryId = this.value;
    if (categoryId) {
        loadSubcategories(categoryId);
    } else {
        document.getElementById('subcategorySelect').innerHTML = '<option value="">Select Subcategory</option>';
    }
});

// Enhanced Product Save Function
async function saveProduct() {
    try {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        // Get form values
        const productData = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            compare_at_price: formData.get('compare_at_price') ? parseFloat(formData.get('compare_at_price')) : null,
            description: formData.get('description'),
            product_type: formData.get('product_type'),
            vendor: formData.get('vendor'),
            sku: formData.get('sku'),
            inventory: parseInt(formData.get('inventory')),
            status: formData.get('status'),
            collections: formData.get('collections'),
            tags: formData.get('tags'),
            seo_title: formData.get('seo_title'),
            seo_meta_description: formData.get('seo_meta_description'),
            seo_url_handle: formData.get('seo_url_handle'),
            category_id: parseInt(formData.get('category_id')),
            subcategory_id: formData.get('subcategory_id') ? parseInt(formData.get('subcategory_id')) : null
        };

        let result;
        if (currentProductId) {
            // Update existing product
            result = await fetch(`${API_BASE_URL}/admin/products/${currentProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Create new product
            result = await fetch(`${API_BASE_URL}/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        if (!result.ok) {
            throw new Error('Failed to save product');
        }

        const savedProduct = await result.json();
        const productId = currentProductId || savedProduct.id;

        // If editing and we have original data, preserve existing media first
        // BUT continue with product updates to allow variant/field changes
        if (currentProductId && window.originalProductData) {
            console.log('Editing mode detected, checking if media preservation is needed...');
            console.log('Original product data:', window.originalProductData);
            
            const hasMedia = (window.originalProductData.images && window.originalProductData.images.length > 0) || 
                           (window.originalProductData.videos && window.originalProductData.videos.length > 0);
            
            console.log('Has media check result:', hasMedia);
            console.log('Images count:', window.originalProductData.images ? window.originalProductData.images.length : 0);
            console.log('Videos count:', window.originalProductData.videos ? window.originalProductData.videos.length : 0);
            
            if (hasMedia) {
                console.log('Product has media, preserving existing media...');
                await preserveExistingMedia(productId);
                console.log('Media preservation completed, but continuing with product updates for variants/other fields');
                
                // LOCK the original data to prevent overwriting
                window.mediaDataLocked = true;
                console.log('Media data locked to prevent overwriting');
                
            } else {
                console.log('Product has no media, proceeding with normal flow');
            }
        } else {
            console.log('New product mode, proceeding with normal flow');
            console.log('currentProductId:', currentProductId);
            console.log('originalProductData exists:', !!window.originalProductData);
        }
        
        // Handle media uploads for new products or when no preservation needed
        // For existing products, this will only process NEW media uploads (if any)
        console.log('Before handleProductMediaUploads - originalProductData:', window.originalProductData);
        await handleProductMediaUploads(productId);
        console.log('After handleProductMediaUploads - originalProductData:', window.originalProductData);
        
        // After media uploads, store the current media state for future edits
        // This ensures that even newly created products can preserve their media
        // BUT don't overwrite existing original data for products being edited
        if (!currentProductId || !window.originalProductData) {
            const currentMediaState = await getCurrentProductMedia(productId);
            if (currentMediaState) {
                window.originalProductData = currentMediaState;
                console.log('Stored current media state for future edits:', currentMediaState);
            }
        } else if (window.mediaDataLocked) {
            console.log('Media data is locked, preserving existing original data:', window.originalProductData);
        } else {
            console.log('Product is being edited, preserving existing original data:', window.originalProductData);
        }

        // Clear form and close modal
        if (currentProductId) {
            // If editing, just close the modal but don't clear the form
            // This preserves the data for potential further edits
            closeProductModal();
            currentProductId = null;
            
            // Unlock media data after editing is complete
            if (window.mediaDataLocked) {
                window.mediaDataLocked = false;
                console.log('Media data unlocked after editing complete');
            }
        } else {
            // If creating new product, clear the form
            clearProductForm();
            closeProductModal();
        }

        // Handle product sizes and inventory distribution
        console.log('🚀 About to call handleProductSizesAndInventory with:', { productId, inventory: productData.inventory });
        await handleProductSizesAndInventory(productId, productData.inventory);
        console.log('✅ handleProductSizesAndInventory completed');
        
        // Show success message
        showMessage('Product saved successfully!', 'success');

        // Small delay to ensure database is fully updated after media preservation
        console.log('Waiting for database to update...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the products list to show new media with pagination
        if (currentProductId) {
            // If editing, update the product in allProducts array
            const productIndex = allProducts.findIndex(p => p.id === currentProductId);
            if (productIndex !== -1) {
                // Update the product data
                allProducts[productIndex] = { ...allProducts[productIndex], ...productData };
            }
        } else {
            // If creating new product, add to allProducts array
            allProducts.unshift(savedProduct);
        }
        
        // Refresh current page with pagination
        refreshCurrentPage();
        
        // Update dashboard stats
        document.getElementById('total-products').textContent = allProducts.length;
        
        // Force refresh on user side by calling the refresh endpoint
        try {
            await fetch(`${API_BASE_URL}/products/refresh`, { method: 'POST' });
            console.log('Products cache cleared for users');
        } catch (error) {
            console.warn('Could not clear products cache:', error);
        }

    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product: ' + error.message);
    }
}

async function handleProductMediaUploads(productId) {
    try {
        console.log('Handling media uploads for product:', productId);
        
        let mediaUploaded = false;
        
        // Handle image files
        const imageFiles = document.getElementById('imageFiles').files;
        if (imageFiles.length > 0) {
            console.log('Uploading', imageFiles.length, 'image files...');
            const imageFormData = new FormData();
            Array.from(imageFiles).forEach(file => {
                imageFormData.append('images', file);
            });
            
            const imageResponse = await fetch(`${API_BASE_URL}/products/${productId}/upload-images`, {
                method: 'POST',
                body: imageFormData
            });
            
            if (imageResponse.ok) {
                const imageResult = await imageResponse.json();
                console.log('Images uploaded successfully:', imageResult.files);
                showMessage(`${imageFiles.length} images uploaded successfully!`, 'success');
                mediaUploaded = true;
            } else {
                const errorText = await imageResponse.text();
                console.error('Failed to upload images:', errorText);
                showMessage('Failed to upload images: ' + errorText, 'error');
                throw new Error('Image upload failed: ' + errorText);
            }
        }

        // Handle video files
        const videoFiles = document.getElementById('videoFiles').files;
        if (videoFiles.length > 0) {
            console.log('Uploading', videoFiles.length, 'video files...');
            const videoFormData = new FormData();
            Array.from(videoFiles).forEach(file => {
                videoFormData.append('videos', file);
            });
            
            const videoResponse = await fetch(`${API_BASE_URL}/products/${productId}/upload-videos`, {
                method: 'POST',
                body: videoFormData
            });
            
            if (videoResponse.ok) {
                const videoResult = await videoResponse.json();
                console.log('Videos uploaded successfully:', videoResult.files);
                showMessage(`${videoFiles.length} videos uploaded successfully!`, 'success');
                mediaUploaded = true;
            } else {
                const errorText = await videoResponse.text();
                console.error('Failed to upload videos:', errorText);
                showMessage('Failed to upload videos: ' + errorText, 'error');
                throw new Error('Video upload failed: ' + errorText);
            }
        }

        // Handle sizes - include all size systems (UK, EUR, Numeric, Custom)
        const sizeCheckboxes = Array.from(document.querySelectorAll('.size-checkbox input:checked')).map(input => input.value);
        const customSizes = Array.from(document.querySelectorAll('#sizeInputs input')).map(input => input.value).filter(Boolean);
        const allSizes = [...sizeCheckboxes, ...customSizes];
        
        if (allSizes.length > 0) {
            console.log('Saving all sizes:', allSizes);
            console.log('Size checkboxes selected:', sizeCheckboxes);
            console.log('Custom sizes entered:', customSizes);
            
            const sizeResponse = await fetch(`${API_BASE_URL}/products/${productId}/sizes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sizes: allSizes })
            });
            
            if (sizeResponse.ok) {
                console.log('Sizes saved successfully');
            } else {
                const errorText = await sizeResponse.text();
                console.error('Failed to save sizes:', errorText);
                showMessage('Failed to save sizes: ' + errorText, 'error');
            }
        } else {
            console.log('No sizes selected or entered');
        }
        
        console.log('Media uploads completed for product:', productId);
        
        // Clear file inputs after successful upload
        clearFileInputs();
        
        // If media was uploaded, trigger immediate refresh
        if (mediaUploaded) {
            // Small delay to ensure database is updated
            setTimeout(async () => {
                // Refresh current page with pagination
                refreshCurrentPage();
            }, 100);
        }
        
        // If we're editing and media was preserved, don't clear the form yet
        // The form will be cleared after the product save is complete
        
    } catch (error) {
        console.error('Error handling media uploads:', error);
        showMessage('Error handling media uploads: ' + error.message, 'error');
        throw error;
    }
}

// Clear file inputs after successful upload
function clearFileInputs() {
    document.getElementById('imageFiles').value = '';
    document.getElementById('videoFiles').value = '';
    clearMediaPreviews();
}

// Preserve existing media when editing a product
async function preserveExistingMedia(productId) {
    try {
        console.log('Preserving existing media for product:', productId);
        
        // Use the stored original product data instead of form inputs
        const originalData = window.originalProductData || { images: [], videos: [] };
        console.log('Original media data:', originalData);
        
        if (!window.originalProductData) {
            console.warn('No original product data found, media may be lost!');
            return;
        }
        
        // Only preserve if there's actually media to preserve
        if ((!originalData.images || originalData.images.length === 0) && 
            (!originalData.videos || originalData.videos.length === 0)) {
            console.log('No media to preserve, skipping media preservation');
            return;
        }
        
        // Preserve existing images
        if (originalData.images && originalData.images.length > 0) {
            console.log('Preserving existing images:', originalData.images);
            
            // Ensure images have the correct format
            const formattedImages = originalData.images.map((img, index) => ({
                image_url: img.image_url || img.url || '',
                file_path: img.file_path || null,
                position: img.position || index + 1
            }));
            
            console.log('Formatted images for backend:', formattedImages);
            console.log('Sending to backend endpoint:', `${API_BASE_URL}/products/${productId}/images`);
            
            const imageResponse = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: formattedImages })
            });
            
            if (imageResponse.ok) {
                const result = await imageResponse.json();
                console.log('Images preservation result:', result);
                console.log('Full response:', result);
            } else {
                const errorText = await imageResponse.text();
                console.error('Failed to preserve existing images:', errorText);
            }
        }
        
        // Preserve existing videos
        if (originalData.videos && originalData.videos.length > 0) {
            console.log('Preserving existing videos:', originalData.videos);
            
            // Ensure videos have the correct format
            const formattedVideos = originalData.videos.map((vid, index) => ({
                video_url: vid.video_url || vid.url || '',
                file_path: vid.file_path || null,
                position: vid.position || index + 1
            }));
            
            console.log('Formatted videos for backend:', formattedVideos);
            
            const videoResponse = await fetch(`${API_BASE_URL}/products/${productId}/videos`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos: formattedVideos })
            });
            
            if (videoResponse.ok) {
                const result = await videoResponse.json();
                console.log('Videos preservation result:', result.message);
            } else {
                console.error('Failed to preserve existing videos');
            }
        }
        
        console.log('Existing media preserved for product:', productId);
        
    } catch (error) {
        console.error('Error preserving existing media:', error);
        // Don't throw error here as it would prevent the product from being saved
        showMessage('Warning: Could not preserve all existing media', 'warning');
    }
}

// Get current product media state from database
async function getCurrentProductMedia(productId) {
    try {
        console.log('Fetching current media state for product:', productId);
        
        // If we're editing a product and already have original data, don't overwrite it
        if (currentProductId && window.originalProductData) {
            console.log('Product is being edited, returning existing original data instead of fetching');
            console.log('Returning preserved data:', window.originalProductData);
            return window.originalProductData;
        }
        
        // If media data is locked, don't fetch new data
        if (window.mediaDataLocked) {
            console.log('Media data is locked, returning null to prevent overwriting');
            return null;
        }
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
            console.error('Failed to fetch product for media state');
            return null;
        }
        
        const product = await response.json();
        const mediaState = {
            images: product.images || [],
            videos: product.videos || []
        };
        
        console.log('Current media state fetched:', mediaState);
        return mediaState;
        
    } catch (error) {
        console.error('Error fetching current media state:', error);
        return null;
    }
}

// Product Management Functions
async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const product = await response.json();
        
        currentProductId = productId;
        
        // Store the original product data globally to preserve media
        // Only set if we don't already have it or if it's different
        const newOriginalData = {
            images: product.images || [],
            videos: product.videos || []
        };
        
        // If media data is locked, don't overwrite it
        if (window.mediaDataLocked) {
            console.log('Media data is locked, preserving existing data:', window.originalProductData);
        }
        // If we already have original data for this product, preserve it
        else if (window.originalProductData && 
            window.originalProductData.images && 
            window.originalProductData.images.length > 0) {
            console.log('Original product data already exists with media, preserving it:', window.originalProductData);
        } else if (!window.originalProductData || 
            JSON.stringify(window.originalProductData) !== JSON.stringify(newOriginalData)) {
            window.originalProductData = newOriginalData;
            console.log('Updated original product data for media preservation:', window.originalProductData);
        } else {
            console.log('Original product data unchanged, keeping existing data');
        }
        
        document.getElementById('modal-title').textContent = 'Edit Product';
        
        // Fill form with product data
        const form = document.getElementById('productForm');
        form.querySelector('[name="name"]').value = product.name;
        form.querySelector('[name="price"]').value = product.price;
        form.querySelector('[name="compare_at_price"]').value = product.compare_at_price || '';
        form.querySelector('[name="description"]').value = product.description || '';
        form.querySelector('[name="product_type"]').value = product.product_type || '';
        form.querySelector('[name="vendor"]').value = product.vendor || '';
        form.querySelector('[name="sku"]').value = product.sku || '';
        form.querySelector('[name="inventory"]').value = product.inventory || 0;
        form.querySelector('[name="status"]').value = product.status || 'active';
        form.querySelector('[name="collections"]').value = product.collections || '';
        form.querySelector('[name="tags"]').value = product.tags || '';
        form.querySelector('[name="seo_title"]').value = product.seo_title || '';
        form.querySelector('[name="seo_meta_description"]').value = product.seo_meta_description || '';
        form.querySelector('[name="seo_url_handle"]').value = product.seo_url_handle || '';
        
        // Load categories and set selected
        await loadCategories();
        if (product.category_id) {
            form.querySelector('[name="category_id"]').value = product.category_id;
            await loadSubcategories(product.category_id);
            if (product.subcategory_id) {
                form.querySelector('[name="subcategory_id"]').value = product.subcategory_id;
            }
        }
        
        // Load existing images
        if (product.images && product.images.length > 0) {
            const imageUrlInputs = document.getElementById('imageUrlInputs');
            imageUrlInputs.innerHTML = ''; // Clear existing inputs
            
            product.images.forEach((image, index) => {
                if (index === 0) {
                    // Use the first input that already exists
                    const firstInput = imageUrlInputs.querySelector('input[type="url"]');
                    if (firstInput) {
                        firstInput.value = image.image_url;
                    }
                } else {
                    // Add new input for additional images
                    const newGroup = document.createElement('div');
                    newGroup.className = 'url-input-group';
                    newGroup.innerHTML = `
                        <input type="url" placeholder="Image URL" class="form-control" value="${image.image_url}">
                        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">
                            <i class="fas fa-minus"></i>
                        </button>
                    `;
                    imageUrlInputs.appendChild(newGroup);
                }
            });
        }
        
        // Load existing videos
        if (product.videos && product.videos.length > 0) {
            const videoUrlInputs = document.getElementById('videoUrlInputs');
            videoUrlInputs.innerHTML = ''; // Clear existing inputs
            
            product.videos.forEach((video, index) => {
                if (index === 0) {
                    // Use the first input that already exists
                    const firstInput = videoUrlInputs.querySelector('input[type="url"]');
                    if (firstInput) {
                        firstInput.value = video.video_url;
                    }
                } else {
                    // Add new input for additional videos
                    const newGroup = document.createElement('div');
                    newGroup.className = 'url-input-group';
                    newGroup.innerHTML = `
                        <input type="url" placeholder="Video URL" class="form-control" value="${video.video_url}">
                        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">
                            <i class="fas fa-minus"></i>
                        </button>
                    `;
                    videoUrlInputs.appendChild(newGroup);
                }
            });
        }
        
        // Load existing sizes
        await loadProductSizes(productId);
        
        document.getElementById('productModal').classList.add('active');
        switchTab('basic');
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Error loading product');
    }
}

// Remove product from category (not delete the product entirely)
async function removeProductFromCategory(productId, categoryId) {
    if (!confirm('Are you sure you want to remove this product from this category?\n\nNote: The product will not be deleted, just removed from this category.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/remove-from-category`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categoryId: categoryId })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Refresh the categories to show updated product counts
            await loadCategoriesManagement();
            
            showNotification('Product removed from category successfully!', 'success');
        } else {
            const error = await response.text();
            showError(`Failed to remove product from category: ${error}`);
        }
    } catch (error) {
        console.error('Error removing product from category:', error);
        showError('Error removing product from category. Please try again.');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product PERMANENTLY?\n\nThis will completely remove the product from your store.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove product from allProducts array
            allProducts = allProducts.filter(p => p.id !== productId);
            
            // Refresh current page with pagination
            refreshCurrentPage();
            
            // Update dashboard stats
            document.getElementById('total-products').textContent = allProducts.length;
            
            alert('Product deleted successfully!');
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }
}

// Order Management Functions - using the proper implementation below

// Placeholder function removed - using the proper implementation above

function viewCustomerDetails(customerId) {
    console.log('🔄 admin.js viewCustomerDetails called, redirecting to enhanced version');
    // Call the enhanced version from admin.html
    if (window.viewCustomerDetails && window.viewCustomerDetails !== viewCustomerDetails) {
        window.viewCustomerDetails(customerId);
    } else {
        // Fallback to enhanced implementation
        console.log('🔍 Opening customer details for ID:', customerId);
        
        fetch(`http://31.97.239.99/users/${customerId}`)
            .then(response => response.json())
            .then(customer => {
                // Fetch orders
                return fetch(`http://31.97.239.99/users/${customerId}/orders`)
                    .then(ordersResponse => ordersResponse.ok ? ordersResponse.json() : [])
                    .then(orders => ({ customer, orders }));
            })
            .then(({ customer, orders }) => {
                const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
                
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 800px;">
                        <div class="modal-header">
                            <h3>👤 Customer Details - ${customer.username}</h3>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                                <div><strong>ID:</strong> #${customer.id}</div>
                                <div><strong>Username:</strong> ${customer.username}</div>
                                <div><strong>Email:</strong> ${customer.email}</div>
                                <div><strong>Phone:</strong> ${customer.phone || 'Not provided'}</div>
                                <div><strong>Address:</strong> ${customer.address || 'Not provided'}</div>
                                <div><strong>Joined:</strong> ${new Date(customer.created_at).toLocaleDateString()}</div>
                                <div><strong>Total Orders:</strong> ${orders.length}</div>
                                <div><strong>Total Spent:</strong> ₹${totalSpent.toFixed(2)}</div>
                            </div>
                            
                            ${orders.length > 0 ? `
                                <h4 style="margin-top: 24px;">Recent Orders</h4>
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${orders.slice(0, 5).map(order => `
                                        <div style="border: 1px solid #ddd; padding: 12px; margin-bottom: 8px; border-radius: 4px;">
                                            <strong>Order #${order.id}</strong> - ${new Date(order.created_at).toLocaleDateString()}<br>
                                            Status: <span style="background: #e3f2fd; padding: 2px 6px; border-radius: 3px;">${order.status}</span>
                                            Amount: <strong>₹${parseFloat(order.total || 0).toFixed(2)}</strong>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="margin-top: 16px; color: #666;">No orders found</p>'}
                        </div>
                        <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end; padding: 16px; border-top: 1px solid #eee;">
                            <button onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 16px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: pointer;">Close</button>
                            <button onclick="window.open('mailto:${customer.email}', '_blank')" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Email Customer</button>
                        </div>
                    </div>
                `;
                
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) modal.remove();
                });
                
                document.body.appendChild(modal);
            })
            .catch(error => {
                console.error('Error loading customer details:', error);
                alert('Failed to load customer details: ' + error.message);
            });
    }
}

// Show the appropriate size system tab
function showSizeSystem(system) {
    console.log('Showing size system:', system);
    
    // Hide all size options first
    document.querySelectorAll('.size-options').forEach(option => {
        option.style.display = 'none';
    });
    
    // Show the selected size system
    if (system === 'us' || system === 'eu' || system === 'uk') {
        document.getElementById('shoeSizes').style.display = 'block';
        
        // Hide all size system divs
        document.querySelectorAll('.size-system').forEach(sys => {
            sys.style.display = 'none';
        });
        
        // Show the selected system
        document.getElementById(system + 'Sizes').style.display = 'block';
        
        // Update tab buttons
        document.querySelectorAll('.size-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-size-system="${system}"]`).classList.add('active');
        
    } else if (system === 'numeric') {
        document.getElementById('numericSizes').style.display = 'block';
    } else if (system === 'custom') {
        document.getElementById('customSizes').style.display = 'block';
    }
}





// Test categories loading function
async function testCategoriesLoading() {
    try {
        console.log('=== TESTING CATEGORIES LOADING ===');
        
        // Test 1: Check if categoriesGrid element exists
        const grid = document.getElementById('categoriesGrid');
        console.log('Categories grid element exists:', !!grid);
        
        // Test 2: Test the categories endpoint directly
        console.log('Testing categories endpoint...');
        const response = await fetch(`${API_BASE_URL}/categories`);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const categories = await response.json();
            console.log('Categories data received:', categories);
            console.log('Categories count:', categories.length);
            console.log('Categories structure:', JSON.stringify(categories, null, 2));
            
            // Test 3: Try to render the categories
            if (categories.length > 0) {
                console.log('Attempting to render categories...');
                await renderCategoriesGrid(categories);
                console.log('Categories rendering completed');
            } else {
                console.log('No categories found in database');
                grid.innerHTML = '<p>No categories found in database</p>';
            }
        } else {
            const errorText = await response.text();
            console.error('Categories endpoint failed:', errorText);
            grid.innerHTML = `<p>Error loading categories: ${response.status} ${response.statusText}</p>`;
        }
        
        console.log('=== CATEGORIES TESTING COMPLETED ===');
        
    } catch (error) {
        console.error('Error testing categories loading:', error);
        const grid = document.getElementById('categoriesGrid');
        if (grid) {
            grid.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
}

// Load product sizes for editing
async function loadProductSizes(productId) {
    try {
        console.log('Loading sizes for product:', productId);
        const response = await fetch(`${API_BASE_URL}/products/${productId}/sizes`);
        
        if (response.ok) {
            const sizes = await response.json();
            console.log('Product sizes loaded:', sizes);
            
            // Clear all existing size selections
            document.querySelectorAll('.size-checkbox input').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Clear custom size inputs
            const customSizeInputs = document.getElementById('sizeInputs');
            if (customSizeInputs) {
                customSizeInputs.innerHTML = `
                    <div class="custom-size-group">
                        <input type="text" placeholder="Custom size (e.g., One Size, Small, Large)" class="form-control">
                        <button type="button" class="btn-secondary" onclick="addCustomSizeInput()">
                            <i class="fas fa-plus"></i> Add More
                        </button>
                    </div>
                `;
            } else {
                console.warn('Size inputs container not found, skipping size input clearing');
            }
            
            // Check the appropriate size checkboxes based on loaded sizes
            sizes.forEach(sizeRecord => {
                const sizeValue = sizeRecord.size;
                console.log('Processing size:', sizeValue);
                
                // Try to find and check the corresponding checkbox
                const checkbox = document.querySelector(`.size-checkbox input[value="${sizeValue}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log('Checked checkbox for size:', sizeValue);
                    
                    // Show the appropriate size system tab based on the size value
                    if (sizeValue.startsWith('US-')) {
                        showSizeSystem('us');
                    } else if (sizeValue.startsWith('EU-')) {
                        showSizeSystem('eu');
                    } else if (sizeValue.startsWith('UK-')) {
                        showSizeSystem('uk');
                    } else if (sizeValue.match(/^\d+$/)) {
                        showSizeSystem('numeric');
                    }
                } else {
                    // If no checkbox found, it might be a custom size
                    console.log('Size not found in checkboxes, treating as custom:', sizeValue);
                    addCustomSizeInput(sizeValue);
                    showSizeSystem('custom');
                }
            });
            
            // Show selected sizes display if any sizes are loaded
            if (sizes.length > 0) {
                updateSelectedSizesDisplay();
            }
            
        } else {
            console.log('No sizes found for product or error loading sizes');
        }
    } catch (error) {
        console.error('Error loading product sizes:', error);
    }
}

// Product Modal Functions
function openAddProductModal() {
    currentProductId = null;
    // Clear stored original product data
    window.originalProductData = null;
    
    document.getElementById('modal-title').textContent = 'Add New Product';
    
    // Clear the form completely for new product
    clearProductForm();
    
    // Load categories for the dropdown with a small delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Delayed categories loading...');
        console.log('About to call loadCategories()...');
        loadCategories();
    }, 100);
    
    document.getElementById('productModal').classList.add('active');
    switchTab('basic');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    
    // Clear stored original product data when closing
    window.originalProductData = null;
    currentProductId = null;
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// File Upload Functions
function setupFileUploads() {
    // Image file upload
    document.getElementById('imageFiles').addEventListener('change', function(e) {
        handleFileUpload(e.target.files, 'image');
    });

    // Video file upload
    document.getElementById('videoFiles').addEventListener('change', function(e) {
        handleFileUpload(e.target.files, 'video');
    });
}

function handleFileUpload(files, type) {
    const previewContainer = document.getElementById(`${type}Preview`);
    const maxFiles = type === 'image' ? 10 : 5;
    
    if (files.length > maxFiles) {
        showMessage(`Maximum ${maxFiles} ${type} files allowed`, 'error');
        return;
    }
    
    // Clear existing previews
    previewContainer.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        // Validate file type
        if (type === 'image' && !file.type.startsWith('image/')) {
            showMessage(`File ${file.name} is not a valid image`, 'error');
            return;
        }
        
        if (type === 'video' && !file.type.startsWith('video/')) {
            showMessage(`File ${file.name} is not a valid video`, 'error');
            return;
        }
        
        // Validate file size (5MB for images, 50MB for videos)
        const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showMessage(`File ${file.name} is too large. Max size: ${type === 'image' ? '5MB' : '50MB'}`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            
            if (type === 'image') {
                mediaItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
                    <div class="file-info">${file.name}</div>
                `;
            } else {
                mediaItem.innerHTML = `
                    <video src="${e.target.result}" controls></video>
                    <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
                    <div class="file-info">${file.name}</div>
                `;
            }
            
            previewContainer.appendChild(mediaItem);
        };
        
        reader.onerror = function() {
            showMessage(`Error reading file ${file.name}`, 'error');
        };
        
        reader.readAsDataURL(file);
    });
    
    if (files.length > 0) {
        showMessage(`${files.length} ${type} file(s) selected`, 'success');
    }
}

function clearMediaPreviews() {
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
}

// URL Input Functions
function addImageUrlInput() {
    const container = document.getElementById('imageUrlInputs');
    const newGroup = document.createElement('div');
    newGroup.className = 'url-input-group';
    newGroup.innerHTML = `
        <input type="url" placeholder="Image URL" class="form-control">
        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newGroup);
}

function addVideoUrlInput() {
    const container = document.getElementById('videoUrlInputs');
    const newGroup = document.createElement('div');
    newGroup.className = 'url-input-group';
    newGroup.innerHTML = `
        <input type="url" placeholder="Video URL" class="form-control">
        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newGroup);
}

// Size Input Functions
function addSizeInput() {
    const container = document.getElementById('sizeInputs');
    const newGroup = document.createElement('div');
    newGroup.className = 'size-input-group';
    newGroup.innerHTML = `
        <input type="text" placeholder="Size (e.g., S, M, L, XL)" class="form-control">
        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newGroup);
}

// Dynamic Size System Functions
function updateSizeOptions() {
    const sizeType = document.getElementById('sizeTypeSelect').value;
    
    // Hide all size options
    document.querySelectorAll('.size-options').forEach(option => {
        option.style.display = 'none';
    });
    
    // Show selected size type
    if (sizeType === 'clothing') {
        document.getElementById('clothingSizes').style.display = 'block';
    } else if (sizeType === 'shoes') {
        document.getElementById('shoeSizes').style.display = 'block';
    } else if (sizeType === 'numeric') {
        document.getElementById('numericSizes').style.display = 'block';
    } else if (sizeType === 'custom') {
        document.getElementById('customSizes').style.display = 'block';
    }
    
    // Clear previous selections
    clearSizeSelections();
    updateSelectedSizesDisplay();
}

function clearSizeSelections() {
    // Clear all checkboxes
    document.querySelectorAll('.size-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear custom size inputs
    const customInputs = document.getElementById('customSizeInputs');
    customInputs.innerHTML = `
        <div class="custom-size-group">
            <input type="text" placeholder="Custom size (e.g., One Size, Small, Large)" class="form-control">
            <button type="button" class="btn-secondary" onclick="addCustomSizeInput()">
                <i class="fas fa-plus"></i> Add More
            </button>
        </div>
    `;
}

// Shoe Size Tab Functions
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for shoe size tabs
    document.querySelectorAll('.size-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sizeSystem = this.getAttribute('data-size-system');
            switchShoeSizeSystem(sizeSystem);
        });
    });
    
    // Add event listeners for size checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('.size-checkbox')) {
            updateSelectedSizesDisplay();
        }
    });
});

function switchShoeSizeSystem(system) {
    // Update tab buttons
    document.querySelectorAll('.size-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-size-system="${system}"]`).classList.add('active');
    
    // Show selected size system
    document.querySelectorAll('.size-system').forEach(sys => {
        sys.style.display = 'none';
    });
    document.getElementById(system + 'Sizes').style.display = 'block';
    
    // Clear checkboxes in other systems
    document.querySelectorAll('.size-system').forEach(sys => {
        if (sys.id !== system + 'Sizes') {
            sys.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    });
    
    updateSelectedSizesDisplay();
}

// Custom Size Functions
function addCustomSizeInput() {
    const container = document.getElementById('customSizeInputs');
    const newGroup = document.createElement('div');
    newGroup.className = 'custom-size-group';
    newGroup.innerHTML = `
        <input type="text" placeholder="Custom size (e.g., One Size, Small, Large)" class="form-control">
        <button type="button" class="btn-secondary" onclick="this.parentElement.remove(); updateSelectedSizesDisplay();">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newGroup);
}

// Selected Sizes Display Functions
function updateSelectedSizesDisplay() {
    const selectedSizes = getSelectedSizes();
    const displayContainer = document.getElementById('selectedSizesDisplay');
    const listContainer = document.getElementById('selectedSizesList');
    
    if (selectedSizes.length > 0) {
        displayContainer.style.display = 'block';
        listContainer.innerHTML = selectedSizes.map(size => `
            <span class="selected-size-tag">
                ${size}
                <button class="remove-size" onclick="removeSize('${size}')">×</button>
            </span>
        `).join('');
    } else {
        displayContainer.style.display = 'none';
    }
}

function getSelectedSizes() {
    const sizes = [];
    
    // Get checked checkboxes
    document.querySelectorAll('.size-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
        sizes.push(checkbox.value);
    });
    
    // Get custom size inputs
    document.querySelectorAll('#customSizeInputs input').forEach(input => {
        if (input.value.trim()) {
            sizes.push(input.value.trim());
        }
    });
    
    return sizes;
}

function removeSize(sizeToRemove) {
    // Remove from checkboxes
    document.querySelectorAll('.size-checkbox input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.value === sizeToRemove) {
            checkbox.checked = false;
        }
    });
    
    // Remove from custom inputs
    document.querySelectorAll('#customSizeInputs input').forEach(input => {
        if (input.value.trim() === sizeToRemove) {
            input.value = '';
        }
    });
    
    updateSelectedSizesDisplay();
}

// ========== HERO SLIDES MANAGEMENT ==========

let currentEditingSlideId = null;

// Load hero slides
async function loadHeroSlides() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/hero-slides`);
        if (!response.ok) {
            throw new Error('Failed to fetch hero slides');
        }
        
        const slides = await response.json();
        displayHeroSlides(slides);
    } catch (error) {
        console.error('Error loading hero slides:', error);
        showMessage('Error loading hero slides', 'error');
    }
}

// Display hero slides in grid
function displayHeroSlides(slides) {
    const slidesGrid = document.getElementById('slides-grid');
    
    if (!slides || slides.length === 0) {
        slidesGrid.innerHTML = '<div class="no-slides">No hero slides found. Create your first slide to get started!</div>';
        return;
    }
    
    slidesGrid.innerHTML = slides.map(slide => `
        <div class="slide-card">
            <div class="slide-media">
                ${slide.media_type === 'video' ? 
                    `<video src="${slide.media_url}" muted></video>` :
                    `<img src="${slide.media_url}" alt="${slide.title}">`
                }
                <span class="media-type-badge">${slide.media_type}</span>
            </div>
            <div class="slide-content">
                <h3 class="slide-title">${slide.title}</h3>
                ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
                ${slide.description ? `<p class="slide-description">${slide.description}</p>` : ''}
                
                <div class="slide-buttons">
                    ${slide.button1_text ? `<span class="slide-button">${slide.button1_text}</span>` : ''}
                    ${slide.button2_text ? `<span class="slide-button">${slide.button2_text}</span>` : ''}
                </div>
                
                <div class="slide-meta">
                    <span class="slide-position">Position: ${slide.position}</span>
                    <div class="slide-status">
                        <span class="status-badge ${slide.is_active ? 'active' : 'inactive'}">
                            ${slide.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                
                <div class="slide-actions">
                    <button class="btn btn-secondary" onclick="editHeroSlide(${slide.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteHeroSlide(${slide.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Open hero slide modal
function openHeroSlideModal(slideId = null) {
    const modal = document.getElementById('heroSlideModal');
    const modalTitle = document.getElementById('hero-slide-modal-title');
    
    if (slideId) {
        // Edit mode
        modalTitle.textContent = 'Edit Hero Slide';
        loadHeroSlideData(slideId);
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Hero Slide';
        resetHeroSlideForm();
    }
    
    modal.style.display = 'block';
}

// Close hero slide modal
function closeHeroSlideModal() {
    const modal = document.getElementById('heroSlideModal');
    modal.style.display = 'none';
}

// Reset hero slide form
function resetHeroSlideForm() {
    document.getElementById('heroSlideForm').reset();
    document.getElementById('mediaPreview').innerHTML = '';
    document.getElementById('slidePosition').value = '0';
    document.getElementById('slideActive').checked = true;
}

// Load hero slide data for editing
async function loadHeroSlideData(slideId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/hero-slides/${slideId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch slide data');
        }
        
        const slide = await response.json();
        
        // Populate form fields
        document.getElementById('slideTitle').value = slide.title;
        document.getElementById('slideSubtitle').value = slide.subtitle || '';
        document.getElementById('slideDescription').value = slide.description || '';
        document.getElementById('mediaType').value = slide.media_type;
        document.getElementById('slidePosition').value = slide.position;
        document.getElementById('button1Text').value = slide.button1_text || '';
        document.getElementById('button1Url').value = slide.button1_url || '';
        document.getElementById('button2Text').value = slide.button2_text || '';
        document.getElementById('button2Url').value = slide.button2_url || '';
        document.getElementById('slideActive').checked = slide.is_active;
        
        // Show media preview
        showMediaPreview(slide.media_url, slide.media_type);
        
    } catch (error) {
        console.error('Error loading slide data:', error);
        showMessage('Error loading slide data', 'error');
    }
}

// Save hero slide
async function saveHeroSlide() {
    try {
        // Get form values
        const slideData = {
            title: document.getElementById('slideTitle').value,
            subtitle: document.getElementById('slideSubtitle').value,
            description: document.getElementById('slideDescription').value,
            media_type: document.getElementById('mediaType').value,
            button1_text: document.getElementById('button1Text').value,
            button1_url: document.getElementById('button1Url').value,
            button2_text: document.getElementById('button2Text').value,
            button2_url: document.getElementById('button2Url').value,
            position: parseInt(document.getElementById('slidePosition').value) || 0,
            is_active: document.getElementById('slideActive').checked
        };
        
        // Validate required fields
        if (!slideData.title) {
            showMessage('Title is required', 'error');
            return;
        }
        
        // Handle file upload if a new file is selected
        const mediaFile = document.getElementById('mediaFile').files[0];
        if (mediaFile) {
            // Upload the file first
            const formData = new FormData();
            formData.append('media', mediaFile);
            formData.append('media_type', slideData.media_type);
            
            const uploadResponse = await fetch(`${API_BASE_URL}/admin/hero-slides/upload-media`, {
                method: 'POST',
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload media file');
            }
            
            const uploadResult = await uploadResponse.json();
            slideData.media_url = uploadResult.media_url;
            console.log('Media uploaded successfully:', uploadResult);
        } else {
            // Use existing media URL if no new file
            const existingUrl = document.getElementById('mediaPreview').dataset.url;
            if (!existingUrl) {
                showMessage('Media is required', 'error');
                return;
            }
            slideData.media_url = existingUrl;
        }
        
        let slideId = null;
        
        // Check if we're editing an existing slide
        const modalTitle = document.getElementById('hero-slide-modal-title').textContent;
        if (modalTitle.includes('Edit')) {
            slideId = currentEditingSlideId;
        }
        
        if (slideId) {
            // Update existing slide
            await updateHeroSlide(slideId, slideData);
        } else {
            // Create new slide
            await createHeroSlide(slideData);
        }
        
        closeHeroSlideModal();
        loadHeroSlides(); // Refresh the list
        
    } catch (error) {
        console.error('Error saving hero slide:', error);
        showMessage('Error saving hero slide: ' + error.message, 'error');
    }
}

// Create new hero slide
async function createHeroSlide(slideData) {
    const response = await fetch(`${API_BASE_URL}/admin/hero-slides`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(slideData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to create hero slide');
    }
    
    showMessage('Hero slide created successfully', 'success');
}

// Update hero slide
async function updateHeroSlide(slideId, slideData) {
    const response = await fetch(`${API_BASE_URL}/admin/hero-slides/${slideId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(slideData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to update hero slide');
    }
    
    showMessage('Hero slide updated successfully', 'success');
}

// Delete hero slide
async function deleteHeroSlide(slideId) {
    if (!confirm('Are you sure you want to delete this hero slide?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/hero-slides/${slideId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete hero slide');
        }
        
        showMessage('Hero slide deleted successfully', 'success');
        loadHeroSlides(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        showMessage('Error deleting hero slide', 'error');
    }
}

// Toggle media upload section
function toggleMediaUpload() {
    const mediaType = document.getElementById('mediaType').value;
    const mediaLabel = document.getElementById('mediaLabel');
    const mediaFile = document.getElementById('mediaFile');
    
    if (mediaType === 'video') {
        mediaLabel.textContent = 'Upload Video';
        mediaFile.accept = 'video/*';
    } else {
        mediaLabel.textContent = 'Upload Image';
        mediaFile.accept = 'image/*';
    }
}

// Show media preview
function showMediaPreview(file, mediaType) {
    const preview = document.getElementById('mediaPreview');
    
    if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (mediaType === 'video') {
                preview.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; max-height: 200px;"></video>`;
            } else {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
            }
        };
        reader.readAsDataURL(file);
    } else if (typeof file === 'string') {
        // URL string
        if (mediaType === 'video') {
            preview.innerHTML = `<video src="${file}" controls style="max-width: 100%; max-height: 200px;"></video>`;
        } else {
            preview.innerHTML = `<img src="${file}" style="max-width: 100%; max-height: 200px;">`;
        }
        preview.dataset.url = file;
    }
}

// Handle file upload
function handleFileUpload() {
    const fileInput = document.getElementById('mediaFile');
    const mediaType = document.getElementById('mediaType').value;
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showMediaPreview(file, mediaType);
        }
    });
}

// Edit hero slide
function editHeroSlide(slideId) {
    currentEditingSlideId = slideId;
    openHeroSlideModal(slideId);
}

// Initialize hero slides functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize file upload handler
    handleFileUpload();
    
    // Add click event to file upload area
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', function() {
            document.getElementById('mediaFile').click();
        });
    }
});

// Limited Edition Drops Functions
function loadLimitedDrops() {
    // Prevent multiple simultaneous calls
    if (window.adminLimitedDropsLoading) {
        console.log('⚠️ Admin limited drops already loading, skipping...');
        return;
    }
    
    window.adminLimitedDropsLoading = true;
    
    fetch(`${API_BASE_URL}/limited-drops`)
        .then(response => response.json())
        .then(data => {
            displayLimitedDrops(data);
            populateDropSelector(data);
        })
        .catch(error => {
            console.error('Error loading limited drops:', error);
            showMessage('Error loading limited drops', 'error');
        })
        .finally(() => {
            window.adminLimitedDropsLoading = false;
        });
}

function displayLimitedDrops(drops) {
    const dropsGrid = document.getElementById('drops-grid');
    
    if (!drops || drops.length === 0) {
        dropsGrid.innerHTML = '<div class="no-drops">No limited edition drops found</div>';
        return;
    }
    
    dropsGrid.innerHTML = drops.map(drop => `
        <div class="drop-card">
            <div class="drop-card-header">
                <h4 class="drop-card-title">${drop.title}</h4>
                <span class="drop-status ${drop.is_active ? 'active' : 'inactive'}">
                    ${drop.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="drop-dates">
                <div class="drop-date">
                    <span class="drop-date-label">Start:</span>
                    <span class="drop-date-value">${formatDateTime(drop.start_date)}</span>
                </div>
                <div class="drop-date">
                    <span class="drop-date-label">End:</span>
                    <span class="drop-date-value">${formatDateTime(drop.end_date)}</span>
                </div>
            </div>
            <div class="drop-actions">
                <button class="btn-secondary" onclick="editLimitedDrop(${drop.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-secondary" onclick="deleteLimitedDrop(${drop.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function populateDropSelector(drops) {
    const dropSelector = document.getElementById('dropSelector');
    dropSelector.innerHTML = '<option value="">Choose a drop...</option>';
    
    drops.forEach(drop => {
        const option = document.createElement('option');
        option.value = drop.id;
        option.textContent = drop.title;
        dropSelector.appendChild(option);
    });
}

function loadDropProducts() {
    const dropId = document.getElementById('dropSelector').value;
    if (!dropId) {
        document.getElementById('drop-products-list').innerHTML = '<div class="no-products">Please select a drop first</div>';
        return;
    }
    
    fetch(`${API_BASE_URL}/limited-drops/${dropId}/products`)
        .then(response => response.json())
        .then(data => {
            displayDropProducts(data);
        })
        .catch(error => {
            console.error('Error loading drop products:', error);
            showMessage('Error loading drop products', 'error');
        });
}

function displayDropProducts(products) {
    const container = document.getElementById('drop-products-list');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-products">No products in this drop</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="drop-product-item">
            <div class="drop-product-info">
                <div class="drop-product-image">
                                    <img src="${product.image_url || product.images?.[0]?.image_url || 'uploads/images/placeholder.svg'}" alt="${product.name}"
                     onerror="this.src='uploads/images/placeholder.svg'">
                </div>
                <div class="drop-product-details">
                    <h4>${product.name}</h4>
                    <p class="product-price">₹${parseFloat(product.price).toLocaleString()}</p>
                    <small class="product-category">ID: ${product.id}</small>
                </div>
            </div>
            <div class="drop-product-actions">
                <button class="btn-secondary" onclick="removeProductFromDrop(${product.id})">
                    <i class="fas fa-minus"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

function loadProductsForSelector() {
    const productGrid = document.getElementById('productGrid');
    const selectedCount = document.getElementById('selected-count');
    const addProductsBtn = document.getElementById('addProductsBtn');
    
    if (!productGrid) return;
    
    // Show loading state
    productGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading products...</div>';
    selectedCount.textContent = '0 products selected';
    addProductsBtn.disabled = true;
    
    // Load categories first
    loadCategories();
    
    // Use admin endpoint with high limit to get all products
    fetch(`${API_BASE_URL}/admin/products?limit=10000`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                productGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No products available</div>';
                return;
            }
            
            // Store products globally for filtering
            window.allProducts = data;
            
            // Display products in grid
            displayProductsInGrid(data);
            
            // Setup product selection events
            setupProductGridEvents();
            
            console.log(`Loaded ${data.length} products for selection`);
            showMessage('Successfully loaded ' + data.length + ' products', 'success');
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showMessage('Error loading products', 'error');
            
            productGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Error loading products</div>';
        });
}

// Load categories for filtering
function loadCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const subcategoryFilter = document.getElementById('subcategoryFilter');
    const mainCategoryFilter = document.getElementById('mainCategoryFilter');
    const mainSubcategoryFilter = document.getElementById('mainSubcategoryFilter');
    
    // Skip if neither set of filters exists
    if ((!categoryFilter || !subcategoryFilter) && (!mainCategoryFilter || !mainSubcategoryFilter)) return;
    
    // Load categories
    fetch(`${API_BASE_URL}/categories`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(categories => {
            // Populate regular category filter (for limited drops)
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilter.appendChild(option);
                });
            }
            
            // Populate category filter dropdown (for categories section)
            const categoryFilterDropdown = document.getElementById('categoryFilterDropdown');
            if (categoryFilterDropdown) {
                console.log('🔧 Populating category filter dropdown with', categories.length, 'categories');
                categoryFilterDropdown.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilterDropdown.appendChild(option);
                    console.log(`✅ Added category: ${category.name} (ID: ${category.id})`);
                });
            } else {
                console.log('❌ categoryFilterDropdown element not found');
            }
            
            // Add event listeners after dropdowns are populated
            setupProductFilterEventListeners();
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            // Disable category filtering if categories can't be loaded
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">Categories unavailable</option>';
                categoryFilter.disabled = true;
            }
            const categoryFilterDropdown = document.getElementById('categoryFilterDropdown');
            if (categoryFilterDropdown) {
                categoryFilterDropdown.innerHTML = '<option value="">Categories unavailable</option>';
                categoryFilterDropdown.disabled = true;
            }
        });
    
    // Initialize subcategory filters
    if (subcategoryFilter) {
        subcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
    }
    const subcategoryFilterDropdown = document.getElementById('subcategoryFilterDropdown');
    if (subcategoryFilterDropdown) {
        subcategoryFilterDropdown.innerHTML = '<option value="">All Subcategories</option>';
    }
}

// Setup event listeners for product filters
function setupProductFilterEventListeners() {
    const categoryFilter = document.getElementById('categoryFilter');
    const subcategoryFilter = document.getElementById('subcategoryFilter');
    const mainCategoryFilter = document.getElementById('mainCategoryFilter');
    const mainSubcategoryFilter = document.getElementById('mainSubcategoryFilter');
    
    // Limited drops filters
    if (categoryFilter) {
        categoryFilter.removeEventListener('change', onCategoryChange);
        categoryFilter.addEventListener('change', onCategoryChange);
    }
    
    if (subcategoryFilter) {
        subcategoryFilter.removeEventListener('change', onSubcategoryChange);
        subcategoryFilter.addEventListener('change', onSubcategoryChange);
    }
    
    // Note: Category section filter event listeners removed as the filter elements were removed
}

// Handle subcategory change  
function onSubcategoryChange() {
    // Reload products from server with new filter
    loadProducts();
}

// Handle main category change (for main products section)
function onMainCategoryChange() {
    const mainCategoryFilter = document.getElementById('mainCategoryFilter');
    const mainSubcategoryFilter = document.getElementById('mainSubcategoryFilter');
    
    if (mainCategoryFilter && mainSubcategoryFilter) {
        const selectedCategoryId = mainCategoryFilter.value;
        
        if (selectedCategoryId) {
            // Load subcategories for the selected category
            loadSubcategoriesForMainCategory(selectedCategoryId);
        } else {
            // Reset subcategory filter
            mainSubcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
        }
        
        // Reload products from server with new filter
        loadProducts();
    }
}

// Handle main subcategory change (for main products section)
function onMainSubcategoryChange() {
    // Reload products from server with new filter
    loadProducts();
}

// Load subcategories for main category filter
function loadSubcategoriesForMainCategory(categoryId) {
    const mainSubcategoryFilter = document.getElementById('mainSubcategoryFilter');
    if (!mainSubcategoryFilter) return;
    
    fetch(`${API_BASE_URL}/categories/${categoryId}/subcategories`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(subcategories => {
            mainSubcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
            subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory.id;
                option.textContent = subcategory.name;
                mainSubcategoryFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading subcategories:', error);
            mainSubcategoryFilter.innerHTML = '<option value="">Subcategories unavailable</option>';
            mainSubcategoryFilter.disabled = true;
        });
}

// Note: onCategoryFilterChange and onSubcategoryFilterChange functions removed 
// as the filter dropdowns were removed from the UI

// Note: loadSubcategoriesForCategoryFilter function removed as the 
// subcategory filter dropdown was removed from the UI

// Load products for bulk operations (renamed from category filtering)
async function loadCategoryProducts() {
    const bulkProductsGrid = document.getElementById('bulkProductsGrid');
    if (!bulkProductsGrid) {
        console.log('❌ bulkProductsGrid not found');
        return;
    }
    
    try {
        // Show loading in bulk grid
        bulkProductsGrid.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';
        
        // No need to clear cache - endpoints are now cache-free
        
        // Build URL with filters from bulk category filter and cache busting
        let url = `${API_BASE_URL}/admin/products?limit=10000`;
        
        // Use bulk category filter instead of removed filter dropdown
        const bulkCategoryFilter = document.getElementById('bulkCategoryFilter');
        if (bulkCategoryFilter && bulkCategoryFilter.value) {
            url += `&category=${bulkCategoryFilter.value}`;
            console.log(`🔍 Selected bulk category: ${bulkCategoryFilter.value}`);
        }
        
        console.log(`🔍 Loading products for bulk operations with URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        
        if (products.length === 0) {
            bulkProductsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-box-open"></i><br><br>No products found for the selected filters.</div>';
            return;
        }
        
        // Update the bulk products grid with filtered results
        bulkProductsGrid.innerHTML = products.map(product => `
            <div class="bulk-product-card" data-product-id="${product.id}" data-category="${product.category_id || ''}" data-subcategory="${product.subcategory_id || ''}">
                <input type="checkbox" value="${product.id}" onchange="toggleBulkProductSelection(${product.id})">
                <div class="bulk-product-image">
                    <img src="${product.image_url || 'uploads/images/placeholder.svg'}" alt="${product.name}" onerror="this.src='uploads/images/placeholder.svg'">
                </div>
                <div class="bulk-product-info">
                    <h4>${product.name}</h4>
                    <p class="category-info">Category: <strong>${product.category_name || 'Unknown'}</strong></p>
                    <p class="subcategory-info">Subcategory: <strong>${product.subcategory_name || 'None'}</strong></p>
                    <p class="price">₹${product.price}</p>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Updated bulk products grid with ${products.length} filtered products`);
        
    } catch (error) {
        console.error('Error loading products for bulk operations:', error);
        bulkProductsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Error loading products. Please try again.</div>';
    }
}

// Attach to window object for global access immediately
window.loadCategoryProducts = loadCategoryProducts;

// Verify function is properly attached
console.log('✅ loadCategoryProducts function attached to window object:', typeof window.loadCategoryProducts);

// Make sure function is available immediately when script loads
if (typeof window.loadCategoryProducts === 'undefined') {
    console.error('❌ loadCategoryProducts not properly attached to window!');
} else {
    console.log('✅ loadCategoryProducts is ready for HTML onclick handlers');
}

// Additional verification when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM loaded - checking loadCategoryProducts function availability');
    console.log('📋 loadCategoryProducts type:', typeof window.loadCategoryProducts);
    console.log('📋 loadCategoryProducts function:', window.loadCategoryProducts);
});

// Note: filterCategoryProducts function removed as the filter section was removed

// Remove this fallback - the main function should be available

// Load subcategories for a specific category
function loadSubcategoriesForCategory(categoryId) {
    const subcategoryFilter = document.getElementById('subcategoryFilter');
    if (!subcategoryFilter) return;
    
    fetch(`${API_BASE_URL}/categories/${categoryId}/subcategories`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(subcategories => {
            subcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
            subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory.id;
                option.textContent = subcategory.name;
                subcategoryFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading subcategories:', error);
            subcategoryFilter.innerHTML = '<option value="">Subcategories unavailable</option>';
            subcategoryFilter.disabled = true;
        });
}

// Display products in grid format
function displayProductsInGrid(products) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => {
        // Prioritize actual product images over placeholder
        let imageUrl = null;
        
        // First try to get image from product_images table
        if (product.images && product.images.length > 0 && product.images[0]?.image_url) {
            imageUrl = product.images[0].image_url;
        }
        // Then try product.image_url as fallback
        else if (product.image_url && product.image_url !== 'null' && product.image_url !== 'undefined' && product.image_url.trim() !== '') {
            imageUrl = product.image_url;
        }
        // Only use placeholder if no actual images exist
        else {
            imageUrl = 'uploads/images/placeholder.svg';
        }
        const categoryName = product.category_name || 'Uncategorized';
        const subcategoryName = product.subcategory_name || '';
        
        return `
            <div class="product-card-selector" data-product-id="${product.id}" onclick="toggleProductSelection(${product.id})">
                <img src="${imageUrl}" alt="${product.name}" class="product-image-selector" 
                                                  onerror="this.src='uploads/images/placeholder.svg'">
                <div class="product-name-selector">${product.name}</div>
                <div class="product-price-selector">₹${parseFloat(product.price).toLocaleString()}</div>
                <div class="product-category-selector">
                    ${categoryName}${subcategoryName ? ` > ${subcategoryName}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle product selection
function toggleProductSelection(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;
    
    if (productCard.classList.contains('selected')) {
        productCard.classList.remove('selected');
        removeProductFromSelection(productId);
    } else {
        productCard.classList.add('selected');
        addProductToSelection(productId);
    }
    
    updateSelectedCount();
    updateAddButtonState();
}

// Add product to selection
function addProductToSelection(productId) {
    if (!window.selectedProducts) window.selectedProducts = new Set();
    window.selectedProducts.add(productId);
}

// Remove product from selection
function removeProductFromSelection(productId) {
    if (!window.selectedProducts) window.selectedProducts.delete(productId);
}

// Update selected count display
function updateSelectedCount() {
    const selectedCount = document.getElementById('selected-count');
    if (selectedCount) {
        const count = window.selectedProducts ? window.selectedProducts.size : 0;
        selectedCount.textContent = `${count} product${count !== 1 ? 's' : ''} selected`;
    }
}

// Update add button state
function updateAddButtonState() {
    const addBtn = document.getElementById('addProductsBtn');
    if (addBtn) {
        const hasSelection = window.selectedProducts && window.selectedProducts.size > 0;
        addBtn.disabled = !hasSelection;
    }
}

// Filter products based on search and category
function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const subcategoryFilter = document.getElementById('subcategoryFilter').value;
    
    if (!window.allProducts) return;
    
    let filteredProducts = window.allProducts.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !categoryFilter || product.category_id == categoryFilter;
        
        // Subcategory filter
        const matchesSubcategory = !subcategoryFilter || product.subcategory_id == subcategoryFilter;
        
        return matchesSearch && matchesCategory && matchesSubcategory;
    });
    
    // Display filtered products
    displayProductsInGrid(filteredProducts);
    
    // Re-setup events for new elements
    setupProductGridEvents();
    
    // Clear selection when filtering
    if (window.selectedProducts) {
        window.selectedProducts.clear();
        updateSelectedCount();
        updateAddButtonState();
        
        // Remove selected styling from all cards
        document.querySelectorAll('.product-card-selector').forEach(card => {
            card.classList.remove('selected');
        });
    }
}

// Setup product grid events
function setupProductGridEvents() {
    // Events are handled by onclick in the HTML
    // This function can be used for additional event setup if needed
}

// Handle category change
function onCategoryChange() {
    const categoryFilter = document.getElementById('categoryFilter');
    const subcategoryFilter = document.getElementById('subcategoryFilter');
    
    if (categoryFilter && subcategoryFilter) {
        const selectedCategoryId = categoryFilter.value;
        
        if (selectedCategoryId) {
            // Load subcategories for the selected category
            loadSubcategoriesForCategory(selectedCategoryId);
        } else {
            // Reset subcategory filter
            subcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
        }
        
        // Reload products from server with new filter
        loadProducts();
    }
}

function addProductsToDrop() {
    const dropId = document.getElementById('dropSelector').value;
    
    if (!dropId) {
        showMessage('Please select a drop first', 'error');
        return;
    }
    
    if (!window.selectedProducts || window.selectedProducts.size === 0) {
        showMessage('Please select products to add', 'error');
        return;
    }
    
    const selectedProducts = Array.from(window.selectedProducts);
    
    // Show loading state
    const addBtn = document.getElementById('addProductsBtn');
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    addBtn.disabled = true;
    
    fetch(`${API_BASE_URL}/limited-drops/${dropId}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_ids: selectedProducts })
    })
    .then(response => response.json())
    .then(data => {
        // Get product names from the global products array
        const productNames = window.allProducts
            .filter(product => selectedProducts.includes(parseInt(product.id)))
            .map(product => product.name)
            .join(', ');
            
        showMessage(`Successfully added ${selectedProducts.length} product(s) to drop: ${productNames}`, 'success');
        
        // Refresh the drop products list
        loadDropProducts();
        
        // Clear selection and reset UI
        window.selectedProducts.clear();
        updateSelectedCount();
        updateAddButtonState();
        
        // Remove selected styling from all cards
        document.querySelectorAll('.product-card-selector').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Reset button text
        addBtn.innerHTML = originalText;
    })
    .catch(error => {
        console.error('Error adding products to drop:', error);
        showMessage('Error adding products to drop', 'error');
        
        // Reset button state
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
    });
}

function removeProductFromDrop(productId) {
    const dropId = document.getElementById('dropSelector').value;
    
    fetch(`${API_BASE_URL}/limited-drops/${dropId}/products/${productId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        showMessage('Product removed from drop successfully', 'success');
        loadDropProducts();
    })
    .catch(error => {
        console.error('Error removing product from drop:', error);
        showMessage('Error removing product from drop', 'error');
    });
}

function openLimitedDropModal() {
    document.getElementById('limitedDropModal').style.display = 'block';
    document.getElementById('limitedDropModalTitle').textContent = 'Create New Limited Edition Drop';
    
    // Set default dates (start now, end in 7 days)
    const now = new Date();
    const endDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    document.getElementById('dropStartDate').value = now.toISOString().slice(0, 16);
    document.getElementById('dropEndDate').value = endDate.toISOString().slice(0, 16);
}

function closeLimitedDropModal() {
    document.getElementById('limitedDropModal').style.display = 'none';
    const form = document.getElementById('limitedDropForm');
    if (form) {
        form.reset();
    }
}

function saveLimitedDrop() {
    const formData = {
        title: document.getElementById('dropTitle').value,
        description: document.getElementById('dropDescription').value,
        start_date: document.getElementById('dropStartDate').value,
        end_date: document.getElementById('dropEndDate').value,
        is_active: document.getElementById('dropStatus').value === '1'
    };
    
    if (!formData.title || !formData.start_date || !formData.end_date) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    fetch(`${API_BASE_URL}/limited-drops`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        showMessage('Limited edition drop created successfully', 'success');
        closeLimitedDropModal();
        loadLimitedDrops();
    })
    .catch(error => {
        console.error('Error creating limited edition drop:', error);
        showMessage('Error creating limited edition drop', 'error');
    });
}

function editLimitedDrop(dropId) {
    // Load drop data and open modal for editing
    fetch(`${API_BASE_URL}/limited-drops/${dropId}`)
        .then(response => response.json())
        .then(drop => {
            document.getElementById('limitedDropModal').style.display = 'block';
            document.getElementById('limitedDropModalTitle').textContent = 'Edit Limited Edition Drop';
            
            document.getElementById('dropTitle').value = drop.title;
            document.getElementById('dropDescription').value = drop.description || '';
            document.getElementById('dropStartDate').value = drop.start_date.slice(0, 16);
            document.getElementById('dropEndDate').value = drop.end_date.slice(0, 16);
            document.getElementById('dropStatus').value = drop.is_active ? '1' : '0';
            
            // Change save button to update
            const saveBtn = document.querySelector('#limitedDropModal .btn-primary');
            saveBtn.textContent = 'Update Drop';
            saveBtn.onclick = () => updateLimitedDrop(dropId);
        })
        .catch(error => {
            console.error('Error loading drop data:', error);
            showMessage('Error loading drop data', 'error');
        });
}

function updateLimitedDrop(dropId) {
    const formData = {
        title: document.getElementById('dropTitle').value,
        description: document.getElementById('dropDescription').value,
        start_date: document.getElementById('dropStartDate').value,
        end_date: document.getElementById('dropEndDate').value,
        is_active: document.getElementById('dropStatus').value === '1'
    };
    
    fetch(`${API_BASE_URL}/limited-drops/${dropId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        showMessage('Limited edition drop updated successfully', 'success');
        closeLimitedDropModal();
        loadLimitedDrops();
        
        // Reset save button
        const saveBtn = document.querySelector('#limitedDropModal .btn-primary');
        saveBtn.textContent = 'Create Drop';
        saveBtn.onclick = saveLimitedDrop;
    })
    .catch(error => {
        console.error('Error updating limited edition drop:', error);
        showMessage('Error updating limited edition drop', 'error');
    });
}

function deleteLimitedDrop(dropId) {
    if (confirm('Are you sure you want to delete this limited edition drop?')) {
        fetch(`${API_BASE_URL}/limited-drops/${dropId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            showMessage('Limited edition drop deleted successfully', 'success');
            loadLimitedDrops();
        })
        .catch(error => {
            console.error('Error deleting limited edition drop:', error);
            showMessage('Error deleting limited edition drop', 'error');
        });
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize Limited Drops section: load drops and populate product selector
function initLimitedDropsSection() {
        loadLimitedDrops();
        loadProductsForSelector();
}

// Handle product sizes and inventory distribution
async function handleProductSizesAndInventory(productId, totalInventory) {
    try {
        console.log('🔄 Handling product sizes and inventory distribution...');
        
        // Get selected sizes from the form
        const selectedSizes = getSelectedSizes();
        console.log('Selected sizes:', selectedSizes);
        
        if (selectedSizes.length === 0) {
            console.log('⚠️ No sizes selected, skipping size creation');
            return;
        }
        
        // Set inventory for each size (not distributed)
        console.log(`📊 Setting ${totalInventory} inventory for EACH of ${selectedSizes.length} sizes`);
        console.log(`📦 Each size will have: ${totalInventory} inventory`);
        
        // Create size objects with full inventory for each
        const sizesWithInventory = selectedSizes.map((size) => {
            return {
                size: size,
                inventory: totalInventory
            };
        });
        
        console.log('📋 Sizes with inventory:', sizesWithInventory);
        
        // Call backend to create/update product sizes
        const response = await fetch(`${API_BASE_URL}/products/${productId}/sizes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sizes: selectedSizes })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create product sizes: ${response.statusText}`);
        }
        
        const sizeResult = await response.json();
        console.log('✅ Product sizes created:', sizeResult);
        
        // Now update each size with its distributed inventory
        for (const sizeData of sizesWithInventory) {
            const inventoryResponse = await fetch(`${API_BASE_URL}/products/${productId}/sizes/${encodeURIComponent(sizeData.size)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inventory: sizeData.inventory })
            });
            
            if (!inventoryResponse.ok) {
                console.warn(`⚠️ Failed to update inventory for size ${sizeData.size}:`, inventoryResponse.statusText);
            } else {
                console.log(`✅ Updated inventory for size ${sizeData.size}: ${sizeData.inventory}`);
            }
        }
        
        console.log('🎉 Product sizes and inventory distribution completed!');
        
    } catch (error) {
        console.error('❌ Error handling product sizes and inventory:', error);
        showMessage('Warning: Product saved but sizes/inventory may not be set correctly', 'warning');
    }
}

// Load existing product sizes when editing
async function loadProductSizes(productId) {
    try {
        console.log('🔄 Loading existing product sizes for product:', productId);
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const product = await response.json();
        
        if (!product.sizes || product.sizes.length === 0) {
            console.log('⚠️ No existing sizes found for product');
            return;
        }
        
        console.log('📋 Existing sizes found:', product.sizes);
        
        // Clear previous selections
        clearSizeSelections();
        
        // Check the appropriate size checkboxes based on existing sizes
        product.sizes.forEach(sizeData => {
            const checkbox = document.querySelector(`input[type="checkbox"][value="${sizeData.size}"]`);
            if (checkbox) {
                checkbox.checked = true;
                console.log(`✅ Checked size: ${sizeData.size}`);
            } else {
                console.log(`⚠️ Checkbox not found for size: ${sizeData.size}`);
            }
        });
        
        // Update the selected sizes display
        updateSelectedSizesDisplay();
        
        // Show inventory information for each size
        displaySizeInventory(product.sizes);
        
        console.log('✅ Product sizes loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading product sizes:', error);
    }
}

// Display current inventory for each size
function displaySizeInventory(sizes) {
    try {
        console.log('📊 Displaying size inventory:', sizes);
        
        // Find or create inventory display container
        let inventoryContainer = document.getElementById('size-inventory-display');
        if (!inventoryContainer) {
            inventoryContainer = document.createElement('div');
            inventoryContainer.id = 'size-inventory-display';
            inventoryContainer.className = 'size-inventory-info';
            inventoryContainer.style.cssText = `
                margin-top: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            `;
            
            // Insert after the selected sizes display
            const selectedSizesDisplay = document.querySelector('.selected-sizes-display');
            if (selectedSizesDisplay && selectedSizesDisplay.parentNode) {
                selectedSizesDisplay.parentNode.insertBefore(inventoryContainer, selectedSizesDisplay.nextSibling);
            }
        }
        
        // Create inventory display HTML
        const inventoryHTML = `
            <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">
                <i class="fas fa-boxes"></i> Current Size Inventory
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                ${sizes.map(size => `
                    <div style="
                        padding: 8px;
                        background: white;
                        border-radius: 5px;
                        border: 1px solid #dee2e6;
                        text-align: center;
                    ">
                        <div style="font-weight: 600; color: #495057; margin-bottom: 5px;">${size.size}</div>
                        <div style="
                            color: ${size.inventory > 0 ? '#28a745' : '#dc3545'};
                            font-size: 12px;
                            font-weight: 500;
                        ">
                            ${size.inventory > 0 ? `${size.inventory} in stock` : 'Out of stock'}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="
                margin-top: 10px;
                padding: 8px;
                background: #e7f3ff;
                border-radius: 5px;
                border: 1px solid #b3d9ff;
                font-size: 12px;
                color: #0066cc;
            ">
                <i class="fas fa-info-circle"></i> 
                When you save, each selected size will have the full inventory quantity.
            </div>
        `;
        
        inventoryContainer.innerHTML = inventoryHTML;
        console.log('✅ Size inventory display updated');
        
    } catch (error) {
        console.error('❌ Error displaying size inventory:', error);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update order status');
        }
        
        // Update local order data
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
        }
        
        // Update filtered orders if they exist
        const filteredOrder = filteredOrders.find(o => o.id === orderId);
        if (filteredOrder) {
            filteredOrder.status = newStatus;
        }
        
        // Update statistics
        updateOrdersStatistics();
        
        // Refresh the orders table to show updated status
        displayOrders();
        
        // Show success message
        showMessage(`Order #${orderId} status updated to ${newStatus}`, 'success');
        
        return true;
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage(`Failed to update order status: ${error.message}`, 'error');
        return false;
    }
}

// Edit order function
function editOrder(orderId) {
    // For now, redirect to view order details
    // In a full implementation, this would open an edit modal
    viewOrderDetails(orderId);
}

// Helper function to check if orders are ready
function areOrdersReady() {
    return allOrders && allOrders.length > 0;
}

// Prevent filter events from firing until orders are loaded
function setupFilterEventListeners() {
    console.log('🔧 Setting up filter event listeners');
    
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const paymentFilter = document.getElementById('payment-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('orders-search');
    
    if (statusFilter) {
        statusFilter.onchange = function() {
            if (!areOrdersReady()) {
                console.log('⏸️ Orders not ready, ignoring status filter change');
                return;
            }
            filterOrders();
        };
    }
    
    if (dateFilter) {
        dateFilter.onchange = function() {
            if (!areOrdersReady()) {
                console.log('⏸️ Orders not ready, ignoring date filter change');
                return;
            }
            filterOrders();
        };
    }
    
    if (paymentFilter) {
        paymentFilter.onchange = function() {
            if (!areOrdersReady()) {
                console.log('⏸️ Orders not ready, ignoring payment filter change');
                return;
            }
            filterOrders();
        };
    }
    
    if (sortFilter) {
        sortFilter.onchange = function() {
            if (!areOrdersReady()) {
                console.log('⏸️ Orders not ready, ignoring sort filter change');
                return;
            }
            sortOrders(this.value);
        };
    }
    
    if (searchInput) {
        searchInput.onkeyup = function() {
            if (!areOrdersReady()) {
                console.log('⏸️ Orders not ready, ignoring search input');
                return;
            }
            searchOrders();
        };
    }
    
    console.log('✅ Filter event listeners set up with ready checks');
}

// Update order status from modal
async function updateOrderStatusFromModal(orderId) {
    const statusSelect = document.getElementById(`status-update-${orderId}`);
    const newStatus = statusSelect.value;
    
    if (!newStatus) {
        showMessage('Please select a status to update', 'warning');
        return;
    }
    
    try {
        const success = await updateOrderStatus(orderId, newStatus);
        if (success) {
            // Update the status display in the modal
            const statusBadge = document.querySelector(`#status-update-${orderId}`).closest('.info-item').querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = newStatus;
                statusBadge.className = `status-badge status-${newStatus}`;
            }
            
            // Reset the select dropdown
            statusSelect.value = '';
            
            // Note: displayOrders() is already called in updateOrderStatus()
        }
    } catch (error) {
        console.error('Error updating order status from modal:', error);
    }
}

// Quick status update from table dropdown
async function quickUpdateStatus(orderId, newStatus, selectElement) {
    if (!newStatus) return; // Ignore if no status selected
    
    try {
        const success = await updateOrderStatus(orderId, newStatus);
        if (success) {
            // Reset the dropdown using the passed element
            if (selectElement) {
                selectElement.value = '';
            }
            
            // Show success message
            showMessage(`Order #${orderId} status updated to ${newStatus}`, 'success');
        }
    } catch (error) {
        console.error('Error in quick status update:', error);
    }
}

// Refresh orders data from server
async function refreshOrders() {
    console.log('🔄 Refreshing orders data...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Refreshed ${data.length} orders`);
        
        // Update global variables
        allOrders = data;
        filteredOrders = data;
        window.allOrders = data;
        window.filteredOrders = data;
        
        // Update statistics
        updateOrdersStatistics();
        
        // Refresh the display
        displayOrders();
        
        showMessage('Orders refreshed successfully', 'success');
        
    } catch (error) {
        console.error('❌ Error refreshing orders:', error);
        showMessage('Failed to refresh orders: ' + error.message, 'error');
    }
}

// Delete order function
async function deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to delete Order #${orderId}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        console.log(`🗑️ Deleting order #${orderId}...`);
        
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete order');
        }
        
        const result = await response.json();
        console.log(`✅ Order #${orderId} deleted successfully:`, result);
        
        // Show success message
        showMessage(`Order #${orderId} deleted successfully`, 'success');
        
        // Remove the order from local arrays
        allOrders = allOrders.filter(order => order.id !== orderId);
        filteredOrders = filteredOrders.filter(order => order.id !== orderId);
        
        // Update statistics
        updateOrdersStatistics();
        
        // Refresh the display
        displayOrders();
        
    } catch (error) {
        console.error(`❌ Error deleting order #${orderId}:`, error);
        showMessage(`Failed to delete order: ${error.message}`, 'error');
    }
}

// ========== CATEGORY IMAGES MANAGEMENT ==========

// Load category images for admin panel
async function loadCategoryImages() {
    try {
        console.log('Loading category images...');
        const response = await fetch(`${API_BASE_URL}/admin/category-images`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch category images');
        }
        
        const categoryImages = await response.json();
        console.log('Category images loaded:', categoryImages);
        
        // Populate category images grid
        displayCategoryImages(categoryImages);
        
        // Populate upload category selector
        populateUploadCategorySelector(categoryImages);
        
    } catch (error) {
        console.error('Error loading category images:', error);
        showError('Failed to load category images');
    }
}

// Display category images in the grid
function displayCategoryImages(categoryImages) {
    const grid = document.getElementById('categoryImagesGrid');
    
    if (!categoryImages || categoryImages.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-images"></i>
                <h3>No Category Images</h3>
                <p>Upload images for your categories to get started</p>
            </div>
        `;
        return;
    }
    
    const imagesHTML = categoryImages.map(category => {
        const mainImage = category.images.find(img => img.image_url === category.current_image_url);
        const otherImages = category.images.filter(img => img.image_url !== category.current_image_url);
        
        let imagesHTML = '';
        
        // Display main image first
        if (mainImage) {
            imagesHTML += `
                <div class="category-image-card">
                    <img src="${API_BASE_URL}${mainImage.image_url}" alt="${category.name}" class="category-image-preview">
                    <div class="category-image-info">
                        <span class="category-image-status main">Main Image</span>
                        <h4>${category.name}</h4>
                        <p>Position: ${mainImage.position}</p>
                        <div class="category-image-actions">
                            <button class="btn btn-secondary" onclick="replaceCategoryImage(${category.id}, '${mainImage.image_url}')">
                                <i class="fas fa-edit"></i> Replace
                            </button>
                            <button class="btn btn-danger" onclick="deleteCategoryImage(${mainImage.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Display other images
        otherImages.forEach(image => {
            imagesHTML += `
                <div class="category-image-card">
                    <img src="${API_BASE_URL}${image.image_url}" alt="${category.name}" class="category-image-preview">
                    <div class="category-image-info">
                        <span class="category-image-status secondary">Secondary</span>
                        <h4>${category.name}</h4>
                        <p>Position: ${image.position}</p>
                        <div class="category-image-actions">
                            <button class="btn btn-primary" onclick="setAsMainImage(${category.id}, '${image.image_url}')">
                                <i class="fas fa-star"></i> Set as Main
                            </button>
                            <button class="btn btn-secondary" onclick="replaceCategoryImage(${category.id}, '${image.image_url}')">
                                <i class="fas fa-edit"></i> Replace
                            </button>
                            <button class="btn btn-danger" onclick="deleteCategoryImage(${image.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return imagesHTML;
    }).join('');
    
    grid.innerHTML = imagesHTML;
}

// Populate upload category selector
function populateUploadCategorySelector(categoryImages) {
    const selector = document.getElementById('uploadCategorySelect');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">Choose a category...</option>';
    
    categoryImages.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        selector.appendChild(option);
    });
}

// Open category image upload modal
function openCategoryImageUploadModal() {
    const modal = document.getElementById('categoryImageUploadModal');
    if (modal) {
        modal.style.display = 'block';
        // Reset form
        document.getElementById('categoryImageUploadForm').reset();
        document.getElementById('setAsMainImage').checked = true;
    }
}

// Close category image upload modal
function closeCategoryImageUploadModal() {
    const modal = document.getElementById('categoryImageUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Upload category image
async function uploadCategoryImage() {
    const form = document.getElementById('categoryImageUploadForm');
    const formData = new FormData();
    
    const categoryId = document.getElementById('uploadCategorySelect').value;
    const imageFile = document.getElementById('categoryImageFile').files[0];
    const position = document.getElementById('imagePosition').value;
    const setAsMain = document.getElementById('setAsMainImage').checked;
    
    if (!categoryId || !imageFile) {
        showError('Please select a category and image file');
        return;
    }
    
    formData.append('category_id', categoryId);
    formData.append('image', imageFile);
    formData.append('position', position);
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/category-images`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }
        
        const result = await response.json();
        console.log('Image uploaded successfully:', result);
        
        // If set as main image, update the category
        if (setAsMain) {
            await setAsMainImage(categoryId, result.image_url);
        }
        
        showSuccess('Category image uploaded successfully');
        closeCategoryImageUploadModal();
        
        // Refresh the category images
        loadCategoryImages();
        
    } catch (error) {
        console.error('Error uploading image:', error);
        showError('Failed to upload image: ' + error.message);
    }
}

// Set image as main category image
async function setAsMainImage(categoryId, imageUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/image`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image_url: imageUrl })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update main image');
        }
        
        showSuccess('Main image updated successfully');
        
        // Refresh the category images
        loadCategoryImages();
        
    } catch (error) {
        console.error('Error setting main image:', error);
        showError('Failed to update main image: ' + error.message);
    }
}

// Replace category image (placeholder for future implementation)
function replaceCategoryImage(categoryId, currentImageUrl) {
    // For now, just open the upload modal
    // In the future, this could pre-populate the form with current image info
    openCategoryImageUploadModal();
    showInfo('Please upload a new image to replace the current one');
}

// Delete category image
async function deleteCategoryImage(imageId) {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/category-images/${imageId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete image');
        }
        
        showSuccess('Image deleted successfully');
        
        // Refresh the category images
        loadCategoryImages();
        
    } catch (error) {
        console.error('Error deleting image:', error);
        showError('Failed to delete image: ' + error.message);
    }
}

// Announcement Bar Management Functions
let announcementMessages = [
    "🚚 FREE DELIVERY on prepaid orders",
    "💳 HUGE DISCOUNTS on Prepaid Orders - Save up to 30%",
    "🎉 LAUNCH SALE: Limited Time Offer - Luxury Sneakers, Luxury Watches & Designer Bags",
    "⚡ Flash Sale: Extra 15% off with code WELCOME15"
];

let announcementBarVisible = true;

async function loadAnnouncementMessages() {
    const container = document.getElementById('announcement-messages');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/announcement`);
        const data = await response.json();
        
        if (response.ok) {
            announcementMessages = data.messages || [];
            announcementBarVisible = data.visible !== undefined ? data.visible : true;
        }
    } catch (error) {
        console.error('Error loading announcement settings:', error);
        showMessage('Error loading announcement settings', 'error');
    }
    
    container.innerHTML = '';
    
    announcementMessages.forEach((message, index) => {
        const messageItem = document.createElement('div');
        messageItem.className = 'announcement-message-item';
        messageItem.innerHTML = `
            <div class="announcement-message-text">${message}</div>
            <div class="announcement-message-actions">
                <button class="edit-message-btn" onclick="editAnnouncementMessage(${index})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-message-btn" onclick="deleteAnnouncementMessage(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        container.appendChild(messageItem);
    });
    
    updatePreview();
}

async function addAnnouncementMessage() {
    const input = document.getElementById('new-announcement-text');
    const text = input.value.trim();
    
    if (!text) {
        showMessage('Please enter a message', 'warning');
        return;
    }
    
    if (announcementMessages.length >= 6) {
        showMessage('Maximum 6 messages allowed', 'warning');
        return;
    }
    
    announcementMessages.push(text);
    input.value = '';
    
    // Auto-save changes to database first
    await saveAnnouncementSettings();
    
    // Then refresh the display
    await loadAnnouncementMessages();
    showMessage('Message added successfully', 'success');
}

async function editAnnouncementMessage(index) {
    const currentText = announcementMessages[index];
    const newText = prompt('Edit message:', currentText);
    
    if (newText !== null && newText.trim()) {
        announcementMessages[index] = newText.trim();
        
        // Auto-save changes to database first
        await saveAnnouncementSettings();
        
        // Then refresh the display
        await loadAnnouncementMessages();
        showMessage('Message updated successfully', 'success');
    }
}

async function deleteAnnouncementMessage(index) {
    if (confirm('Are you sure you want to delete this message?')) {
        announcementMessages.splice(index, 1);
        
        // Auto-save changes to database first
        await saveAnnouncementSettings();
        
        // Then refresh the display
        await loadAnnouncementMessages();
        showMessage('Message deleted successfully', 'success');
    }
}

async function clearAllAnnouncements() {
    if (confirm('Are you sure you want to clear all announcement messages?')) {
        announcementMessages = [];
        
        // Auto-save changes to database first
        await saveAnnouncementSettings();
        
        // Then refresh the display
        await loadAnnouncementMessages();
        showMessage('All messages cleared', 'success');
    }
}

async function toggleAnnouncementBar() {
    announcementBarVisible = !announcementBarVisible;
    const toggleBtn = document.getElementById('toggle-btn');
    const toggleText = document.getElementById('toggle-text');
    
    if (toggleBtn && toggleText) {
        if (announcementBarVisible) {
            toggleText.textContent = 'Hide Announcement Bar';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Announcement Bar';
        } else {
            toggleText.textContent = 'Show Announcement Bar';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show Announcement Bar';
        }
    }
    
    // Auto-save changes to database
    await saveAnnouncementSettings();
    
    // Refresh the display
    await loadAnnouncementMessages();
    
    showMessage(`Announcement bar ${announcementBarVisible ? 'enabled' : 'disabled'}`, 'info');
}

function updatePreview() {
    const preview = document.getElementById('announcement-preview');
    if (!preview) return;
    
    if (announcementMessages.length === 0) {
        preview.innerHTML = '<div class="marquee-preview">No messages to display</div>';
        return;
    }
    
    const previewContent = announcementMessages.map(msg => 
        `<span style="margin-right: 100px;">${msg}</span>`
    ).join('');
    
    preview.innerHTML = `<div class="marquee-preview">${previewContent}</div>`;
}

async function saveAnnouncementSettings() {
    try {
        const settings = {
            messages: announcementMessages,
            visible: announcementBarVisible
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/announcement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Announcement settings saved successfully', 'success');
            // Update the actual announcement bar on the website
            updateWebsiteAnnouncementBar();
        } else {
            showMessage(data.error || 'Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Error saving announcement settings:', error);
        showMessage('Error saving announcement settings', 'error');
    }
}

function loadAnnouncementSettings() {
    // This function is now handled by loadAnnouncementMessages which fetches from the server
    // Keeping it for backward compatibility
}

function updateWebsiteAnnouncementBar() {
    // This function would update the actual announcement bar on the website
    // For now, we'll just show a message that the user should refresh the main site
    showMessage('Settings saved! Please refresh your main website to see the changes.', 'info');
    
    // In a real application, you could use WebSockets or Server-Sent Events
    // to notify the main website to refresh the announcement bar
    console.log('Announcement bar settings updated - main website should refresh');
}

// Note: loadCategoryProducts function is now defined earlier in the file and attached to window object