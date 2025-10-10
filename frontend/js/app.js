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
            
            // Fix section position if it's inside dashboard-container
            console.log('🔍 Checking section:', sectionId);
            if (sectionId === 'audit-section') {
                console.log('🔧 Calling fixAuditSectionPosition');
                this.fixAuditSectionPosition(targetSection);
            } else if (sectionId === 'onboarding-section') {
                console.log('🔧 Calling fixOnboardingSectionPosition');
                this.fixOnboardingSectionPosition(targetSection);
            } else if (sectionId === 'offboarding-section') {
                console.log('🔧 Calling fixOffboardingSectionPosition');
                this.fixOffboardingSectionPosition(targetSection);
            }
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
        console.log('🔧 Fixing audit section position...');
        
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
            z-index: 1000 !important;
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
        
        console.log('✅ Audit section created and displayed');
    }

    // Fix onboarding section position if it's inside dashboard-container
    fixOnboardingSectionPosition(onboardingSection) {
        console.log('🔧 Fixing onboarding section position...');
        console.log('📊 Target section:', onboardingSection);
        
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
            
            // Create the onboarding content
            onboardingContainer.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <!-- Header -->
                    <div class="mb-8">
                        <h1 class="text-3xl font-bold text-gray-900">Procesos de Onboarding</h1>
                        <p class="mt-2 text-gray-600">Gestiona el proceso de incorporación de nuevos empleados</p>
                    </div>

                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white rounded-lg shadow-sm p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-clock text-blue-600"></i>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-500">Pendientes</p>
                                    <p class="text-2xl font-semibold text-gray-900" id="pendingOnboarding">12</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow-sm p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-paper-plane text-green-600"></i>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-500">Enviadas</p>
                                    <p class="text-2xl font-semibold text-gray-900" id="sentOnboarding">8</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow-sm p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-500">No Firmadas</p>
                                    <p class="text-2xl font-semibold text-gray-900" id="unsignedOnboarding">5</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow-sm p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-exclamation-circle text-red-600"></i>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-500">Atrasadas</p>
                                    <p class="text-2xl font-semibold text-gray-900" id="overdueOnboarding">3</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Bar -->
                    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div class="flex items-center space-x-4">
                                <button onclick="createNewOnboarding()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center">
                                    <i class="fas fa-plus mr-2"></i>
                                    Nuevo Onboarding
                                </button>
                                <button onclick="exportOnboarding()" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center">
                                    <i class="fas fa-download mr-2"></i>
                                    Exportar
                                </button>
                            </div>
                            <div class="mt-4 sm:mt-0">
                                <div class="flex items-center space-x-2">
                                    <input type="text" id="onboardingSearch" placeholder="Buscar empleado..." class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                    <select id="onboardingFilter" class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Todos los estados</option>
                                        <option value="pending">Pendientes</option>
                                        <option value="sent">Enviadas</option>
                                        <option value="unsigned">No Firmadas</option>
                                        <option value="overdue">Atrasadas</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Onboarding Table -->
                    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="onboardingTableBody" class="bg-white divide-y divide-gray-200">
                                    <!-- Sample data -->
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span class="text-sm font-medium text-blue-600">JD</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Juan Díaz</div>
                                                    <div class="text-sm text-gray-500">juan.diaz@empresa.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/01/2025</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="w-full bg-gray-200 rounded-full h-2">
                                                    <div class="bg-blue-600 h-2 rounded-full" style="width: 60%"></div>
                                                </div>
                                                <span class="ml-2 text-sm text-gray-600">60%</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="viewOnboarding(1)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                            <button onclick="editOnboarding(1)" class="text-green-600 hover:text-green-900 mr-3">Editar</button>
                                            <button onclick="sendReminder(1)" class="text-yellow-600 hover:text-yellow-900">Recordar</button>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                        <span class="text-sm font-medium text-green-600">MR</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">María Rodríguez</div>
                                                    <div class="text-sm text-gray-500">maria.rodriguez@empresa.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10/01/2025</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="w-full bg-gray-200 rounded-full h-2">
                                                    <div class="bg-green-600 h-2 rounded-full" style="width: 100%"></div>
                                                </div>
                                                <span class="ml-2 text-sm text-gray-600">100%</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="viewOnboarding(2)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                            <button onclick="downloadCertificate(2)" class="text-green-600 hover:text-green-900">Certificado</button>
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
            
            console.log('✅ Onboarding container added to body');
            
            // Load onboarding data
            setTimeout(() => {
                console.log('📊 Loading onboarding data...');
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
            
            console.log('✅ Onboarding section created and displayed');
            
        } catch (error) {
            console.error('❌ Error in fixOnboardingSectionPosition:', error);
        }
    }

    // Fix offboarding section position if it's inside dashboard-container
    fixOffboardingSectionPosition(offboardingSection) {
        console.log('🔧 Fixing offboarding section position...');
        
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
        
        console.log('✅ Offboarding section created and displayed');
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

// Global function to create onboarding overlay
function createOnboardingOverlay() {
    console.log('🔧 Creating onboarding overlay...');
    
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

    // Crear el contenido completo
    onboardingContainer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Procesos de Onboarding</h1>
                <p class="mt-2 text-gray-600">Gestiona el proceso de incorporación de nuevos empleados</p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-blue-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Pendientes</p>
                            <p class="text-2xl font-semibold text-gray-900">12</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-paper-plane text-green-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Enviadas</p>
                            <p class="text-2xl font-semibold text-gray-900">8</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">No Firmadas</p>
                            <p class="text-2xl font-semibold text-gray-900">5</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-exclamation-circle text-red-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Atrasadas</p>
                            <p class="text-2xl font-semibold text-gray-900">3</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Bar -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center space-x-4">
                        <button onclick="createNewOnboarding()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center">
                            <i class="fas fa-plus mr-2"></i>
                            Nuevo Onboarding
                        </button>
                        <button onclick="exportOnboarding()" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center">
                            <i class="fas fa-download mr-2"></i>
                            Exportar
                        </button>
                    </div>
                    <div class="mt-4 sm:mt-0">
                        <div class="flex items-center space-x-2">
                            <input type="text" placeholder="Buscar empleado..." class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                            <select class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Todos los estados</option>
                                <option value="pending">Pendientes</option>
                                <option value="sent">Enviadas</option>
                                <option value="unsigned">No Firmadas</option>
                                <option value="overdue">Atrasadas</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Onboarding Table -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span class="text-sm font-medium text-blue-600">JD</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">Juan Díaz</div>
                                            <div class="text-sm text-gray-500">juan.diaz@empresa.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/01/2025</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: 60%"></div>
                                        </div>
                                        <span class="ml-2 text-sm text-gray-600">60%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="viewOnboarding(1)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                    <button onclick="editOnboarding(1)" class="text-green-600 hover:text-green-900 mr-3">Editar</button>
                                    <button onclick="sendReminder(1)" class="text-yellow-600 hover:text-yellow-900">Recordar</button>
                                </td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <span class="text-sm font-medium text-green-600">MR</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">María Rodríguez</div>
                                            <div class="text-sm text-gray-500">maria.rodriguez@empresa.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10/01/2025</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-green-600 h-2 rounded-full" style="width: 100%"></div>
                                        </div>
                                        <span class="ml-2 text-sm text-gray-600">100%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="viewOnboarding(2)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                    <button onclick="downloadCertificate(2)" class="text-green-600 hover:text-green-900">Certificado</button>
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

    console.log('✅ Onboarding overlay creado');
}

// Global function to create offboarding overlay
function createOffboardingOverlay() {
    console.log('🔧 Creating offboarding overlay...');
    
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

    // Crear el contenido completo
    offboardingContainer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Procesos de Offboarding</h1>
                <p class="mt-2 text-gray-600">Gestiona el proceso de salida de empleados</p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-orange-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">En Proceso</p>
                            <p class="text-2xl font-semibold text-gray-900">8</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-laptop text-blue-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Assets Pendientes</p>
                            <p class="text-2xl font-semibold text-gray-900">15</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Documentos Faltantes</p>
                            <p class="text-2xl font-semibold text-gray-900">6</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-green-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Completados</p>
                            <p class="text-2xl font-semibold text-gray-900">12</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Bar -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center space-x-4">
                        <button onclick="createNewOffboarding()" class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200 flex items-center">
                            <i class="fas fa-plus mr-2"></i>
                            Nuevo Offboarding
                        </button>
                        <button onclick="exportOffboarding()" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center">
                            <i class="fas fa-download mr-2"></i>
                            Exportar
                        </button>
                        <button onclick="generateOffboardingReport()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center">
                            <i class="fas fa-chart-bar mr-2"></i>
                            Reporte
                        </button>
                    </div>
                    <div class="mt-4 sm:mt-0">
                        <div class="flex items-center space-x-2">
                            <input type="text" placeholder="Buscar empleado..." class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                            <select class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Todos los estados</option>
                                <option value="in_progress">En Proceso</option>
                                <option value="pending_assets">Assets Pendientes</option>
                                <option value="missing_docs">Documentos Faltantes</option>
                                <option value="completed">Completados</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Offboarding Table -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Salida</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                <span class="text-sm font-medium text-orange-600">AL</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">Ana López</div>
                                            <div class="text-sm text-gray-500">ana.lopez@empresa.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">20/01/2025</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">En Proceso</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <i class="fas fa-laptop text-blue-600 mr-1"></i>
                                        <span class="text-sm text-gray-900">2 pendientes</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-orange-600 h-2 rounded-full" style="width: 75%"></div>
                                        </div>
                                        <span class="ml-2 text-sm text-gray-600">75%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="viewOffboarding(1)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                    <button onclick="editOffboarding(1)" class="text-green-600 hover:text-green-900 mr-3">Editar</button>
                                    <button onclick="sendReminderOffboarding(1)" class="text-yellow-600 hover:text-yellow-900">Recordar</button>
                                </td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                                <span class="text-sm font-medium text-red-600">CM</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">Carlos Martínez</div>
                                            <div class="text-sm text-gray-500">carlos.martinez@empresa.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">18/01/2025</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Documentos Faltantes</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <i class="fas fa-check-circle text-green-600 mr-1"></i>
                                        <span class="text-sm text-gray-900">Completados</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-yellow-600 h-2 rounded-full" style="width: 90%"></div>
                                        </div>
                                        <span class="ml-2 text-sm text-gray-600">90%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="viewOffboarding(2)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                    <button onclick="requestDocuments(2)" class="text-yellow-600 hover:text-yellow-900 mr-3">Solicitar Docs</button>
                                    <button onclick="completeOffboarding(2)" class="text-green-600 hover:text-green-900">Completar</button>
                                </td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <span class="text-sm font-medium text-green-600">SG</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">Sofia García</div>
                                            <div class="text-sm text-gray-500">sofia.garcia@empresa.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/01/2025</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <i class="fas fa-check-circle text-green-600 mr-1"></i>
                                        <span class="text-sm text-gray-900">Completados</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-green-600 h-2 rounded-full" style="width: 100%"></div>
                                        </div>
                                        <span class="ml-2 text-sm text-gray-600">100%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="viewOffboarding(3)" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                    <button onclick="downloadOffboardingCertificate(3)" class="text-green-600 hover:text-green-900">Certificado</button>
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

    console.log('✅ Offboarding overlay creado');
}

// Initialize dropdown functionality
function initializeDropdowns() {
    // Responsibility dropdown functionality
    const responsibilityDropdownButton = document.getElementById('responsibilityDropdownButton');
    const responsibilityDropdown = document.getElementById('responsibilityDropdown');
    
    if (responsibilityDropdownButton && responsibilityDropdown) {
        responsibilityDropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = responsibilityDropdown.classList.contains('hidden');
            
            if (isHidden) {
                responsibilityDropdown.classList.remove('hidden');
                responsibilityDropdown.classList.add('dropdown-enter');
                
                // Rotate chevron
                const chevron = responsibilityDropdownButton.querySelector('i');
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                }
            } else {
                responsibilityDropdown.classList.add('hidden');
                responsibilityDropdown.classList.remove('dropdown-enter');
                
                // Reset chevron
                const chevron = responsibilityDropdownButton.querySelector('i');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!responsibilityDropdownButton.contains(e.target) && !responsibilityDropdown.contains(e.target)) {
                responsibilityDropdown.classList.add('hidden');
                responsibilityDropdown.classList.remove('dropdown-enter');
                
                // Reset chevron
                const chevron = responsibilityDropdownButton.querySelector('i');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
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
