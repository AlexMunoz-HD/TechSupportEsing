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
        // Try to focus the global search first
        if (window.searchManager) {
            window.searchManager.focus();
        } else {
            // Fallback to asset search
            const searchInput = document.getElementById('assetSearch');
            if (searchInput && !searchInput.closest('.hidden')) {
                searchInput.focus();
            }
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
            
            // Fix section position if it's inside dashboard-container
            if (sectionId === 'dashboard-section') {
                // Initialize dashboard when showing dashboard section
                setTimeout(() => {
                    if (typeof initializeDashboard === 'function') {
                        initializeDashboard();
                    } else if (window.dashboardManager) {
                        window.dashboardManager.loadDashboardData();
                    } else {
                        // Fallback: load demo data if dashboard manager is not available
                        loadDashboardDemoData();
                    }
                }, 100);
            } else if (sectionId === 'audit-section') {
                this.fixAuditSectionPosition(targetSection);
            } else if (sectionId === 'onboarding-section') {
                this.fixOnboardingSectionPosition(targetSection);
            } else if (sectionId === 'offboarding-section') {
                this.fixOffboardingSectionPosition(targetSection);
            } else if (sectionId === 'profile-section') {
                createProfileOverlay();
            }
        }
        
        // Update navigation
        this.updateNavigation(sectionId);
        
        // Reinitialize dropdowns after section change
        setTimeout(() => {
            initializeDropdowns();
        }, 100);
        
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

    // Fix audit section position if it's inside dashboard-container
    fixAuditSectionPosition(auditSection) {
        
        // First, hide all other sections
        document.querySelectorAll('.section').forEach(section => {
            if (section.id !== 'audit-section') {
                section.classList.add('hidden');
                section.style.display = 'none';
            }
        });
        
        // Create a completely new audit section outside everything
        const existingAuditSection = document.getElementById('audit-section');
        if (existingAuditSection) {
            existingAuditSection.remove();
        }
        
        // Create new audit container
        const auditContainer = document.createElement('div');
        auditContainer.id = 'audit-section';
        auditContainer.className = 'section';
        auditContainer.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            min-height: calc(100vh - 64px) !important;
            width: 100% !important;
            position: fixed !important;
            top: 64px !important;
            left: 0 !important;
            z-index: 10 !important;
            background: white !important;
            padding: 20px !important;
            overflow-y: auto !important;
        `;
        
        // Create the audit content
        auditContainer.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="bg-white rounded-lg shadow card-shadow">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">Log de Auditoría</h3>
                        <button onclick="exportAuditLogs()" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                            <i class="fas fa-download mr-2"></i>Exportar
                        </button>
                    </div>
                    <div class="p-6">
                        <!-- Filters -->
                        <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select id="auditActionFilter" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="">Todas las acciones</option>
                                <option value="LOGIN">Login</option>
                                <option value="ASSET_ASSIGNED">Asset Asignado</option>
                                <option value="ASSET_RETURNED">Asset Devuelto</option>
                                <option value="USER_CREATED">Usuario Creado</option>
                            </select>
                            <select id="auditLocationFilter" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="">Todas las ubicaciones</option>
                                <option value="MX">México</option>
                                <option value="CL">Chile</option>
                                <option value="REMOTO">Remoto</option>
                            </select>
                            <input type="date" id="auditStartDate" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <input type="date" id="auditEndDate" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                        </div>
                        <!-- Audit Table -->
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurso</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody id="auditTableBody" class="bg-white divide-y divide-gray-200">
                                    <!-- Audit logs will be populated here -->
                                </tbody>
                            </table>
                        </div>
                        <!-- Pagination -->
                        <div id="auditPagination" class="mt-6 flex justify-between items-center">
                            <!-- Pagination will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.className = 'fixed top-20 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-1001';
        closeButton.onclick = () => {
            auditContainer.remove();
            closeButton.remove();
            // Show dashboard
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection) {
                dashboardSection.classList.remove('hidden');
                dashboardSection.style.display = 'block';
            }
        };
        
        // Add to body
        document.body.appendChild(auditContainer);
        document.body.appendChild(closeButton);
        
        // Load audit data
        setTimeout(() => {
            if (typeof window.loadAuditLogs === 'function') {
                window.loadAuditLogs();
            } else if (window.auditManager) {
                window.auditManager.loadAuditLogs();
            }
        }, 100);

        // Initialize dropdown functionality for audit overlay
        setTimeout(() => {
            initializeDropdowns();
        }, 200);
        
    }

    // Fix onboarding section position if it's inside dashboard-container
    fixOnboardingSectionPosition(onboardingSection) {
        
        try {
            // First, hide all other sections
            document.querySelectorAll('.section').forEach(section => {
                if (section.id !== 'onboarding-section') {
                    section.classList.add('hidden');
                    section.style.display = 'none';
                }
            });
            
            // Create a completely new onboarding section outside everything
            const existingOnboardingSection = document.getElementById('onboarding-section');
            if (existingOnboardingSection) {
                console.log('🗑️ Removing existing onboarding section');
                existingOnboardingSection.remove();
            }
            
            // Create new onboarding container
            const onboardingContainer = document.createElement('div');
            onboardingContainer.id = 'onboarding-section';
            onboardingContainer.className = 'section';
            onboardingContainer.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                height: calc(100vh - 64px) !important;
                width: 100% !important;
                position: fixed !important;
                top: 64px !important;
                left: 0 !important;
                z-index: 10 !important;
                background: white !important;
                padding: 20px !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
            `;
            
            // Create the onboarding content
            onboardingContainer.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <!-- Header with Gradient -->
                    <div class="mb-8 relative">
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h1 class="text-4xl font-bold mb-2">🚀 Procesos de Onboarding</h1>
                                    <p class="text-blue-100 text-lg">Gestiona el proceso de incorporación de nuevos empleados</p>
                                </div>
                                <div class="hidden md:block">
                                    <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                        <i class="fas fa-user-plus text-3xl text-white"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-blue-600 mb-1">Pendientes</p>
                                    <p class="text-3xl font-bold text-blue-800" id="pendingOnboarding">12</p>
                                    <p class="text-xs text-blue-500 mt-1">Esperando inicio</p>
                                </div>
                                <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <i class="fas fa-clock text-white text-lg"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-green-600 mb-1">Enviadas</p>
                                    <p class="text-3xl font-bold text-green-800" id="sentOnboarding">8</p>
                                    <p class="text-xs text-green-500 mt-1">En proceso</p>
                                </div>
                                <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <i class="fas fa-paper-plane text-white text-lg"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-yellow-600 mb-1">No Firmadas</p>
                                    <p class="text-3xl font-bold text-yellow-800" id="unsignedOnboarding">5</p>
                                    <p class="text-xs text-yellow-500 mt-1">Requieren atención</p>
                                </div>
                                <div class="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <i class="fas fa-exclamation-triangle text-white text-lg"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-red-600 mb-1">Atrasadas</p>
                                    <p class="text-3xl font-bold text-red-800" id="overdueOnboarding">3</p>
                                    <p class="text-xs text-red-500 mt-1">Urgente</p>
                                </div>
                                <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <i class="fas fa-exclamation-circle text-white text-lg"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Actions Bar -->
                    <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div class="flex flex-wrap items-center gap-3">
                                <button onclick="createNewOnboarding()" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    <i class="fas fa-plus mr-2"></i>
                                    Nuevo Onboarding
                                </button>
                                <button onclick="exportOnboarding()" class="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    <i class="fas fa-download mr-2"></i>
                                    Exportar
                                </button>
                                <button onclick="bulkActions()" class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    <i class="fas fa-tasks mr-2"></i>
                                    Acciones Masivas
                                </button>
                            </div>
                            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div class="relative">
                                    <input type="text" id="onboardingSearch" placeholder="Buscar empleado..." class="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                <select id="onboardingFilter" class="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                    <option value="">Todos los estados</option>
                                    <option value="pending">Pendientes</option>
                                    <option value="sent">Enviadas</option>
                                    <option value="unsigned">No Firmadas</option>
                                    <option value="overdue">Atrasadas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Onboarding Table -->
                    <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-table mr-2 text-blue-600"></i>
                                Lista de Procesos de Onboarding
                            </h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <i class="fas fa-user mr-2 text-gray-400"></i>
                                                Empleado
                                            </div>
                                        </th>
                                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <i class="fas fa-calendar mr-2 text-gray-400"></i>
                                                Fecha Inicio
                                            </div>
                                        </th>
                                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <i class="fas fa-flag mr-2 text-gray-400"></i>
                                                Estado
                                            </div>
                                        </th>
                                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <i class="fas fa-chart-line mr-2 text-gray-400"></i>
                                                Progreso
                                            </div>
                                        </th>
                                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <i class="fas fa-cogs mr-2 text-gray-400"></i>
                                                Acciones
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="onboardingTableBody" class="bg-white divide-y divide-gray-200">
                                    <!-- Sample data with enhanced styling -->
                                    <tr class="hover:bg-blue-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-12 w-12">
                                                    <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                                        <span class="text-sm font-bold text-white">JD</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-semibold text-gray-900">Juan Díaz</div>
                                                    <div class="text-sm text-gray-500">juan.diaz@empresa.com</div>
                                                    <div class="text-xs text-blue-600 font-medium">Desarrollador Senior</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">15/01/2025</div>
                                            <div class="text-xs text-gray-500">Hace 3 días</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300">
                                                <i class="fas fa-clock mr-1"></i>
                                                Pendiente
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm" style="width: 60%"></div>
                                                </div>
                                                <span class="text-sm font-semibold text-gray-700">60%</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div class="flex items-center space-x-2">
                                                <button onclick="viewOnboarding(1)" class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                                    <i class="fas fa-eye mr-1"></i>Ver
                                                </button>
                                                <button onclick="editOnboarding(1)" class="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                                    <i class="fas fa-edit mr-1"></i>Editar
                                                </button>
                                                <button onclick="sendReminder(1)" class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-xs font-medium">
                                                    <i class="fas fa-bell mr-1"></i>Recordar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-green-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-12 w-12">
                                                    <div class="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                                        <span class="text-sm font-bold text-white">MR</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-semibold text-gray-900">María Rodríguez</div>
                                                    <div class="text-sm text-gray-500">maria.rodriguez@empresa.com</div>
                                                    <div class="text-xs text-green-600 font-medium">Diseñadora UX</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">10/01/2025</div>
                                            <div class="text-xs text-gray-500">Hace 8 días</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                                                <i class="fas fa-check-circle mr-1"></i>
                                                Completado
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                                    <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm" style="width: 100%"></div>
                                                </div>
                                                <span class="text-sm font-semibold text-gray-700">100%</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div class="flex items-center space-x-2">
                                                <button onclick="viewOnboarding(2)" class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                                    <i class="fas fa-eye mr-1"></i>Ver
                                                </button>
                                                <button onclick="downloadCertificate(2)" class="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                                    <i class="fas fa-certificate mr-1"></i>Certificado
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.className = 'fixed top-20 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-1001';
            closeButton.onclick = () => {
                onboardingContainer.remove();
                closeButton.remove();
                // Show dashboard
                const dashboardSection = document.getElementById('dashboard-section');
                if (dashboardSection) {
                    dashboardSection.classList.remove('hidden');
                    dashboardSection.style.display = 'block';
                }
            };
            
            // Add to body
            document.body.appendChild(onboardingContainer);
            document.body.appendChild(closeButton);
            
            
            // Load onboarding data
            setTimeout(() => {
                if (typeof window.loadOnboarding === 'function') {
                    window.loadOnboarding();
                } else if (window.onboardingManager) {
                    window.onboardingManager.loadOnboarding();
                } else {
                    console.log('⚠️ No onboarding loader found');
                }
            }, 100);

            // Add global functions for onboarding actions
            window.createNewOnboarding = function() {
                alert('Función: Crear nuevo proceso de onboarding');
            };

            window.exportOnboarding = function() {
                alert('Función: Exportar datos de onboarding');
            };

            window.viewOnboarding = function(id) {
                alert(`Función: Ver detalles del onboarding ${id}`);
            };

            window.editOnboarding = function(id) {
                alert(`Función: Editar onboarding ${id}`);
            };

            window.sendReminder = function(id) {
                alert(`Función: Enviar recordatorio para onboarding ${id}`);
            };

            window.downloadCertificate = function(id) {
                alert(`Función: Descargar certificado del onboarding ${id}`);
            };
            
            
        } catch (error) {
            console.error('❌ Error in fixOnboardingSectionPosition:', error);
        }
    }

    // Fix offboarding section position if it's inside dashboard-container
    fixOffboardingSectionPosition(offboardingSection) {
        
        // First, hide all other sections
        document.querySelectorAll('.section').forEach(section => {
            if (section.id !== 'offboarding-section') {
                section.classList.add('hidden');
                section.style.display = 'none';
            }
        });
        
        // Create a completely new offboarding section outside everything
        const existingOffboardingSection = document.getElementById('offboarding-section');
        if (existingOffboardingSection) {
            existingOffboardingSection.remove();
        }
        
        // Create new offboarding container
        const offboardingContainer = document.createElement('div');
        offboardingContainer.id = 'offboarding-section';
        offboardingContainer.className = 'section';
        offboardingContainer.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            min-height: calc(100vh - 64px) !important;
            width: 100% !important;
            position: fixed !important;
            top: 64px !important;
            left: 0 !important;
            z-index: 1000 !important;
            background: white !important;
            padding: 20px !important;
            overflow-y: auto !important;
        `;
        
        // Create the offboarding content
        offboardingContainer.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="bg-white rounded-lg shadow card-shadow">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">Procesos de Offboarding</h3>
                        <button onclick="window.showSection('dashboard-section')" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                            <i class="fas fa-arrow-left mr-2"></i>Volver al Dashboard
                        </button>
                    </div>
                    <div class="p-6">
                        <div id="offboardingContent">
                            <!-- Content will be loaded here -->
                            <div class="text-center py-8">
                                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p class="mt-4 text-gray-600">Cargando procesos de offboarding...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.className = 'fixed top-20 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-1001';
        closeButton.onclick = () => {
            offboardingContainer.remove();
            closeButton.remove();
            // Show dashboard
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection) {
                dashboardSection.classList.remove('hidden');
                dashboardSection.style.display = 'block';
            }
        };
        
        // Add to body
        document.body.appendChild(offboardingContainer);
        document.body.appendChild(closeButton);
        
        // Load offboarding data
        setTimeout(() => {
            if (typeof window.loadOffboarding === 'function') {
                window.loadOffboarding();
            } else if (window.offboardingManager) {
                window.offboardingManager.loadOffboarding();
            }
        }, 100);
        
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
    
    // Initialize dropdowns
    initializeDropdowns();
});

// Load onboarding processes (fallback function)
function loadOnboarding() {
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
}

// Load offboarding processes (fallback function)
function loadOffboarding() {
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
}

// Load responsibility letters (fallback function)
function loadResponsibilityLetters() {
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

// Global function to create onboarding overlay
function createOnboardingOverlay() {
    
    // Limpiar cualquier overlay existente
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        if (section.style.position === 'fixed') {
            section.remove();
        }
    });

    // Limpiar botones de cerrar
    document.querySelectorAll('button[class*="fixed top-20 right-4"]').forEach(btn => {
        btn.remove();
    });

    // Crear onboarding container
    const onboardingContainer = document.createElement('div');
    onboardingContainer.id = 'onboarding-section';
    onboardingContainer.className = 'section';
    onboardingContainer.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: calc(100vh - 64px) !important;
        width: 100% !important;
        position: fixed !important;
        top: 64px !important;
        left: 0 !important;
        z-index: 10 !important;
        background: white !important;
        padding: 20px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
    `;

    // Crear el contenido completo con diseño mejorado
    onboardingContainer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header with Gradient -->
            <div class="mb-8 relative">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-4xl font-bold mb-2">🚀 Procesos de Onboarding</h1>
                            <p class="text-blue-100 text-lg">Gestiona el proceso de incorporación de nuevos empleados</p>
                        </div>
                        <div class="hidden md:block">
                            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-plus text-3xl text-white"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-blue-600 mb-1">Pendientes</p>
                            <p class="text-3xl font-bold text-blue-800">12</p>
                            <p class="text-xs text-blue-500 mt-1">Esperando inicio</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-clock text-white text-lg"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-green-600 mb-1">Enviadas</p>
                            <p class="text-3xl font-bold text-green-800">8</p>
                            <p class="text-xs text-green-500 mt-1">En proceso</p>
                        </div>
                        <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-paper-plane text-white text-lg"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-yellow-600 mb-1">No Firmadas</p>
                            <p class="text-3xl font-bold text-yellow-800">5</p>
                            <p class="text-xs text-yellow-500 mt-1">Requieren atención</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-exclamation-triangle text-white text-lg"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-red-600 mb-1">Atrasadas</p>
                            <p class="text-3xl font-bold text-red-800">3</p>
                            <p class="text-xs text-red-500 mt-1">Urgente</p>
                        </div>
                        <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-exclamation-circle text-white text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Actions Bar -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="createNewOnboarding()" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-plus mr-2"></i>
                            Nuevo Onboarding
                        </button>
                        <button onclick="exportOnboarding()" class="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-download mr-2"></i>
                            Exportar
                        </button>
                        <button onclick="bulkActions()" class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-tasks mr-2"></i>
                            Acciones Masivas
                        </button>
                    </div>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div class="relative">
                            <input type="text" placeholder="Buscar empleado..." class="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <select class="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="sent">Enviadas</option>
                            <option value="unsigned">No Firmadas</option>
                            <option value="overdue">Atrasadas</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Enhanced Onboarding Table -->
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                        <i class="fas fa-table mr-2 text-blue-600"></i>
                        Lista de Procesos de Onboarding
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-user mr-2 text-gray-400"></i>
                                        Empleado
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-calendar mr-2 text-gray-400"></i>
                                        Fecha Inicio
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-flag mr-2 text-gray-400"></i>
                                        Estado
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-chart-line mr-2 text-gray-400"></i>
                                        Progreso
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-cogs mr-2 text-gray-400"></i>
                                        Acciones
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr class="hover:bg-blue-50 transition-colors duration-200">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-12 w-12">
                                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                                <span class="text-sm font-bold text-white">JD</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-semibold text-gray-900">Juan Díaz</div>
                                            <div class="text-sm text-gray-500">juan.diaz@empresa.com</div>
                                            <div class="text-xs text-blue-600 font-medium">Desarrollador Senior</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">15/01/2025</div>
                                    <div class="text-xs text-gray-500">Hace 3 días</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300">
                                        <i class="fas fa-clock mr-1"></i>
                                        Pendiente
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                            <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm" style="width: 60%"></div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-700">60%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex items-center space-x-2">
                                        <button onclick="viewOnboarding(1)" class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-eye mr-1"></i>Ver
                                        </button>
                                        <button onclick="editOnboarding(1)" class="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-edit mr-1"></i>Editar
                                        </button>
                                        <button onclick="sendReminder(1)" class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-bell mr-1"></i>Recordar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-green-50 transition-colors duration-200">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-12 w-12">
                                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                                <span class="text-sm font-bold text-white">MR</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-semibold text-gray-900">María Rodríguez</div>
                                            <div class="text-sm text-gray-500">maria.rodriguez@empresa.com</div>
                                            <div class="text-xs text-green-600 font-medium">Diseñadora UX</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">10/01/2025</div>
                                    <div class="text-xs text-gray-500">Hace 8 días</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                                        <i class="fas fa-check-circle mr-1"></i>
                                        Completado
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                            <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm" style="width: 100%"></div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-700">100%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex items-center space-x-2">
                                        <button onclick="viewOnboarding(2)" class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-eye mr-1"></i>Ver
                                        </button>
                                        <button onclick="downloadCertificate(2)" class="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-certificate mr-1"></i>Certificado
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Crear botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.className = 'fixed top-20 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-1001';
    closeButton.onclick = () => {
        onboardingContainer.remove();
        closeButton.remove();
    };

    // Agregar funciones globales
    window.createNewOnboarding = function() {
        alert('Función: Crear nuevo proceso de onboarding');
    };

    window.exportOnboarding = function() {
        alert('Función: Exportar datos de onboarding');
    };

    window.viewOnboarding = function(id) {
        alert(`Función: Ver detalles del onboarding ${id}`);
    };

    window.editOnboarding = function(id) {
        alert(`Función: Editar onboarding ${id}`);
    };

    window.sendReminder = function(id) {
        alert(`Función: Enviar recordatorio para onboarding ${id}`);
    };

    window.downloadCertificate = function(id) {
        alert(`Función: Descargar certificado del onboarding ${id}`);
    };

    // Agregar al body
    document.body.appendChild(onboardingContainer);
    document.body.appendChild(closeButton);

    // Initialize dropdown functionality for onboarding overlay
    setTimeout(() => {
        initializeDropdowns();
    }, 200);

}

// Global function to create profile overlay
function createProfileOverlay() {
    
    // Limpiar cualquier overlay existente
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        if (section.style.position === 'fixed') {
            section.remove();
        }
    });

    // Limpiar botones de cerrar
    document.querySelectorAll('button[class*="fixed top-20 right-4"]').forEach(btn => {
        btn.remove();
    });

    // Crear profile container
    const profileContainer = document.createElement('div');
    profileContainer.id = 'profile-section';
    profileContainer.className = 'section';
    profileContainer.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: calc(100vh - 64px) !important;
        width: 100% !important;
        position: fixed !important;
        top: 64px !important;
        left: 0 !important;
        z-index: 10 !important;
        background: white !important;
        padding: 20px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
    `;

    // Crear el contenido completo con diseño mejorado
    profileContainer.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header -->
            <div class="mb-8">
                <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-4xl font-bold mb-2">👤 Mi Perfil</h1>
                            <p class="text-purple-100 text-lg">Gestiona tu información personal y configuración</p>
                        </div>
                        <div class="hidden md:block">
                            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-cog text-3xl text-white"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Profile Info Card -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div class="text-center">
                            <div class="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                                <span id="profileInitials" class="text-2xl font-bold text-white">US</span>
                            </div>
                            <h3 id="profileName" class="text-xl font-semibold text-gray-900 mb-2">Usuario</h3>
                            <p id="profileRole" class="text-sm text-gray-500 mb-4">Administrador</p>
                            <p id="profileEmail" class="text-sm text-gray-600 mb-6">usuario@empresa.com</p>
                            
                            <!-- Quick Actions -->
                            <div class="space-y-2">
                                <button onclick="editProfile()" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                                    <i class="fas fa-edit mr-2"></i>Editar Perfil
                                </button>
                                <button onclick="changePassword()" class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                                    <i class="fas fa-key mr-2"></i>Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Details -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-info-circle mr-2 text-purple-600"></i>
                                Información Personal
                            </h3>
                        </div>
                        <div class="p-6">
                            <form id="profileForm" class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                                        <input type="text" id="profileFullName" class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Ingresa tu nombre completo">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input type="email" id="profileEmailInput" class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="tu@empresa.com">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                                        <input type="tel" id="profilePhone" class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="+52 55 1234 5678">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                                        <select id="profileDepartment" class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                            <option value="">Selecciona un departamento</option>
                                            <option value="IT">Tecnología de la Información</option>
                                            <option value="HR">Recursos Humanos</option>
                                            <option value="Finance">Finanzas</option>
                                            <option value="Operations">Operaciones</option>
                                            <option value="Sales">Ventas</option>
                                            <option value="Marketing">Marketing</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                                    <select id="profileLocation" class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                        <option value="">Selecciona una ubicación</option>
                                        <option value="MX">México</option>
                                        <option value="CL">Chile</option>
                                        <option value="REMOTO">Remoto</option>
                                    </select>
                                </div>

                                <div class="flex justify-end space-x-3 pt-4">
                                    <button type="button" onclick="cancelProfileEdit()" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                                        <i class="fas fa-save mr-2"></i>Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Activity Log -->
                    <div class="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-history mr-2 text-purple-600"></i>
                                Actividad Reciente
                            </h3>
                        </div>
                        <div class="p-6">
                            <div class="space-y-4">
                                <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <i class="fas fa-sign-in-alt text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-900">Inicio de sesión</p>
                                        <p class="text-xs text-gray-500">Hace 2 horas</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <i class="fas fa-user-edit text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-900">Perfil actualizado</p>
                                        <p class="text-xs text-gray-500">Hace 1 día</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                                    <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <i class="fas fa-key text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-900">Contraseña cambiada</p>
                                        <p class="text-xs text-gray-500">Hace 3 días</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Crear botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.className = 'fixed top-20 right-4 z-50 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg';
    closeButton.onclick = function() {
        profileContainer.remove();
        closeButton.remove();
    };

    // Agregar al body
    document.body.appendChild(profileContainer);
    document.body.appendChild(closeButton);

    // Initialize profile section
    setTimeout(() => {
        initializeProfileSection();
    }, 200);

}

// Initialize profile section
function initializeProfileSection() {
    
    // Add event listener to profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Load profile data
    loadProfileData();
}

// Global functions for profile management
function editProfile() {
    
    // Get user data to check permissions
    const isAdmin = window.auth && window.auth.user && window.auth.user.role === 'admin';
    
    // Enable form fields for editing based on permissions
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        const fieldId = input.id;
        
        // Check if field is admin-only
        const adminOnlyFields = ['profileFullName', 'profileEmailInput', 'profileDepartment', 'profileLocation'];
        const isAdminOnlyField = adminOnlyFields.includes(fieldId);
        
        if (isAdminOnlyField && !isAdmin) {
            // Keep admin-only fields disabled for non-admin users
            input.disabled = true;
            input.classList.add('bg-gray-100');
        } else {
            // Enable field for editing
            input.disabled = false;
            input.classList.remove('bg-gray-100');
            input.classList.add('bg-white');
        }
    });
    
    // Show save/cancel buttons
    const buttons = form.querySelectorAll('button[type="submit"], button[onclick="cancelProfileEdit()"]');
    buttons.forEach(button => {
        button.classList.remove('hidden');
    });
}

function cancelProfileEdit() {
    
    // Get user data to check permissions
    const isAdmin = window.auth && window.auth.user && window.auth.user.role === 'admin';
    
    // Disable form fields based on permissions
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        const fieldId = input.id;
        
        // Check if field is admin-only
        const adminOnlyFields = ['profileFullName', 'profileEmailInput', 'profileDepartment', 'profileLocation'];
        const isAdminOnlyField = adminOnlyFields.includes(fieldId);
        
        if (isAdminOnlyField && !isAdmin) {
            // Keep admin-only fields disabled for non-admin users
            input.disabled = true;
            input.classList.add('bg-gray-100');
        } else {
            // Disable field
            input.disabled = true;
            input.classList.remove('bg-white');
            input.classList.add('bg-gray-100');
        }
    });
    
    // Hide save/cancel buttons
    const buttons = form.querySelectorAll('button[type="submit"], button[onclick="cancelProfileEdit()"]');
    buttons.forEach(button => {
        button.classList.add('hidden');
    });
    
    // Reset form to original values
    loadProfileData();
}

function loadProfileData() {
    
    // Get user data from auth
    if (window.auth && window.auth.user) {
        const user = window.auth.user;
        const isAdmin = user.role === 'admin';
        
        // Update profile card
        const profileInitials = document.getElementById('profileInitials');
        const profileName = document.getElementById('profileName');
        const profileRole = document.getElementById('profileRole');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileInitials) {
            const initials = user.full_name
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase();
            profileInitials.textContent = initials;
        }
        
        if (profileName) {
            profileName.textContent = user.full_name;
        }
        
        if (profileRole) {
            profileRole.textContent = user.role === 'admin' ? 'Administrador' : 'Usuario';
        }
        
        if (profileEmail) {
            profileEmail.textContent = user.email;
        }
        
        // Update form fields
        const profileFullName = document.getElementById('profileFullName');
        const profileEmailInput = document.getElementById('profileEmailInput');
        const profilePhone = document.getElementById('profilePhone');
        const profileDepartment = document.getElementById('profileDepartment');
        const profileLocation = document.getElementById('profileLocation');
        
        if (profileFullName) {
            profileFullName.value = user.full_name || '';
        }
        
        if (profileEmailInput) {
            profileEmailInput.value = user.email || '';
        }
        
        if (profilePhone) {
            profilePhone.value = user.phone || '';
        }
        
        if (profileDepartment) {
            profileDepartment.value = user.department || '';
        }
        
        if (profileLocation) {
            profileLocation.value = user.location || '';
        }
        
        // Apply permission restrictions
        applyProfilePermissions(isAdmin);
        
        // Initially disable form fields
        const form = document.getElementById('profileForm');
        if (form) {
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.disabled = true;
                input.classList.add('bg-gray-100');
            });
            
            // Hide save/cancel buttons initially
            const buttons = form.querySelectorAll('button[type="submit"], button[onclick="cancelProfileEdit()"]');
            buttons.forEach(button => {
                button.classList.add('hidden');
            });
        }
    }
}

// Apply permission restrictions to profile fields
function applyProfilePermissions(isAdmin) {
    
    const profileFullName = document.getElementById('profileFullName');
    const profileEmailInput = document.getElementById('profileEmailInput');
    const profilePhone = document.getElementById('profilePhone');
    const profileDepartment = document.getElementById('profileDepartment');
    const profileLocation = document.getElementById('profileLocation');
    
    // Fields that only admins can edit
    const adminOnlyFields = [profileFullName, profileEmailInput, profileDepartment, profileLocation];
    
    // Fields that all users can edit
    const userEditableFields = [profilePhone];
    
    // Apply restrictions to admin-only fields
    adminOnlyFields.forEach(field => {
        if (field) {
            if (!isAdmin) {
                // Add visual indicator for restricted fields
                field.classList.add('bg-gray-50', 'cursor-not-allowed');
                field.title = 'Solo los administradores pueden modificar este campo';
                
                // Add lock icon to label
                const label = field.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    if (!label.querySelector('.fa-lock')) {
                        const lockIcon = document.createElement('i');
                        lockIcon.className = 'fas fa-lock text-gray-400 ml-1';
                        lockIcon.title = 'Solo administradores';
                        label.appendChild(lockIcon);
                    }
                }
            } else {
                // Remove restrictions for admins
                field.classList.remove('bg-gray-50', 'cursor-not-allowed');
                field.title = '';
                
                // Remove lock icon from label
                const label = field.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    const lockIcon = label.querySelector('.fa-lock');
                    if (lockIcon) {
                        lockIcon.remove();
                    }
                }
            }
        }
    });
    
    // Ensure user-editable fields are always accessible
    userEditableFields.forEach(field => {
        if (field) {
            field.classList.remove('bg-gray-50', 'cursor-not-allowed');
            field.title = '';
            
            // Remove lock icon from label
            const label = field.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                const lockIcon = label.querySelector('.fa-lock');
                if (lockIcon) {
                    lockIcon.remove();
                }
            }
        }
    });
}

// Handle profile form submission
function handleProfileSubmit(event) {
    event.preventDefault();
    console.log('💾 Guardando perfil...');
    
    // Get user data to check permissions
    const isAdmin = window.auth && window.auth.user && window.auth.user.role === 'admin';
    
    const formData = {
        full_name: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmailInput').value,
        phone: document.getElementById('profilePhone').value,
        department: document.getElementById('profileDepartment').value,
        location: document.getElementById('profileLocation').value
    };
    
    // Validate permissions for admin-only fields
    const adminOnlyFields = ['full_name', 'email', 'department', 'location'];
    const restrictedChanges = [];
    
    adminOnlyFields.forEach(field => {
        const currentValue = window.auth.user[field] || '';
        const newValue = formData[field];
        
        if (currentValue !== newValue && !isAdmin) {
            restrictedChanges.push(field);
        }
    });
    
    if (restrictedChanges.length > 0) {
        // Show error message for restricted changes
        if (window.app) {
            window.app.showNotification('error', 'Permisos Insuficientes', 
                'Solo los administradores pueden modificar: ' + restrictedChanges.join(', '));
        }
        return;
    }
    
    // Here you would typically send the data to the server
    console.log('Datos del perfil:', formData);
    
    // Show success message
    if (window.app) {
        window.app.showNotification('success', 'Perfil Actualizado', 'Tu información ha sido guardada correctamente.');
    }
    
    // Disable form after saving
    cancelProfileEdit();
}

// Global function to create offboarding overlay
function createOffboardingOverlay() {
    
    // Limpiar cualquier overlay existente
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        if (section.style.position === 'fixed') {
            section.remove();
        }
    });

    // Limpiar botones de cerrar
    document.querySelectorAll('button[class*="fixed top-20 right-4"]').forEach(btn => {
        btn.remove();
    });

    // Crear offboarding container
    const offboardingContainer = document.createElement('div');
    offboardingContainer.id = 'offboarding-section';
    offboardingContainer.className = 'section';
    offboardingContainer.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: calc(100vh - 64px) !important;
        width: 100% !important;
        position: fixed !important;
        top: 64px !important;
        left: 0 !important;
        z-index: 10 !important;
        background: white !important;
        padding: 20px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
    `;

    // Crear el contenido completo con diseño mejorado
    offboardingContainer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header with Gradient -->
            <div class="mb-8 relative">
                <div class="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-4xl font-bold mb-2">🚪 Procesos de Offboarding</h1>
                            <p class="text-orange-100 text-lg">Gestiona el proceso de salida de empleados</p>
                        </div>
                        <div class="hidden md:block">
                            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-minus text-3xl text-white"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-orange-600 mb-1">En Proceso</p>
                            <p class="text-3xl font-bold text-orange-800">8</p>
                            <p class="text-xs text-orange-500 mt-1">Activos</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-clock text-white text-lg"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-blue-600 mb-1">Assets Pendientes</p>
                            <p class="text-3xl font-bold text-blue-800">15</p>
                            <p class="text-xs text-blue-500 mt-1">Por recuperar</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-laptop text-white text-lg"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-yellow-600 mb-1">Documentos Faltantes</p>
                            <p class="text-3xl font-bold text-yellow-800">6</p>
                            <p class="text-xs text-yellow-500 mt-1">Requieren atención</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-exclamation-triangle text-white text-lg"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-green-600 mb-1">Completados</p>
                            <p class="text-3xl font-bold text-green-800">12</p>
                            <p class="text-xs text-green-500 mt-1">Finalizados</p>
                        </div>
                        <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-check-circle text-white text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Actions Bar -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="createNewOffboarding()" class="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-plus mr-2"></i>
                            Nuevo Offboarding
                        </button>
                        <button onclick="exportOffboarding()" class="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-download mr-2"></i>
                            Exportar
                        </button>
                        <button onclick="generateOffboardingReport()" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-chart-bar mr-2"></i>
                            Reporte
                        </button>
                        <button onclick="bulkOffboardingActions()" class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-tasks mr-2"></i>
                            Acciones Masivas
                        </button>
                    </div>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div class="relative">
                            <input type="text" placeholder="Buscar empleado..." class="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <select class="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm">
                            <option value="">Todos los estados</option>
                            <option value="in_progress">En Proceso</option>
                            <option value="pending_assets">Assets Pendientes</option>
                            <option value="missing_docs">Documentos Faltantes</option>
                            <option value="completed">Completados</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Enhanced Offboarding Table -->
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                        <i class="fas fa-table mr-2 text-orange-600"></i>
                        Lista de Procesos de Offboarding
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full divide-y divide-gray-200" style="min-width: 1200px;">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                                    <div class="flex items-center">
                                        <i class="fas fa-user mr-2 text-gray-400"></i>
                                        Empleado
                                    </div>
                                </th>
                                <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-calendar mr-2 text-gray-400"></i>
                                        Fecha Salida
                                    </div>
                                </th>
                                <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-flag mr-2 text-gray-400"></i>
                                        Estado
                                    </div>
                                </th>
                                <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-laptop mr-2 text-gray-400"></i>
                                        Assets
                                    </div>
                                </th>
                                <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-chart-line mr-2 text-gray-400"></i>
                                        Progreso
                                    </div>
                                </th>
                                <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-cogs mr-2 text-gray-400"></i>
                                        Acciones
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr class="hover:bg-orange-50 transition-colors duration-200">
                                <td class="px-4 py-4 w-1/4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-12 w-12">
                                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                                                <span class="text-sm font-bold text-white">AL</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-semibold text-gray-900">Ana López</div>
                                            <div class="text-sm text-gray-500">ana.lopez@empresa.com</div>
                                            <div class="text-xs text-orange-600 font-medium">Gerente de Ventas</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="text-sm font-medium text-gray-900">20/01/2025</div>
                                    <div class="text-xs text-gray-500">Hace 2 días</div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300">
                                        <i class="fas fa-clock mr-1"></i>
                                        En Proceso
                                    </span>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-laptop text-blue-600 mr-2"></i>
                                        <span class="text-sm text-gray-900 font-medium">2 pendientes</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                            <div class="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full shadow-sm" style="width: 75%"></div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-700">75%</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6 text-sm font-medium">
                                    <div class="flex flex-col space-y-1">
                                        <button onclick="viewOffboarding(1)" class="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-eye mr-1"></i>Ver
                                        </button>
                                        <button onclick="editOffboarding(1)" class="bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-edit mr-1"></i>Editar
                                        </button>
                                        <button onclick="sendReminderOffboarding(1)" class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-bell mr-1"></i>Recordar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-yellow-50 transition-colors duration-200">
                                <td class="px-4 py-4 w-1/4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-12 w-12">
                                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                                                <span class="text-sm font-bold text-white">CM</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-semibold text-gray-900">Carlos Martínez</div>
                                            <div class="text-sm text-gray-500">carlos.martinez@empresa.com</div>
                                            <div class="text-xs text-red-600 font-medium">Desarrollador</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="text-sm font-medium text-gray-900">18/01/2025</div>
                                    <div class="text-xs text-gray-500">Hace 4 días</div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>
                                        Documentos Faltantes
                                    </span>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                        <span class="text-sm text-gray-900 font-medium">Completados</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                            <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full shadow-sm" style="width: 90%"></div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-700">90%</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6 text-sm font-medium">
                                    <div class="flex flex-col space-y-1">
                                        <button onclick="viewOffboarding(2)" class="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-eye mr-1"></i>Ver
                                        </button>
                                        <button onclick="requestDocuments(2)" class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-file-alt mr-1"></i>Solicitar Docs
                                        </button>
                                        <button onclick="completeOffboarding(2)" class="bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-check mr-1"></i>Completar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-green-50 transition-colors duration-200">
                                <td class="px-4 py-4 w-1/4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-12 w-12">
                                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                                <span class="text-sm font-bold text-white">SG</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-semibold text-gray-900">Sofia García</div>
                                            <div class="text-sm text-gray-500">sofia.garcia@empresa.com</div>
                                            <div class="text-xs text-green-600 font-medium">Analista</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="text-sm font-medium text-gray-900">15/01/2025</div>
                                    <div class="text-xs text-gray-500">Hace 7 días</div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                                        <i class="fas fa-check-circle mr-1"></i>
                                        Completado
                                    </span>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="flex items-center">
                                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                        <span class="text-sm text-gray-900 font-medium">Completados</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-3 mr-3">
                                            <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm" style="width: 100%"></div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-700">100%</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4 w-1/6 text-sm font-medium">
                                    <div class="flex flex-col space-y-1">
                                        <button onclick="viewOffboarding(3)" class="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-eye mr-1"></i>Ver
                                        </button>
                                        <button onclick="downloadOffboardingCertificate(3)" class="bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium">
                                            <i class="fas fa-certificate mr-1"></i>Certificado
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Crear botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.className = 'fixed top-20 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-1001';
    closeButton.onclick = () => {
        offboardingContainer.remove();
        closeButton.remove();
    };

    // Agregar funciones globales para offboarding
    window.createNewOffboarding = function() {
        alert('Función: Crear nuevo proceso de offboarding');
    };

    window.exportOffboarding = function() {
        alert('Función: Exportar datos de offboarding');
    };

    window.generateOffboardingReport = function() {
        alert('Función: Generar reporte de offboarding');
    };

    window.viewOffboarding = function(id) {
        alert(`Función: Ver detalles del offboarding ${id}`);
    };

    window.editOffboarding = function(id) {
        alert(`Función: Editar offboarding ${id}`);
    };

    window.sendReminderOffboarding = function(id) {
        alert(`Función: Enviar recordatorio para offboarding ${id}`);
    };

    window.requestDocuments = function(id) {
        alert(`Función: Solicitar documentos faltantes para offboarding ${id}`);
    };

    window.completeOffboarding = function(id) {
        alert(`Función: Completar proceso de offboarding ${id}`);
    };

    window.downloadOffboardingCertificate = function(id) {
        alert(`Función: Descargar certificado de offboarding ${id}`);
    };

    // Agregar al body
    document.body.appendChild(offboardingContainer);
    document.body.appendChild(closeButton);

    // Initialize dropdown functionality for offboarding overlay
    setTimeout(() => {
        initializeDropdowns();
    }, 200);

}

// Load demo data for dashboard when backend is not available
function loadDashboardDemoData() {
    
    // Update stats cards
    const totalUsersEl = document.getElementById('totalUsers');
    const availableAssetsEl = document.getElementById('availableAssets');
    const assignedAssetsEl = document.getElementById('assignedAssets');
    const todayActivityEl = document.getElementById('todayActivity');
    
    if (totalUsersEl) totalUsersEl.textContent = '105';
    if (availableAssetsEl) availableAssetsEl.textContent = '25';
    if (assignedAssetsEl) assignedAssetsEl.textContent = '78';
    if (todayActivityEl) todayActivityEl.textContent = '12';
    
    // Update recent activity
    const recentActivityEl = document.getElementById('recentActivity');
    if (recentActivityEl) {
        recentActivityEl.innerHTML = `
            <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-plus text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">Nuevo usuario creado</p>
                    <p class="text-xs text-gray-500">Juan Pérez - Departamento IT</p>
                    <p class="text-xs text-gray-400">Hace 2 horas</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-laptop text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">Asset asignado</p>
                    <p class="text-xs text-gray-500">MacBook Pro asignado a María García</p>
                    <p class="text-xs text-gray-400">Hace 4 horas</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-clipboard-check text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">Proceso completado</p>
                    <p class="text-xs text-gray-500">Onboarding de Carlos Mendoza</p>
                    <p class="text-xs text-gray-400">Hace 6 horas</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">Alerta de sistema</p>
                    <p class="text-xs text-gray-500">Mantenimiento programado para mañana</p>
                    <p class="text-xs text-gray-400">Hace 8 horas</p>
                </div>
            </div>
        `;
    }
    
    // Update recent assignments
    const recentAssignmentsEl = document.getElementById('recentAssignments');
    if (recentAssignmentsEl) {
        recentAssignmentsEl.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm font-bold">MP</span>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">María Pérez</p>
                            <p class="text-xs text-gray-500">Desarrolladora Senior</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900">MacBook Pro</p>
                        <p class="text-xs text-gray-500">Asignado hoy</p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm font-bold">JL</span>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">José López</p>
                            <p class="text-xs text-gray-500">Analista de Datos</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900">Dell XPS 13</p>
                        <p class="text-xs text-gray-500">Asignado ayer</p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm font-bold">AG</span>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">Ana García</p>
                            <p class="text-xs text-gray-500">Gerente de Proyecto</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900">iPad Pro</p>
                        <p class="text-xs text-gray-500">Asignado hace 2 días</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update alerts
    const alertsEl = document.getElementById('alerts');
    if (alertsEl) {
        alertsEl.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-red-900">Mantenimiento Programado</p>
                        <p class="text-xs text-red-700">Sistema estará fuera de servicio mañana de 2-4 AM</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-clock text-white text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-yellow-900">Backup Pendiente</p>
                        <p class="text-xs text-yellow-700">Realizar backup de datos antes del viernes</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-info-circle text-white text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-blue-900">Actualización Disponible</p>
                        <p class="text-xs text-blue-700">Nueva versión del sistema disponible</p>
                    </div>
                </div>
            </div>
        `;
    }
    
}

// Close responsibility dropdown
function closeResponsibilityDropdown() {
    console.log('🔽 Cerrando dropdown de Cartas de Responsabilidad...');
    const dropdown = document.getElementById('responsibilityDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

// Initialize dropdown functionality
function initializeDropdowns() {
    console.log('🔽 Initializing dropdowns...');
    
    // Responsibility dropdown functionality
    const responsibilityDropdownButton = document.getElementById('responsibilityDropdownButton');
    const responsibilityDropdown = document.getElementById('responsibilityDropdown');
    
    console.log('Responsibility dropdown button:', responsibilityDropdownButton);
    console.log('Responsibility dropdown:', responsibilityDropdown);
    
    // Check if elements exist
    if (!responsibilityDropdownButton) {
        console.error('❌ Responsibility dropdown button not found!');
        return;
    }
    if (!responsibilityDropdown) {
        console.error('❌ Responsibility dropdown not found!');
        return;
    }
    
    // Remove any existing event listeners by cloning the element
    const newButton = responsibilityDropdownButton.cloneNode(true);
    responsibilityDropdownButton.parentNode.replaceChild(newButton, responsibilityDropdownButton);
    
    
    // Add click event listener to the new button
    newButton.addEventListener('click', (e) => {
        console.log('🖱️ Responsibility dropdown button clicked!');
        e.preventDefault();
        e.stopPropagation();
        
        const isHidden = responsibilityDropdown.classList.contains('hidden');
        console.log('Dropdown is hidden:', isHidden);
        
        if (isHidden) {
            console.log('📂 Opening dropdown...');
            responsibilityDropdown.classList.remove('hidden');
            responsibilityDropdown.classList.add('dropdown-enter');
            
            // Rotate chevron
            const chevron = newButton.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.style.transform = 'rotate(180deg)';
                console.log('🔄 Chevron rotated');
            }
        } else {
            console.log('📁 Closing dropdown...');
            responsibilityDropdown.classList.add('hidden');
            responsibilityDropdown.classList.remove('dropdown-enter');
            
            // Reset chevron
            const chevron = newButton.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
                console.log('🔄 Chevron reset');
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!newButton.contains(e.target) && !responsibilityDropdown.contains(e.target)) {
            console.log('🖱️ Clicked outside dropdown, closing...');
            responsibilityDropdown.classList.add('hidden');
            responsibilityDropdown.classList.remove('dropdown-enter');
            
            // Reset chevron
            const chevron = newButton.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
        }
    });
    
    
    // User dropdown functionality
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    
    console.log('User menu button:', userMenuButton);
    console.log('User dropdown:', userDropdown);
    
    if (userMenuButton && userDropdown) {
    } else {
    }
    
    console.log('🔽 Dropdown initialization complete');
    
    // Test function for responsibility dropdown
    
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
