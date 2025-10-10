// Loading States and Spinners System
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.init();
    }

    init() {
        this.setupStyles();
    }

    setupStyles() {
        if (document.getElementById('loading-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'loading-styles';
        styles.textContent = `
            /* Loading overlay */
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                border-radius: inherit;
            }

            [data-theme="dark"] .loading-overlay {
                background: rgba(31, 41, 55, 0.8);
            }

            /* Loading spinner variations */
            .spinner-small {
                width: 16px;
                height: 16px;
                border-width: 2px;
            }

            .spinner-medium {
                width: 24px;
                height: 24px;
                border-width: 3px;
            }

            .spinner-large {
                width: 32px;
                height: 32px;
                border-width: 4px;
            }

            /* Pulse animation for buttons */
            .btn-loading {
                position: relative;
                pointer-events: none;
            }

            .btn-loading .btn-text {
                opacity: 0;
            }

            .btn-loading .btn-spinner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            /* Skeleton loading for tables */
            .skeleton-table {
                width: 100%;
            }

            .skeleton-table tr {
                height: 60px;
            }

            .skeleton-table td {
                padding: 12px;
            }

            .skeleton-table .skeleton-cell {
                height: 20px;
                margin-bottom: 8px;
            }

            .skeleton-table .skeleton-cell:last-child {
                margin-bottom: 0;
            }

            /* Skeleton loading for cards */
            .skeleton-card {
                padding: 24px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            [data-theme="dark"] .skeleton-card {
                background: #1f2937;
            }

            .skeleton-card .skeleton-line {
                height: 16px;
                margin-bottom: 12px;
                border-radius: 4px;
            }

            .skeleton-card .skeleton-line:last-child {
                margin-bottom: 0;
            }

            .skeleton-card .skeleton-line.short {
                width: 60%;
            }

            .skeleton-card .skeleton-line.medium {
                width: 80%;
            }

            /* Progress bar loading */
            .progress-loading {
                width: 100%;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                position: relative;
            }

            .progress-loading::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, #3b82f6, transparent);
                animation: progress-loading 1.5s infinite;
            }

            @keyframes progress-loading {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            [data-theme="dark"] .progress-loading {
                background: #374151;
            }

            [data-theme="dark"] .progress-loading::after {
                background: linear-gradient(90deg, transparent, #60a5fa, transparent);
            }

            /* Shimmer effect */
            .shimmer {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            [data-theme="dark"] .shimmer {
                background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
                background-size: 200% 100%;
            }
        `;
        document.head.appendChild(styles);
    }

    // Show loading overlay on element
    showOverlay(element, text = 'Cargando...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner spinner-medium mb-3"></div>
                <div class="text-sm text-gray-600">${text}</div>
            </div>
        `;

        // Make parent relative if not already
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
        this.activeLoaders.add(overlay);
        return overlay;
    }

    // Hide loading overlay
    hideOverlay(overlay) {
        if (overlay && overlay.parentElement) {
            overlay.parentElement.removeChild(overlay);
            this.activeLoaders.delete(overlay);
        }
    }

    // Show loading state on button
    showButtonLoading(button, text = 'Cargando...') {
        const originalText = button.innerHTML;
        button.classList.add('btn-loading');
        button.innerHTML = `
            <span class="btn-text">${originalText}</span>
            <div class="btn-spinner">
                <div class="loading-spinner spinner-small"></div>
            </div>
        `;
        button.disabled = true;
        
        return () => {
            button.classList.remove('btn-loading');
            button.innerHTML = originalText;
            button.disabled = false;
        };
    }

    // Create skeleton table
    createSkeletonTable(rows = 5, cols = 4) {
        const table = document.createElement('table');
        table.className = 'skeleton-table';
        
        for (let i = 0; i < rows; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('td');
                cell.innerHTML = `
                    <div class="skeleton-cell skeleton"></div>
                    <div class="skeleton-cell skeleton short"></div>
                `;
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        
        return table;
    }

    // Create skeleton card
    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-line skeleton medium"></div>
            <div class="skeleton-line skeleton"></div>
            <div class="skeleton-line skeleton short"></div>
        `;
        return card;
    }

    // Show progress loading
    showProgressLoading(element) {
        const progress = document.createElement('div');
        progress.className = 'progress-loading';
        element.appendChild(progress);
        return progress;
    }

    // Clear all loading states
    clearAll() {
        this.activeLoaders.forEach(overlay => this.hideOverlay(overlay));
        this.activeLoaders.clear();
    }
}

// Initialize loading manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.loadingManager = new LoadingManager();
});

// Export for global access
window.LoadingManager = LoadingManager;
