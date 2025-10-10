// Onboarding Management module
class OnboardingManager {
    constructor() {
        console.log('=== ONBOARDING MANAGER CONSTRUCTOR ===');
        
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
        
        console.log('=== END ONBOARDING MANAGER CONSTRUCTOR ===');
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
        try {
            console.log('=== ONBOARDING LOAD PROCESSES DEBUG ===');
            console.log('API Base:', this.apiBase);
            console.log('Auth object:', auth);
            
            const response = await auth.apiRequest(`${this.apiBase}`);
            
            console.log('Response received:', response);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error('Error loading onboarding processes');
            }
            
            const data = await response.json();
            console.log('Parsed response data:', data);
            
            this.processes = data.processes || [];
            console.log('Processes loaded:', this.processes.length);
            
            this.applyFilters();
            this.updateStats();
            
            // Force section visibility after data is loaded
            this.ensureSectionVisibility();
            
            console.log('=== END ONBOARDING LOAD PROCESSES DEBUG ===');
        } catch (error) {
            console.error('Error loading onboarding processes:', error);
            // Fallback to demo data so the UI is not blank
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
            showNotification('info', 'Modo demo', 'Mostrando procesos de onboarding de ejemplo');
        }
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

        document.getElementById('totalOnboarding').textContent = totalProcesses;
        document.getElementById('inProgressOnboarding').textContent = inProgressProcesses;
        document.getElementById('completedOnboarding').textContent = completedProcesses;
        document.getElementById('thisWeekOnboarding').textContent = thisWeekProcesses;
    }

    // Update processes count
    updateProcessesCount() {
        const count = this.filteredProcesses.length;
        const countElement = document.getElementById('onboardingCount');
        if (countElement) {
            countElement.textContent = `Mostrando ${count} proceso${count !== 1 ? 's' : ''}`;
        }
    }

    // Render processes table
    renderProcessesTable() {
        const tbody = document.getElementById('onboardingTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProcesses = this.filteredProcesses.slice(startIndex, endIndex);

        if (pageProcesses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
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
                    ${formatDate(process.start_date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${process.progress || 0}%"></div>
                        </div>
                        <span class="text-xs text-gray-500">${process.progress || 0}%</span>
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
                        ${process.status === 'in_progress' ? `
                            <button onclick="onboardingManager.updateProgress(${process.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                    title="Actualizar progreso">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${process.status !== 'completed' ? `
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
        `).join('');
    }

    // Update pagination
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredProcesses.length / this.itemsPerPage);
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredProcesses.length);
        const total = this.filteredProcesses.length;
        
        document.getElementById('onboardingPaginationInfo').textContent = 
            `Mostrando ${startIndex}-${endIndex} de ${total} procesos`;

        // Update prev/next buttons
        document.getElementById('onboardingPrevPage').disabled = this.currentPage === 1;
        document.getElementById('onboardingNextPage').disabled = this.currentPage === this.totalPages;

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
        document.getElementById('createOnboardingModal').classList.remove('hidden');
        document.getElementById('createOnboardingForm').reset();
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
    console.log('=== ONBOARDING INITIALIZATION DEBUG ===');
    console.log('Creating OnboardingManager instance...');
    
        window.onboardingManager = new OnboardingManager();
    
    console.log('OnboardingManager created:', window.onboardingManager);
    
    // Make OnboardingManager class globally available
    window.OnboardingManager = OnboardingManager;
    
    console.log('OnboardingManager class made globally available');
    
    // Override the global loadSectionData function to include onboarding
    const originalLoadSectionData = window.app ? window.app.loadSectionData : null;
    if (window.app) {
        console.log('Overriding loadSectionData function...');
        window.app.loadSectionData = function(sectionId) {
            if (originalLoadSectionData) {
                originalLoadSectionData.call(this, sectionId);
            }
            
            if (sectionId === 'onboarding-section') {
                console.log('Loading onboarding processes from override...');
                loadOnboardingProcesses();
            }
        };
    } else {
        console.log('window.app not available yet');
    }
    
    console.log('=== END ONBOARDING INITIALIZATION DEBUG ===');
});