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
            } else if (sectionId === 'calendar-section') {
                // Inicializar calendario cuando se muestra
                setTimeout(() => {
                    if (window.calendarManager) {
                        window.calendarManager.loadEvents();
                        window.calendarManager.renderCalendar();
                    }
                }, 100);
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
        const responsibilitySection = document.getElementById('responsibility-section');
        if (responsibilitySection) {
            const immediateParent = responsibilitySection.parentElement;
            if (immediateParent && immediateParent.classList.contains('hidden')) {
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
        } else {
            console.error('Responsibility section NOT FOUND in DOM!');
        }
        
        if (window.responsibilityManager) {
            window.responsibilityManager.loadLetters();
        } else if (window.ResponsibilityManager) {
            window.responsibilityManager = new window.ResponsibilityManager();
            window.responsibilityManager.loadLetters();
        }
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
            case 'calendar-section':
                if (window.calendarManager) {
                    window.calendarManager.loadEvents();
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
                }
                
                // Don't load data here - let the onclick handler do it
                break;
            case 'onboarding-section':
                if (window.onboardingManager && !window.onboardingManager.isLoading) {
                    window.onboardingManager.loadProcesses();
                } else if (window.OnboardingManager && !window.onboardingManager) {
                    window.onboardingManager = new window.OnboardingManager();
                    window.onboardingManager.loadProcesses();
                }
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
                <!-- Header Apple Style -->
                <div class="mb-12 relative">
                    <div class="content-card bg-white rounded-3xl p-12 border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                        <div class="flex items-center justify-between">
                            <div>
                                <h1 class="text-5xl font-semibold mb-3" style="color: #1d1d1f; letter-spacing: -0.02em;">Log de Auditoría</h1>
                                <p class="text-lg" style="color: #86868b; font-weight: 400;">Registro de todas las acciones del sistema</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-card bg-white rounded-3xl overflow-hidden border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <div class="px-8 py-6 border-b flex justify-between items-center" style="border-color: #f5f5f7;">
                        <h3 class="text-2xl font-semibold" style="color: #1d1d1f; letter-spacing: -0.02em;">Registros de Auditoría</h3>
                        <button onclick="exportAuditLogs()" class="px-6 py-3 rounded-full flex items-center transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 15px; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <i class="fas fa-download mr-2 text-sm"></i>Exportar
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
        window.onboardingManager.loadProcesses();
    } else {
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
        window.offboardingManager.loadProcesses();
    } else {
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
        background: #fbfbfd !important;
        padding: 20px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
    `;

    // Crear el contenido completo con diseño mejorado
    onboardingContainer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header Apple Style -->
            <div class="mb-12 relative">
                <div class="content-card bg-white rounded-3xl p-12 border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-5xl font-semibold mb-3" style="color: #1d1d1f; letter-spacing: -0.02em;">Procesos de Onboarding</h1>
                            <p class="text-lg" style="color: #86868b; font-weight: 400;">Gestiona el proceso de incorporación de nuevos empleados</p>
                        </div>
                        <div class="hidden md:block">
                            <div class="w-24 h-24 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%);">
                                <i class="fas fa-user-plus text-3xl" style="color: #0071e3;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards Apple Style -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">Total</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;" id="totalOnboarding">0</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Procesos totales</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <i class="fas fa-list text-lg" style="color: #0071e3;"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">En Progreso</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;" id="inProgressOnboarding">0</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Activos</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <svg class="flaticon-icon text-lg animate-spin" style="width: 1.125rem; height: 1.125rem; color: #30d158;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="32" stroke-dashoffset="32">
                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 40;40 40;40 40;40 40;0 40" repeatCount="indefinite"/>
                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-40;-80;-120;-160" repeatCount="indefinite"/>
                                </circle>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">Completados</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;" id="completedOnboarding">0</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Finalizados</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <i class="fas fa-check-circle text-lg" style="color: #30d158;"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">Esta Semana</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;" id="thisWeekOnboarding">0</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Nuevos</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <svg class="flaticon-icon text-lg" style="width: 1.125rem; height: 1.125rem; color: #ff9500;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Bar Apple Style -->
            <div class="content-card bg-white rounded-3xl p-8 mb-8 border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div class="flex flex-row items-center justify-between gap-6 flex-wrap">
                    <div class="flex flex-row flex-wrap items-center gap-3">
                        <button onclick="createNewOnboarding()" class="px-6 py-3 rounded-full flex items-center whitespace-nowrap transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 15px; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Nuevo Onboarding
                        </button>
                        <button onclick="exportOnboarding()" class="px-6 py-3 rounded-full flex items-center whitespace-nowrap transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 15px; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Exportar
                        </button>
                        <button onclick="bulkActions()" class="px-6 py-3 rounded-full flex items-center whitespace-nowrap transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 15px; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Acciones Masivas
                        </button>
                        <button onclick="generateOnboardingPDF()" class="px-6 py-3 rounded-full flex items-center whitespace-nowrap transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 15px; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Nuevo Onboarding PDF
                        </button>
                        <button onclick="openPDFEditor()" class="px-6 py-3 rounded-full flex items-center whitespace-nowrap transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 15px; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Editar Template PDF
                        </button>
                    </div>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div class="relative">
                            <input type="text" id="onboardingSearch" placeholder="Buscar empleado..." class="w-full sm:w-64 pl-10 pr-4 py-3 rounded-full text-sm focus:outline-none" style="background: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 15px;" onfocus="this.style.background='white'; this.style.borderColor='#0071e3'" onblur="this.style.background='#f5f5f7'; this.style.borderColor='#d2d2d7'">
                            <svg class="flaticon-icon absolute left-3 top-1/2 transform -translate-y-1/2" style="width: 0.875rem; height: 0.875rem; color: #86868b;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <select id="statusOnboardingFilter" class="px-4 py-3 rounded-full text-sm focus:outline-none" style="background: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 15px;" onfocus="this.style.background='white'; this.style.borderColor='#0071e3'" onblur="this.style.background='#f5f5f7'; this.style.borderColor='#d2d2d7'">
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="completed">Completados</option>
                            <option value="cancelled">Cancelados</option>
                        </select>
                        <select id="locationOnboardingFilter" class="px-4 py-3 rounded-full text-sm focus:outline-none" style="background: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 15px;" onfocus="this.style.background='white'; this.style.borderColor='#0071e3'" onblur="this.style.background='#f5f5f7'; this.style.borderColor='#d2d2d7'">
                            <option value="">Todas las ubicaciones</option>
                            <option value="MX">México</option>
                            <option value="CL">Chile</option>
                            <option value="REMOTO">Remoto</option>
                        </select>
                        <select id="departmentOnboardingFilter" class="px-4 py-3 rounded-full text-sm focus:outline-none" style="background: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 15px;" onfocus="this.style.background='white'; this.style.borderColor='#0071e3'" onblur="this.style.background='#f5f5f7'; this.style.borderColor='#d2d2d7'">
                            <option value="">Todos los departamentos</option>
                            <option value="IT">IT</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Product">Product</option>
                            <option value="Sales">Sales</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Onboarding Table Apple Style -->
            <div class="content-card bg-white rounded-3xl overflow-hidden border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div class="px-8 py-6 border-b" style="border-color: #f5f5f7;">
                    <div class="flex items-center justify-between">
                        <h3 class="text-2xl font-semibold flex items-center" style="color: #1d1d1f; letter-spacing: -0.02em;">
                            <i class="fas fa-table mr-3" style="color: #0071e3;"></i>
                            Lista de Procesos de Onboarding
                        </h3>
                        <span id="onboardingCount" class="text-sm font-medium" style="color: #86868b;">Mostrando 0 procesos</span>
                    </div>
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
                                        <i class="fas fa-briefcase mr-2 text-gray-400"></i>
                                        Posición
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-building mr-2 text-gray-400"></i>
                                        Departamento
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div class="flex items-center">
                                        <i class="fas fa-globe mr-2 text-gray-400"></i>
                                        País
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
                                        <i class="fas fa-calendar mr-2 text-gray-400"></i>
                                        Fecha Inicio
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
                            <tr>
                                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                                    <div class="flex flex-col items-center">
                                        <i class="fas fa-spinner fa-spin text-4xl text-gray-300 mb-4"></i>
                                        <p class="text-lg font-medium text-gray-900 mb-2">Cargando procesos de onboarding...</p>
                                        <p class="text-sm text-gray-400">Por favor espera...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Pagination -->
            <div id="onboardingPagination" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white rounded-b-2xl">
                <div class="flex items-center text-sm text-gray-700">
                    <span id="onboardingPaginationInfo">Mostrando 0 de 0 procesos</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="onboardingPrevPage" onclick="onboardingManager.previousPage()" disabled class="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="flaticon-icon" style="width: 1rem; height: 1rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="15 18 9 12 15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div id="onboardingPageNumbers" class="flex space-x-1">
                        <!-- Page numbers will be populated here -->
                    </div>
                    <button id="onboardingNextPage" onclick="onboardingManager.nextPage()" disabled class="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="flaticon-icon" style="width: 1rem; height: 1rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
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
    
    // Load onboarding processes if OnboardingManager is available
    // Solo cargar una vez, no en múltiples timeouts
    if (window.onboardingManager) {
        console.log('🔄 Re-initializing OnboardingManager event listeners...');
        // Re-setup event listeners for the new DOM elements
        window.onboardingManager.setupEventListeners();
        // NO cargar procesos aquí - ya se cargan cuando se muestra la sección
    }

    // Agregar funciones globales
    window.createNewOnboarding = function() {
        console.log('➕ Creando nuevo proceso de onboarding...');
        
        // Remover modal existente si existe
        const existingModal = document.getElementById('modal-nuevo-onboarding');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Crear el modal
        const modal = document.createElement('div');
        modal.id = 'modal-nuevo-onboarding';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5) !important;
            z-index: 10000000 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            font-family: Arial, sans-serif !important;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white !important;
                border-radius: 12px !important;
                padding: 30px !important;
                max-width: 600px !important;
                width: 90% !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                border: 1px solid #E5E7EB !important;
            ">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #E5E7EB;">
                    <h2 style="color: #1F2937; font-size: 24px; font-weight: bold; margin: 0;">
                        ➕ Crear Nuevo Proceso de Onboarding
                    </h2>
                    <button onclick="window.cerrarModalNuevoOnboarding()" style="
                        background: #EF4444 !important;
                        color: white !important;
                        border: none !important;
                        padding: 8px 12px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        font-size: 16px !important;
                        font-weight: bold !important;
                    ">✕</button>
                </div>
                
                <!-- Form -->
                <form id="form-nuevo-onboarding" style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="position: relative;">
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            🆔 ID de Empleado *
                        </label>
                        <input type="text" id="new-employee-id" placeholder="Ingresa el ID del empleado..." autocomplete="off" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " required>
                        <div id="employee-autocomplete-dropdown" style="
                            position: absolute !important;
                            top: 100% !important;
                            left: 0 !important;
                            right: 0 !important;
                            background: white !important;
                            border: 2px solid #D1D5DB !important;
                            border-top: none !important;
                            border-radius: 0 0 8px 8px !important;
                            max-height: 300px !important;
                            overflow-y: auto !important;
                            z-index: 10000001 !important;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                            display: none !important;
                        "></div>
                    </div>
                    
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            👤 Nombre del Empleado
                        </label>
                        <input type="text" id="new-employee-name" placeholder="Se llenará automáticamente..." autocomplete="off" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        ">
                    </div>
                    
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            📧 Email
                        </label>
                        <input type="email" id="new-employee-email" placeholder="Se generará automáticamente..." readonly style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                            background-color: #F3F4F6 !important;
                            cursor: not-allowed !important;
                        ">
                        <small style="color: #6B7280; font-size: 12px; margin-top: 4px; display: block;">
                            Formato: nombre.apellido@xepelin.com
                        </small>
                    </div>
                    
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            💼 Posición *
                        </label>
                        <input type="text" id="new-position" placeholder="Desarrollador Senior" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " required>
                    </div>
                    
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            🏢 Departamento *
                        </label>
                        <input type="text" id="new-department" placeholder="IT" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " required>
                    </div>
                    
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            📍 Ubicación *
                        </label>
                        <select id="new-location" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                            background: white !important;
                        " required>
                            <option value="">Selecciona una ubicación</option>
                            <option value="MX">México</option>
                            <option value="CL">Chile</option>
                            <option value="CO">Colombia</option>
                            <option value="PE">Perú</option>
                            <option value="AR">Argentina</option>
                            <option value="REMOTO">Remoto</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            📅 Fecha de Inicio *
                        </label>
                        <input type="date" id="new-start-date" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 8px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " required>
                    </div>
                    
                    <!-- Botones -->
                    <div style="display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
                        <button type="button" onclick="window.cerrarModalNuevoOnboarding()" style="
                            flex: 1 !important;
                            padding: 12px 20px !important;
                            background: #6B7280 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 8px !important;
                            cursor: pointer !important;
                            font-weight: bold !important;
                            font-size: 14px !important;
                        ">Cancelar</button>
                        <button type="submit" style="
                            flex: 1 !important;
                            padding: 12px 20px !important;
                            background: #3B82F6 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 8px !important;
                            cursor: pointer !important;
                            font-weight: bold !important;
                            font-size: 14px !important;
                        ">✅ Crear Proceso</button>
                    </div>
                </form>
            </div>
        `;
        
        // Agregar al body
        document.body.appendChild(modal);
        
        // Wait for DOM to update before setting up autocomplete
        setTimeout(() => {
            // Set today's date as default
            const startDateInput = document.getElementById('new-start-date');
            if (startDateInput) {
                const today = new Date().toISOString().split('T')[0];
                startDateInput.value = today;
            }
            
            // Setup employee autocomplete - ensure elements exist
            const employeeIdInput = document.getElementById('new-employee-id');
            const autocompleteDropdown = document.getElementById('employee-autocomplete-dropdown');
            
            if (employeeIdInput && autocompleteDropdown) {
                console.log('✅ Setting up employee autocomplete...');
                window.setupEmployeeAutocomplete();
            } else {
                console.error('❌ Autocomplete elements not found:', {
                    employeeIdInput: !!employeeIdInput,
                    autocompleteDropdown: !!autocompleteDropdown
                });
            }
        }, 100);
        
        // Manejar el envío del formulario
        const form = document.getElementById('form-nuevo-onboarding');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            window.guardarNuevoOnboarding();
        });
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                window.cerrarModalNuevoOnboarding();
            }
        });
    };
    
    // Helper function to generate email from name
    function generateEmailFromName(name) {
        if (!name) return '';
        
        // Split name into parts
        const nameParts = name.trim().toLowerCase().split(/\s+/);
        if (nameParts.length < 2) return '';
        
        // Get first name (first part)
        const firstName = nameParts[0];
        
        // Get last name (last part)
        const lastName = nameParts[nameParts.length - 1];
        
        // Remove special characters and accents
        const cleanFirstName = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        const cleanLastName = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        
        // Generate email: nombre.apellido@xepelin.com
        return `${cleanFirstName}.${cleanLastName}@xepelin.com`;
    }
    
    // Setup employee autocomplete
    window.setupEmployeeAutocomplete = function() {
        const employeeIdInput = document.getElementById('new-employee-id');
        const autocompleteDropdown = document.getElementById('employee-autocomplete-dropdown');
        
        if (!employeeIdInput || !autocompleteDropdown) {
            console.error('❌ Autocomplete setup failed: Elements not found', {
                employeeIdInput: !!employeeIdInput,
                autocompleteDropdown: !!autocompleteDropdown
            });
            return;
        }
        
        console.log('✅ Autocomplete elements found, setting up...');
        
        // Remove existing event listeners by cloning and replacing the input
        const newInput = employeeIdInput.cloneNode(true);
        employeeIdInput.parentNode.replaceChild(newInput, employeeIdInput);
        
        // Get fresh reference
        const input = document.getElementById('new-employee-id');
        
        let searchTimeout;
        let selectedEmployee = null;
        
        // Debounced search function
        input.addEventListener('input', async function(e) {
            // Only get the actual input value, ignore any other events
            const inputValue = e.target instanceof HTMLInputElement ? e.target.value : '';
            const searchTerm = String(inputValue).trim();
            
            // Prevent extremely long searches (likely copy-paste errors)
            if (searchTerm.length > 50) {
                console.warn('Search term too long, truncating to first 50 characters');
                input.value = searchTerm.substring(0, 50);
                return;
            }
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Hide dropdown if search is too short
            if (searchTerm.length < 2) {
                autocompleteDropdown.style.display = 'none';
                autocompleteDropdown.innerHTML = '';
                selectedEmployee = null;
                return;
            }
            
            // Wait 300ms before searching
            searchTimeout = setTimeout(async () => {
                try {
                    console.log('🔍 Searching employees by ID:', searchTerm);
                    
                    // Search in Jira employees
                    if (!window.auth) {
                        console.error('Auth not available');
                        return;
                    }
                    
                    // Always search by Employee ID when typing in the ID field
                    const url = `/onboarding/jira-employees?employeeId=${encodeURIComponent(searchTerm)}&project=Helpdesk On/Off&limit=20`;
                    console.log('📡 Calling Jira API:', url);
                    const jiraResponse = await window.auth.apiRequest(url);
                    
                    if (!jiraResponse.ok) {
                        const errorText = await jiraResponse.text().catch(() => 'Unknown error');
                        console.error('❌ Jira API error:', jiraResponse.status, errorText);
                        throw new Error(`Error fetching employees from Jira: ${jiraResponse.status}`);
                    }
                    
                    const jiraData = await jiraResponse.json();
                    console.log('✅ Jira API response:', {
                        source: jiraData.source || 'unknown',
                        count: jiraData.employees?.length || 0,
                        total: jiraData.total || 0,
                        message: jiraData.message || '',
                        employees: jiraData.employees || []
                    });
                    const employees = jiraData.employees || [];
                    
                    if (employees.length === 0) {
                        console.log('⚠️ No employees found in Jira response');
                    }
                    
                    // Use Jira employees directly (already filtered by search term)
                    const filteredUsers = employees;
                    
                    // Show dropdown with results
                    if (filteredUsers.length > 0) {
                        autocompleteDropdown.innerHTML = filteredUsers.map(employee => {
                            return `
                                <div class="autocomplete-item" data-employee='${JSON.stringify({
                                    name: employee.name || '',
                                    firstName: employee.firstName || '',
                                    lastName: employee.lastName || '',
                                    email: employee.email || '',
                                    employeeId: employee.employeeId || employee.id || '',
                                    department: employee.department || '',
                                    location: employee.location || '',
                                    position: employee.position || '',
                                    startDate: employee.startDate || '',
                                    jiraTicket: employee.jiraTicket || ''
                                })}' style="
                                    padding: 12px !important;
                                    cursor: pointer !important;
                                    border-bottom: 1px solid #E5E7EB !important;
                                    transition: background-color 0.2s !important;
                                " onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='white'">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: bold; color: #1F2937; margin-bottom: 4px;">${employee.employeeId || employee.id} - ${employee.name || 'Sin nombre'}</div>
                                            <div style="font-size: 12px; color: #6B7280;">${employee.name || 'Sin nombre'} ${employee.department ? '• ' + employee.department : ''}</div>
                                            ${employee.position ? `<div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">${employee.position}</div>` : ''}
                                        </div>
                                        ${employee.jiraTicket ? `<div style="font-size: 10px; color: #3B82F6; font-weight: bold; margin-left: 8px;">${employee.jiraTicket}</div>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('');
                        
                        autocompleteDropdown.style.display = 'block';
                        
                        // Add click handlers
                        autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                            item.addEventListener('click', function() {
                                const employeeData = JSON.parse(this.getAttribute('data-employee'));
                                selectedEmployee = employeeData;
                                
                                // Fill form fields in order
                                // 1. Employee ID (already filled)
                                document.getElementById('new-employee-id').value = employeeData.employeeId || '';
                                
                                // 2. Name
                                document.getElementById('new-employee-name').value = employeeData.name || '';
                                
                                // 3. Generate email: nombre.apellido@xepelin.com
                                let generatedEmail = '';
                                if (employeeData.firstName && employeeData.lastName) {
                                    generatedEmail = generateEmailFromName(`${employeeData.firstName} ${employeeData.lastName}`);
                                } else if (employeeData.name) {
                                    generatedEmail = generateEmailFromName(employeeData.name);
                                }
                                document.getElementById('new-employee-email').value = generatedEmail;
                                
                                // 4. Position
                                document.getElementById('new-position').value = employeeData.position || '';
                                
                                // 5. Department
                                document.getElementById('new-department').value = employeeData.department || '';
                                
                                // 6. Start date if available
                                if (employeeData.startDate) {
                                    const startDateInput = document.getElementById('new-start-date');
                                    // Format date if needed (Jira might return different formats)
                                    let formattedDate = employeeData.startDate;
                                    if (formattedDate.includes('T')) {
                                        formattedDate = formattedDate.split('T')[0];
                                    }
                                    startDateInput.value = formattedDate;
                                }
                                
                                // 7. Location - map Jira country values to form values
                                if (employeeData.location) {
                                    const locationSelect = document.getElementById('new-location');
                                    const locationValue = String(employeeData.location).trim().toUpperCase();
                                    
                                    // Map Jira country values to form dropdown values
                                    const locationMap = {
                                        'MX': 'MX',
                                        'MEXICO': 'MX',
                                        'MÉXICO': 'MX',
                                        'CL': 'CL',
                                        'CHILE': 'CL',
                                        'CO': 'CO',
                                        'COLOMBIA': 'CO',
                                        'PE': 'PE',
                                        'PERU': 'PE',
                                        'PERÚ': 'PE',
                                        'AR': 'AR',
                                        'ARGENTINA': 'AR',
                                        'REMOTE': 'REMOTO',
                                        'REMOTO': 'REMOTO',
                                        'REMOTELY': 'REMOTO'
                                    };
                                    
                                    // Try exact match first
                                    let mappedLocation = locationMap[locationValue];
                                    
                                    // If not found, try partial match
                                    if (!mappedLocation) {
                                        for (const [key, value] of Object.entries(locationMap)) {
                                            if (locationValue.includes(key) || key.includes(locationValue)) {
                                                mappedLocation = value;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    // Try to find in dropdown options
                                    if (!mappedLocation) {
                                        const locationOption = Array.from(locationSelect.options).find(opt => 
                                            opt.value.toUpperCase() === locationValue || 
                                            opt.text.toUpperCase().includes(locationValue) ||
                                            locationValue.includes(opt.value.toUpperCase())
                                        );
                                        if (locationOption) {
                                            mappedLocation = locationOption.value;
                                        }
                                    }
                                    
                                    if (mappedLocation) {
                                        locationSelect.value = mappedLocation;
                                    }
                                }
                                
                                // Hide dropdown
                                autocompleteDropdown.style.display = 'none';
                                autocompleteDropdown.innerHTML = '';
                            });
                        });
                        
                        // Auto-select if only one result and it matches exactly
                        if (filteredUsers.length === 1 && filteredUsers[0].employeeId && filteredUsers[0].employeeId.toLowerCase() === searchTerm.toLowerCase()) {
                            const autoSelectItem = autocompleteDropdown.querySelector('.autocomplete-item');
                            if (autoSelectItem) {
                                setTimeout(() => {
                                    autoSelectItem.click();
                                }, 100);
                            }
                        }
                    } else {
                        autocompleteDropdown.innerHTML = `
                            <div style="padding: 12px; text-align: center; color: #6B7280;">
                                No se encontraron empleados con ese ID
                            </div>
                        `;
                        autocompleteDropdown.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Error searching employees:', error);
                    autocompleteDropdown.innerHTML = `
                        <div style="padding: 12px; text-align: center; color: #EF4444;">
                            Error al buscar empleados
                        </div>
                    `;
                    autocompleteDropdown.style.display = 'block';
                }
            }, 500); // Increased delay to 500ms for ID search
        });
        
        // Hide dropdown when clicking outside
        const clickOutsideHandler = function(e) {
            if (!input.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                autocompleteDropdown.style.display = 'none';
            }
        };
        document.addEventListener('click', clickOutsideHandler);
    };
    
    // Cerrar modal de nuevo onboarding
    window.cerrarModalNuevoOnboarding = function() {
        const modal = document.getElementById('modal-nuevo-onboarding');
        if (modal) {
            modal.remove();
        }
    };
    
    // Guardar nuevo onboarding
    window.guardarNuevoOnboarding = async function() {
        try {
            console.log('💾 Guardando nuevo proceso de onboarding...');
            
            const employeeName = document.getElementById('new-employee-name').value;
            const employeeId = document.getElementById('new-employee-id').value;
            const email = document.getElementById('new-employee-email').value;
            const position = document.getElementById('new-position').value;
            const department = document.getElementById('new-department').value;
            const location = document.getElementById('new-location').value;
            const startDate = document.getElementById('new-start-date').value;
            
            if (!employeeName || !position || !department || !location || !startDate) {
                alert('Por favor completa todos los campos requeridos (*)');
                return;
            }
            
            // Check if auth is available
            if (!window.auth) {
                throw new Error('Auth no disponible. Por favor recarga la página.');
            }
            
            // Show loading
            if (typeof showNotification === 'function') {
                showNotification('info', 'Creando proceso', 'Por favor espera...');
            }
            
            const onboardingData = {
                employeeName: employeeName,
                employeeId: employeeId || null,
                email: email || null,
                position: position,
                department: department,
                location: location,
                startDate: startDate,
                customSteps: [
                    { name: 'Create user account', description: 'Set up system access', completed: false, due_date: startDate },
                    { name: 'Generate responsibility letter', description: 'Create and send responsibility letter', completed: false, due_date: startDate },
                    { name: 'Assign assets', description: 'Assign required equipment', completed: false, due_date: startDate },
                    { name: 'Setup workspace', description: 'Configure workspace and tools', completed: false, due_date: startDate },
                    { name: 'Training completion', description: 'Complete required training', completed: false, due_date: startDate }
                ]
            };
            
            console.log('📝 Datos del nuevo onboarding:', onboardingData);
            
            const response = await window.auth.apiRequest('/onboarding/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(onboardingData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error creando proceso de onboarding');
            }
            
            const result = await response.json();
            console.log('✅ Proceso creado exitosamente:', result);
            
            // Cerrar modal
            window.cerrarModalNuevoOnboarding();
            
            // Mostrar mensaje de éxito
            if (typeof showNotification === 'function') {
                showNotification('success', 'Éxito', `Proceso de onboarding creado exitosamente para ${employeeName}`);
            } else {
                alert(`Proceso de onboarding creado exitosamente para ${employeeName}`);
            }
            
            // Recargar la lista de procesos
            if (window.onboardingManager && window.onboardingManager.loadProcesses) {
                setTimeout(() => {
                    window.onboardingManager.loadProcesses();
                }, 500);
            }
        } catch (error) {
            console.error('❌ Error creando onboarding:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', error.message || 'Error creando proceso de onboarding');
            } else {
                alert('Error: ' + (error.message || 'Error creando proceso de onboarding'));
            }
        }
    };

    window.exportOnboarding = function() {
        alert('Función: Exportar datos de onboarding');
    };

    // Generate Onboarding PDF function
    window.generateOnboardingPDF = async function() {
        try {
            console.log('📄 Generando PDF de onboarding...');
            
            // Show modal to collect employee information
            const modal = document.createElement('div');
            modal.id = 'modal-generate-onboarding-pdf';
            modal.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 10000000 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                font-family: Arial, sans-serif !important;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white !important;
                    border-radius: 12px !important;
                    padding: 30px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <h2 style="color: #1F2937; font-size: 24px; font-weight: bold; margin: 0;">
                            📄 Generar PDF de Onboarding
                        </h2>
                        <button onclick="this.closest('#modal-generate-onboarding-pdf').remove()" style="
                            background: #EF4444 !important;
                            color: white !important;
                            border: none !important;
                            padding: 8px 12px !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            font-size: 16px !important;
                        ">✕</button>
                    </div>
                    
                    <form id="form-generate-pdf" style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="position: relative;">
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                👤 Buscar Empleado en Snipe-IT *
                            </label>
                            <input type="text" id="pdf-employee-search" required autocomplete="off" placeholder="Escribe nombre o email para buscar..." style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                            <div id="pdf-employee-autocomplete" style="
                                display: none;
                                position: absolute;
                                top: 100%;
                                left: 0;
                                right: 0;
                                background: white;
                                border: 2px solid #D1D5DB;
                                border-top: none;
                                border-radius: 0 0 8px 8px;
                                max-height: 200px;
                                overflow-y: auto;
                                z-index: 1000;
                                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            "></div>
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                👤 Nombre del Empleado *
                            </label>
                            <input type="text" id="pdf-employee-name" required autocomplete="off" readonly style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                                background: #F3F4F6 !important;
                            ">
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                🆔 ID de Empleado
                            </label>
                            <input type="text" id="pdf-employee-id" autocomplete="off" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                📧 Email *
                            </label>
                            <input type="email" id="pdf-employee-email" required autocomplete="off" readonly style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                                background: #F3F4F6 !important;
                            ">
                            <small style="color: #6B7280; font-size: 12px; margin-top: 4px; display: block;">
                                Se buscarán los assets en Snipe IT usando este email
                            </small>
                        </div>
                        
                        <!-- Assets Preview -->
                        <div id="pdf-assets-preview" style="display: none; margin-top: 10px;">
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                📦 Assets Asignados (desde Snipe-IT)
                            </label>
                            <div style="
                                max-height: 200px;
                                overflow-y: auto;
                                border: 2px solid #D1D5DB;
                                border-radius: 8px;
                                padding: 10px;
                                background: #F9FAFB;
                            ">
                                <table id="pdf-assets-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                    <thead>
                                        <tr style="background: #E5E7EB; font-weight: bold;">
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #D1D5DB;">Asset Tag</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #D1D5DB;">Nombre</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #D1D5DB;">Modelo</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #D1D5DB;">Serial</th>
                                        </tr>
                                    </thead>
                                    <tbody id="pdf-assets-table-body">
                                    </tbody>
                                </table>
                                <div id="pdf-assets-loading" style="display: none; text-align: center; padding: 20px; color: #6B7280;">
                                    Cargando assets...
                                </div>
                                <div id="pdf-assets-empty" style="display: none; text-align: center; padding: 20px; color: #6B7280;">
                                    No se encontraron assets asignados
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                💼 Posición
                            </label>
                            <input type="text" id="pdf-position" autocomplete="off" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                🏢 Departamento
                            </label>
                            <input type="text" id="pdf-department" autocomplete="off" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                🌍 Ubicación
                            </label>
                            <select id="pdf-location" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                                <option value="MX">México</option>
                                <option value="CL">Chile</option>
                                <option value="REMOTO">Remoto</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                                📅 Fecha de Inicio
                            </label>
                            <input type="date" id="pdf-start-date" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button type="submit" style="
                                flex: 1 !important;
                                background: #3B82F6 !important;
                                color: white !important;
                                border: none !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                font-weight: bold !important;
                                cursor: pointer !important;
                            ">Generar PDF</button>
                            <button type="button" onclick="this.closest('#modal-generate-onboarding-pdf').remove()" style="
                                flex: 1 !important;
                                background: #6B7280 !important;
                                color: white !important;
                                border: none !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                font-weight: bold !important;
                                cursor: pointer !important;
                            ">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Setup autocomplete for employee search
            let searchTimeout;
            let selectedUserId = null;
            const searchInput = document.getElementById('pdf-employee-search');
            const autocompleteDiv = document.getElementById('pdf-employee-autocomplete');
            const nameInput = document.getElementById('pdf-employee-name');
            const emailInput = document.getElementById('pdf-employee-email');
            const idInput = document.getElementById('pdf-employee-id');
            const assetsPreview = document.getElementById('pdf-assets-preview');
            const assetsTableBody = document.getElementById('pdf-assets-table-body');
            const assetsLoading = document.getElementById('pdf-assets-loading');
            const assetsEmpty = document.getElementById('pdf-assets-empty');
            
            // Search users in Snipe-IT
            searchInput.addEventListener('input', async (e) => {
                const query = e.target.value.trim();
                
                clearTimeout(searchTimeout);
                
                if (query.length < 2) {
                    autocompleteDiv.style.display = 'none';
                    return;
                }
                
                searchTimeout = setTimeout(async () => {
                    try {
                        const response = await window.auth.apiRequest(`/jumpcloud/snipe/users/search?query=${encodeURIComponent(query)}`, {
                            method: 'GET'
                        });
                        
                        const data = await response.json();
                        const users = data.users || [];
                        
                        if (users.length === 0) {
                            autocompleteDiv.innerHTML = '<div style="padding: 12px; color: #6B7280; text-align: center;">No se encontraron usuarios</div>';
                            autocompleteDiv.style.display = 'block';
                            return;
                        }
                        
                        autocompleteDiv.innerHTML = users.map(user => `
                            <div class="autocomplete-item" data-user-id="${user.id}" data-user-name="${user.name}" data-user-email="${user.email || user.username}" data-user-id-num="${user.employee_num}" style="
                                padding: 12px;
                                cursor: pointer;
                                border-bottom: 1px solid #E5E7EB;
                                transition: background 0.2s;
                            " onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='white'">
                                <div style="font-weight: bold; color: #1F2937;">${user.name}</div>
                                <div style="font-size: 12px; color: #6B7280;">${user.email || user.username || ''} ${user.employee_num ? '| ID: ' + user.employee_num : ''}</div>
                            </div>
                        `).join('');
                        
                        autocompleteDiv.style.display = 'block';
                        
                        // Add click handlers
                        autocompleteDiv.querySelectorAll('.autocomplete-item').forEach(item => {
                            item.addEventListener('click', async () => {
                                const userId = item.dataset.userId;
                                const userName = item.dataset.userName;
                                const userEmail = item.dataset.userEmail;
                                const userIdNum = item.dataset.userIdNum;
                                
                                selectedUserId = userId;
                                searchInput.value = userName;
                                nameInput.value = userName;
                                emailInput.value = userEmail;
                                if (userIdNum) idInput.value = userIdNum;
                                
                                autocompleteDiv.style.display = 'none';
                                
                                // Load assets for this user
                                assetsPreview.style.display = 'block';
                                assetsTableBody.innerHTML = '';
                                assetsLoading.style.display = 'block';
                                assetsEmpty.style.display = 'none';
                                
                                try {
                                    const assetsResponse = await window.auth.apiRequest(`/jumpcloud/snipe/users/${userId}/assets`, {
                                        method: 'GET'
                                    });
                                    
                                    const assetsData = await assetsResponse.json();
                                    const assets = assetsData.assets || [];
                                    
                                    assetsLoading.style.display = 'none';
                                    
                                    if (assets.length === 0) {
                                        assetsEmpty.style.display = 'block';
                                    } else {
                                        assetsTableBody.innerHTML = assets.map(asset => `
                                            <tr style="border-bottom: 1px solid #E5E7EB;">
                                                <td style="padding: 8px;">${asset.asset_tag || 'N/A'}</td>
                                                <td style="padding: 8px;">${asset.name || 'N/A'}</td>
                                                <td style="padding: 8px;">${asset.model || 'N/A'}</td>
                                                <td style="padding: 8px;">${asset.serial || 'N/A'}</td>
                                            </tr>
                                        `).join('');
                                    }
                                } catch (error) {
                                    console.error('Error loading assets:', error);
                                    assetsLoading.style.display = 'none';
                                    assetsEmpty.style.display = 'block';
                                    assetsEmpty.textContent = 'Error cargando assets: ' + (error.message || 'Error desconocido');
                                }
                            });
                        });
                    } catch (error) {
                        console.error('Error searching users:', error);
                        autocompleteDiv.innerHTML = '<div style="padding: 12px; color: #EF4444; text-align: center;">Error buscando usuarios</div>';
                        autocompleteDiv.style.display = 'block';
                    }
                }, 300);
            });
            
            // Close autocomplete when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
                    autocompleteDiv.style.display = 'none';
                }
            });
            
            // Handle form submission
            document.getElementById('form-generate-pdf').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const employeeName = document.getElementById('pdf-employee-name').value;
                const employeeId = document.getElementById('pdf-employee-id').value;
                const email = document.getElementById('pdf-employee-email').value;
                const position = document.getElementById('pdf-position').value;
                const department = document.getElementById('pdf-department').value;
                const location = document.getElementById('pdf-location').value;
                const startDate = document.getElementById('pdf-start-date').value || new Date().toISOString().split('T')[0];
                
                // Show loading
                const submitButton = e.target.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Generando PDF...';
                
                try {
                    if (!window.auth) {
                        throw new Error('Auth no disponible. Por favor recarga la página.');
                    }
                    
                    const response = await window.auth.apiRequest('/onboarding/generate-pdf', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            employeeName,
                            employeeId,
                            email,
                            position,
                            department,
                            location,
                            startDate
                        })
                    });
                    
                    // Check if response is OK
                    if (!response.ok) {
                        // Try to get error message
                        let errorMessage = 'Error generando PDF';
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorData.details || errorMessage;
                        } catch (e) {
                            errorMessage = `Error ${response.status}: ${response.statusText}`;
                        }
                        throw new Error(errorMessage);
                    }
                    
                    // Check content type
                    const contentType = response.headers.get('content-type');
                    console.log('Response content-type:', contentType);
                    
                    if (!contentType || !contentType.includes('application/pdf')) {
                        console.warn('Response is not a PDF, content-type:', contentType);
                        // Clone response to read as text
                        const clonedResponse = response.clone();
                        const text = await clonedResponse.text();
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(errorData.error || errorData.details || 'El servidor no devolvió un PDF válido');
                        } catch (e) {
                            throw new Error('El servidor no devolvió un PDF válido. Content-Type: ' + contentType);
                        }
                    }
                    
                    // Download PDF
                    const blob = await response.blob();
                    console.log('PDF blob size:', blob.size, 'bytes');
                    
                    // Verify blob is not empty
                    if (blob.size === 0) {
                        throw new Error('El PDF generado está vacío');
                    }
                    
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `onboarding-${employeeName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    // Close modal
                    modal.remove();
                    
                    if (typeof showNotification === 'function') {
                        showNotification('success', 'Éxito', 'PDF generado y descargado correctamente');
                    } else {
                        alert('PDF generado y descargado correctamente');
                    }
                } catch (error) {
                    console.error('Error generando PDF:', error);
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                    
                    if (typeof showNotification === 'function') {
                        showNotification('error', 'Error', error.message || 'Error generando PDF');
                    } else {
                        alert('Error: ' + (error.message || 'Error generando PDF'));
                    }
                }
            });
            
        } catch (error) {
            console.error('Error opening PDF generation modal:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', 'No se pudo abrir el formulario');
            } else {
                alert('Error: ' + error.message);
            }
        }
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
        background: #fbfbfd !important;
        padding: 20px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
    `;

    // Crear el contenido completo con diseño mejorado
    offboardingContainer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header Apple Style -->
            <div class="mb-12 relative">
                <div class="content-card bg-white rounded-3xl p-6 sm:p-8 lg:p-12 border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-2 sm:mb-3" style="color: #1d1d1f; letter-spacing: -0.02em;">Procesos de Offboarding</h1>
                            <p class="text-base sm:text-lg" style="color: #86868b; font-weight: 400;">Gestiona el proceso de salida de empleados</p>
                        </div>
                        <div class="hidden sm:block">
                            <div class="w-24 h-24 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%);">
                                <i class="fas fa-user-minus text-3xl" style="color: #ff3b30;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards Apple Style -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">En Proceso</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;">8</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Activos</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <svg class="flaticon-icon text-lg" style="width: 1.125rem; height: 1.125rem; color: #ff9500;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">Assets Pendientes</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;">15</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Por recuperar</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <svg class="flaticon-icon text-lg" style="width: 1.125rem; height: 1.125rem; color: #0071e3;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="4" width="20" height="12" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="2" y1="16" x2="22" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">Documentos Faltantes</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;">6</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Requieren atención</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <svg class="flaticon-icon text-lg" style="width: 1.125rem; height: 1.125rem; color: #ff9500;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card bg-white rounded-3xl border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 2.25rem;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium mb-2.5" style="color: #86868b; letter-spacing: 0.01em;">Completados</p>
                            <p class="text-4xl font-semibold mb-1" style="color: #1d1d1f; letter-spacing: -0.03em;">12</p>
                            <p class="text-xs mt-1.5" style="color: #86868b;">Finalizados</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300" style="background: #f5f5f7;">
                            <i class="fas fa-check-circle text-lg" style="color: #30d158;"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Bar Apple Style -->
            <div class="content-card bg-white rounded-3xl p-8 mb-8 border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div class="flex flex-row items-center justify-between gap-6 flex-wrap">
                    <div class="flex flex-row flex-wrap items-center gap-3">
                        <button onclick="createNewOffboarding()" class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center justify-center whitespace-nowrap transition-all duration-200" style="background: #1d1d1f; color: white; font-weight: 500; font-size: 14px sm:text-base; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Nuevo Offboarding
                        </button>
                        <button onclick="exportOffboarding()" class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center justify-center whitespace-nowrap transition-all duration-200 text-sm sm:text-base" style="background: #1d1d1f; color: white; font-weight: 500; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="hidden sm:inline">Exportar</span>
                            <span class="sm:hidden">Exportar</span>
                        </button>
                        <button onclick="generateOffboardingReport()" class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center justify-center whitespace-nowrap transition-all duration-200 text-sm sm:text-base" style="background: #1d1d1f; color: white; font-weight: 500; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="hidden sm:inline">Reporte</span>
                            <span class="sm:hidden">Reporte</span>
                        </button>
                        <button onclick="bulkOffboardingActions()" class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center justify-center whitespace-nowrap transition-all duration-200 text-sm sm:text-base" style="background: #1d1d1f; color: white; font-weight: 500; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="hidden sm:inline">Acciones Masivas</span>
                            <span class="sm:hidden">Masivas</span>
                        </button>
                        <button onclick="openPDFEditor()" class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center justify-center whitespace-nowrap transition-all duration-200 text-sm sm:text-base" style="background: #1d1d1f; color: white; font-weight: 500; letter-spacing: -0.01em;" onmouseover="this.style.background='#2d2d2f'" onmouseout="this.style.background='#1d1d1f'">
                            <svg class="flaticon-icon mr-2 text-sm" style="width: 0.875rem; height: 0.875rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Editar Template PDF
                        </button>
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <div class="relative w-full sm:w-64">
                            <input type="text" placeholder="Buscar empleado..." class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-full text-sm focus:outline-none" style="background: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 14px;" onfocus="this.style.background='white'; this.style.borderColor='#0071e3'" onblur="this.style.background='#f5f5f7'; this.style.borderColor='#d2d2d7'">
                            <svg class="flaticon-icon absolute left-3 top-1/2 transform -translate-y-1/2" style="width: 0.875rem; height: 0.875rem; color: #86868b;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <select class="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-full text-sm focus:outline-none" style="background: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 14px;" onfocus="this.style.background='white'; this.style.borderColor='#0071e3'" onblur="this.style.background='#f5f5f7'; this.style.borderColor='#d2d2d7'">
                            <option value="">Todos los estados</option>
                            <option value="in_progress">En Proceso</option>
                            <option value="pending_assets">Assets Pendientes</option>
                            <option value="missing_docs">Documentos Faltantes</option>
                            <option value="completed">Completados</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Offboarding Table Apple Style -->
            <div class="content-card bg-white rounded-3xl overflow-hidden border" style="border-color: rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b" style="border-color: #f5f5f7;">
                    <h3 class="text-xl sm:text-2xl font-semibold flex items-center" style="color: #1d1d1f; letter-spacing: -0.02em;">
                        <i class="fas fa-table mr-2 sm:mr-3 text-lg sm:text-xl" style="color: #ff3b30;"></i>
                        <span class="hidden sm:inline">Lista de Procesos de Offboarding</span>
                        <span class="sm:hidden">Offboarding</span>
                    </h3>
                </div>
                <div class="overflow-x-auto -mx-4 sm:mx-0">
                    <table class="w-full divide-y divide-gray-200" style="min-width: 1000px;">
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
        console.log('🔵 createNewOffboarding called');
        
        // Check if offboardingManager exists
        if (window.offboardingManager) {
            console.log('✅ Using offboardingManager.openCreateProcessModal()');
            window.offboardingManager.openCreateProcessModal();
        } else if (window.openCreateOffboardingModal) {
            console.log('✅ Using global openCreateOffboardingModal()');
            window.openCreateOffboardingModal();
        } else {
            // Fallback: directly open the modal
            console.log('⚠️ Fallback: directly opening modal');
            const modal = document.getElementById('createOffboardingModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.zIndex = '100000';
                
                // Reset form
                const form = document.getElementById('createOffboardingForm');
                if (form) {
                    form.reset();
                }
                
                console.log('✅ Modal opened successfully');
            } else {
                console.error('❌ createOffboardingModal not found in DOM');
                alert('Error: No se pudo abrir el modal de crear offboarding. Por favor, recarga la página.');
            }
        }
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

// Abrir herramienta de firma de PDF
function openPdfSignerTool() {
    console.log('📝 Abriendo herramienta de firma de PDF...');
    
    // Crear o mostrar sección de firma de PDF
    let pdfSignerSection = document.getElementById('pdf-signer-section');
    
    if (!pdfSignerSection) {
        // Crear la sección si no existe
        pdfSignerSection = document.createElement('div');
        pdfSignerSection.id = 'pdf-signer-section';
        pdfSignerSection.className = 'section hidden';
        pdfSignerSection.style.cssText = `
            position: relative;
            min-height: 100vh;
            padding-top: 80px;
            background: #f5f5f7;
        `;
        
        const container = document.createElement('div');
        container.className = 'container mx-auto px-6 py-8';
        container.id = 'pdfSignerContainer';
        pdfSignerSection.appendChild(container);
        
        // Agregar al dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.appendChild(pdfSignerSection);
        } else {
            document.body.appendChild(pdfSignerSection);
        }
    }
    
    // Ocultar todas las demás secciones
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'pdf-signer-section') {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    });
    
    // Mostrar la sección de firma
    pdfSignerSection.classList.remove('hidden');
    pdfSignerSection.style.display = 'block';
    pdfSignerSection.style.visibility = 'visible';
    pdfSignerSection.style.opacity = '1';
    
    // Renderizar la herramienta
    const container = document.getElementById('pdfSignerContainer');
    if (container && window.pdfSignerTool) {
        window.pdfSignerTool.render(container);
    } else if (container) {
        // Si no existe, inicializarla
        if (window.PDFSignerTool) {
            window.pdfSignerTool = new window.PDFSignerTool();
            window.pdfSignerTool.render(container);
        } else {
            container.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div class="text-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p class="text-gray-600 dark:text-gray-400">Cargando herramienta de firma...</p>
                    </div>
                </div>
            `;
            // Esperar a que se cargue el script
            setTimeout(() => {
                if (window.pdfSignerTool) {
                    window.pdfSignerTool.render(container);
                } else if (window.PDFSignerTool) {
                    window.pdfSignerTool = new window.PDFSignerTool();
                    window.pdfSignerTool.render(container);
                }
            }, 500);
        }
    }
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hacer la función globalmente disponible
window.openPdfSignerTool = openPdfSignerTool;

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

// User Management Functions - Create full page overlay (like onboarding/offboarding)
window.abrirGestionUsuarios = function() {
    // Limpiar cualquier overlay existente (incluyendo ultimate-users-interface)
    const existingOverlays = document.querySelectorAll('#users-section-overlay, #ultimate-users-interface, [id$="-section-overlay"]');
    existingOverlays.forEach(el => el.remove());

    // Limpiar cualquier sección con position fixed
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        if (section.style.position === 'fixed' || section.id.includes('overlay')) {
            section.remove();
        }
    });

    // Limpiar botones de cerrar
    document.querySelectorAll('button[class*="fixed top-20 right-4"], button[id*="close-users"]').forEach(btn => {
        btn.remove();
    });

    // Ocultar dashboard
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.classList.add('hidden');
        dashboardSection.style.display = 'none';
    }

    // Obtener el contenido de la sección de usuarios del HTML
    const existingUsersSection = document.getElementById('users-section');
    let usersContent = '';
    
    if (existingUsersSection) {
        usersContent = existingUsersSection.innerHTML;
    } else {
        // Fallback: crear contenido básico
        usersContent = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 class="text-5xl font-semibold mb-3" style="color: #1d1d1f; letter-spacing: -0.02em;">Gestión de Usuarios</h1>
                <p class="text-lg" style="color: #86868b; font-weight: 400;">Administra usuarios, roles y permisos del sistema</p>
            </div>
        `;
    }

    // Crear users container como overlay completo
    const usersContainer = document.createElement('div');
    usersContainer.id = 'users-section-overlay';
    usersContainer.className = 'section';
    usersContainer.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: 100vh !important;
        width: 100vw !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        z-index: 9999 !important;
        background: #fbfbfd !important;
        padding: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        margin: 0 !important;
    `;

    // Obtener el header del dashboard y clonarlo
    const dashboardHeader = document.querySelector('header');
    let headerHTML = '';
    if (dashboardHeader) {
        // Clonar el header y ajustar z-index de dropdowns
        const headerClone = dashboardHeader.cloneNode(true);
        // Ajustar z-index del header y sus dropdowns
        headerClone.style.zIndex = '10000';
        headerClone.style.position = 'relative';
        
        // Ajustar z-index de todos los dropdowns dentro del header
        const dropdowns = headerClone.querySelectorAll('[id$="Dropdown"], [id$="dropdown"]');
        dropdowns.forEach(dropdown => {
            dropdown.style.zIndex = '10001';
        });
        
        headerHTML = headerClone.outerHTML;
    } else {
        // Fallback: crear header básico
        headerHTML = `
            <header class="bg-white/80 backdrop-blur-xl sticky top-0 z-40" style="border-bottom: 0.5px solid rgba(0,0,0,0.1); box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; z-index: 10000;">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-20">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 flex items-center group cursor-pointer">
                                <div class="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                    <svg class="flaticon-icon" style="width: 1.25rem; height: 1.25rem; color: white;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
                                    </svg>
                                </div>
                                <div>
                                    <h1 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">TechSupport</h1>
                                    <p class="text-xs text-gray-500 -mt-1 font-medium">Asset Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    usersContainer.innerHTML = `
        ${headerHTML}
        <div style="min-height: calc(100vh - 80px);">
            ${usersContent}
        </div>
    `;
    
    // Después de agregar al DOM, ajustar z-index de dropdowns y re-inicializar eventos
    setTimeout(() => {
        const headerInOverlay = usersContainer.querySelector('header');
        if (headerInOverlay) {
            headerInOverlay.style.zIndex = '10000';
            headerInOverlay.style.position = 'relative';
            
            // Ajustar z-index de todos los dropdowns
            const allDropdowns = headerInOverlay.querySelectorAll('[id$="Dropdown"], [id$="dropdown"], .absolute, [class*="dropdown"]');
            allDropdowns.forEach(dropdown => {
                if (dropdown.style) {
                    dropdown.style.zIndex = '10001';
                }
            });
            
            // Re-inicializar eventos de dropdowns
            const userMenuButton = headerInOverlay.querySelector('#userMenuButton');
            const userDropdown = headerInOverlay.querySelector('#userDropdown');
            if (userMenuButton && userDropdown) {
                userMenuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('hidden');
                });
            }
            
            const notificationButton = headerInOverlay.querySelector('#notificationButton');
            const notificationDropdown = headerInOverlay.querySelector('#notificationDropdown');
            if (notificationButton && notificationDropdown) {
                notificationButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notificationDropdown.classList.toggle('hidden');
                });
            }
            
            const responsibilityButton = headerInOverlay.querySelector('#responsibilityDropdownButton');
            const responsibilityDropdown = headerInOverlay.querySelector('#responsibilityDropdown');
            if (responsibilityButton && responsibilityDropdown) {
                responsibilityButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    responsibilityDropdown.classList.toggle('hidden');
                });
            }
            
            // Cerrar dropdowns al hacer click fuera
            document.addEventListener('click', function closeDropdowns(e) {
                if (userDropdown && !userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
                if (notificationDropdown && !notificationButton.contains(e.target) && !notificationDropdown.contains(e.target)) {
                    notificationDropdown.classList.add('hidden');
                }
                if (responsibilityDropdown && !responsibilityButton.contains(e.target) && !responsibilityDropdown.contains(e.target)) {
                    responsibilityDropdown.classList.add('hidden');
                }
            });
        }
    }, 100);

    // Agregar al body
    document.body.appendChild(usersContainer);

    // Agregar botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `
        <svg class="flaticon-icon" style="width: 1.25rem; height: 1.25rem; color: white;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    closeButton.className = 'fixed top-20 right-4 px-4 py-3 rounded-full transition-all duration-200 z-50';
    closeButton.style.cssText = `
        background: #1d1d1f !important;
        color: white !important;
        border: none !important;
        cursor: pointer !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    `;
    closeButton.onmouseover = function() {
        this.style.background = '#2d2d2f';
    };
    closeButton.onmouseout = function() {
        this.style.background = '#1d1d1f';
    };
    closeButton.onclick = () => {
        usersContainer.remove();
        closeButton.remove();
        // Mostrar dashboard
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.style.display = 'block';
        }
        // Limpiar cualquier otro overlay de usuarios
        const otherUsersOverlays = document.querySelectorAll('#ultimate-users-interface, #users-section-overlay');
        otherUsersOverlays.forEach(el => el.remove());
    };
    document.body.appendChild(closeButton);

    // Cargar datos de usuarios
    setTimeout(() => {
        if (window.userManager) {
            window.userManager.loadUsers();
        } else if (window.UserManager) {
            window.userManager = new window.UserManager();
            window.userManager.loadUsers();
        }
    }, 100);

    return false;
};

// ========================================
// MODALES DE EDICIÓN Y ELIMINACIÓN DE USUARIOS
// ========================================

// Modal de Editar Usuario
window.abrirModalEditarUsuario = function(id, username, email, role, location, isActive, fullName) {
    console.log('🔧 Abriendo modal de editar usuario:', { id, username, email, role, location, isActive, fullName });
    
    // Remover modal existente si existe
    const existingModal = document.getElementById('modal-editar-usuario');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Crear el modal
    const modal = document.createElement('div');
    modal.id = 'modal-editar-usuario';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 10000000 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        font-family: Arial, sans-serif !important;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white !important;
            border-radius: 12px !important;
            padding: 30px !important;
            max-width: 500px !important;
            width: 90% !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            border: 1px solid #E5E7EB !important;
        ">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #E5E7EB;">
                <h2 style="color: #1F2937; font-size: 24px; font-weight: bold; margin: 0;">
                    ✏️ Editar Usuario
                </h2>
                <button onclick="window.cerrarModalEditarUsuario()" style="
                    background: #EF4444 !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 12px !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                ">✕</button>
            </div>
            
            <!-- Form -->
            <form id="form-editar-usuario" style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                        👤 Nombre Completo
                    </label>
                    <input type="text" id="edit-fullname" value="${fullName || username || ''}" style="
                        width: 100% !important;
                        padding: 12px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        box-sizing: border-box !important;
                    " required>
                </div>
                
                <div>
                    <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                        👤 Nombre de Usuario
                    </label>
                    <input type="text" id="edit-username" value="${username}" style="
                        width: 100% !important;
                        padding: 12px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        box-sizing: border-box !important;
                    " required>
                </div>
                
                <div>
                    <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                        📧 Email
                    </label>
                    <input type="email" id="edit-email" value="${email}" style="
                        width: 100% !important;
                        padding: 12px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        box-sizing: border-box !important;
                    " required>
                </div>
                
                <div>
                    <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                        🎭 Rol
                    </label>
                    <select id="edit-role" style="
                        width: 100% !important;
                        padding: 12px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        box-sizing: border-box !important;
                        background: white !important;
                    ">
                        <option value="auditor" ${role === 'auditor' ? 'selected' : ''}>Auditor</option>
                        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                        📍 Ubicación
                    </label>
                    <select id="edit-location" style="
                        width: 100% !important;
                        padding: 12px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        box-sizing: border-box !important;
                        background: white !important;
                    ">
                        <option value="REMOTO" ${location === 'REMOTO' ? 'selected' : ''}>Remoto</option>
                        <option value="MX" ${location === 'MX' ? 'selected' : ''}>México</option>
                        <option value="CL" ${location === 'CL' ? 'selected' : ''}>Chile</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                        🔒 Estado
                    </label>
                    <select id="edit-status" style="
                        width: 100% !important;
                        padding: 12px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        box-sizing: border-box !important;
                        background: white !important;
                    ">
                        <option value="true" ${isActive ? 'selected' : ''}>Activo</option>
                        <option value="false" ${!isActive ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
                
                <!-- Botones -->
                <div style="display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
                    <button type="button" onclick="window.cerrarModalEditarUsuario()" style="
                        flex: 1 !important;
                        padding: 12px 20px !important;
                        background: #6B7280 !important;
                        color: white !important;
                        border: none !important;
                        border-radius: 8px !important;
                        cursor: pointer !important;
                        font-weight: bold !important;
                        font-size: 14px !important;
                    ">Cancelar</button>
                    <button type="submit" style="
                        flex: 1 !important;
                        padding: 12px 20px !important;
                        background: #3B82F6 !important;
                        color: white !important;
                        border: none !important;
                        border-radius: 8px !important;
                        cursor: pointer !important;
                        font-weight: bold !important;
                        font-size: 14px !important;
                    ">💾 Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    
    // Agregar al body
    document.body.appendChild(modal);
    
    // Manejar el envío del formulario
    const form = document.getElementById('form-editar-usuario');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        window.guardarCambiosUsuario(id);
    });
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.cerrarModalEditarUsuario();
        }
    });
};

// Cerrar modal de editar usuario
window.cerrarModalEditarUsuario = function() {
    const modal = document.getElementById('modal-editar-usuario');
    if (modal) {
        modal.remove();
    }
};

// Guardar cambios del usuario
window.guardarCambiosUsuario = async function(userId) {
    console.log('💾 Guardando cambios del usuario:', userId);
    
    try {
        const fullName = document.getElementById('edit-fullname')?.value || '';
        const username = document.getElementById('edit-username').value;
        const email = document.getElementById('edit-email').value;
        const role = document.getElementById('edit-role').value;
        const location = document.getElementById('edit-location').value;
        const isActive = document.getElementById('edit-status').value === 'true';
        
        const userData = {
            full_name: fullName,
            username: username,
            email: email,
            role: role,
            location: location,
            is_active: isActive
        };
        
        console.log('📝 Datos a guardar:', userData);
        
        // Llamada real a la API
        if (!window.auth || !window.auth.apiRequest) {
            throw new Error('Sistema de autenticación no disponible');
        }
        
        const response = await window.auth.apiRequest(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el usuario');
        }
        
        const result = await response.json();
        console.log('✅ Usuario actualizado exitosamente:', result);
        
        // Mostrar mensaje de éxito
        if (window.showNotification) {
            window.showNotification('success', 'Éxito', `Usuario ${username} actualizado exitosamente`);
        } else {
            alert(`✅ Usuario ${username} actualizado exitosamente!`);
        }
        
        // Cerrar modal
        window.cerrarModalEditarUsuario();
        
        // Recargar la tabla de usuarios
        if (window.userManager && window.userManager.loadUsers) {
            await window.userManager.loadUsers();
        } else if (window.abrirGestionUsuarios) {
            window.abrirGestionUsuarios();
        }
    } catch (error) {
        console.error('❌ Error al guardar cambios del usuario:', error);
        if (window.showNotification) {
            window.showNotification('error', 'Error', error.message || 'No se pudieron guardar los cambios');
        } else {
            alert(`❌ Error: ${error.message || 'No se pudieron guardar los cambios'}`);
        }
    }
};

// Modal de Eliminar Usuario
window.abrirModalEliminarUsuario = function(id, username) {
    console.log('🗑️ Abriendo modal de eliminar usuario:', { id, username });
    
    // Remover modal existente si existe
    const existingModal = document.getElementById('modal-eliminar-usuario');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Crear el modal
    const modal = document.createElement('div');
    modal.id = 'modal-eliminar-usuario';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 10000000 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        font-family: Arial, sans-serif !important;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white !important;
            border-radius: 12px !important;
            padding: 30px !important;
            max-width: 450px !important;
            width: 90% !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            border: 2px solid #EF4444 !important;
        ">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <h2 style="color: #DC2626; font-size: 24px; font-weight: bold; margin: 0; margin-bottom: 10px;">
                    Eliminar Usuario
                </h2>
                <p style="color: #6B7280; font-size: 16px; margin: 0;">
                    Esta acción no se puede deshacer
                </p>
            </div>
            
            <!-- Content -->
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="color: #DC2626; font-size: 16px; margin: 0; font-weight: bold;">
                    ¿Estás seguro de que deseas eliminar al usuario?
                </p>
                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px; border: 1px solid #E5E7EB;">
                    <p style="color: #374151; font-size: 14px; margin: 0; font-weight: bold;">
                        ID: ${id}
                    </p>
                    <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">
                        Usuario: ${username}
                    </p>
                </div>
            </div>
            
            <!-- Warning -->
            <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <p style="color: #92400E; font-size: 14px; margin: 0; font-weight: bold;">
                    ⚠️ Advertencia:
                </p>
                <ul style="color: #92400E; font-size: 13px; margin: 8px 0 0 0; padding-left: 20px;">
                    <li>Se eliminarán todos los datos del usuario</li>
                    <li>Se revocarán todos los permisos y accesos</li>
                    <li>Esta acción es irreversible</li>
                </ul>
            </div>
            
            <!-- Botones -->
            <div style="display: flex; gap: 12px;">
                <button onclick="window.cerrarModalEliminarUsuario()" style="
                    flex: 1 !important;
                    padding: 12px 20px !important;
                    background: #6B7280 !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                ">Cancelar</button>
                <button onclick="window.confirmarEliminarUsuario(${id}, '${username}')" style="
                    flex: 1 !important;
                    padding: 12px 20px !important;
                    background: #EF4444 !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                ">🗑️ Eliminar Usuario</button>
            </div>
        </div>
    `;
    
    // Agregar al body
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.cerrarModalEliminarUsuario();
        }
    });
};

// Cerrar modal de eliminar usuario
window.cerrarModalEliminarUsuario = function() {
    const modal = document.getElementById('modal-eliminar-usuario');
    if (modal) {
        modal.remove();
    }
};

// Confirmar eliminación del usuario
window.confirmarEliminarUsuario = async function(userId, username) {
    console.log('🗑️ Confirmando eliminación del usuario:', { userId, username });
    
    try {
        // Llamada real a la API
        if (!window.auth || !window.auth.apiRequest) {
            throw new Error('Sistema de autenticación no disponible');
        }
        
        const response = await window.auth.apiRequest(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar el usuario');
        }
        
        const result = await response.json();
        console.log('✅ Usuario eliminado exitosamente:', result);
        
        // Mostrar mensaje de éxito
        if (window.showNotification) {
            window.showNotification('success', 'Éxito', `Usuario ${username} eliminado exitosamente`);
        } else {
            alert(`✅ Usuario ${username} eliminado exitosamente!`);
        }
        
        // Cerrar modal
        window.cerrarModalEliminarUsuario();
        
        // Recargar la tabla de usuarios
        if (window.userManager && window.userManager.loadUsers) {
            await window.userManager.loadUsers();
        } else if (window.abrirGestionUsuarios) {
            window.abrirGestionUsuarios();
        }
    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        if (window.showNotification) {
            window.showNotification('error', 'Error', error.message || 'No se pudo eliminar el usuario');
        } else {
            alert(`❌ Error: ${error.message || 'No se pudo eliminar el usuario'}`);
        }
    }
};

// Function to close users section
window.closeUsersSection = function() {
    console.log('🚨 Closing users section');
    const usersSection = document.getElementById('users-section');
    if (usersSection) {
        usersSection.classList.add('hidden');
        usersSection.style.display = 'none';
        usersSection.style.visibility = 'hidden';
        usersSection.style.opacity = '0';
    }
};

// Emergency function to force show users
window.emergencyShowUsers = function() {
    console.log('🚨 EMERGENCY: Force showing users section');
    
    // Create a completely new visible section
    const emergencySection = document.createElement('div');
    emergencySection.id = 'emergency-users-section';
    emergencySection.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: white !important;
        z-index: 99999 !important;
        overflow-y: auto !important;
        padding: 20px !important;
        box-sizing: border-box !important;
    `;
    
    emergencySection.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1F2937; font-size: 28px; font-weight: bold; margin-bottom: 10px;">
                    🚨 Gestión de Usuarios - Vista de Emergencia
                </h1>
                <p style="color: #6B7280; font-size: 16px;">
                    Esta es una vista de emergencia. La sección normal no se pudo mostrar.
                </p>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #EF4444;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #374151; font-size: 20px; font-weight: bold;">
                        Lista de Usuarios
                    </h2>
                    <button onclick="document.getElementById('emergency-users-section').remove()" 
                            style="background: #EF4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        ❌ Cerrar Vista de Emergencia
                    </button>
                </div>
                
                <div id="emergency-users-table-container" style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #D1D5DB;">
                        <thead>
                            <tr style="background: #F3F4F6;">
                                <th style="border: 1px solid #D1D5DB; padding: 12px; text-align: left; font-weight: bold;">ID</th>
                                <th style="border: 1px solid #D1D5DB; padding: 12px; text-align: left; font-weight: bold;">Usuario</th>
                                <th style="border: 1px solid #D1D5DB; padding: 12px; text-align: left; font-weight: bold;">Email</th>
                                <th style="border: 1px solid #D1D5DB; padding: 12px; text-align: left; font-weight: bold;">Rol</th>
                                <th style="border: 1px solid #D1D5DB; padding: 12px; text-align: left; font-weight: bold;">Estado</th>
                            </tr>
                        </thead>
                        <tbody id="emergency-users-tbody">
                            <tr>
                                <td colspan="5" style="border: 1px solid #D1D5DB; padding: 20px; text-align: center; color: #6B7280;">
                                    ⏳ Cargando usuarios...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(emergencySection);
    
    // Load users data
    setTimeout(() => {
        if (window.userManager && window.userManager.users) {
            const tbody = document.getElementById('emergency-users-tbody');
            tbody.innerHTML = '';
            
            window.userManager.users.forEach((user, index) => {
                const row = document.createElement('tr');
                row.style.cssText = `
                    background: ${index % 2 === 0 ? '#ffffff' : '#F9FAFB'};
                    border-bottom: 1px solid #E5E7EB;
                `;
                row.innerHTML = `
                    <td style="border: 1px solid #D1D5DB; padding: 10px;">${user.id}</td>
                    <td style="border: 1px solid #D1D5DB; padding: 10px; font-weight: 500;">${user.username}</td>
                    <td style="border: 1px solid #D1D5DB; padding: 10px;">${user.email}</td>
                    <td style="border: 1px solid #D1D5DB; padding: 10px;">
                        <span style="background: ${user.role === 'admin' ? '#FEF3C7' : '#DBEAFE'}; color: ${user.role === 'admin' ? '#92400E' : '#1E40AF'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${user.role.toUpperCase()}
                        </span>
                    </td>
                    <td style="border: 1px solid #D1D5DB; padding: 10px;">
                        <span style="background: ${user.is_active ? '#D1FAE5' : '#FEE2E2'}; color: ${user.is_active ? '#065F46' : '#991B1B'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            const tbody = document.getElementById('emergency-users-tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="border: 1px solid #D1D5DB; padding: 20px; text-align: center; color: #EF4444;">
                        ❌ No se pudieron cargar los usuarios
                    </td>
                </tr>
            `;
        }
    }, 500);
};

// Handle global errors
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.handleError(event.error, 'Global Error');
    }
});
