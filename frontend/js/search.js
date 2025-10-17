// Global Search with Autocomplete
class SearchManager {
    constructor() {
        this.searchInput = null;
        this.suggestionsContainer = null;
        this.currentSuggestions = [];
        this.selectedIndex = -1;
        this.isOpen = false;
        
        // Define searchable items with their navigation targets
        this.searchItems = [
            {
                title: 'Onboarding',
                description: 'Gestión de incorporación de empleados',
                icon: 'fas fa-user-plus',
                action: () => this.navigateToSection('secure-onboarding-section'),
                keywords: ['onboarding', 'incorporacion', 'empleados', 'nuevos']
            },
            {
                title: 'Offboarding',
                description: 'Gestión de desincorporación de empleados',
                icon: 'fas fa-user-minus',
                action: () => this.navigateToSection('offboarding-section'),
                keywords: ['offboarding', 'desincorporacion', 'salida', 'empleados']
            },
            {
                title: 'Dashboard',
                description: 'Panel principal con estadísticas',
                icon: 'fas fa-chart-pie',
                action: () => this.navigateToSection('dashboard-section'),
                keywords: ['dashboard', 'panel', 'estadisticas', 'principal']
            },
            {
                title: 'Usuarios',
                description: 'Gestión de usuarios del sistema',
                icon: 'fas fa-users',
                action: () => this.navigateToSection('users-section'),
                keywords: ['usuarios', 'users', 'gestion', 'sistema']
            },
            {
                title: 'Cartas de Responsabilidad',
                description: 'Gestión de cartas de responsabilidad',
                icon: 'fas fa-file-contract',
                action: () => this.navigateToSection('responsibility-section'),
                keywords: ['cartas', 'responsabilidad', 'letters', 'contratos']
            },
            {
                title: 'Auditoría',
                description: 'Registro de auditoría del sistema',
                icon: 'fas fa-clipboard-list',
                action: () => this.navigateToSection('audit-section'),
                keywords: ['auditoria', 'audit', 'registro', 'logs']
            }
        ];
    }

    init() {
        this.searchInput = document.getElementById('globalSearch');
        this.suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (!this.searchInput || !this.suggestionsContainer) {
            console.warn('Search elements not found');
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showSuggestions();
            }
        });

        this.searchInput.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => {
                this.hideSuggestions();
            }, 200);
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }

    handleInput(value) {
        const query = value.toLowerCase().trim();
        
        if (query.length === 0) {
            this.hideSuggestions();
            return;
        }

        // Filter suggestions based on query
        this.currentSuggestions = this.searchItems.filter(item => {
            return item.title.toLowerCase().includes(query) ||
                   item.description.toLowerCase().includes(query) ||
                   item.keywords.some(keyword => keyword.includes(query));
        });

        if (this.currentSuggestions.length > 0) {
            this.showSuggestions();
        } else {
            this.hideSuggestions();
        }
    }

    showSuggestions() {
        if (this.currentSuggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.renderSuggestions();
        this.suggestionsContainer.classList.remove('hidden');
        this.isOpen = true;
        this.selectedIndex = -1;
    }

    hideSuggestions() {
        this.suggestionsContainer.classList.add('hidden');
        this.isOpen = false;
        this.selectedIndex = -1;
    }

    renderSuggestions() {
        const suggestionsHTML = this.currentSuggestions.map((item, index) => `
            <div class="suggestion-item px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150" 
                 data-index="${index}">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <i class="${item.icon} text-blue-500 text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">${item.title}</div>
                        <div class="text-xs text-gray-500 truncate">${item.description}</div>
                    </div>
                </div>
            </div>
        `).join('');

        this.suggestionsContainer.innerHTML = suggestionsHTML;

        // Add click listeners to suggestions
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectSuggestion(index);
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
        });
    }

    handleKeydown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentSuggestions.length - 1);
                this.updateSelection();
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.selectedIndex);
                }
                break;
            
            case 'Escape':
                e.preventDefault();
                this.hideSuggestions();
                this.searchInput.blur();
                break;
        }
    }

    updateSelection() {
        const items = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('bg-blue-50', 'border-blue-200');
                item.classList.remove('hover:bg-gray-50');
            } else {
                item.classList.remove('bg-blue-50', 'border-blue-200');
                item.classList.add('hover:bg-gray-50');
            }
        });
    }

    selectSuggestion(index) {
        if (index < 0 || index >= this.currentSuggestions.length) return;

        const selectedItem = this.currentSuggestions[index];
        console.log('🎯 Selected suggestion:', selectedItem.title);
        
        // Update input value
        this.searchInput.value = selectedItem.title;
        
        // Hide suggestions
        this.hideSuggestions();
        
        // Execute the action
        selectedItem.action();
        
        // Clear the search input after navigation
        setTimeout(() => {
            this.searchInput.value = '';
        }, 100);
    }

    navigateToSection(sectionId) {
        
        // First, try to use the global showSection function
        if (typeof window.showSection === 'function') {
            try {
                window.showSection(sectionId);
                return;
            } catch (error) {
                console.warn('⚠️ window.showSection failed:', error);
            }
        }
        
        // Fallback: manual navigation
        console.log('🔄 Using fallback navigation');
        this.fallbackNavigation(sectionId);
    }

    fallbackNavigation(sectionId) {
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            section.style.display = 'none';
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.style.display = 'block';
            targetSection.style.visibility = 'visible';
            targetSection.style.opacity = '1';
            
            // Update navigation state
            this.updateNavigationState(sectionId);
            
            // Load section-specific data if needed
            this.loadSectionData(sectionId);
        } else {
            console.error('❌ Section not found:', sectionId);
            alert(`Error: No se pudo encontrar la sección "${sectionId}". Por favor, verifica que la página esté completamente cargada.`);
        }
    }

    updateNavigationState(sectionId) {
        // Update navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('text-primary-600', 'border-primary-500');
            link.classList.add('text-gray-500');
        });
        
        // Update active link
        const activeLink = document.querySelector(`[onclick*="showSection('${sectionId}')"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-500');
            activeLink.classList.add('text-primary-600', 'border-primary-500');
        }
    }

    loadSectionData(sectionId) {
        // Load specific data for each section
        switch (sectionId) {
            case 'audit-section':
                if (typeof loadAuditLogs === 'function') {
                    loadAuditLogs();
                }
                break;
            case 'responsibility-section':
                if (typeof loadEmployees === 'function') {
                    loadEmployees();
                }
                break;
            case 'offboarding-section':
                if (typeof loadOffboarding === 'function') {
                    loadOffboarding();
                }
                break;
            case 'users-section':
                if (window.userManager && window.userManager.loadUsers) {
                    window.userManager.loadUsers();
                }
                break;
            case 'secure-onboarding-section':
                if (window.onboardingManager && window.onboardingManager.loadProcesses) {
                    window.onboardingManager.loadProcesses();
                }
                break;
        }
    }

    // Public method to focus search
    focus() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    // Public method to clear search
    clear() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.hideSuggestions();
        }
    }
}

// Initialize search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
    window.searchManager.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}
