// Animation and Transition System
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupStyles();
        this.setupPageTransitions();
        this.setupElementAnimations();
    }

    setupStyles() {
        if (document.getElementById('animation-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'animation-styles';
        styles.textContent = `
            /* Page transitions */
            .page-transition {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .page-transition.show {
                opacity: 1;
                transform: translateY(0);
            }

            /* Ensure dashboard and onboarding are always visible */
            #dashboard-section {
                opacity: 1 !important;
                transform: none !important;
            }

            #dashboard-section.show {
                opacity: 1 !important;
                transform: none !important;
            }

            #onboarding-section {
                opacity: 1 !important;
                transform: none !important;
            }

            #onboarding-section.show {
                opacity: 1 !important;
                transform: none !important;
            }

            /* Section transitions */
            .section-fade-in {
                animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            .section-slide-in {
                animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            /* Card animations */
            .card-hover {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .card-hover:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }

            [data-theme="dark"] .card-hover:hover {
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            }

            /* Button animations */
            .btn-animated {
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .btn-animated::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
            }

            .btn-animated:hover::before {
                left: 100%;
            }

            .btn-animated:active {
                transform: scale(0.98);
            }

            /* Table row animations */
            .table-row {
                transition: all 0.2s ease;
            }

            .table-row:hover {
                transform: scale(1.01);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            /* Progress ring animations */
            .progress-ring {
                transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .progress-ring-animate {
                animation: progressRingFill 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            /* Status badge animations */
            .status-badge {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .status-badge::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.6s;
            }

            .status-badge:hover::before {
                left: 100%;
            }

            .status-badge:hover {
                transform: scale(1.05);
            }

            /* Icon animations */
            .icon-bounce {
                transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .icon-bounce:hover {
                transform: scale(1.2) rotate(5deg);
            }

            .icon-pulse {
                animation: pulse 2s infinite;
            }

            .icon-spin {
                animation: spin 1s linear infinite;
            }

            /* Loading animations */
            .loading-fade {
                animation: loadingFade 1.5s ease-in-out infinite;
            }

            .loading-slide {
                animation: loadingSlide 1.5s ease-in-out infinite;
            }

            /* Keyframes */
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes progressRingFill {
                from {
                    stroke-dashoffset: 283;
                }
                to {
                    stroke-dashoffset: var(--progress-offset);
                }
            }

            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }

            @keyframes loadingFade {
                0%, 100% {
                    opacity: 0.3;
                }
                50% {
                    opacity: 1;
                }
            }

            @keyframes loadingSlide {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(100%);
                }
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .card-hover:hover {
                    transform: none;
                }

                .table-row:hover {
                    transform: none;
                }

                .status-badge:hover {
                    transform: none;
                }

                .icon-bounce:hover {
                    transform: none;
                }
            }

            /* Reduced motion preferences */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    setupPageTransitions() {
        // Add transition classes to sections (but not dashboard and onboarding initially)
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            // Don't add transition class to dashboard and onboarding sections initially
            if (section.id !== 'dashboard-section' && section.id !== 'onboarding-section') {
                section.classList.add('page-transition');
            }
        });
    }

    setupElementAnimations() {
        // Add hover animations to cards
        const cards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
        cards.forEach(card => {
            card.classList.add('card-hover');
        });

        // Add animations to buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.add('btn-animated');
        });

        // Add animations to table rows
        const tableRows = document.querySelectorAll('tbody tr');
        tableRows.forEach(row => {
            row.classList.add('table-row');
        });
    }

    // Animate element entrance
    animateIn(element, animation = 'fadeInUp', delay = 0) {
        setTimeout(() => {
            element.classList.add(animation);
        }, delay);
    }

    // Animate element exit
    animateOut(element, animation = 'fadeOut', callback) {
        element.classList.add(animation);
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    // Stagger animation for multiple elements
    staggerAnimation(elements, animation = 'fadeInUp', staggerDelay = 100) {
        elements.forEach((element, index) => {
            this.animateIn(element, animation, index * staggerDelay);
        });
    }

    // Page transition effect
    transitionToPage(sectionId, callback) {
        const currentSection = document.querySelector('.section:not(.hidden)');
        const newSection = document.getElementById(sectionId);

        if (currentSection && newSection) {
            // Fade out current section
            currentSection.classList.remove('show');
            currentSection.classList.add('hidden');

            // Fade in new section
            setTimeout(() => {
                newSection.classList.remove('hidden');
                newSection.classList.add('show');
                
                // Animate content
                const content = newSection.querySelectorAll('.card-hover, .table-row');
                this.staggerAnimation(content, 'section-fade-in', 50);
                
                if (callback) callback();
            }, 150);
        }
    }
}

// Initialize animation manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.animationManager = new AnimationManager();
});

// Export for global access
window.AnimationManager = AnimationManager;
