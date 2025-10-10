// Keyboard Shortcuts System
class ShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.modifiers = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.registerDefaultShortcuts();
    }

    setupEventListeners() {
        // Track modifier keys
        document.addEventListener('keydown', (e) => {
            this.updateModifiers(e);
            this.handleKeydown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.updateModifiers(e);
        });

        // Prevent shortcuts in input fields (optional)
        document.addEventListener('keydown', (e) => {
            if (this.isInputElement(e.target)) {
                // Allow some shortcuts in input fields
                const allowedInInput = ['Escape', 'F1'];
                if (!allowedInInput.includes(e.key)) {
                    return;
                }
            }
        });
    }

    updateModifiers(e) {
        this.modifiers.ctrl = e.ctrlKey;
        this.modifiers.alt = e.altKey;
        this.modifiers.shift = e.shiftKey;
        this.modifiers.meta = e.metaKey;
    }

    isInputElement(element) {
        const inputTypes = ['input', 'textarea', 'select'];
        return inputTypes.includes(element.tagName.toLowerCase()) || 
               element.contentEditable === 'true';
    }

    handleKeydown(e) {
        const key = e.key;
        const shortcutKey = this.getShortcutKey(key);
        
        if (this.shortcuts.has(shortcutKey)) {
            const shortcut = this.shortcuts.get(shortcutKey);
            e.preventDefault();
            this.executeShortcut(shortcut);
        }
    }

    getShortcutKey(key) {
        const parts = [];
        
        if (this.modifiers.ctrl) parts.push('Ctrl');
        if (this.modifiers.alt) parts.push('Alt');
        if (this.modifiers.shift) parts.push('Shift');
        if (this.modifiers.meta) parts.push('Meta');
        
        parts.push(key);
        return parts.join('+');
    }

    register(key, callback, description = '') {
        this.shortcuts.set(key, {
            callback,
            description,
            key
        });
    }

    unregister(key) {
        this.shortcuts.delete(key);
    }

    executeShortcut(shortcut) {
        try {
            shortcut.callback();
            
            // Show feedback for shortcuts
            if (window.showToast) {
                window.showToast('info', 'Atajo ejecutado', shortcut.description, 2000);
            }
        } catch (error) {
            console.error('Error executing shortcut:', error);
        }
    }

    registerDefaultShortcuts() {
        // Navigation shortcuts
        this.register('Ctrl+k', () => {
            const searchInput = document.querySelector('#globalSearch, input[type="search"], input[placeholder*="buscar" i]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 'Enfocar búsqueda');

        this.register('Ctrl+d', () => {
            window.showSection('dashboard-section');
        }, 'Ir al Dashboard');

        this.register('Ctrl+u', () => {
            window.showSection('users-section');
        }, 'Ir a Usuarios');

        this.register('Ctrl+r', () => {
            window.showSection('responsibility-section');
        }, 'Ir a Cartas de Responsabilidad');

        this.register('Ctrl+o', () => {
            window.showSection('onboarding-section');
        }, 'Ir a Onboarding');

        this.register('Ctrl+f', () => {
            window.showSection('offboarding-section');
        }, 'Ir a Offboarding');

        this.register('Ctrl+a', () => {
            window.showSection('audit-section');
        }, 'Ir a Auditoría');

        // Theme toggle
        this.register('Ctrl+t', () => {
            if (window.themeManager) {
                window.themeManager.toggleTheme();
            }
        }, 'Cambiar tema');

        // Modal shortcuts
        this.register('Escape', () => {
            // Close any open modals
            const modals = document.querySelectorAll('.modal.show, .modal[style*="display: block"]');
            modals.forEach(modal => {
                const closeBtn = modal.querySelector('.close, [data-dismiss="modal"]');
                if (closeBtn) closeBtn.click();
            });
        }, 'Cerrar modales');

        // Help shortcut
        this.register('F1', () => {
            this.showShortcutsHelp();
        }, 'Mostrar ayuda de atajos');

        // Refresh data
        this.register('Ctrl+r', () => {
            if (window.location.reload) {
                window.location.reload();
            }
        }, 'Recargar página');

        // New item shortcuts
        this.register('Ctrl+n', () => {
            // Try to find and click "New" buttons
            const newButtons = document.querySelectorAll('button:contains("Nuevo"), button:contains("New"), button:contains("Agregar")');
            if (newButtons.length > 0) {
                newButtons[0].click();
            }
        }, 'Crear nuevo elemento');
    }

    showShortcutsHelp() {
        const shortcuts = Array.from(this.shortcuts.values());
        
        const helpContent = `
            <div class="shortcuts-help">
                <h3 class="text-lg font-semibold mb-4">Atajos de Teclado Disponibles</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${shortcuts.map(shortcut => `
                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span class="text-sm">${shortcut.description}</span>
                            <kbd class="px-2 py-1 bg-gray-200 text-xs rounded">${shortcut.key}</kbd>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Create modal for shortcuts help
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content max-w-4xl">
                <div class="modal-header">
                    <h2 class="modal-title">Atajos de Teclado</h2>
                    <button class="close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${helpContent}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 10);
    }

    getShortcuts() {
        return Array.from(this.shortcuts.values());
    }
}

// Initialize shortcut manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.shortcutManager = new ShortcutManager();
});

// Export for global access
window.ShortcutManager = ShortcutManager;
