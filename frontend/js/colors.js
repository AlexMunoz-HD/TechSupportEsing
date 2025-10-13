// Dynamic Colors System
class ColorManager {
    constructor() {
        this.colorSchemes = new Map();
        this.currentScheme = 'default';
        this.init();
    }

    init() {
        this.setupStyles();
        this.registerColorSchemes();
        this.applyColorScheme(this.currentScheme);
        this.setupContextualColors();
    }

    setupStyles() {
        if (document.getElementById('color-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'color-styles';
        styles.textContent = `
            /* Dynamic color variables */
            :root {
                --primary-color: #3b82f6;
                --primary-light: #60a5fa;
                --primary-dark: #1d4ed8;
                --secondary-color: #6b7280;
                --accent-color: #10b981;
                --warning-color: #f59e0b;
                --error-color: #ef4444;
                --success-color: #10b981;
                --info-color: #06b6d4;
                
                --bg-primary: #ffffff;
                --bg-secondary: #f9fafb;
                --bg-tertiary: #f3f4f6;
                --text-primary: #111827;
                --text-secondary: #6b7280;
                --text-tertiary: #9ca3af;
                
                --border-color: #e5e7eb;
                --shadow-color: rgba(0, 0, 0, 0.1);
            }

            /* Dark mode color variables */
            [data-theme="dark"] {
                --bg-primary: #1f2937;
                --bg-secondary: #111827;
                --bg-tertiary: #374151;
                --text-primary: #f9fafb;
                --text-secondary: #d1d5db;
                --text-tertiary: #9ca3af;
                
                --border-color: #374151;
                --shadow-color: rgba(0, 0, 0, 0.3);
            }

            /* Contextual color classes */
            .color-primary {
                color: var(--primary-color) !important;
            }

            .color-secondary {
                color: var(--secondary-color) !important;
            }

            .color-accent {
                color: var(--accent-color) !important;
            }

            .color-warning {
                color: var(--warning-color) !important;
            }

            .color-error {
                color: var(--error-color) !important;
            }

            .color-success {
                color: var(--success-color) !important;
            }

            .color-info {
                color: var(--info-color) !important;
            }

            /* Background color classes */
            .bg-primary {
                background-color: var(--primary-color) !important;
            }

            .bg-secondary {
                background-color: var(--secondary-color) !important;
            }

            .bg-accent {
                background-color: var(--accent-color) !important;
            }

            .bg-warning {
                background-color: var(--warning-color) !important;
            }

            .bg-error {
                background-color: var(--error-color) !important;
            }

            .bg-success {
                background-color: var(--success-color) !important;
            }

            .bg-info {
                background-color: var(--info-color) !important;
            }

            /* Border color classes */
            .border-primary {
                border-color: var(--primary-color) !important;
            }

            .border-secondary {
                border-color: var(--secondary-color) !important;
            }

            .border-accent {
                border-color: var(--accent-color) !important;
            }

            .border-warning {
                border-color: var(--warning-color) !important;
            }

            .border-error {
                border-color: var(--error-color) !important;
            }

            .border-success {
                border-color: var(--success-color) !important;
            }

            .border-info {
                border-color: var(--info-color) !important;
            }

            /* Gradient backgrounds */
            .gradient-primary {
                background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
            }

            .gradient-secondary {
                background: linear-gradient(135deg, var(--secondary-color), #4b5563);
            }

            .gradient-accent {
                background: linear-gradient(135deg, var(--accent-color), #059669);
            }

            .gradient-warning {
                background: linear-gradient(135deg, var(--warning-color), #d97706);
            }

            .gradient-error {
                background: linear-gradient(135deg, var(--error-color), #dc2626);
            }

            .gradient-success {
                background: linear-gradient(135deg, var(--success-color), #059669);
            }

            .gradient-info {
                background: linear-gradient(135deg, var(--info-color), #0891b2);
            }

            /* Dynamic status colors */
            .status-active {
                color: var(--success-color);
                background-color: rgba(16, 185, 129, 0.1);
            }

            .status-pending {
                color: var(--warning-color);
                background-color: rgba(245, 158, 11, 0.1);
            }

            .status-completed {
                color: var(--primary-color);
                background-color: rgba(59, 130, 246, 0.1);
            }

            .status-error {
                color: var(--error-color);
                background-color: rgba(239, 68, 68, 0.1);
            }

            .status-warning {
                color: var(--warning-color);
                background-color: rgba(245, 158, 11, 0.1);
            }

            /* Contextual element colors */
            .context-dashboard {
                --primary-color: #3b82f6;
                --accent-color: #10b981;
            }

            .context-users {
                --primary-color: #10b981;
                --accent-color: #3b82f6;
            }

            .context-responsibility {
                --primary-color: #f59e0b;
                --accent-color: #ef4444;
            }

            .context-onboarding {
                --primary-color: #8b5cf6;
                --accent-color: #06b6d4;
            }

            .context-offboarding {
                --primary-color: #ef4444;
                --accent-color: #f59e0b;
            }

            .context-audit {
                --primary-color: #06b6d4;
                --accent-color: #8b5cf6;
            }

            /* Time-based colors */
            .time-morning {
                --primary-color: #f59e0b;
                --accent-color: #f97316;
            }

            .time-afternoon {
                --primary-color: #3b82f6;
                --accent-color: #1d4ed8;
            }

            .time-evening {
                --primary-color: #8b5cf6;
                --accent-color: #7c3aed;
            }

            .time-night {
                --primary-color: #1f2937;
                --accent-color: #374151;
            }

            /* Seasonal colors */
            .season-spring {
                --primary-color: #10b981;
                --accent-color: #84cc16;
            }

            .season-summer {
                --primary-color: #f59e0b;
                --accent-color: #f97316;
            }

            .season-autumn {
                --primary-color: #d97706;
                --accent-color: #dc2626;
            }

            .season-winter {
                --primary-color: #06b6d4;
                --accent-color: #3b82f6;
            }
        `;
        document.head.appendChild(styles);
    }

    registerColorSchemes() {
        // Default scheme
        this.colorSchemes.set('default', {
            primary: '#3b82f6',
            secondary: '#6b7280',
            accent: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            success: '#10b981',
            info: '#06b6d4'
        });

        // Professional scheme
        this.colorSchemes.set('professional', {
            primary: '#1f2937',
            secondary: '#4b5563',
            accent: '#059669',
            warning: '#d97706',
            error: '#dc2626',
            success: '#059669',
            info: '#0891b2'
        });

        // Vibrant scheme
        this.colorSchemes.set('vibrant', {
            primary: '#8b5cf6',
            secondary: '#ec4899',
            accent: '#f59e0b',
            warning: '#f97316',
            error: '#ef4444',
            success: '#10b981',
            info: '#06b6d4'
        });

        // Minimal scheme
        this.colorSchemes.set('minimal', {
            primary: '#6b7280',
            secondary: '#9ca3af',
            accent: '#374151',
            warning: '#d97706',
            error: '#dc2626',
            success: '#059669',
            info: '#0891b2'
        });

        // High contrast scheme
        this.colorSchemes.set('high-contrast', {
            primary: '#000000',
            secondary: '#374151',
            accent: '#059669',
            warning: '#d97706',
            error: '#dc2626',
            success: '#059669',
            info: '#0891b2'
        });
    }

    applyColorScheme(schemeName) {
        const scheme = this.colorSchemes.get(schemeName);
        if (!scheme) return;

        this.currentScheme = schemeName;
        
        // Update CSS custom properties
        const root = document.documentElement;
        Object.entries(scheme).forEach(([key, value]) => {
            root.style.setProperty(`--${key}-color`, value);
        });

        // Store preference
        localStorage.setItem('colorScheme', schemeName);
    }

    setupContextualColors() {
        // Apply contextual colors based on current section
        this.updateContextualColors();
        
        // Listen for section changes
        const originalShowSection = window.showSection;
        window.showSection = (sectionId) => {
            originalShowSection(sectionId);
            this.updateContextualColors(sectionId);
        };
    }

    updateContextualColors(sectionId = null) {
        // Remove existing context classes
        document.body.classList.remove(
            'context-dashboard',
            'context-users',
            'context-responsibility',
            'context-onboarding',
            'context-offboarding',
            'context-audit'
        );

        // Add new context class (but not for dashboard initially)
        if (sectionId && sectionId !== 'dashboard-section') {
            const contextClass = `context-${sectionId.replace('-section', '')}`;
            document.body.classList.add(contextClass);
        }
    }

    updateTimeBasedColors() {
        const hour = new Date().getHours();
        const month = new Date().getMonth();

        // Remove existing time classes
        document.body.classList.remove(
            'time-morning',
            'time-afternoon',
            'time-evening',
            'time-night'
        );

        // Add time-based class
        if (hour >= 6 && hour < 12) {
            document.body.classList.add('time-morning');
        } else if (hour >= 12 && hour < 18) {
            document.body.classList.add('time-afternoon');
        } else if (hour >= 18 && hour < 22) {
            document.body.classList.add('time-evening');
        } else {
            document.body.classList.add('time-night');
        }

        // Remove existing season classes
        document.body.classList.remove(
            'season-spring',
            'season-summer',
            'season-autumn',
            'season-winter'
        );

        // Add season-based class
        if (month >= 2 && month <= 4) {
            document.body.classList.add('season-spring');
        } else if (month >= 5 && month <= 7) {
            document.body.classList.add('season-summer');
        } else if (month >= 8 && month <= 10) {
            document.body.classList.add('season-autumn');
        } else {
            document.body.classList.add('season-winter');
        }
    }

    // Get available color schemes
    getAvailableSchemes() {
        return Array.from(this.colorSchemes.keys());
    }

    // Get current scheme
    getCurrentScheme() {
        return this.currentScheme;
    }

    // Create color picker
    createColorPicker() {
        const picker = document.createElement('div');
        picker.className = 'color-picker';
        picker.innerHTML = `
            <div class="color-picker-header">
                <h3>Esquemas de Colores</h3>
            </div>
            <div class="color-schemes">
                ${Array.from(this.colorSchemes.keys()).map(scheme => `
                    <button class="color-scheme-btn ${scheme === this.currentScheme ? 'active' : ''}" 
                            data-scheme="${scheme}" 
                            onclick="colorManager.applyColorScheme('${scheme}')">
                        <div class="color-preview">
                            <div class="color-dot" style="background: ${this.colorSchemes.get(scheme).primary}"></div>
                            <div class="color-dot" style="background: ${this.colorSchemes.get(scheme).secondary}"></div>
                            <div class="color-dot" style="background: ${this.colorSchemes.get(scheme).accent}"></div>
                        </div>
                        <span>${scheme}</span>
                    </button>
                `).join('')}
            </div>
        `;
        return picker;
    }
}

// Initialize color manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.colorManager = new ColorManager();
    
    // Update time-based colors every hour
    setInterval(() => {
        window.colorManager.updateTimeBasedColors();
    }, 3600000); // 1 hour
    
    // Initial time-based color update
    window.colorManager.updateTimeBasedColors();
});

// Export for global access
window.ColorManager = ColorManager;
