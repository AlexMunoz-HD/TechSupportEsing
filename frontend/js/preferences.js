// Preferences and Theme Manager
class PreferencesManager {
    constructor() {
        this.preferences = null;
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.loadPreferences();
        this.setupEventListeners();
        this.applyTheme();
    }

    // Setup event listeners
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

        // Notification preferences
        const notificationToggles = document.querySelectorAll('.notification-toggle');
        notificationToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.updateNotificationPreference(e.target.name, e.target.checked);
            });
        });

        // Dashboard layout save
        const saveLayoutBtn = document.getElementById('saveDashboardLayout');
        if (saveLayoutBtn) {
            saveLayoutBtn.addEventListener('click', () => {
                this.saveDashboardLayout();
            });
        }

        // Reset layout
        const resetLayoutBtn = document.getElementById('resetDashboardLayout');
        if (resetLayoutBtn) {
            resetLayoutBtn.addEventListener('click', () => {
                this.resetDashboardLayout();
            });
        }

        // Shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleShortcut(e);
        });
    }

    // Load user preferences
    async loadPreferences() {
        try {
            const response = await auth.apiRequest('/preferences');
            const data = await response.json();

            if (response.ok) {
                this.preferences = data.preferences;
                this.currentTheme = this.preferences.theme || 'light';
                this.applyPreferences();
            } else {
                console.error('Error loading preferences:', data.error);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    // Apply preferences to UI
    applyPreferences() {
        if (!this.preferences) return;

        // Apply theme
        this.setTheme(this.preferences.theme);

        // Apply notification preferences
        const notifications = typeof this.preferences.notifications === 'string' 
            ? JSON.parse(this.preferences.notifications || '{}') 
            : this.preferences.notifications || {};
        Object.keys(notifications).forEach(key => {
            const toggle = document.querySelector(`[name="${key}"]`);
            if (toggle) {
                toggle.checked = notifications[key];
            }
        });

        // Apply dashboard layout
        const layout = typeof this.preferences.dashboard_layout === 'string' 
            ? JSON.parse(this.preferences.dashboard_layout || '{}') 
            : this.preferences.dashboard_layout || {};
        if (layout.widgets) {
            this.applyDashboardLayout(layout.widgets);
        }

        // Apply shortcuts
        const shortcuts = typeof this.preferences.shortcuts === 'string' 
            ? JSON.parse(this.preferences.shortcuts || '{}') 
            : this.preferences.shortcuts || {};
        this.updateShortcutsDisplay(shortcuts);
    }

    // Toggle theme
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Set theme
    async setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) return;

        this.currentTheme = theme;
        this.applyTheme();

        // Update theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = theme;
        }

        // Save to backend
        try {
            await auth.apiRequest('/preferences/theme', {
                method: 'PATCH',
                body: JSON.stringify({ theme })
            });
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }

    // Apply theme to document
    applyTheme() {
        const body = document.body;
        const html = document.documentElement;

        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme');
        html.classList.remove('light-theme', 'dark-theme');

        if (this.currentTheme === 'auto') {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const themeClass = prefersDark ? 'dark-theme' : 'light-theme';
            body.classList.add(themeClass);
            html.classList.add(themeClass);
        } else {
            const themeClass = `${this.currentTheme}-theme`;
            body.classList.add(themeClass);
            html.classList.add(themeClass);
        }

        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // Update notification preference
    async updateNotificationPreference(key, value) {
        try {
            await auth.apiRequest('/preferences/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ [key]: value })
            });
        } catch (error) {
            console.error('Error updating notification preference:', error);
        }
    }

    // Save dashboard layout
    async saveDashboardLayout() {
        const widgets = this.getDashboardWidgets();
        
        try {
            await auth.apiRequest('/preferences/dashboard-layout', {
                method: 'PATCH',
                body: JSON.stringify({ dashboard_layout: { widgets } })
            });
            
            alert('Layout guardado exitosamente');
        } catch (error) {
            console.error('Error saving dashboard layout:', error);
            alert('Error al guardar el layout');
        }
    }

    // Reset dashboard layout
    async resetDashboardLayout() {
        if (confirm('¿Estás seguro de que quieres resetear el layout del dashboard?')) {
            const defaultLayout = {
                widgets: [
                    { id: 'stats', position: { x: 0, y: 0 }, size: { w: 4, h: 2 } },
                    { id: 'chart', position: { x: 4, y: 0 }, size: { w: 4, h: 2 } },
                    { id: 'activity', position: { x: 8, y: 0 }, size: { w: 4, h: 2 } },
                    { id: 'newhires', position: { x: 0, y: 2 }, size: { w: 6, h: 3 } },
                    { id: 'assignments', position: { x: 6, y: 2 }, size: { w: 6, h: 3 } }
                ]
            };

            try {
                await auth.apiRequest('/preferences/dashboard-layout', {
                    method: 'PATCH',
                    body: JSON.stringify({ dashboard_layout: defaultLayout })
                });
                
                this.applyDashboardLayout(defaultLayout.widgets);
                alert('Layout reseteado exitosamente');
            } catch (error) {
                console.error('Error resetting dashboard layout:', error);
                alert('Error al resetear el layout');
            }
        }
    }

    // Get dashboard widgets
    getDashboardWidgets() {
        const widgets = [];
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (dashboardSection) {
            const widgetElements = dashboardSection.querySelectorAll('[data-widget]');
            widgetElements.forEach((element, index) => {
                const widgetId = element.getAttribute('data-widget');
                const rect = element.getBoundingClientRect();
                
                widgets.push({
                    id: widgetId,
                    position: { x: index * 4, y: 0 },
                    size: { w: 4, h: 2 }
                });
            });
        }
        
        return widgets;
    }

    // Apply dashboard layout
    applyDashboardLayout(widgets) {
        if (!widgets) return;

        widgets.forEach(widget => {
            const element = document.querySelector(`[data-widget="${widget.id}"]`);
            if (element) {
                element.style.gridColumn = `${widget.position.x + 1} / span ${widget.size.w}`;
                element.style.gridRow = `${widget.position.y + 1} / span ${widget.size.h}`;
            }
        });
    }

    // Update shortcuts display
    updateShortcutsDisplay(shortcuts) {
        const shortcutsList = document.getElementById('shortcutsList');
        if (!shortcutsList) return;

        shortcutsList.innerHTML = '';

        Object.entries(shortcuts).forEach(([key, action]) => {
            const shortcutItem = document.createElement('div');
            shortcutItem.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg';
            shortcutItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-sm font-mono">${key}</kbd>
                    <span class="text-sm text-gray-700">${this.getActionDescription(action)}</span>
                </div>
                <button onclick="editShortcut('${key}')" class="text-blue-600 hover:text-blue-800 text-sm">
                    <i class="fas fa-edit"></i>
                </button>
            `;
            shortcutsList.appendChild(shortcutItem);
        });
    }

    // Get action description
    getActionDescription(action) {
        const descriptions = {
            'focus_search': 'Enfocar búsqueda',
            'new_asset': 'Nuevo asset',
            'audit_page': 'Página de auditoría',
            'responsibility_page': 'Página de cartas',
            'dashboard_page': 'Dashboard',
            'onboarding_page': 'Onboarding',
            'offboarding_page': 'Offboarding',
            'close_modals': 'Cerrar modales',
            'help': 'Ayuda',
            'show_shortcuts': 'Mostrar atajos'
        };
        return descriptions[action] || action;
    }

    // Handle keyboard shortcuts
    handleShortcut(e) {
        if (!this.preferences) return;

        const shortcuts = JSON.parse(this.preferences.shortcuts || '{}');
        const key = this.getKeyString(e);
        
        if (shortcuts[key]) {
            e.preventDefault();
            this.executeAction(shortcuts[key]);
        }
    }

    // Get key string from event
    getKeyString(e) {
        let key = '';
        if (e.ctrlKey) key += 'Ctrl+';
        if (e.altKey) key += 'Alt+';
        if (e.shiftKey) key += 'Shift+';
        if (e.metaKey) key += 'Cmd+';
        
        key += e.key;
        return key;
    }

    // Execute action
    executeAction(action) {
        switch (action) {
            case 'focus_search':
                const searchInput = document.getElementById('assetSearch');
                if (searchInput) searchInput.focus();
                break;
            case 'new_asset':
                if (window.showCreateAssetModal) window.showCreateAssetModal();
                break;
            case 'audit_page':
                if (window.showSection) window.showSection('audit-section');
                break;
            case 'responsibility_page':
                if (window.showSection) window.showSection('responsibility-section');
                break;
            case 'dashboard_page':
                if (window.showSection) window.showSection('dashboard-section');
                break;
            case 'onboarding_page':
                if (window.showSection) window.showSection('onboarding-section');
                break;
            case 'offboarding_page':
                if (window.showSection) window.showSection('offboarding-section');
                break;
            case 'close_modals':
                if (window.app) window.app.closeAllModals();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'show_shortcuts':
                this.showShortcuts();
                break;
        }
    }

    // Show help
    showHelp() {
        alert('Sistema de ayuda en desarrollo');
    }

    // Show shortcuts
    showShortcuts() {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Edit shortcut
    async editShortcut(currentKey) {
        const newKey = prompt('Ingresa la nueva combinación de teclas:', currentKey);
        if (!newKey || newKey === currentKey) return;

        const shortcuts = JSON.parse(this.preferences.shortcuts || '{}');
        const action = shortcuts[currentKey];
        
        // Remove old shortcut
        delete shortcuts[currentKey];
        
        // Add new shortcut
        shortcuts[newKey] = action;

        try {
            await auth.apiRequest('/preferences/shortcuts', {
                method: 'PATCH',
                body: JSON.stringify({ shortcuts })
            });
            
            this.preferences.shortcuts = JSON.stringify(shortcuts);
            this.updateShortcutsDisplay(shortcuts);
            alert('Atajo actualizado exitosamente');
        } catch (error) {
            console.error('Error updating shortcut:', error);
            alert('Error al actualizar el atajo');
        }
    }
}

// Global functions for preferences
function showPreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Ensure preferencesManager exists
        if (!window.preferencesManager) {
            window.preferencesManager = new PreferencesManager();
        }
    }
}

function closePreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closeShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Global functions
window.showPreferencesModal = showPreferencesModal;
window.closePreferencesModal = closePreferencesModal;
window.closeShortcutsModal = closeShortcutsModal;
window.editShortcut = (key) => {
    if (window.preferencesManager) {
        window.preferencesManager.editShortcut(key);
    }
};

// Initialize preferences manager
function initializePreferences() {
    if (!window.preferencesManager) {
        window.preferencesManager = new PreferencesManager();
    }
}
