// Theme Management System
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.setupThemeListeners();
    }

    getStoredTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        
        // Update theme toggle button
        const toggleButton = document.getElementById('themeToggle');
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Show notification
        if (window.showToast) {
            window.showToast('success', 'Tema cambiado', `Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`);
        }
    }

    createThemeToggle() {
        // Check if toggle already exists
        if (document.getElementById('themeToggle')) return;

        const header = document.querySelector('header');
        if (!header) return;

        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <i class="fas fa-moon"></i>
            <span class="sr-only">Cambiar tema</span>
        `;
        themeToggle.title = 'Cambiar tema';
        themeToggle.onclick = () => this.toggleTheme();

        // Insert before user dropdown
        const userDropdown = header.querySelector('.relative');
        if (userDropdown) {
            header.insertBefore(themeToggle, userDropdown);
        }
    }

    setupThemeListeners() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                if (this.getStoredTheme() === 'auto') {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
});

// Export for global access
window.ThemeManager = ThemeManager;
