// Tooltip System
class TooltipManager {
    constructor() {
        this.tooltips = new Map();
        this.init();
    }

    init() {
        this.setupStyles();
        this.setupEventListeners();
    }

    setupStyles() {
        if (document.getElementById('tooltip-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tooltip-styles';
        styles.textContent = `
            .tooltip {
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                line-height: 1.4;
                max-width: 250px;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transform: translateY(-4px);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .tooltip.show {
                opacity: 1;
                transform: translateY(0);
            }

            .tooltip::before {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border: 5px solid transparent;
            }

            /* Tooltip arrow positions */
            .tooltip[data-position="top"]::before {
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: #1f2937;
            }

            .tooltip[data-position="bottom"]::before {
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-bottom-color: #1f2937;
            }

            .tooltip[data-position="left"]::before {
                right: -10px;
                top: 50%;
                transform: translateY(-50%);
                border-left-color: #1f2937;
            }

            .tooltip[data-position="right"]::before {
                left: -10px;
                top: 50%;
                transform: translateY(-50%);
                border-right-color: #1f2937;
            }

            /* Dark theme tooltip */
            [data-theme="dark"] .tooltip {
                background: #374151;
                color: #f9fafb;
            }

            [data-theme="dark"] .tooltip[data-position="top"]::before {
                border-top-color: #374151;
            }

            [data-theme="dark"] .tooltip[data-position="bottom"]::before {
                border-bottom-color: #374151;
            }

            [data-theme="dark"] .tooltip[data-position="left"]::before {
                border-left-color: #374151;
            }

            [data-theme="dark"] .tooltip[data-position="right"]::before {
                border-right-color: #374151;
            }

            /* Tooltip trigger styles */
            .tooltip-trigger {
                position: relative;
                cursor: help;
            }

            /* Rich tooltip styles */
            .tooltip-rich {
                max-width: 300px;
                padding: 12px 16px;
            }

            .tooltip-rich .tooltip-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: #f9fafb;
            }

            .tooltip-rich .tooltip-content {
                font-size: 12px;
                opacity: 0.9;
            }

            .tooltip-rich .tooltip-footer {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 11px;
                opacity: 0.7;
            }

            [data-theme="dark"] .tooltip-rich .tooltip-footer {
                border-top-color: rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(styles);
    }

    setupEventListeners() {
        // Global mouse events for tooltip positioning
        document.addEventListener('mousemove', (e) => {
            this.updateTooltipPosition(e);
        });

        // Cleanup on scroll
        document.addEventListener('scroll', () => {
            this.hideAllTooltips();
        }, true);
    }

    // Create tooltip for element
    create(element, content, options = {}) {
        const {
            position = 'top',
            delay = 300,
            rich = false,
            title = null,
            footer = null
        } = options;

        // Remove existing tooltip if any
        this.destroy(element);

        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${rich ? 'tooltip-rich' : ''}`;
        tooltip.setAttribute('data-position', position);

        if (rich) {
            tooltip.innerHTML = `
                ${title ? `<div class="tooltip-title">${title}</div>` : ''}
                <div class="tooltip-content">${content}</div>
                ${footer ? `<div class="tooltip-footer">${footer}</div>` : ''}
            `;
        } else {
            tooltip.textContent = content;
        }

        document.body.appendChild(tooltip);

        // Store tooltip reference
        this.tooltips.set(element, {
            tooltip,
            delay,
            timeout: null,
            position
        });

        // Add trigger class
        element.classList.add('tooltip-trigger');

        // Setup events
        element.addEventListener('mouseenter', () => this.show(element));
        element.addEventListener('mouseleave', () => this.hide(element));
        element.addEventListener('focus', () => this.show(element));
        element.addEventListener('blur', () => this.hide(element));

        return tooltip;
    }

    show(element) {
        const tooltipData = this.tooltips.get(element);
        if (!tooltipData) return;

        const { tooltip, delay } = tooltipData;

        // Clear existing timeout
        if (tooltipData.timeout) {
            clearTimeout(tooltipData.timeout);
        }

        // Show with delay
        tooltipData.timeout = setTimeout(() => {
            tooltip.classList.add('show');
            this.updateTooltipPosition({ target: element });
        }, delay);
    }

    hide(element) {
        const tooltipData = this.tooltips.get(element);
        if (!tooltipData) return;

        const { tooltip, timeout } = tooltipData;

        // Clear timeout
        if (timeout) {
            clearTimeout(timeout);
            tooltipData.timeout = null;
        }

        tooltip.classList.remove('show');
    }

    updateTooltipPosition(e) {
        const element = e.target;
        const tooltipData = this.tooltips.get(element);
        if (!tooltipData || !tooltipData.tooltip.classList.contains('show')) return;

        const { tooltip, position } = tooltipData;
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }

        // Adjust for viewport boundaries
        if (left < 8) left = 8;
        if (left + tooltipRect.width > viewport.width - 8) {
            left = viewport.width - tooltipRect.width - 8;
        }
        if (top < 8) top = 8;
        if (top + tooltipRect.height > viewport.height - 8) {
            top = viewport.height - tooltipRect.height - 8;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    hideAllTooltips() {
        this.tooltips.forEach(({ tooltip }) => {
            tooltip.classList.remove('show');
        });
    }

    destroy(element) {
        const tooltipData = this.tooltips.get(element);
        if (!tooltipData) return;

        const { tooltip, timeout } = tooltipData;

        // Clear timeout
        if (timeout) {
            clearTimeout(timeout);
        }

        // Remove tooltip from DOM
        if (tooltip.parentElement) {
            tooltip.parentElement.removeChild(tooltip);
        }

        // Remove from map
        this.tooltips.delete(element);

        // Remove trigger class
        element.classList.remove('tooltip-trigger');
    }

    destroyAll() {
        this.tooltips.forEach((_, element) => {
            this.destroy(element);
        });
    }
}

// Initialize tooltip manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tooltipManager = new TooltipManager();
    
    // Global function for easy access
    window.addTooltip = (element, content, options) => {
        return window.tooltipManager.create(element, content, options);
    };
});

// Export for global access
window.TooltipManager = TooltipManager;
