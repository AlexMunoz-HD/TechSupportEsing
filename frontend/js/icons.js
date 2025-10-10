// Custom Icons System
class IconManager {
    constructor() {
        this.iconMap = new Map();
        this.init();
    }

    init() {
        this.setupStyles();
        this.registerIcons();
        this.applyIcons();
    }

    setupStyles() {
        if (document.getElementById('icon-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'icon-styles';
        styles.textContent = `
            /* Custom icon styles */
            .custom-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.5rem;
                height: 1.5rem;
                border-radius: 0.375rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .custom-icon:hover {
                transform: scale(1.1);
            }

            .custom-icon.large {
                width: 2rem;
                height: 2rem;
            }

            .custom-icon.small {
                width: 1rem;
                height: 1rem;
            }

            /* Section-specific icon colors */
            .icon-dashboard {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
            }

            .icon-users {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .icon-responsibility {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }

            .icon-onboarding {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
            }

            .icon-offboarding {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .icon-audit {
                background: linear-gradient(135deg, #06b6d4, #0891b2);
                color: white;
            }

            .icon-assets {
                background: linear-gradient(135deg, #84cc16, #65a30d);
                color: white;
            }

            .icon-employees {
                background: linear-gradient(135deg, #f97316, #ea580c);
                color: white;
            }

            /* Status icons */
            .icon-status-active {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .icon-status-pending {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }

            .icon-status-completed {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
            }

            .icon-status-error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .icon-status-warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }

            /* Action icons */
            .icon-action-create {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .icon-action-edit {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
            }

            .icon-action-delete {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .icon-action-view {
                background: linear-gradient(135deg, #6b7280, #4b5563);
                color: white;
            }

            /* Dark mode adjustments */
            [data-theme="dark"] .custom-icon {
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .custom-icon:hover {
                    transform: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    registerIcons() {
        // Section icons
        this.iconMap.set('dashboard', {
            icon: 'fas fa-tachometer-alt',
            class: 'icon-dashboard',
            title: 'Dashboard'
        });

        this.iconMap.set('users', {
            icon: 'fas fa-users-cog',
            class: 'icon-users',
            title: 'Gestión de Usuarios'
        });

        this.iconMap.set('responsibility', {
            icon: 'fas fa-file-contract',
            class: 'icon-responsibility',
            title: 'Cartas de Responsabilidad'
        });

        this.iconMap.set('onboarding', {
            icon: 'fas fa-user-plus',
            class: 'icon-onboarding',
            title: 'Onboarding'
        });

        this.iconMap.set('offboarding', {
            icon: 'fas fa-user-minus',
            class: 'icon-offboarding',
            title: 'Offboarding'
        });

        this.iconMap.set('audit', {
            icon: 'fas fa-search',
            class: 'icon-audit',
            title: 'Auditoría'
        });

        this.iconMap.set('assets', {
            icon: 'fas fa-laptop',
            class: 'icon-assets',
            title: 'Activos'
        });

        this.iconMap.set('employees', {
            icon: 'fas fa-user-tie',
            class: 'icon-employees',
            title: 'Empleados'
        });

        // Status icons
        this.iconMap.set('active', {
            icon: 'fas fa-check-circle',
            class: 'icon-status-active',
            title: 'Activo'
        });

        this.iconMap.set('pending', {
            icon: 'fas fa-clock',
            class: 'icon-status-pending',
            title: 'Pendiente'
        });

        this.iconMap.set('completed', {
            icon: 'fas fa-check-double',
            class: 'icon-status-completed',
            title: 'Completado'
        });

        this.iconMap.set('error', {
            icon: 'fas fa-exclamation-triangle',
            class: 'icon-status-error',
            title: 'Error'
        });

        this.iconMap.set('warning', {
            icon: 'fas fa-exclamation-circle',
            class: 'icon-status-warning',
            title: 'Advertencia'
        });

        // Action icons
        this.iconMap.set('create', {
            icon: 'fas fa-plus',
            class: 'icon-action-create',
            title: 'Crear'
        });

        this.iconMap.set('edit', {
            icon: 'fas fa-edit',
            class: 'icon-action-edit',
            title: 'Editar'
        });

        this.iconMap.set('delete', {
            icon: 'fas fa-trash',
            class: 'icon-action-delete',
            title: 'Eliminar'
        });

        this.iconMap.set('view', {
            icon: 'fas fa-eye',
            class: 'icon-action-view',
            title: 'Ver'
        });

        this.iconMap.set('download', {
            icon: 'fas fa-download',
            class: 'icon-action-view',
            title: 'Descargar'
        });

        this.iconMap.set('upload', {
            icon: 'fas fa-upload',
            class: 'icon-action-create',
            title: 'Subir'
        });

        this.iconMap.set('search', {
            icon: 'fas fa-search',
            class: 'icon-action-view',
            title: 'Buscar'
        });

        this.iconMap.set('filter', {
            icon: 'fas fa-filter',
            class: 'icon-action-view',
            title: 'Filtrar'
        });

        this.iconMap.set('sort', {
            icon: 'fas fa-sort',
            class: 'icon-action-view',
            title: 'Ordenar'
        });
    }

    applyIcons() {
        // Apply section icons to navigation
        this.applySectionIcons();
        
        // Apply status icons to status elements
        this.applyStatusIcons();
        
        // Apply action icons to buttons
        this.applyActionIcons();
    }

    applySectionIcons() {
        const navLinks = document.querySelectorAll('nav a, .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href') || link.getAttribute('onclick');
            if (href) {
                const section = this.extractSectionFromHref(href);
                if (section && this.iconMap.has(section)) {
                    // Don't apply icons to dashboard links initially
                    if (section !== 'dashboard') {
                        this.addIconToElement(link, section);
                    }
                }
            }
        });
    }

    applyStatusIcons() {
        const statusElements = document.querySelectorAll('[data-status], .status, .badge');
        statusElements.forEach(element => {
            const status = element.getAttribute('data-status') || 
                          element.textContent.toLowerCase().trim();
            
            if (this.iconMap.has(status)) {
                this.addIconToElement(element, status);
            }
        });
    }

    applyActionIcons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            const text = button.textContent.toLowerCase();
            const action = this.extractActionFromText(text);
            
            if (action && this.iconMap.has(action)) {
                this.addIconToElement(button, action);
            }
        });
    }

    extractSectionFromHref(href) {
        if (href.includes('dashboard')) return 'dashboard';
        if (href.includes('users')) return 'users';
        if (href.includes('responsibility')) return 'responsibility';
        if (href.includes('onboarding')) return 'onboarding';
        if (href.includes('offboarding')) return 'offboarding';
        if (href.includes('audit')) return 'audit';
        if (href.includes('assets')) return 'assets';
        if (href.includes('employees')) return 'employees';
        return null;
    }

    extractActionFromText(text) {
        if (text.includes('nuevo') || text.includes('crear') || text.includes('agregar')) return 'create';
        if (text.includes('editar') || text.includes('modificar')) return 'edit';
        if (text.includes('eliminar') || text.includes('borrar')) return 'delete';
        if (text.includes('ver') || text.includes('mostrar')) return 'view';
        if (text.includes('descargar')) return 'download';
        if (text.includes('subir') || text.includes('cargar')) return 'upload';
        if (text.includes('buscar')) return 'search';
        if (text.includes('filtrar')) return 'filter';
        if (text.includes('ordenar')) return 'sort';
        return null;
    }

    addIconToElement(element, iconKey) {
        const iconData = this.iconMap.get(iconKey);
        if (!iconData) return;

        // Check if icon already exists
        if (element.querySelector('.custom-icon')) return;

        const iconElement = document.createElement('i');
        iconElement.className = `custom-icon ${iconData.class}`;
        iconElement.innerHTML = `<i class="${iconData.icon}"></i>`;
        iconElement.title = iconData.title;

        // Insert icon at the beginning of the element
        element.insertBefore(iconElement, element.firstChild);
    }

    // Create icon element
    createIcon(iconKey, size = 'normal') {
        const iconData = this.iconMap.get(iconKey);
        if (!iconData) return null;

        const iconElement = document.createElement('i');
        iconElement.className = `custom-icon ${iconData.class} ${size}`;
        iconElement.innerHTML = `<i class="${iconData.icon}"></i>`;
        iconElement.title = iconData.title;

        return iconElement;
    }

    // Get all available icons
    getAvailableIcons() {
        return Array.from(this.iconMap.keys());
    }

    // Register custom icon
    registerCustomIcon(key, iconData) {
        this.iconMap.set(key, iconData);
    }
}

// Initialize icon manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.iconManager = new IconManager();
});

// Export for global access
window.IconManager = IconManager;
