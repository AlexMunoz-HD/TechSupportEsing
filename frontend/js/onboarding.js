// Onboarding Management module
class OnboardingManager {
    constructor() {
        this.isLoading = false; // Bandera para evitar loops infinitos
        this.processes = [];
        this.filteredProcesses = [];
        this.apiBase = '/onboarding';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.sortField = 'start_date';
        this.sortDirection = 'desc';
        this.searchTerm = '';
        this.filters = {
            status: '',
            location: '',
            department: ''
        };
        
        console.log('OnboardingManager properties initialized');
        console.log('API Base:', this.apiBase);
        
        this.init();
        
    }

    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('onboardingSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const statusFilter = document.getElementById('statusOnboardingFilter');
        const locationFilter = document.getElementById('locationOnboardingFilter');
        const departmentFilter = document.getElementById('departmentOnboardingFilter');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.filters.location = e.target.value;
                this.applyFilters();
            });
        }

        if (departmentFilter) {
            departmentFilter.addEventListener('change', (e) => {
                this.filters.department = e.target.value;
                this.applyFilters();
            });
        }
    }

    // Debounce function
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

    // Load processes data
    async loadProcesses() {
        // Evitar múltiples llamadas simultáneas
        if (this.isLoading) {
            console.log('⏸️ [OnboardingManager] Carga ya en progreso, ignorando llamada duplicada');
            return;
        }
        
        this.isLoading = true;
        
        try {
            console.log('📥 [OnboardingManager] Iniciando carga de procesos...');
            console.log('📥 [OnboardingManager] API Base:', this.apiBase);
            console.log('📥 [OnboardingManager] Auth object:', window.auth);
            
            if (!window.auth) {
                console.error('❌ [OnboardingManager] Auth not available');
                this.showErrorState('Sistema de autenticación no disponible');
                this.isLoading = false;
                return;
            }
            
            const response = await window.auth.apiRequest(`${this.apiBase}`);
            
            console.log('📥 [OnboardingManager] Response received:', response);
            console.log('📥 [OnboardingManager] Response status:', response.status);
            console.log('📥 [OnboardingManager] Response ok:', response.ok);
            
            // Verificar si la respuesta es null o undefined (puede pasar si hay un 401)
            if (!response) {
                console.error('❌ [OnboardingManager] Response is null/undefined');
                throw new Error('No se recibió respuesta del servidor');
            }
            
            if (!response.ok) {
                let errorText = 'Error desconocido';
                try {
                    errorText = await response.text();
                } catch (e) {
                    console.error('❌ [OnboardingManager] Error reading error response:', e);
                }
                console.error('❌ [OnboardingManager] Error response:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error loading onboarding processes'}`);
            }
            
            let data;
            try {
                const responseText = await response.text();
                console.log('📥 [OnboardingManager] Response text:', responseText);
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ [OnboardingManager] Error parsing JSON:', parseError);
                throw new Error('Error al procesar la respuesta del servidor');
            }
            
            console.log('✅ [OnboardingManager] Parsed response data:', data);
            
            this.processes = data.processes || [];
            console.log('✅ [OnboardingManager] Processes loaded:', this.processes.length);
            
            // Validar que los procesos tengan la estructura correcta
            this.processes = this.processes.map(process => ({
                ...process,
                employee_name: process.employee_name || process.full_name || 'N/A',
                email: process.email || process.employee_email || '',
                position: process.position || 'N/A',
                department: process.department || 'N/A',
                location: process.location || 'REMOTO',
                status: process.status || 'pending',
                progress: process.progress || 0,
                // Preservar campos de firma y documento
                document_path: process.document_path || null,
                signature_url: process.signature_url || null,
                signature_request_id: process.signature_request_id || null,
            }));
            
            this.applyFilters();
            this.updateStats();
            
            // Asegurar que la tabla se renderice
            this.renderProcessesTable();
            
            // NO llamar ensureSectionVisibility aquí para evitar loops infinitos
            // La visibilidad de la sección se maneja en showSection()
            
            console.log('✅ [OnboardingManager] Carga completada exitosamente');
            
        } catch (error) {
            console.error('❌ [OnboardingManager] Error loading onboarding processes:', error);
            console.error('❌ [OnboardingManager] Error stack:', error.stack);
            
            // Mostrar estado de error en la tabla
            this.showErrorState(error.message || 'Error al cargar los procesos de onboarding');
            
            // Fallback a datos mock solo si es necesario para desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ [OnboardingManager] Usando datos mock para desarrollo');
                this.processes = [
                    {
                        id: 1,
                        employee_name: 'Sofia Martínez',
                        email: 'sofia.martinez@company.com',
                        position: 'Financial Analyst',
                        department: 'Finance',
                        location: 'CL',
                        status: 'in_progress',
                        start_date: new Date(Date.now() - 3*86400000).toISOString(),
                        progress: 75
                    },
                    {
                        id: 2,
                        employee_name: 'Diego Herrera',
                        email: 'diego.herrera@company.com',
                        position: 'Operations Coordinator',
                        department: 'Operations',
                        location: 'MX',
                        status: 'pending',
                        start_date: new Date(Date.now() + 5*86400000).toISOString(),
                        progress: 0
                    }
                ];
                this.applyFilters();
                this.updateStats();
            }
        } finally {
            // Siempre liberar la bandera de carga
            this.isLoading = false;
        }
    }

    // Mostrar estado de error en la tabla
    showErrorState(errorMessage) {
        const tbody = document.getElementById('onboardingTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                        <p class="text-lg font-medium text-gray-900 mb-2">Error al cargar procesos</p>
                        <p class="text-sm text-gray-500 mb-4">${errorMessage}</p>
                        <button onclick="onboardingManager.loadProcesses()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-redo mr-2"></i>Reintentar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Apply filters and search
    applyFilters() {
        this.filteredProcesses = this.processes.filter(process => {
            // Search filter
            const matchesSearch = !this.searchTerm || 
                process.employee_name.toLowerCase().includes(this.searchTerm) ||
                process.position.toLowerCase().includes(this.searchTerm) ||
                process.department.toLowerCase().includes(this.searchTerm);

            // Status filter
            const matchesStatus = !this.filters.status || process.status === this.filters.status;

            // Location filter
            const matchesLocation = !this.filters.location || process.location === this.filters.location;

            // Department filter
            const matchesDepartment = !this.filters.department || process.department === this.filters.department;

            return matchesSearch && matchesStatus && matchesLocation && matchesDepartment;
        });

        // Sort filtered processes
        this.sortProcesses();
        
        // Reset to first page
        this.currentPage = 1;
        
        // Update display
        this.renderProcessesTable();
        this.updatePagination();
        this.updateProcessesCount();
    }

    // Sort processes
    sortProcesses() {
        this.filteredProcesses.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];

            // Handle boolean values
            if (typeof aValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }

            // Handle date values
            if (this.sortField === 'start_date' || this.sortField === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (this.sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    // Sort by field
    sortBy(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.sortProcesses();
        this.renderProcessesTable();
        this.updateSortIndicators();
    }

    // Update sort indicators
    updateSortIndicators() {
        // Remove all sort indicators
        document.querySelectorAll('#onboarding-section th i').forEach(icon => {
            icon.className = 'fas fa-sort ml-1';
        });

        // Add sort indicator to current field
        const currentHeader = document.querySelector(`#onboarding-section th[onclick="onboardingManager.sortBy('${this.sortField}')"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ml-1`;
        }
    }

    // Update stats
    updateStats() {
        const totalProcesses = this.processes.length;
        const inProgressProcesses = this.processes.filter(p => p.status === 'in_progress').length;
        const completedProcesses = this.processes.filter(p => p.status === 'completed').length;
        
        // Calculate processes started this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekProcesses = this.processes.filter(p => new Date(p.start_date) >= oneWeekAgo).length;

        // Check if elements exist before updating
        const totalEl = document.getElementById('totalOnboarding');
        const inProgressEl = document.getElementById('inProgressOnboarding');
        const completedEl = document.getElementById('completedOnboarding');
        const thisWeekEl = document.getElementById('thisWeekOnboarding');
        
        if (totalEl) totalEl.textContent = totalProcesses;
        if (inProgressEl) inProgressEl.textContent = inProgressProcesses;
        if (completedEl) completedEl.textContent = completedProcesses;
        if (thisWeekEl) thisWeekEl.textContent = thisWeekProcesses;
    }

    // Update processes count
    updateProcessesCount() {
        const count = this.filteredProcesses.length;
        const countElement = document.getElementById('onboardingCount');
        if (countElement) {
            countElement.textContent = `Mostrando ${count} proceso${count !== 1 ? 's' : ''}`;
        }
    }

    // Helper function to get country from location
    getCountryFromLocation(location) {
        if (!location) return 'Remoto';
        const loc = location.toUpperCase().trim();
        if (loc === 'MX' || loc === 'MEXICO' || loc === 'MÉXICO') {
            return 'México';
        } else if (loc === 'CL' || loc === 'CHILE') {
            return 'Chile';
        } else {
            return 'Remoto';
        }
    }

    // Render processes table
    renderProcessesTable() {
        const tbody = document.getElementById('onboardingTableBody');
        if (!tbody) {
            console.warn('⚠️ [OnboardingManager] onboardingTableBody no encontrado');
            return;
        }
        
        console.log('🎨 [OnboardingManager] Renderizando tabla con', this.filteredProcesses.length, 'procesos filtrados');

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProcesses = this.filteredProcesses.slice(startIndex, endIndex);

        if (pageProcesses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-user-plus text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium text-gray-900 mb-2">No se encontraron procesos</p>
                            <p class="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageProcesses.map(process => {
            // Validar y sanitizar datos para evitar errores
            const employeeName = (process.employee_name || process.full_name || 'N/A').toString();
            const employeeEmail = (process.email || process.employee_email || '').toString();
            const employeeId = process.employee_id || process.id || 'N/A';
            const position = process.position || 'N/A';
            const department = process.department || 'N/A';
            const location = process.location || 'REMOTO';
            const status = process.status || 'pending';
            const startDate = process.start_date || new Date().toISOString();
            const progress = process.progress || 0;
            
            // Obtener inicial del nombre de forma segura
            const initial = employeeName && employeeName.length > 0 ? employeeName.charAt(0).toUpperCase() : '?';
            
            return `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="user-avatar">
                            <span>${initial}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${employeeName}</div>
                            <div class="text-sm text-gray-500">ID: ${employeeId}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${position}</div>
                    <div class="text-sm text-gray-500">${process.level || 'Sin nivel'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${department}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        this.getCountryFromLocation(location) === 'México'
                            ? 'bg-green-100 text-green-800'
                            : this.getCountryFromLocation(location) === 'Chile'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                    }">
                        ${this.getCountryFromLocation(location)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }">
                        ${this.getStatusLabel(status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(startDate)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <span class="text-xs text-gray-500">${progress}%</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="onboardingManager.viewProcess(${process.id})" 
                                class="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1 rounded hover:bg-blue-50"
                                title="Ver proceso">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="onboardingManager.editProcess(${process.id})" 
                                class="text-yellow-600 hover:text-yellow-900 transition-colors duration-150 p-1 rounded hover:bg-yellow-50"
                                title="Editar proceso">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="onboardingManager.downloadPDF(${process.id})" 
                                class="text-purple-600 hover:text-purple-900 transition-colors duration-150 p-2 rounded hover:bg-purple-50 font-bold"
                                title="Descargar PDF"
                                style="background-color: rgba(147, 51, 234, 0.1); min-width: 32px;">
                            <i class="fas fa-file-pdf text-lg"></i>
                        </button>
                        <button onclick="onboardingManager.showSlackMessageModal(${process.id}, ${JSON.stringify(employeeName)}, ${JSON.stringify(employeeEmail)})" 
                                class="text-purple-600 hover:text-purple-900 transition-colors duration-150 p-1 rounded hover:bg-purple-50"
                                title="Enviar mensaje a Slack">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5.042 15.165a2.528 2.528 0 0 1-1.524-3.237c.16-.38.388-.73.674-1.02l1.523-1.523c.472-.471 1.08-.693 1.696-.693.616 0 1.224.222 1.696.693l.701.701c.471.471.693 1.08.693 1.696 0 .616-.222 1.224-.693 1.696l-1.523 1.523c-.29.286-.64.514-1.02.674a2.528 2.528 0 0 1-3.237-1.524l-.001-.001zm15.916 0a2.528 2.528 0 0 1-3.237 1.524c-.38-.16-.73-.388-1.02-.674l-1.523-1.523a2.396 2.396 0 0 1-.693-1.696c0-.616.222-1.224.693-1.696l.701-.701c.471-.471 1.08-.693 1.696-.693.616 0 1.224.222 1.696.693l1.523 1.523c.286.29.514.64.674 1.02a2.528 2.528 0 0 1 1.524 3.237l.001.001zM12.5 8.5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm0 7c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5z"/>
                            </svg>
                        </button>
                        <button onclick="onboardingManager.showSlackReminderModal(${process.id}, ${JSON.stringify(employeeName)}, ${JSON.stringify(employeeEmail)})" 
                                class="text-orange-600 hover:text-orange-900 transition-colors duration-150 p-1 rounded hover:bg-orange-50"
                                title="Enviar recordatorio de firma">
                            <i class="fas fa-bell"></i>
                        </button>
                        <button onclick="onboardingManager.sendSignatureRequest(${process.id}, ${JSON.stringify(employeeName)}, ${JSON.stringify(employeeEmail)})" 
                                class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                title="Enviar solicitud de firma por Slack">
                            <i class="fas fa-signature"></i>
                        </button>
                        ${status !== 'completed' ? `
                            <button onclick="onboardingManager.markAsResolved(${process.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                    title="Marcar como resuelto (100%)">
                                <i class="fas fa-check-circle"></i>
                            </button>
                        ` : ''}
                        ${status === 'in_progress' ? `
                            <button onclick="onboardingManager.updateProgress(${process.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                    title="Actualizar progreso">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${status !== 'completed' ? `
                            <button onclick="onboardingManager.completeProcess(${process.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                    title="Completar proceso">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button onclick="onboardingManager.deleteProcess(${process.id})" 
                                class="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 rounded hover:bg-red-50"
                                title="Eliminar proceso">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    // Update pagination
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredProcesses.length / this.itemsPerPage);
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredProcesses.length);
        const total = this.filteredProcesses.length;
        
        // Check if pagination elements exist before updating
        const paginationInfo = document.getElementById('onboardingPaginationInfo');
        const prevButton = document.getElementById('onboardingPrevPage');
        const nextButton = document.getElementById('onboardingNextPage');
        
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startIndex}-${endIndex} de ${total} procesos`;
        }
        
        if (prevButton) {
            prevButton.disabled = this.currentPage === 1;
        }
        
        if (nextButton) {
            nextButton.disabled = this.currentPage === this.totalPages;
        }

        // Update page numbers
        this.renderPageNumbers();
    }

    // Render page numbers
    renderPageNumbers() {
        const pageNumbersContainer = document.getElementById('onboardingPageNumbers');
        const pages = [];
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button onclick="onboardingManager.goToPage(${i})" 
                        class="px-3 py-1 text-sm font-medium rounded-md ${
                            i === this.currentPage 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }">
                    ${i}
                </button>
            `);
        }

        pageNumbersContainer.innerHTML = pages.join('');
    }

    // Pagination methods
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderProcessesTable();
            this.updatePagination();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    // Clear filters
    clearFilters() {
        this.searchTerm = '';
        this.filters = { status: '', location: '', department: '' };
        
        document.getElementById('onboardingSearch').value = '';
        document.getElementById('statusOnboardingFilter').value = '';
        document.getElementById('locationOnboardingFilter').value = '';
        document.getElementById('departmentOnboardingFilter').value = '';
        
        this.applyFilters();
    }

    // Get status label
    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };
        return labels[status] || status;
    }

    // View process
    async viewProcess(processId) {
        try {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;

            // Open process details modal
            this.openProcessDetailsModal(process);
        } catch (error) {
            console.error('Error viewing process:', error);
            showNotification('error', 'Error', 'No se pudo abrir el proceso');
        }
    }

    // Edit process
    async editProcess(processId) {
        try {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;

            // Fill edit form
            document.getElementById('editProcessId').value = process.id;
            document.getElementById('editEmployeeName').value = process.employee_name;
            document.getElementById('editPosition').value = process.position;
            document.getElementById('editDepartment').value = process.department;
            document.getElementById('editLocation').value = process.location;
            document.getElementById('editStartDate').value = process.start_date;

            this.openEditProcessModal();
        } catch (error) {
            console.error('Error editing process:', error);
            showNotification('error', 'Error', 'No se pudo cargar la información del proceso');
        }
    }

    // Update progress
    async updateProgress(processId) {
        try {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;

            const newProgress = prompt(`Actualizar progreso para ${process.employee_name} (0-100%):`, process.progress || 0);
            
            if (newProgress === null) return;
            
            const progressValue = parseInt(newProgress);
            if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
                showNotification('error', 'Error', 'El progreso debe ser un número entre 0 y 100');
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/${processId}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                },
                body: JSON.stringify({ progress: progressValue })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error updating progress');
            }

            showNotification('success', 'Éxito', 'Progreso actualizado correctamente');
            this.loadProcesses();
        } catch (error) {
            console.error('Error updating progress:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Complete process
    async completeProcess(processId) {
        try {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;

            if (!confirm(`¿Estás seguro de que quieres completar el proceso de onboarding para ${process.employee_name}?`)) {
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/${processId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error completing process');
            }

            showNotification('success', 'Éxito', 'Proceso completado correctamente');
            this.loadProcesses();
        } catch (error) {
            console.error('Error completing process:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Mark as resolved (100% progress and completed)
    async markAsResolved(processId) {
        try {
            console.log('✅ Mark as resolved called for process:', processId);
            
            const process = this.processes.find(p => p.id === processId);
            if (!process) {
                console.error('❌ Process not found:', processId);
                return;
            }

            if (!confirm(`¿Estás seguro de que quieres marcar como resuelto el proceso de onboarding para ${process.employee_name}? Esto establecerá el progreso al 100% y completará el proceso.`)) {
                return;
            }

            // Check if auth is available
            if (!window.auth) {
                throw new Error('Auth no disponible. Por favor recarga la página.');
            }

            // First, update progress to 100%
            console.log('✅ Updating progress to 100%...');
            const progressResponse = await window.auth.apiRequest(`${this.apiBase}/${processId}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ progress: 100 })
            });

            if (!progressResponse.ok) {
                const error = await progressResponse.json();
                throw new Error(error.error || 'Error actualizando progreso');
            }

            // Then, complete the process
            console.log('✅ Completing process...');
            const completeResponse = await window.auth.apiRequest(`${this.apiBase}/${processId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!completeResponse.ok) {
                const error = await completeResponse.json();
                throw new Error(error.error || 'Error completando proceso');
            }

            console.log('✅ Process marked as resolved successfully');
            if (typeof showNotification === 'function') {
                showNotification('success', 'Éxito', `Proceso de ${process.employee_name} marcado como resuelto (100%)`);
            } else {
                alert(`Proceso de ${process.employee_name} marcado como resuelto (100%)`);
            }
            this.loadProcesses();
        } catch (error) {
            console.error('❌ Error marking as resolved:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', error.message);
            } else {
                alert('Error: ' + error.message);
            }
        }
    }

    // Download PDF
    async downloadPDF(processId) {
        try {
            console.log('📄 Download PDF called for process:', processId);
            console.log('📄 Available processes:', this.processes);
            
            const process = this.processes.find(p => p.id === processId);
            if (!process) {
                console.error('❌ Process not found:', processId);
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Error', 'No se encontró el proceso');
                } else {
                    alert('No se encontró el proceso');
                }
                return;
            }

            // Show loading notification
            if (typeof showNotification === 'function') {
                showNotification('info', 'Generando PDF', 'Por favor espera...');
            }

            // Check if auth is available
            if (!window.auth) {
                throw new Error('Auth no disponible. Por favor recarga la página.');
            }

            // Get full process details including steps
            console.log('📄 Requesting process details from:', `${this.apiBase}/${processId}`);
            const response = await window.auth.apiRequest(`${this.apiBase}/${processId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error obteniendo detalles del proceso');
            }

            const processDetails = await response.json();
            console.log('📄 Process details received:', processDetails);
            
            // Generate PDF using backend endpoint to save signature URL
            await this.generateOnboardingPDFFromBackend(processDetails);

            if (typeof showNotification === 'function') {
                showNotification('success', 'Éxito', 'PDF generado y descargado correctamente');
            }
        } catch (error) {
            console.error('❌ Error downloading PDF:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', error.message || 'Error generando PDF');
            } else {
                alert('Error: ' + (error.message || 'Error generando PDF'));
            }
        }
    }

    // Generate PDF from backend (saves signature URL)
    async generateOnboardingPDFFromBackend(processData) {
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
                    employeeName: processData.employee_name,
                    employeeId: processData.employee_id || '',
                    email: processData.email,
                    position: processData.position || 'N/A',
                    department: processData.department || 'N/A',
                    location: processData.location || 'REMOTO',
                    startDate: processData.start_date || new Date().toISOString().split('T')[0],
                    processId: processData.id  // Pasar el ID del proceso
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error generando PDF');
            }

            // Download PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `onboarding-${processData.employee_name}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Recargar procesos para obtener la URL de firma actualizada
            // Usar setTimeout para evitar llamadas inmediatas que puedan causar loops
            setTimeout(() => {
                this.loadProcesses();
            }, 500);
        } catch (error) {
            console.error('Error generating PDF from backend:', error);
            throw error;
        }
    }

    // Generate PDF with specific format (legacy method, kept for compatibility)
    generateOnboardingPDF(processData) {
        // Check if jsPDF is available, if not, load it dynamically
        if (typeof window.jsPDF === 'undefined') {
            // Load jsPDF from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                this.createPDF(processData);
            };
            script.onerror = () => {
                showNotification('error', 'Error', 'No se pudo cargar la librería de PDF. Por favor recarga la página.');
            };
            document.head.appendChild(script);
        } else {
            this.createPDF(processData);
        }
    }

    // Create PDF document - Format based on doc.docx template
    createPDF(processData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Colors - matching document style
        const textColor = [0, 0, 0]; // Black
        const lineColor = [0, 0, 0]; // Black for lines

        // Page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        let yPosition = margin + 10;

        // Title - Centered (like "Certificado de Devolución de Activos")
        doc.setTextColor(...textColor);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const title = 'Certificado de Proceso de Onboarding';
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, (pageWidth - titleWidth) / 2, yPosition);

        yPosition += 12;

        // Date field with line
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Fecha:', margin, yPosition);
        const currentDate = new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.setFont('helvetica', 'normal');
        doc.text(currentDate, margin + 25, yPosition);
        
        // Line under date
        doc.setDrawColor(...lineColor);
        doc.line(margin + 25, yPosition + 2, margin + 80, yPosition + 2);

        yPosition += 8;

        // Employee Name field with line
        doc.setFont('helvetica', 'normal');
        doc.text('Nombre Colaborador:', margin, yPosition);
        const employeeName = processData.employee_name || 'N/A';
        doc.text(employeeName, margin + 50, yPosition);
        
        // Line under name
        doc.line(margin + 50, yPosition + 2, margin + 150, yPosition + 2);

        yPosition += 10;

        // Employee Information Section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Información del Colaborador:', margin, yPosition);

        yPosition += 7;

        // Employee details in a clean format
        const employeeInfo = [
            ['ID de Empleado:', processData.employee_id || 'N/A'],
            ['Email:', processData.email || 'N/A'],
            ['Posición:', processData.position || 'N/A'],
            ['Departamento:', processData.department || 'N/A'],
            ['Ubicación:', processData.location || 'N/A'],
            ['Fecha de Inicio:', processData.start_date ? new Date(processData.start_date).toLocaleDateString('es-ES') : 'N/A']
        ];

        employeeInfo.forEach(([label, value]) => {
            doc.setFont('helvetica', 'normal');
            doc.text(`${label} ${value}`, margin, yPosition);
            yPosition += 5;
        });

        yPosition += 5;

        // Steps/Process Description Section - Similar to "Descripción de activos recepcionados por Helpdesk"
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Descripción de pasos completados del proceso de onboarding:', margin, yPosition);

        yPosition += 8;

        // Table header for steps - Similar format to the asset return table
        const tableStartX = margin;
        const tableY = yPosition;
        const colWidths = [15, 20, 70, 25, 40]; // ITEM, Estado, DESCRIPCIÓN, Fecha, Observación
        const rowHeight = 7;
        let currentX = tableStartX;

        // Table header background
        doc.setFillColor(240, 240, 240);
        doc.rect(tableStartX, tableY, contentWidth, rowHeight, 'F');

        // Table headers
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ITEM', tableStartX + 5, tableY + 5);
        currentX += colWidths[0];
        
        doc.text('ESTADO', currentX + 5, tableY + 5);
        currentX += colWidths[1];
        
        doc.text('DESCRIPCIÓN DEL PASO', currentX + 5, tableY + 5);
        currentX += colWidths[2];
        
        doc.text('FECHA', currentX + 5, tableY + 5);
        currentX += colWidths[3];
        
        doc.text('OBSERVACIÓN', currentX + 5, tableY + 5);

        // Draw header border
        doc.setDrawColor(...lineColor);
        doc.line(tableStartX, tableY, tableStartX + contentWidth, tableY);
        doc.line(tableStartX, tableY + rowHeight, tableStartX + contentWidth, tableY + rowHeight);
        doc.line(tableStartX, tableY, tableStartX, tableY + rowHeight);
        doc.line(tableStartX + colWidths[0], tableY, tableStartX + colWidths[0], tableY + rowHeight);
        doc.line(tableStartX + colWidths[0] + colWidths[1], tableY, tableStartX + colWidths[0] + colWidths[1], tableY + rowHeight);
        doc.line(tableStartX + colWidths[0] + colWidths[1] + colWidths[2], tableY, tableStartX + colWidths[0] + colWidths[1] + colWidths[2], tableY + rowHeight);
        doc.line(tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableY, tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableY + rowHeight);
        doc.line(tableStartX + contentWidth, tableY, tableStartX + contentWidth, tableY + rowHeight);

        yPosition = tableY + rowHeight;

        // Table rows for steps
        if (processData.steps && processData.steps.length > 0) {
            processData.steps.forEach((step, index) => {
                // Check if we need a new page
                if (yPosition + rowHeight > pageHeight - 50) {
                    doc.addPage();
                    yPosition = margin + 10;
                }

                const rowY = yPosition;
                currentX = tableStartX;

                // Item number
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text((index + 1).toString(), currentX + 5, rowY + 5);
                currentX += colWidths[0];

                // Status
                const statusLabel = step.status === 'completed' ? 'Completado' : 
                                    step.status === 'in_progress' ? 'En Progreso' : 
                                    'Pendiente';
                doc.text(statusLabel, currentX + 5, rowY + 5);
                currentX += colWidths[1];

                // Description
                const stepName = step.step_name || step.name || `Paso ${index + 1}`;
                const description = step.description || '';
                const fullDesc = stepName + (description ? ': ' + description : '');
                const descLines = doc.splitTextToSize(fullDesc, colWidths[2] - 10);
                if (descLines.length > 1) {
                    doc.text(descLines[0], currentX + 5, rowY + 5);
                    doc.text(descLines[1], currentX + 5, rowY + 9);
                } else {
                    doc.text(descLines[0], currentX + 5, rowY + 5);
                }
                currentX += colWidths[2];

                // Date
                const stepDate = step.completed_at ? new Date(step.completed_at).toLocaleDateString('es-ES') : 
                                step.due_date ? new Date(step.due_date).toLocaleDateString('es-ES') : '-';
                doc.text(stepDate, currentX + 5, rowY + 5);
                currentX += colWidths[3];

                // Notes/Observation
                const notes = step.notes || '-';
                const notesLines = doc.splitTextToSize(notes, colWidths[4] - 10);
                doc.text(notesLines[0] || '-', currentX + 5, rowY + 5);

                // Draw row border
                doc.setDrawColor(...lineColor);
                doc.line(tableStartX, rowY, tableStartX + contentWidth, rowY);
                doc.line(tableStartX, rowY + rowHeight, tableStartX + contentWidth, rowY + rowHeight);

                // Adjust row height if description has multiple lines
                const actualRowHeight = descLines.length > 1 ? rowHeight + 5 : rowHeight;
                yPosition += actualRowHeight;
            });
        } else {
            // Empty row if no steps
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('No hay pasos registrados', tableStartX + 10, yPosition + 5);
            doc.line(tableStartX, yPosition, tableStartX + contentWidth, yPosition);
            yPosition += rowHeight;
        }

        // Close table border
        doc.line(tableStartX, tableY + rowHeight, tableStartX, yPosition);
        doc.line(tableStartX + contentWidth, tableY + rowHeight, tableStartX + contentWidth, yPosition);

        yPosition += 15;

        // Progress information
        if (processData.progress !== undefined) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const progress = processData.progress || 0;
            doc.text(`Progreso del Proceso: ${progress}%`, margin, yPosition);
            yPosition += 8;
        }

        // Status
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Estado: ${this.getStatusLabel(processData.status)}`, margin, yPosition);
        yPosition += 12;

        // Signatures section - Similar to "Helpdesk __________________"
        const signatureY = Math.min(yPosition, pageHeight - 50);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Responsable de Onboarding __________________', margin, signatureY);
        doc.text('Colaborador ________________', margin, signatureY + 10);

        // Save PDF
        const fileName = `Onboarding_${processData.employee_name.replace(/\s+/g, '_')}_${processData.id}.pdf`;
        doc.save(fileName);
    }

    // Delete process
    async deleteProcess(processId) {
        try {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;

            if (!confirm(`¿Estás seguro de que quieres eliminar el proceso de onboarding para "${process.employee_name}"? Esta acción no se puede deshacer.`)) {
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/${processId}`, {
                method: 'DELETE',
                headers: {
                    ...auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error deleting process');
            }

            showNotification('success', 'Éxito', 'Proceso eliminado correctamente');
            this.loadProcesses();
        } catch (error) {
            console.error('Error deleting process:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Modal functions
    openCreateProcessModal() {
        console.log('🔵 OnboardingManager.openCreateProcessModal() called');
        const modal = document.getElementById('createOnboardingModal');
        
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '100000';
            
            // Reset form
            const form = document.getElementById('createOnboardingForm');
            if (form) {
                form.reset();
            }
            
            // Setup employee autocomplete from Snipe-IT
            this.setupEmployeeAutocomplete();
            
            console.log('✅ Create onboarding modal opened');
        } else {
            console.error('❌ createOnboardingModal not found in DOM');
        }
    }

    // Setup employee autocomplete from Snipe-IT
    setupEmployeeAutocomplete() {
        const nameInput = document.getElementById('onboardingEmployeeName');
        const autocompleteDiv = document.getElementById('onboardingEmployeeAutocomplete');
        const emailInput = document.getElementById('onboardingEmail');
        const positionInput = document.getElementById('onboardingPosition');
        const departmentInput = document.getElementById('onboardingDepartment');
        const locationInput = document.getElementById('onboardingLocation');
        const employeeIdInput = document.getElementById('onboardingEmployeeId');
        
        if (!nameInput || !autocompleteDiv) {
            console.warn('⚠️ Autocomplete elements not found');
            return;
        }
        
        let searchTimeout;
        let selectedUserId = null;
        
        // Get fresh reference after potential DOM updates
        const currentNameInput = document.getElementById('onboardingEmployeeName');
        if (!currentNameInput) {
            console.warn('⚠️ Name input not found after setup');
            return;
        }
        
        // Search users in Snipe-IT
        currentNameInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                autocompleteDiv.classList.add('hidden');
                autocompleteDiv.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    console.log('🔍 Searching employees in Snipe-IT:', query);
                    
                    if (!window.auth || !window.auth.apiRequest) {
                        console.error('❌ Auth not available');
                        return;
                    }
                    
                    const response = await window.auth.apiRequest(`/jumpcloud/snipe/users/search?query=${encodeURIComponent(query)}`, {
                        method: 'GET'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    const users = data.users || [];
                    
                    console.log('✅ Found users:', users.length);
                    
                    if (users.length === 0) {
                        autocompleteDiv.innerHTML = '<div style="padding: 12px; color: #6B7280; text-align: center; font-size: 14px;">No se encontraron usuarios en Snipe-IT</div>';
                        autocompleteDiv.classList.remove('hidden');
                        autocompleteDiv.style.display = 'block';
                        return;
                    }
                    
                    autocompleteDiv.innerHTML = users.map(user => `
                        <div class="autocomplete-item" 
                             data-user-id="${user.id}" 
                             data-user-name="${user.name || ''}" 
                             data-user-email="${user.email || user.username || ''}" 
                             data-user-position="${user.jobtitle || ''}"
                             data-user-department="${user.department || ''}"
                             data-user-location="${user.location || ''}"
                             data-user-employee-num="${user.employee_num || ''}"
                             style="
                                padding: 12px;
                                cursor: pointer;
                                border-bottom: 1px solid #E5E7EB;
                                transition: background 0.2s;
                            " 
                            onmouseover="this.style.background='#F3F4F6'" 
                            onmouseout="this.style.background='white'">
                            <div style="font-weight: 600; color: #1F2937; font-size: 14px;">${user.name || 'Sin nombre'}</div>
                            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                                ${user.email || user.username || ''} 
                                ${user.employee_num ? '| ID: ' + user.employee_num : ''}
                            </div>
                        </div>
                    `).join('');
                    
                    autocompleteDiv.classList.remove('hidden');
                    autocompleteDiv.style.display = 'block';
                    
                    // Add click handlers
                    autocompleteDiv.querySelectorAll('.autocomplete-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const userId = item.dataset.userId;
                            const userName = item.dataset.userName;
                            const userEmail = item.dataset.userEmail;
                            const userPosition = item.dataset.userPosition;
                            const userDepartment = item.dataset.userDepartment;
                            const userLocation = item.dataset.userLocation;
                            const userEmployeeNum = item.dataset.userEmployeeNum;
                            
                            selectedUserId = userId;
                            const currentInput = document.getElementById('onboardingEmployeeName');
                            if (currentInput) currentInput.value = userName;
                            
                            // Auto-fill other fields
                            if (emailInput) emailInput.value = userEmail;
                            if (positionInput && userPosition) positionInput.value = userPosition;
                            if (departmentInput && userDepartment) departmentInput.value = userDepartment;
                            if (employeeIdInput && userEmployeeNum) employeeIdInput.value = userEmployeeNum;
                            if (locationInput && userLocation) {
                                // Try to match location with select options
                                const locationOptions = Array.from(locationInput.options);
                                const matchedOption = locationOptions.find(opt => 
                                    opt.value === userLocation || 
                                    opt.text.toLowerCase().includes(userLocation.toLowerCase())
                                );
                                if (matchedOption) {
                                    locationInput.value = matchedOption.value;
                                }
                            }
                            
                            autocompleteDiv.classList.add('hidden');
                            autocompleteDiv.style.display = 'none';
                            
                            console.log('✅ Employee selected:', { userName, userEmail, userPosition, userDepartment });
                        });
                    });
                } catch (error) {
                    console.error('❌ Error searching users in Snipe-IT:', error);
                    autocompleteDiv.innerHTML = `<div style="padding: 12px; color: #EF4444; text-align: center; font-size: 14px;">Error buscando usuarios: ${error.message || 'Error desconocido'}</div>`;
                    autocompleteDiv.classList.remove('hidden');
                    autocompleteDiv.style.display = 'block';
                }
            }, 300);
        });
        
        // Close autocomplete when clicking outside
        const closeAutocompleteHandler = (e) => {
            const currentInput = document.getElementById('onboardingEmployeeName');
            if (currentInput && !currentInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
                autocompleteDiv.classList.add('hidden');
                autocompleteDiv.style.display = 'none';
            }
        };
        
        // Use a single event listener that we can remove later
        document.addEventListener('click', closeAutocompleteHandler);
        
        // Store handler for cleanup if needed
        if (!this._autocompleteHandlers) {
            this._autocompleteHandlers = [];
        }
        this._autocompleteHandlers.push(closeAutocompleteHandler);
        
        console.log('✅ Employee autocomplete setup completed');
    }

    closeCreateProcessModal() {
        document.getElementById('createOnboardingModal').classList.add('hidden');
    }

    openEditProcessModal() {
        document.getElementById('editOnboardingModal').classList.remove('hidden');
    }

    closeEditProcessModal() {
        document.getElementById('editOnboardingModal').classList.add('hidden');
    }

    openProcessDetailsModal(process) {
        // Implementation for process details modal
        console.log('Opening process details for:', process);
    }

    // Ensure onboarding section is visible
    ensureSectionVisibility() {
        const onboardingSection = document.getElementById('onboarding-section');
        if (onboardingSection) {
            // Force visibility with multiple approaches
            onboardingSection.classList.remove('hidden');
            onboardingSection.classList.add('show');
            onboardingSection.style.display = 'block';
            onboardingSection.style.opacity = '1';
            onboardingSection.style.transform = 'none';
            onboardingSection.style.visibility = 'visible';

            // Remove any conflicting animation classes
            onboardingSection.classList.remove('page-transition');
            onboardingSection.classList.remove('section-fade-in');
            onboardingSection.classList.remove('section-slide-in-right');
            onboardingSection.classList.remove('section-slide-in-left');
            onboardingSection.classList.remove('section-zoom-in');
            
            console.log('OnboardingManager: Section visibility forced');
            console.log('Onboarding section classes:', onboardingSection.className);
        }
    }

    // Mostrar modal de confirmación para enviar mensaje a Slack
    showSlackMessageModal(processId, employeeName, employeeEmail) {
        const modal = document.createElement('div');
        modal.id = 'slackMessageModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg class="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-1.524-3.237c.16-.38.388-.73.674-1.02l1.523-1.523c.472-.471 1.08-.693 1.696-.693.616 0 1.224.222 1.696.693l.701.701c.471.471.693 1.08.693 1.696 0 .616-.222 1.224-.693 1.696l-1.523 1.523c-.29.286-.64.514-1.02.674a2.528 2.528 0 0 1-3.237-1.524l-.001-.001zm15.916 0a2.528 2.528 0 0 1-3.237 1.524c-.38-.16-.73-.388-1.02-.674l-1.523-1.523a2.396 2.396 0 0 1-.693-1.696c0-.616.222-1.224.693-1.696l.701-.701c.471-.471 1.08-.693 1.696-.693.616 0 1.224.222 1.696.693l1.523 1.523c.286.29.514.64.674 1.02a2.528 2.528 0 0 1 1.524 3.237l.001.001zM12.5 8.5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm0 7c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5z"/>
                        </svg>
                        Enviar Mensaje a Slack
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <p class="text-gray-700 dark:text-gray-300">
                        ¿Estás seguro de enviar mensaje a <strong>${employeeName}</strong> por Slack?
                    </p>
                </div>
                <div class="flex gap-3 justify-end">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        No
                    </button>
                    <button onclick="onboardingManager.sendSlackMessage(${processId}, ${JSON.stringify(employeeName)}, ${JSON.stringify(employeeEmail)}); this.closest('.fixed').remove();" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Sí
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Mostrar modal de confirmación para enviar recordatorio de firma
    showSlackReminderModal(processId, employeeName, employeeEmail) {
        const modal = document.createElement('div');
        modal.id = 'slackReminderModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="fas fa-bell text-orange-600"></i>
                        Recordatorio de Firma
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <p class="text-gray-700 dark:text-gray-300">
                        ¿Quieres enviar un recordatorio de firma a <strong>${employeeName}</strong>?
                    </p>
                </div>
                <div class="flex gap-3 justify-end">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        No
                    </button>
                    <button onclick="onboardingManager.sendSlackReminder(${processId}, ${JSON.stringify(employeeName)}, ${JSON.stringify(employeeEmail)}); this.closest('.fixed').remove();" 
                            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        Sí
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Enviar mensaje a Slack
    async sendSlackMessage(processId, employeeName, employeeEmail) {
        try {
            if (!employeeEmail) {
                if (window.showNotification) {
                    window.showNotification('warning', 'Advertencia', 'El proceso no tiene email asociado. No se puede enviar el mensaje.');
                } else {
                    alert('⚠️ El proceso no tiene email asociado.');
                }
                return;
            }

            const response = await window.auth.apiRequest('/integrations/slack/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: processId,
                    userName: employeeName,
                    userEmail: employeeEmail
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error enviando mensaje a Slack');
            }

            const result = await response.json();
            if (window.showNotification) {
                window.showNotification('success', 'Éxito', 'Mensaje enviado a Slack exitosamente');
            } else {
                alert('✅ Mensaje enviado a Slack exitosamente');
            }
        } catch (error) {
            console.error('Error sending Slack message:', error);
            if (window.showNotification) {
                window.showNotification('error', 'Error', error.message || 'No se pudo enviar el mensaje a Slack');
            } else {
                alert(`❌ Error: ${error.message || 'No se pudo enviar el mensaje a Slack'}`);
            }
        }
    }

    // Enviar recordatorio de firma a Slack
    async sendSlackReminder(processId, employeeName, employeeEmail) {
        try {
            if (!employeeEmail) {
                if (window.showNotification) {
                    window.showNotification('warning', 'Advertencia', 'El proceso no tiene email asociado. No se puede enviar el recordatorio.');
                } else {
                    alert('⚠️ El proceso no tiene email asociado.');
                }
                return;
            }

            // Intentar obtener URL de firma si existe
            let signatureUrl = null;
            // Aquí podrías buscar si hay una solicitud de firma asociada al proceso
            // Por ahora lo dejamos como null

            const response = await window.auth.apiRequest('/integrations/slack/send-reminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: processId,
                    userName: employeeName,
                    userEmail: employeeEmail,
                    signatureUrl: signatureUrl
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error enviando recordatorio a Slack');
            }

            const result = await response.json();
            if (window.showNotification) {
                window.showNotification('success', 'Éxito', 'Recordatorio de firma enviado a Slack exitosamente');
            } else {
                alert('✅ Recordatorio de firma enviado a Slack exitosamente');
            }
        } catch (error) {
            console.error('Error sending Slack reminder:', error);
            if (window.showNotification) {
                window.showNotification('error', 'Error', error.message || 'No se pudo enviar el recordatorio a Slack');
            } else {
                alert(`❌ Error: ${error.message || 'No se pudo enviar el recordatorio a Slack'}`);
            }
        }
    }

    // Enviar solicitud de firma a Slack
    async sendSignatureRequest(processId, employeeName, employeeEmail) {
        try {
            // Obtener el proceso completo para asegurar que tenemos el email
            const process = this.processes.find(p => p.id === processId);
            const email = employeeEmail || process?.email || process?.employee_email || '';
            
            if (!email) {
                if (window.showNotification) {
                    window.showNotification('warning', 'Advertencia', 'El proceso no tiene email asociado. No se puede enviar la solicitud de firma.');
                } else {
                    alert('⚠️ El proceso no tiene email asociado.');
                }
                return;
            }

            // Mostrar confirmación
            const confirmed = confirm(`¿Estás seguro de enviar la solicitud de firma a ${employeeName || process?.employee_name || 'el empleado'} por Slack?`);
            if (!confirmed) {
                return;
            }

            const response = await window.auth.apiRequest(`/onboarding/${processId}/send-signature-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error enviando solicitud de firma a Slack');
            }

            const result = await response.json();
            if (window.showNotification) {
                window.showNotification('success', 'Éxito', 'Solicitud de firma enviada a Slack exitosamente. El empleado recibirá un mensaje con el link para firmar.');
            } else {
                alert('✅ Solicitud de firma enviada a Slack exitosamente');
            }
        } catch (error) {
            console.error('Error sending signature request:', error);
            if (window.showNotification) {
                window.showNotification('error', 'Error', error.message || 'No se pudo enviar la solicitud de firma a Slack');
            } else {
                alert(`❌ Error: ${error.message || 'No se pudo enviar la solicitud de firma a Slack'}`);
            }
        }
    }
}

// Global functions for modal controls
function openCreateOnboardingModal() {
    if (window.onboardingManager) {
        window.onboardingManager.openCreateProcessModal();
    }
}

function closeCreateOnboardingModal() {
    if (window.onboardingManager) {
        window.onboardingManager.closeCreateProcessModal();
    }
}

function closeEditOnboardingModal() {
    if (window.onboardingManager) {
        window.onboardingManager.closeEditProcessModal();
    }
}

// Load onboarding processes when section is shown
function loadOnboardingProcesses() {
    if (window.onboardingManager) {
        window.onboardingManager.loadProcesses();
    }
}

// Initialize onboarding manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Creating OnboardingManager instance...');
    
        window.onboardingManager = new OnboardingManager();
    
    console.log('OnboardingManager created:', window.onboardingManager);
    
    // Make OnboardingManager class globally available
    window.OnboardingManager = OnboardingManager;
    
    console.log('OnboardingManager class made globally available');
    
    // NO override loadSectionData aquí - se maneja en app.js
    // Esto evita loops infinitos
    
});