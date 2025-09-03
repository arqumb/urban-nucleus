// Professional Notification System - Shared Utility
// Include this file in any HTML page to use the notification system

// Create notification container if it doesn't exist
function ensureNotificationContainer() {
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    }
}

// Add notification CSS if not already present
function addNotificationCSS() {
    if (!document.querySelector('#notification-css')) {
        const style = document.createElement('style');
        style.id = 'notification-css';
        style.textContent = `
            /* Professional Notification System */
            .notification-container {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10002;
                max-width: 400px;
            }
            
            .notification {
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                margin-bottom: 16px;
                padding: 20px;
                border-left: 4px solid #4caf50;
                transform: translateX(100%);
                transition: transform 0.3s ease-out;
                position: relative;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.success {
                border-left-color: #4caf50;
            }
            
            .notification.error {
                border-left-color: #f44336;
            }
            
            .notification.warning {
                border-left-color: #ff9800;
            }
            
            .notification.info {
                border-left-color: #2196f3;
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 16px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .notification-close:hover {
                background: #f5f5f5;
                color: #666;
            }
            
            .notification-message {
                color: #666;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 0;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #4caf50;
                width: 100%;
                animation: notification-progress 5s linear forwards;
            }
            
            .notification.error .notification-progress {
                background: #f44336;
            }
            
            .notification.warning .notification-progress {
                background: #ff9800;
            }
            
            .notification.info .notification-progress {
                background: #2196f3;
            }
            
            @keyframes notification-progress {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .notification-icon {
                font-size: 18px;
            }
            
            .notification.success .notification-icon {
                color: #4caf50;
            }
            
            .notification.error .notification-icon {
                color: #f44336;
            }
            
            .notification.warning .notification-icon {
                color: #ff9800;
            }
            
            .notification.info .notification-icon {
                color: #2196f3;
            }
            
            /* Mobile responsive notifications */
            @media (max-width: 768px) {
                .notification-container {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .notification {
                    padding: 16px;
                    margin-bottom: 12px;
                }
                
                .notification-title {
                    font-size: 14px;
                }
                
                .notification-message {
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Main notification function
function showNotification(type, title, message, duration = 5000) {
    // Ensure CSS and container are available
    addNotificationCSS();
    ensureNotificationContainer();
    
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    const icon = getNotificationIcon(type);
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">
                <i class="fas ${icon} notification-icon"></i>
                ${title}
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-progress"></div>
    `;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
}

// Get icon for notification type
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// Convenience functions for common notification types
function showSuccess(title, message, duration = 5000) {
    showNotification('success', title, message, duration);
}

function showError(title, message, duration = 8000) {
    showNotification('error', title, message, duration);
}

function showWarning(title, message, duration = 5000) {
    showNotification('warning', title, message, duration);
}

function showInfo(title, message, duration = 4000) {
    showNotification('info', title, message, duration);
}

// Initialize notification system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        addNotificationCSS();
        ensureNotificationContainer();
    });
} else {
    // DOM is already loaded
    addNotificationCSS();
    ensureNotificationContainer();
}

// Export functions for use in other scripts
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;




