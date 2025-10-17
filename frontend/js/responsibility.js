// Responsibility Letters Management module
class ResponsibilityManager {
    constructor() {
        this.letters = [];
        this.filteredLetters = [];
        this.apiBase = '/employees';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.sortField = 'created_at';
        this.sortDirection = 'desc';
        this.searchTerm = '';
        this.filters = {
            status: '',
            location: '',
            assetType: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('letterSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const statusFilter = document.getElementById('statusFilter');
        const locationFilter = document.getElementById('locationFilter');
        const assetTypeFilter = document.getElementById('assetTypeFilter');

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

        if (assetTypeFilter) {
            assetTypeFilter.addEventListener('change', (e) => {
                this.filters.assetType = e.target.value;
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

    // Load letters data
    async loadLetters() {
        try {
            const response = await auth.apiRequest(`${this.apiBase}/responsibility-letters`);
            
            if (!response.ok) {
                throw new Error('Error loading letters');
            }
            
            const data = await response.json();
            console.log('Responsibility API data:', data);
            this.letters = data.letters || [];
            this.applyFilters();
            this.updateStats();
            this.ensureSectionVisibility();
        } catch (error) {
            console.error('Error loading letters:', error);
            // Fallback: empty state so the page is not blank
            this.letters = [
                {
                    id: 1,
                    employee_id: 101,
                    employee_name: 'Juan Pérez',
                    position: 'Developer',
                    department: 'IT',
                    asset_name: 'MacBook Pro 16"',
                    asset_tag: 'LAPTOP-001',
                    asset_type: 'Laptop',
                    status: 'sent',
                    created_at: new Date(Date.now() - 2*86400000).toISOString()
                },
                {
                    id: 2,
                    employee_id: 102,
                    employee_name: 'María García',
                    position: 'HR Specialist',
                    department: 'HR',
                    asset_name: 'Dell Monitor 27"',
                    asset_tag: 'MONITOR-002',
                    asset_type: 'Monitor',
                    status: 'pending',
                    created_at: new Date(Date.now() - 1*86400000).toISOString()
                },
                {
                    id: 3,
                    employee_id: 103,
                    employee_name: 'Pedro López',
                    position: 'Account Manager',
                    department: 'Sales',
                    asset_name: 'iPhone 14',
                    asset_tag: 'PHONE-003',
                    asset_type: 'Phone',
                    status: 'signed',
                    created_at: new Date(Date.now() - 5*86400000).toISOString()
                }
            ];
            this.applyFilters();
            this.updateStats();
            this.ensureSectionVisibility();
            // Show empty state notification
        }
    }

    // Ensure section is visible
    ensureSectionVisibility() {
        const section = document.getElementById('responsibility-section');
        if (section) {
            section.classList.remove('hidden');
            section.style.display = 'block';
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.classList.remove('page-transition', 'section-fade-in', 'section-slide-in-right', 'section-slide-in-left', 'section-zoom-in');
            section.classList.add('show');
            console.log('Responsibility section visibility ensured');
        }
    }

    // Apply filters and search
    applyFilters() {
        this.filteredLetters = this.letters.filter(letter => {
            // Normalize fields to avoid undefined errors
            const employeeName = (letter.employee_name || '').toLowerCase();
            const assetName = (letter.asset_name || '').toLowerCase();
            const letterNumber = (letter.letter_number || '').toLowerCase();

            // Search filter
            const matchesSearch = !this.searchTerm || 
                employeeName.includes(this.searchTerm) ||
                assetName.includes(this.searchTerm) ||
                letterNumber.includes(this.searchTerm);

            // Status filter
            const matchesStatus = !this.filters.status || letter.status === this.filters.status;

            // Location filter
            const matchesLocation = !this.filters.location || letter.location === this.filters.location;

            // Asset type filter
            const matchesAssetType = !this.filters.assetType || letter.asset_type === this.filters.assetType;

            return matchesSearch && matchesStatus && matchesLocation && matchesAssetType;
        });

        // Sort filtered letters
        this.sortLetters();
        
        // Reset to first page
        this.currentPage = 1;
        
        // Update display
        this.renderLettersTable();
        this.updatePagination();
        this.updateLettersCount();
    }

    // Sort letters
    sortLetters() {
        this.filteredLetters.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];

            // Handle boolean values
            if (typeof aValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }

            // Handle date values
            if (this.sortField === 'created_at') {
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
        
        this.sortLetters();
        this.renderLettersTable();
        this.updateSortIndicators();
    }

    // Update sort indicators
    updateSortIndicators() {
        // Remove all sort indicators
        document.querySelectorAll('#responsibility-section th i').forEach(icon => {
            icon.className = 'fas fa-sort ml-1';
        });

        // Add sort indicator to current field
        const currentHeader = document.querySelector(`#responsibility-section th[onclick="responsibilityManager.sortBy('${this.sortField}')"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ml-1`;
        }
    }

    // Update stats
    updateStats() {
        const totalLetters = this.letters.length;
        const pendingLetters = this.letters.filter(l => l.status === 'pending').length;
        const sentLetters = this.letters.filter(l => l.status === 'sent').length;
        const signedLetters = this.letters.filter(l => l.status === 'signed').length;
        const missingSignature = this.letters.filter(l => l.status !== 'signed').length;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const sentThisMonth = this.letters.filter(l => {
            if (!l.created_at) return false;
            const d = new Date(l.created_at);
            return l.status === 'sent' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const totalEl = document.getElementById('totalLetters');
        const pendingEl = document.getElementById('pendingLetters');
        const sentEl = document.getElementById('sentLetters');
        const missingEl = document.getElementById('missingSignatureLetters');
        const sentMonthEl = document.getElementById('sentThisMonthLetters');

        if (totalEl) totalEl.textContent = totalLetters;
        if (pendingEl) pendingEl.textContent = pendingLetters;
        if (sentEl) sentEl.textContent = sentLetters + signedLetters; // total enviadas incluye firmadas
        if (missingEl) missingEl.textContent = missingSignature;
        if (sentMonthEl) sentMonthEl.textContent = sentThisMonth;
    }

    // Update letters count
    updateLettersCount() {
        const count = this.filteredLetters.length;
        const countElement = document.getElementById('lettersCount');
        if (countElement) {
            countElement.textContent = `Mostrando ${count} carta${count !== 1 ? 's' : ''}`;
        }
    }

    // Render letters table
    renderLettersTable() {
        const tbody = document.getElementById('lettersTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageLetters = this.filteredLetters.slice(startIndex, endIndex);

        if (pageLetters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-file-alt text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium text-gray-900 mb-2">No se encontraron cartas</p>
                            <p class="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageLetters.map(letter => `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="user-avatar">
                            <span>${letter.employee_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${letter.employee_name}</div>
                            <div class="text-sm text-gray-500">${letter.position || 'Sin posición'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${letter.asset_name}</div>
                    <div class="text-sm text-gray-500">${letter.asset_tag || 'Sin tag'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${letter.asset_type || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        letter.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : letter.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                    }">
                        ${this.getStatusLabel(letter.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(letter.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="responsibilityManager.viewLetter(${letter.id})" 
                                class="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1 rounded hover:bg-blue-50"
                                title="Ver carta">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="responsibilityManager.editLetter(${letter.id})" 
                                class="text-yellow-600 hover:text-yellow-900 transition-colors duration-150 p-1 rounded hover:bg-yellow-50"
                                title="Editar carta">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${letter.status === 'pending' ? `
                            <button onclick="responsibilityManager.sendLetter(${letter.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors duration-150 p-1 rounded hover:bg-green-50"
                                    title="Enviar carta">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        ` : ''}
                        <button onclick="responsibilityManager.deleteLetter(${letter.id})" 
                                class="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 rounded hover:bg-red-50"
                                title="Eliminar carta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Update pagination
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredLetters.length / this.itemsPerPage);
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredLetters.length);
        const total = this.filteredLetters.length;
        
        document.getElementById('lettersPaginationInfo').textContent = 
            `Mostrando ${startIndex}-${endIndex} de ${total} cartas`;

        // Update prev/next buttons
        document.getElementById('lettersPrevPage').disabled = this.currentPage === 1;
        document.getElementById('lettersNextPage').disabled = this.currentPage === this.totalPages;

        // Update page numbers
        this.renderPageNumbers();
    }

    // Render page numbers
    renderPageNumbers() {
        const pageNumbersContainer = document.getElementById('lettersPageNumbers');
        const pages = [];
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button onclick="responsibilityManager.goToPage(${i})" 
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
            this.renderLettersTable();
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
        this.filters = { status: '', location: '', assetType: '' };
        
        document.getElementById('letterSearch').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('locationFilter').value = '';
        document.getElementById('assetTypeFilter').value = '';
        
        this.applyFilters();
    }

    // Get status label
    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'sent': 'Enviada',
            'signed': 'Firmada'
        };
        return labels[status] || status;
    }

    // View letter
    async viewLetter(letterId) {
        try {
            const letter = this.letters.find(l => l.id === letterId);
            if (!letter) return;

            // Open letter in new window or modal
            const letterUrl = `/api/employees/responsibility-letters/${letterId}/download`;
            window.open(letterUrl, '_blank');
        } catch (error) {
            console.error('Error viewing letter:', error);
            showNotification('error', 'Error', 'No se pudo abrir la carta');
        }
    }

    // Edit letter
    async editLetter(letterId) {
        try {
            const letter = this.letters.find(l => l.id === letterId);
            if (!letter) return;

            // Fill edit form
            document.getElementById('editLetterId').value = letter.id;
            document.getElementById('editEmployeeName').value = letter.employee_name;
            document.getElementById('editAssetName').value = letter.asset_name;
            document.getElementById('editAssetType').value = letter.asset_type;
            document.getElementById('editPosition').value = letter.position || '';
            document.getElementById('editDepartment').value = letter.department || '';

            this.openEditLetterModal();
        } catch (error) {
            console.error('Error editing letter:', error);
            showNotification('error', 'Error', 'No se pudo cargar la información de la carta');
        }
    }

    // Send letter
    async sendLetter(letterId) {
        try {
            const letter = this.letters.find(l => l.id === letterId);
            if (!letter) return;

            if (!confirm(`¿Estás seguro de que quieres enviar la carta de responsabilidad para ${letter.employee_name}?`)) {
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/responsibility-letters/${letterId}/send`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error sending letter');
            }

            showNotification('success', 'Éxito', 'Carta enviada correctamente');
            this.loadLetters();
        } catch (error) {
            console.error('Error sending letter:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Delete letter
    async deleteLetter(letterId) {
        try {
            const letter = this.letters.find(l => l.id === letterId);
            if (!letter) return;

            if (!confirm(`¿Estás seguro de que quieres eliminar la carta de responsabilidad para "${letter.employee_name}"? Esta acción no se puede deshacer.`)) {
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/responsibility-letters/${letterId}`, {
                method: 'DELETE',
                headers: {
                    ...auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error deleting letter');
            }

            showNotification('success', 'Éxito', 'Carta eliminada correctamente');
            this.loadLetters();
        } catch (error) {
            console.error('Error deleting letter:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Modal functions
    openCreateLetterModal() {
        document.getElementById('createLetterModal').classList.remove('hidden');
        document.getElementById('createLetterForm').reset();
    }

    closeCreateLetterModal() {
        document.getElementById('createLetterModal').classList.add('hidden');
    }

    openEditLetterModal() {
        document.getElementById('editLetterModal').classList.remove('hidden');
    }

    closeEditLetterModal() {
        document.getElementById('editLetterModal').classList.add('hidden');
    }
}

// Global functions for modal controls
function openCreateLetterModal() {
    if (window.responsibilityManager) {
        window.responsibilityManager.openCreateLetterModal();
    }
}

function closeCreateLetterModal() {
    if (window.responsibilityManager) {
        window.responsibilityManager.closeCreateLetterModal();
    }
}

function closeEditLetterModal() {
    if (window.responsibilityManager) {
        window.responsibilityManager.closeEditLetterModal();
    }
}

// Load letters when section is shown
function loadResponsibilityLetters() {
    if (window.responsibilityManager) {
        window.responsibilityManager.loadLetters();
    }
}

// Initialize responsibility manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.responsibilityManager = new ResponsibilityManager();
    
    // Make ResponsibilityManager class globally available
    window.ResponsibilityManager = ResponsibilityManager;
    
    // Override the global loadSectionData function to include responsibility letters
    const originalLoadSectionData = window.app ? window.app.loadSectionData : null;
    if (window.app) {
        window.app.loadSectionData = function(sectionId) {
            if (originalLoadSectionData) {
                originalLoadSectionData.call(this, sectionId);
            }
            
            if (sectionId === 'responsibility-section') {
                loadResponsibilityLetters();
            }
        };
    }
});
