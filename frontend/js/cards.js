// Interactive Cards System
class CardManager {
    constructor() {
        this.expandedCards = new Set();
        this.init();
    }

    init() {
        this.setupStyles();
        this.setupCards();
    }

    setupStyles() {
        if (document.getElementById('card-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'card-styles';
        styles.textContent = `
            /* Interactive card styles */
            .interactive-card {
                position: relative;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            .interactive-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }

            [data-theme="dark"] .interactive-card:hover {
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }

            .interactive-card.expanded {
                transform: scale(1.02);
                z-index: 10;
            }

            .card-header {
                position: relative;
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-color);
            }

            .card-content {
                padding: 1.5rem;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .card-content.expanded {
                max-height: 1000px;
            }

            .card-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid var(--border-color);
                background: var(--bg-secondary);
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .card-footer.expanded {
                opacity: 1;
                transform: translateY(0);
            }

            .card-expand-icon {
                position: absolute;
                top: 1rem;
                right: 1rem;
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                background: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 0.875rem;
            }

            .card-expand-icon:hover {
                transform: scale(1.1);
                background: var(--primary-dark);
            }

            .card-expand-icon.expanded {
                transform: rotate(180deg);
            }

            /* Card types */
            .card-stats {
                background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
                color: white;
            }

            .card-stats .card-header {
                border-bottom-color: rgba(255, 255, 255, 0.2);
            }

            .card-stats .card-footer {
                background: rgba(255, 255, 255, 0.1);
                border-top-color: rgba(255, 255, 255, 0.2);
            }

            .card-info {
                background: linear-gradient(135deg, var(--info-color), #0891b2);
                color: white;
            }

            .card-success {
                background: linear-gradient(135deg, var(--success-color), #059669);
                color: white;
            }

            .card-warning {
                background: linear-gradient(135deg, var(--warning-color), #d97706);
                color: white;
            }

            .card-error {
                background: linear-gradient(135deg, var(--error-color), #dc2626);
                color: white;
            }

            /* Card grid */
            .card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .card-grid.compact {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }

            .card-grid.large {
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 2rem;
            }

            /* Card animations */
            .card-fade-in {
                animation: cardFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            .card-slide-in {
                animation: cardSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            .card-scale-in {
                animation: cardScaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            @keyframes cardFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes cardSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes cardScaleIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .card-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .interactive-card:hover {
                    transform: none;
                }

                .card-expand-icon:hover {
                    transform: none;
                }
            }

            /* Card content types */
            .card-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .card-metric {
                text-align: center;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 0.5rem;
            }

            .card-metric-value {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }

            .card-metric-label {
                font-size: 0.875rem;
                opacity: 0.8;
            }

            .card-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }

            .card-action-btn {
                flex: 1;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 0.375rem;
                background: rgba(255, 255, 255, 0.2);
                color: inherit;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .card-action-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(styles);
    }

    setupCards() {
        // Find all cards and make them interactive (but not dashboard cards initially)
        const cards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
        cards.forEach(card => {
            // Don't make dashboard cards interactive initially
            if (!card.closest('#dashboard-section')) {
                this.makeInteractive(card);
            }
        });

        // Setup card grids
        this.setupCardGrids();
    }

    makeInteractive(card) {
        // Skip if already interactive
        if (card.classList.contains('interactive-card')) return;

        card.classList.add('interactive-card');

        // Create expandable structure
        const content = card.innerHTML;
        const header = this.extractCardHeader(content);
        const body = this.extractCardBody(content);
        const footer = this.extractCardFooter(content);

        card.innerHTML = `
            <div class="card-header">
                ${header}
                <div class="card-expand-icon">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="card-content">
                ${body}
            </div>
            ${footer ? `<div class="card-footer">${footer}</div>` : ''}
        `;

        // Add click handler
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-expand-icon')) {
                this.toggleCard(card);
            }
        });

        // Add expand icon click handler
        const expandIcon = card.querySelector('.card-expand-icon');
        if (expandIcon) {
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCard(card);
            });
        }
    }

    extractCardHeader(content) {
        // Extract title and main content for header
        const titleMatch = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/);
        if (titleMatch) {
            return titleMatch[0];
        }
        
        // Fallback: extract first text content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const firstText = tempDiv.textContent.trim().split('\n')[0];
        return `<h3 class="text-lg font-semibold">${firstText}</h3>`;
    }

    extractCardBody(content) {
        // Extract main content (everything except header)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Remove header elements
        const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => header.remove());
        
        return tempDiv.innerHTML;
    }

    extractCardFooter(content) {
        // Look for footer content or action buttons
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const buttons = tempDiv.querySelectorAll('button');
        if (buttons.length > 0) {
            return Array.from(buttons).map(btn => btn.outerHTML).join('');
        }
        
        return null;
    }

    toggleCard(card) {
        const isExpanded = card.classList.contains('expanded');
        const content = card.querySelector('.card-content');
        const footer = card.querySelector('.card-footer');
        const expandIcon = card.querySelector('.card-expand-icon');

        if (isExpanded) {
            // Collapse
            card.classList.remove('expanded');
            content.classList.remove('expanded');
            if (footer) footer.classList.remove('expanded');
            if (expandIcon) expandIcon.classList.remove('expanded');
            this.expandedCards.delete(card);
        } else {
            // Expand
            card.classList.add('expanded');
            content.classList.add('expanded');
            if (footer) footer.classList.add('expanded');
            if (expandIcon) expandIcon.classList.add('expanded');
            this.expandedCards.add(card);
        }
    }

    setupCardGrids() {
        // Find card containers and make them grids
        const cardContainers = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-4');
        cardContainers.forEach(container => {
            container.classList.add('card-grid');
        });
    }

    // Create custom card
    createCard(options = {}) {
        const {
            title = 'Card Title',
            content = 'Card content',
            type = 'default',
            actions = [],
            metrics = [],
            expandable = true
        } = options;

        const card = document.createElement('div');
        card.className = `interactive-card bg-white rounded-lg shadow-sm ${type !== 'default' ? `card-${type}` : ''}`;

        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="card-actions">
                    ${actions.map(action => `
                        <button class="card-action-btn" onclick="${action.onclick || ''}">
                            ${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        let metricsHtml = '';
        if (metrics.length > 0) {
            metricsHtml = `
                <div class="card-metrics">
                    ${metrics.map(metric => `
                        <div class="card-metric">
                            <div class="card-metric-value">${metric.value}</div>
                            <div class="card-metric-label">${metric.label}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (expandable) {
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <div class="card-expand-icon">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="card-content">
                    ${content}
                    ${metricsHtml}
                    ${actionsHtml}
                </div>
            `;

            // Add click handlers
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-expand-icon')) {
                    this.toggleCard(card);
                }
            });

            const expandIcon = card.querySelector('.card-expand-icon');
            if (expandIcon) {
                expandIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleCard(card);
                });
            }
        } else {
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="text-lg font-semibold">${title}</h3>
                </div>
                <div class="card-content expanded">
                    ${content}
                    ${metricsHtml}
                    ${actionsHtml}
                </div>
            `;
        }

        return card;
    }

    // Animate card entrance
    animateCardIn(card, animation = 'card-fade-in') {
        card.classList.add(animation);
    }

    // Get expanded cards
    getExpandedCards() {
        return Array.from(this.expandedCards);
    }

    // Collapse all cards
    collapseAll() {
        this.expandedCards.forEach(card => {
            this.toggleCard(card);
        });
    }
}

// Initialize card manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.cardManager = new CardManager();
});

// Export for global access
window.CardManager = CardManager;
