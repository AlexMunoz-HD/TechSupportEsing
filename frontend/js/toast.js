// Toast Notification System
class ToastManager {
    constructor() {
        this.toasts = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.setupStyles();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    setupStyles() {
        if (document.getElementById('toast-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }

            .toast {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 16px 20px;
                min-width: 300px;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 12px;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-left: 4px solid;
            }

            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .toast.success {
                border-left-color: #10b981;
                color: #065f46;
            }

            .toast.error {
                border-left-color: #ef4444;
                color: #991b1b;
            }

            .toast.warning {
                border-left-color: #f59e0b;
                color: #92400e;
            }

            .toast.info {
                border-left-color: #3b82f6;
                color: #1e40af;
            }

            .toast-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .toast-content {
                flex: 1;
            }

            .toast-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 2px;
            }

            .toast-message {
                font-size: 13px;
                opacity: 0.8;
                line-height: 1.4;
            }

            .toast-close {
                background: none;
                border: none;
                font-size: 16px;
                opacity: 0.5;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: opacity 0.2s;
            }

            .toast-close:hover {
                opacity: 1;
            }

            /* Dark theme styles */
            [data-theme="dark"] .toast {
                background: #1f2937;
                color: #f9fafb;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            [data-theme="dark"] .toast.success {
                color: #6ee7b7;
            }

            [data-theme="dark"] .toast.error {
                color: #fca5a5;
            }

            [data-theme="dark"] .toast.warning {
                color: #fcd34d;
            }

            [data-theme="dark"] .toast.info {
                color: #93c5fd;
            }

            /* Theme toggle styles */
            .theme-toggle {
                background: none;
                border: none;
                color: #6b7280;
                font-size: 18px;
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                margin-right: 12px;
            }

            .theme-toggle:hover {
                background: #f3f4f6;
                color: #374151;
            }

            [data-theme="dark"] .theme-toggle {
                color: #9ca3af;
            }

            [data-theme="dark"] .theme-toggle:hover {
                background: #374151;
                color: #d1d5db;
            }

            /* Loading spinner styles */
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            [data-theme="dark"] .loading-spinner {
                border-color: #374151;
                border-top-color: #60a5fa;
            }

            /* Skeleton loading styles */
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 4px;
            }

            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            [data-theme="dark"] .skeleton {
                background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
                background-size: 200% 100%;
            }
        `;
        document.head.appendChild(styles);
    }

    show(type, title, message, duration = 5000) {
        const toast = this.createToast(type, title, message);
        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    createToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="toastManager.remove(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        return toast;
    }

    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    clear() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.remove(toast));
    }
}

// Initialize toast manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.toastManager = new ToastManager();
    
    // Global function for easy access
    window.showToast = (type, title, message, duration) => {
        return window.toastManager.show(type, title, message, duration);
    };
});

// Export for global access
window.ToastManager = ToastManager;
