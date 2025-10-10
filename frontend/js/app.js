// Main application module
class TechSupportApp {
    constructor() {
        this.currentSection = 'dashboard-section';
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.initializeDefaultSection();
        this.initializePreferences();
    }

    // Setup global event listeners
    setupGlobalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('success', 'Conexión restaurada', 'La aplicación está nuevamente en línea');
        });

        window.addEventListener('offline', () => {
            this.showNotification('warning', 'Sin conexión', 'La aplicación está funcionando sin conexión');
        });
    }

    // Initialize default section
    initializeDefaultSection() {
        if (auth.isAuthenticated()) {
            this.showSection('dashboard-section');
        }
    }

    // Initialize preferences
    initializePreferences() {
        if (auth.isAuthenticated()) {
            initializePreferences();
        }
    }

    // Handle window resize
    handleResize() {
        // Adjust charts and layouts on resize
        if (window.dashboard && window.dashboard.locationChart) {
            window.dashboard.locationChart.resize();
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Alt + 1, 2, 3 for navigation
        if (e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.showSection('dashboard-section');
                    break;
                case '2':
                    e.preventDefault();
                    this.showSection('assets-section');
                    break;
                case '3':
                    e.preventDefault();
                    this.showSection('audit-section');
                    break;
            }
        }
    }

    // Focus search input
    focusSearch() {
        const searchInput = document.getElementById('assetSearch');
        if (searchInput && !searchInput.closest('.hidden')) {
            searchInput.focus();
        }
    }

    // Close all modals
    closeAllModals() {
        const modals = document.querySelectorAll('[id$="Modal"]');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }

    // Show notification
    showNotification(type, title, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden notification-enter`;
        
        const bgColor = {
            'success': 'bg-green-50',
            'error': 'bg-red-50',
            'warning': 'bg-yellow-50',
            'info': 'bg-blue-50'
        }[type] || 'bg-gray-50';

        const iconColor = {
            'success': 'text-green-400',
            'error': 'text-red-400',
            'warning': 'text-yellow-400',
            'info': 'text-blue-400'
        }[type] || 'text-gray-400';

        const icon = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-times-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        }[type] || 'fas fa-bell';

        notification.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="${icon} ${iconColor}"></i>
                    </div>
                    <div class="ml-3 w-0 flex-1 pt-0.5">
                        <p class="text-sm font-medium text-gray-900">${title}</p>
                        <p class="mt-1 text-sm text-gray-500">${message}</p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Show section
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            // Clear any forced styles from previous debug/animations
            section.style.display = '';
            section.style.opacity = '';
            section.style.visibility = '';
            section.style.transform = '';
            section.style.zIndex = '';
            section.style.backgroundColor = '';
            section.style.minHeight = '';
            section.style.padding = '';
            section.style.position = '';
            section.classList.remove('page-transition', 'section-fade-in', 'section-slide-in-right', 'section-slide-in-left', 'section-zoom-in', 'show');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            // Ensure visible if any inline styles lingered
            targetSection.style.display = 'block';
            targetSection.style.opacity = '1';
            targetSection.style.visibility = 'visible';
            this.currentSection = sectionId;
        }
        
        // Update navigation
        this.updateNavigation(sectionId);
        
        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    // Update navigation
    updateNavigation(activeSectionId) {
        // Remove active classes from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('text-primary-600', 'border-primary-500');
            link.classList.add('text-gray-500');
        });
        
        // Add active class to current section link
        const activeLink = document.querySelector(`[onclick="showSection('${activeSectionId}')"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-500');
            activeLink.classList.add('text-primary-600', 'border-primary-500');
        }
    }

    // Global function to load responsibility letters
    loadResponsibilityLetters() {
        console.log('=== LOAD RESPONSIBILITY LETTERS GLOBAL ===');
        console.log('Current section before:', this.currentSection);
        
        // Ensure section is visible first
        const responsibilitySection = document.getElementById('responsibility-section');
        if (responsibilitySection) {
            console.log('Responsibility section found:', responsibilitySection);
            console.log('Current classes:', responsibilitySection.className);
            console.log('Current styles:', {
                display: responsibilitySection.style.display,
                opacity: responsibilitySection.style.opacity,
                visibility: responsibilitySection.style.visibility,
                position: responsibilitySection.style.position,
                zIndex: responsibilitySection.style.zIndex
            });
            
            // Check and fix immediate parent if it's hidden
            const immediateParent = responsibilitySection.parentElement;
            if (immediateParent && immediateParent.classList.contains('hidden')) {
                console.log('Removing hidden class from immediate parent:', immediateParent.className);
                immediateParent.classList.remove('hidden');
                immediateParent.style.display = 'block';
                immediateParent.style.opacity = '1';
                immediateParent.style.visibility = 'visible';
            }
            
            responsibilitySection.classList.remove('hidden');
            responsibilitySection.style.display = 'block';
            responsibilitySection.style.opacity = '1';
            responsibilitySection.style.visibility = 'visible';
            responsibilitySection.style.position = 'relative';
            responsibilitySection.style.zIndex = '999';
            responsibilitySection.style.height = 'auto';
            responsibilitySection.style.minHeight = '100vh';
            
            console.log('After changes - classes:', responsibilitySection.className);
            console.log('After changes - styles:', {
                display: responsibilitySection.style.display,
                opacity: responsibilitySection.style.opacity,
                visibility: responsibilitySection.style.visibility,
                position: responsibilitySection.style.position,
                zIndex: responsibilitySection.style.zIndex,
                height: responsibilitySection.style.height,
                minHeight: responsibilitySection.style.minHeight
            });
            console.log('Responsibility section made visible');
            
            // Check if section is actually visible
            setTimeout(() => {
                const rect = responsibilitySection.getBoundingClientRect();
                console.log('Section bounding rect:', rect);
                console.log('Section is visible:', rect.width > 0 && rect.height > 0);
                
                // Check if any element is covering this section
                const elementsAtCenter = document.elementsFromPoint(
                    rect.left + rect.width / 2, 
                    rect.top + rect.height / 2
                );
                console.log('Elements at section center:', elementsAtCenter.map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className
                })));
            }, 100);
        } else {
            console.error('Responsibility section NOT FOUND in DOM!');
        }
        
        // Load data
        if (window.responsibilityManager) {
            console.log('ResponsibilityManager exists, calling loadLetters...');
            window.responsibilityManager.loadLetters();
        } else {
            console.log('ResponsibilityManager not found, trying to initialize...');
            if (window.ResponsibilityManager) {
                console.log('ResponsibilityManager class available, creating instance...');
                window.responsibilityManager = new window.ResponsibilityManager();
                window.responsibilityManager.loadLetters();
            } else {
                console.log('ResponsibilityManager class not available');
            }
        }
        console.log('Current section after:', this.currentSection);
        console.log('=== END LOAD RESPONSIBILITY LETTERS GLOBAL ===');
    }

    // Load section-specific data
    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard-section':
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
                break;
            case 'audit-section':
                if (window.auditManager) {
                    window.auditManager.loadAuditLogs();
                } else {
                    loadAuditLogs();
                }
                break;
            case 'responsibility-section':
                console.log('=== LOADING RESPONSIBILITY SECTION DEBUG ===');
                
                // Force responsibility section visibility
                const responsibilitySection = document.getElementById('responsibility-section');
                if (responsibilitySection) {
                    responsibilitySection.classList.remove('hidden');
                    responsibilitySection.style.display = 'block';
                    responsibilitySection.style.opacity = '1';
                    responsibilitySection.style.visibility = 'visible';
                    console.log('Forced responsibility section visibility');
                }
                
                // Don't load data here - let the onclick handler do it
                console.log('Responsibility section visibility set, data loading handled by onclick');
                console.log('=== END LOADING RESPONSIBILITY SECTION DEBUG ===');
                break;
            case 'onboarding-section':
                console.log('=== LOADING ONBOARDING SECTION DEBUG ===');
                console.log('window.onboardingManager:', window.onboardingManager);
                console.log('window.OnboardingManager:', window.OnboardingManager);
                
                // Force onboarding section visibility
                const onboardingSection = document.getElementById('onboarding-section');
                if (onboardingSection) {
                    onboardingSection.classList.remove('hidden');
                    onboardingSection.style.display = 'block';
                    onboardingSection.style.opacity = '1';
                    onboardingSection.style.visibility = 'visible';
                    console.log('Forced onboarding section visibility');
                }
                
                if (window.onboardingManager) {
                    console.log('OnboardingManager exists, calling loadProcesses...');
                    window.onboardingManager.loadProcesses();
                } else {
                    console.log('OnboardingManager not found, trying to initialize...');
                    // Try to initialize if not available
                    if (window.OnboardingManager) {
                        console.log('OnboardingManager class available, creating instance...');
                        window.onboardingManager = new window.OnboardingManager();
                        window.onboardingManager.loadProcesses();
                    } else {
                        console.log('OnboardingManager class not available, calling loadOnboarding...');
                        loadOnboarding();
                    }
                }
                console.log('=== END LOADING ONBOARDING SECTION DEBUG ===');
                break;
            case 'offboarding-section':
                if (window.offboardingManager) {
                    window.offboardingManager.loadProcesses();
                } else {
                    // Try to initialize if not available
                    if (window.OffboardingManager) {
                        window.offboardingManager = new window.OffboardingManager();
                        window.offboardingManager.loadProcesses();
                    } else {
                        loadOffboarding();
                    }
                }
                break;
            case 'jira-employees-section':
                if (window.offboardingManager) {
                    window.offboardingManager.loadJiraEmployees();
                } else {
                    // Try to initialize if not available
                    if (window.OffboardingManager) {
                        window.offboardingManager = new window.OffboardingManager();
                        window.offboardingManager.loadJiraEmployees();
                    } else {
                        loadJiraEmployees();
                    }
                }
                break;
        }
    }

    // Utility functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = 'Ha ocurrido un error inesperado';
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        this.showNotification('error', 'Error', message);
    }

    // API helper with error handling
    async apiRequest(url, options = {}) {
        try {
            const response = await auth.apiRequest(url, options);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Request failed');
            }
            
            return response;
        } catch (error) {
            this.handleError(error, 'API Request');
            throw error;
        }
    }
}

// Initialize application
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new TechSupportApp();
    
    // Make app globally available
    window.app = app;
    
    // Override the global showSection function
    window.showSection = function(sectionId) {
        app.showSection(sectionId);
    };
});

// Load onboarding processes (fallback function)
function loadOnboarding() {
    console.log('=== LOAD ONBOARDING FALLBACK ===');
    if (window.onboardingManager) {
        console.log('OnboardingManager found in fallback, calling loadProcesses...');
        window.onboardingManager.loadProcesses();
    } else {
        console.log('OnboardingManager not found in fallback, trying to create...');
        if (window.OnboardingManager) {
            window.onboardingManager = new window.OnboardingManager();
            window.onboardingManager.loadProcesses();
        } else {
            console.error('OnboardingManager class not available');
            showNotification('error', 'Error', 'No se pudo inicializar el gestor de onboarding');
        }
    }
    console.log('=== END LOAD ONBOARDING FALLBACK ===');
}

// Load offboarding processes (fallback function)
function loadOffboarding() {
    console.log('=== LOAD OFFBOARDING FALLBACK ===');
    if (window.offboardingManager) {
        console.log('OffboardingManager found in fallback, calling loadProcesses...');
        window.offboardingManager.loadProcesses();
    } else {
        console.log('OffboardingManager not found in fallback, trying to create...');
        if (window.OffboardingManager) {
            window.offboardingManager = new window.OffboardingManager();
            window.offboardingManager.loadProcesses();
        } else {
            console.error('OffboardingManager class not available');
            showNotification('error', 'Error', 'No se pudo inicializar el gestor de offboarding');
        }
    }
    console.log('=== END LOAD OFFBOARDING FALLBACK ===');
}

// Load responsibility letters (fallback function)
function loadResponsibilityLetters() {
    console.log('=== LOAD RESPONSIBILITY LETTERS FALLBACK ===');
    if (window.responsibilityManager) {
        console.log('ResponsibilityManager found in fallback, calling loadLetters...');
        window.responsibilityManager.loadLetters();
    } else {
        console.log('ResponsibilityManager not found in fallback, trying to create...');
        if (window.ResponsibilityManager) {
            window.responsibilityManager = new window.ResponsibilityManager();
            window.responsibilityManager.loadLetters();
        } else {
            console.error('ResponsibilityManager class not available');
            showNotification('error', 'Error', 'No se pudo inicializar el gestor de cartas de responsabilidad');
        }
    }
    console.log('=== END LOAD RESPONSIBILITY LETTERS FALLBACK ===');
}

// Global utility functions
function showNotification(type, title, message) {
    if (window.app) {
        window.app.showNotification(type, title, message);
    }
}

function formatDate(dateString) {
    if (window.app) {
        return window.app.formatDate(dateString);
    }
    return new Date(dateString).toLocaleDateString();
}

function formatFileSize(bytes) {
    if (window.app) {
        return window.app.formatFileSize(bytes);
    }
    return bytes + ' Bytes';
}

// Global function for responsibility letters
function loadResponsibilityLetters() {
    if (window.app) {
        window.app.loadResponsibilityLetters();
    }
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        window.app.handleError(event.reason, 'Unhandled Promise Rejection');
    }
});

// Handle global errors
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.handleError(event.error, 'Global Error');
    }
});
