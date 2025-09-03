document.addEventListener('DOMContentLoaded', function() {
    // Order Modal
    const orderModal = document.getElementById('orderModal');
    const viewButtons = document.querySelectorAll('.action-btn.view');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    // Open modal for viewing order details
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.closest('tr').querySelector('td:first-child').textContent;
            document.querySelector('.order-id').textContent = orderId;
            orderModal.classList.add('show');
        });
    });
    
    // Close modal
    function closeModal() {
        orderModal.classList.remove('show');
    }
    
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Update order status
    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', function() {
            const newStatus = this.value;
            const orderRow = this.closest('tr');
            
            // Update the select class to reflect new status
            this.className = 'status-select ' + newStatus;
            
            // In a real app, you would make an API call to update the status
            console.log('Order status updated to:', newStatus);
            showNotification('Order status updated successfully');
        });
    });
    
    // Filter orders
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    statusFilter.addEventListener('change', filterOrders);
    dateFilter.addEventListener('change', filterOrders);
    
    function filterOrders() {
        const statusValue = statusFilter.value;
        const dateValue = dateFilter.value;
        const rows = document.querySelectorAll('.orders-table tbody tr');
        
        rows.forEach(row => {
            const rowStatus = row.querySelector('.status-select').value;
            const rowDate = row.querySelector('td:nth-child(3)').textContent;
            
            const statusMatch = statusValue === 'all' || rowStatus === statusValue;
            const dateMatch = !dateValue || rowDate.includes(formatDateForComparison(dateValue));
            
            if (statusMatch && dateMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    function formatDateForComparison(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
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