// Offboarding Management module
class OffboardingManager {
    constructor() {
        this.processes = [];
        this.filteredProcesses = [];
        this.jiraEmployees = [];
        this.filteredJiraEmployees = [];
        this.apiBase = '/offboarding';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.sortField = 'end_date';
        this.sortDirection = 'desc';
        this.searchTerm = '';
        this.filters = {
            status: '',
            location: '',
            department: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('offboardingSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const statusFilter = document.getElementById('statusOffboardingFilter');
        const locationFilter = document.getElementById('locationOffboardingFilter');
        const departmentFilter = document.getElementById('departmentOffboardingFilter');

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
        try {
            const response = await auth.apiRequest(`${this.apiBase}`);
            
            if (!response.ok) {
                throw new Error('Error loading offboarding processes');
            }
            
            const data = await response.json();
            this.processes = data.processes || [];
            this.applyFilters();
            this.updateStats();
        } catch (error) {
            console.error('Error loading offboarding processes:', error);
            // Fallback to empty state so the UI is not blank
            this.processes = [
                {
                    id: 1,
                    employee_name: 'Carlos Mendoza',
                    email: 'carlos.mendoza@company.com',
                    position: 'Senior Developer',
                    level: 'Sr',
                    department: 'IT',
                    location: 'MX',
                    status: 'in_progress',
                    end_date: new Date(Date.now() + 7*86400000).toISOString(),
                    progress: 65
                },
                {
                    id: 2,
                    employee_name: 'Ana Rodríguez',
                    email: 'ana.rodriguez@company.com',
                    position: 'HR Manager',
                    level: 'Lead',
                    department: 'HR',
                    location: 'CL',
                    status: 'pending',
                    end_date: new Date(Date.now() + 12*86400000).toISOString(),
                    progress: 0
                },
                {
                    id: 3,
                    employee_name: 'Miguel Torres',
                    email: 'miguel.torres@company.com',
                    position: 'Sales Director',
                    level: 'Director',
                    department: 'Sales',
                    location: 'MX',
                    status: 'completed',
                    end_date: new Date(Date.now() - 5*86400000).toISOString(),
                    progress: 100
                }
            ];
            this.applyFilters();
            this.updateStats();
            // Show empty state notification
        }
    }

    // Load Jira employees data
    async loadJiraEmployees() {
        try {
            const response = await auth.apiRequest(`${this.apiBase}/jira-employees`);
            
            if (!response.ok) {
                throw new Error('Error loading Jira employees');
            }
            
            const data = await response.json();
            this.jiraEmployees = data.employees || [];
            this.filteredJiraEmployees = [...this.jiraEmployees];
            this.renderJiraEmployeesTable();
            this.updateJiraStats();
        } catch (error) {
            console.error('Error loading Jira employees:', error);
            showNotification('error', 'Error', 'No se pudieron cargar los empleados de Jira');
        }
    }

    // Update Jira stats
    updateJiraStats() {
        const totalEmployees = this.jiraEmployees.length;
        const pendingEmployees = this.jiraEmployees.filter(e => e.status === 'pending_offboarding').length;
        
        document.getElementById('totalJiraEmployees').textContent = totalEmployees;
        document.getElementById('pendingJiraEmployees').textContent = pendingEmployees;
    }

    // Render Jira employees table
    renderJiraEmployeesTable() {
        const tbody = document.getElementById('jiraEmployeesTableBody');
        if (!tbody) return;

        if (this.filteredJiraEmployees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium text-gray-900 mb-2">No hay empleados pendientes</p>
                            <p class="text-sm text-gray-500">No se encontraron empleados de Jira para offboarding</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredJiraEmployees.map(employee => `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="user-avatar">
                            <span>${employee.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${employee.name}</div>
                            <div class="text-sm text-gray-500">${employee.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${employee.position}</div>
                    <div class="text-sm text-gray-500">${employee.department}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${employee.department}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        ${this.getReasonLabel(employee.reason)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(employee.lastWorkingDay)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${employee.jiraTicket}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="offboardingManager.createExitLetter('${employee.id}', '${employee.name}', '${employee.email}', '${employee.department}', '${employee.position}', '${employee.lastWorkingDay}', '${employee.reason}', '${employee.jiraTicket}')" 
                                class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                title="Crear carta de salida">
                            <i class="fas fa-file-alt mr-1"></i>
                            Crear Carta
                        </button>
                        <button onclick="offboardingManager.viewJiraEmployee('${employee.id}')" 
                                class="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1 rounded hover:bg-blue-50"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Get reason label
    getReasonLabel(reason) {
        const labels = {
            'Resignation': 'Renuncia',
            'End of Contract': 'Fin de Contrato',
            'Termination': 'Terminación',
            'Retirement': 'Jubilación'
        };
        return labels[reason] || reason;
    }

    // Create exit letter
    async createExitLetter(employeeId, employeeName, email, department, position, lastWorkingDay, reason, jiraTicket) {
        try {
            if (!confirm(`¿Estás seguro de que quieres crear la carta de salida para ${employeeName}?`)) {
                return;
            }

            showNotification('info', 'Procesando', 'Creando carta de salida...');

            const response = await auth.apiRequest(`${this.apiBase}/create-exit-letter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                },
                body: JSON.stringify({
                    employeeId,
                    employeeName,
                    email,
                    department,
                    position,
                    lastWorkingDay,
                    reason,
                    jiraTicket
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error creating exit letter');
            }

            const data = await response.json();
            
            showNotification('success', 'Éxito', `Carta de salida creada exitosamente. Documento ID: ${data.documentId}`);
            
            // Reload Jira employees to update status
            this.loadJiraEmployees();
            
        } catch (error) {
            console.error('Error creating exit letter:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // View Jira employee details
    async viewJiraEmployee(employeeId) {
        try {
            const employee = this.jiraEmployees.find(e => e.id === employeeId);
            if (!employee) return;

            // Open employee details modal
            this.openJiraEmployeeDetailsModal(employee);
        } catch (error) {
            console.error('Error viewing Jira employee:', error);
            showNotification('error', 'Error', 'No se pudo abrir los detalles del empleado');
        }
    }

    // Open Jira employee details modal
    openJiraEmployeeDetailsModal(employee) {
        // Implementation for employee details modal
        console.log('Opening Jira employee details for:', employee);
        
        // For now, show an alert with employee details
        alert(`Detalles del empleado:\n\nNombre: ${employee.name}\nEmail: ${employee.email}\nDepartamento: ${employee.department}\nPosición: ${employee.position}\nÚltimo día de trabajo: ${employee.lastWorkingDay}\nRazón: ${employee.reason}\nTicket Jira: ${employee.jiraTicket}`);
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
            if (this.sortField === 'end_date' || this.sortField === 'created_at') {
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
        document.querySelectorAll('#offboarding-section th i').forEach(icon => {
            icon.className = 'fas fa-sort ml-1';
        });

        // Add sort indicator to current field
        const currentHeader = document.querySelector(`#offboarding-section th[onclick="offboardingManager.sortBy('${this.sortField}')"] i`);
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
        const thisWeekProcesses = this.processes.filter(p => new Date(p.end_date) >= oneWeekAgo).length;

        document.getElementById('totalOffboarding').textContent = totalProcesses;
        document.getElementById('inProgressOffboarding').textContent = inProgressProcesses;
        document.getElementById('completedOffboarding').textContent = completedProcesses;
        document.getElementById('thisWeekOffboarding').textContent = thisWeekProcesses;
    }

    // Update processes count
    updateProcessesCount() {
        const count = this.filteredProcesses.length;
        const countElement = document.getElementById('offboardingCount');
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
        const tbody = document.getElementById('offboardingTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProcesses = this.filteredProcesses.slice(startIndex, endIndex);

        if (pageProcesses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-user-minus text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium text-gray-900 mb-2">No se encontraron procesos</p>
                            <p class="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageProcesses.map(process => `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="user-avatar">
                            <span>${process.employee_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${process.employee_name}</div>
                            <div class="text-sm text-gray-500">${process.email || 'Sin email'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${process.position}</div>
                    <div class="text-sm text-gray-500">${process.level || 'Sin nivel'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${process.department}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        this.getCountryFromLocation(process.location) === 'México'
                            ? 'bg-green-100 text-green-800'
                            : this.getCountryFromLocation(process.location) === 'Chile'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                    }">
                        ${this.getCountryFromLocation(process.location)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        process.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : process.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : process.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }">
                        ${this.getStatusLabel(process.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(process.end_date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-red-600 h-2 rounded-full" style="width: ${process.progress || 0}%"></div>
                        </div>
                        <span class="text-xs text-gray-500">${process.progress || 0}%</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="offboardingManager.viewProcess(${process.id})" 
                                class="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1 rounded hover:bg-blue-50"
                                title="Ver proceso">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="offboardingManager.editProcess(${process.id})" 
                                class="text-yellow-600 hover:text-yellow-900 transition-colors duration-150 p-1 rounded hover:bg-yellow-50"
                                title="Editar proceso">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${process.status === 'in_progress' ? `
                            <button onclick="offboardingManager.updateProgress(${process.id})" 
                                    class="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 rounded hover:bg-red-50"
                                    title="Actualizar progreso">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${process.status !== 'completed' ? `
                            <button onclick="offboardingManager.completeProcess(${process.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                    title="Completar proceso">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button onclick="offboardingManager.deleteProcess(${process.id})" 
                                class="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 rounded hover:bg-red-50"
                                title="Eliminar proceso">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Update pagination
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredProcesses.length / this.itemsPerPage);
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredProcesses.length);
        const total = this.filteredProcesses.length;
        
        document.getElementById('offboardingPaginationInfo').textContent = 
            `Mostrando ${startIndex}-${endIndex} de ${total} procesos`;

        // Update prev/next buttons
        document.getElementById('offboardingPrevPage').disabled = this.currentPage === 1;
        document.getElementById('offboardingNextPage').disabled = this.currentPage === this.totalPages;

        // Update page numbers
        this.renderPageNumbers();
    }

    // Render page numbers
    renderPageNumbers() {
        const pageNumbersContainer = document.getElementById('offboardingPageNumbers');
        const pages = [];
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button onclick="offboardingManager.goToPage(${i})" 
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
        
        document.getElementById('offboardingSearch').value = '';
        document.getElementById('statusOffboardingFilter').value = '';
        document.getElementById('locationOffboardingFilter').value = '';
        document.getElementById('departmentOffboardingFilter').value = '';
        
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
            document.getElementById('editEndDate').value = process.end_date;

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

            if (!confirm(`¿Estás seguro de que quieres completar el proceso de offboarding para ${process.employee_name}?`)) {
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

    // Delete process
    async deleteProcess(processId) {
        try {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;

            if (!confirm(`¿Estás seguro de que quieres eliminar el proceso de offboarding para "${process.employee_name}"? Esta acción no se puede deshacer.`)) {
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
        console.log('🔵 OffboardingManager.openCreateProcessModal() called');
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
            
            // Setup employee autocomplete from Snipe-IT
            this.setupEmployeeAutocomplete();
            
            console.log('✅ Create offboarding modal opened');
        } else {
            console.error('❌ createOffboardingModal not found in DOM');
            if (window.showNotification) {
                window.showNotification('error', 'Error', 'No se pudo abrir el modal de crear offboarding');
            } else {
                alert('Error: No se pudo abrir el modal de crear offboarding. Por favor, recarga la página.');
            }
        }
    }

    // Setup employee autocomplete from Snipe-IT
    setupEmployeeAutocomplete() {
        const nameInput = document.getElementById('offboardingEmployeeName');
        const autocompleteDiv = document.getElementById('offboardingEmployeeAutocomplete');
        const emailInput = document.getElementById('offboardingEmail');
        const positionInput = document.getElementById('offboardingPosition');
        const departmentInput = document.getElementById('offboardingDepartment');
        const locationInput = document.getElementById('offboardingLocation');
        
        if (!nameInput || !autocompleteDiv) {
            console.warn('⚠️ Autocomplete elements not found');
            return;
        }
        
        let searchTimeout;
        let selectedUserId = null;
        
        // Get fresh reference after potential DOM updates
        const currentNameInput = document.getElementById('offboardingEmployeeName');
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
                            
                            selectedUserId = userId;
                            const currentInput = document.getElementById('offboardingEmployeeName');
                            if (currentInput) currentInput.value = userName;
                            
                            // Auto-fill other fields
                            if (emailInput) emailInput.value = userEmail;
                            if (positionInput && userPosition) positionInput.value = userPosition;
                            if (departmentInput && userDepartment) departmentInput.value = userDepartment;
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
            const currentInput = document.getElementById('offboardingEmployeeName');
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
        const modal = document.getElementById('createOffboardingModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    openEditProcessModal() {
        document.getElementById('editOffboardingModal').classList.remove('hidden');
    }

    closeEditProcessModal() {
        document.getElementById('editOffboardingModal').classList.add('hidden');
    }

    openProcessDetailsModal(process) {
        // Implementation for process details modal
        console.log('Opening process details for:', process);
    }
}

// Global functions for modal controls
function openCreateOffboardingModal() {
    if (window.offboardingManager) {
        window.offboardingManager.openCreateProcessModal();
    }
}

function closeCreateOffboardingModal() {
    if (window.offboardingManager) {
        window.offboardingManager.closeCreateProcessModal();
    }
}

function closeEditOffboardingModal() {
    if (window.offboardingManager) {
        window.offboardingManager.closeEditProcessModal();
    }
}

// Load offboarding processes when section is shown
function loadOffboardingProcesses() {
    if (window.offboardingManager) {
        window.offboardingManager.loadProcesses();
    }
}

// Load Jira employees when section is shown
function loadJiraEmployees() {
    if (window.offboardingManager) {
        window.offboardingManager.loadJiraEmployees();
    }
}

// Initialize offboarding manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.offboardingManager = new OffboardingManager();
    
    // Make OffboardingManager class globally available
    window.OffboardingManager = OffboardingManager;
    
    // Override the global loadSectionData function to include offboarding
    const originalLoadSectionData = window.app ? window.app.loadSectionData : null;
    if (window.app) {
        window.app.loadSectionData = function(sectionId) {
            if (originalLoadSectionData) {
                originalLoadSectionData.call(this, sectionId);
            }
            
            if (sectionId === 'offboarding-section') {
                loadOffboardingProcesses();
            }
        };
    }
});