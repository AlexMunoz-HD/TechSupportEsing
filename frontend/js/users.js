// User Management module
class UserManager {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.apiBase = '/users';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.sortField = 'created_at';
        this.sortDirection = 'desc';
        this.searchTerm = '';
        this.filters = {
            role: '',
            status: '',
            location: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAdminAccess();
    }

    // Check if current user is admin and show/hide admin section
    checkAdminAccess() {
        console.log('UserManager: Checking admin access...');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('UserManager: Current user:', user);
        
        const adminSection = document.getElementById('adminSection');
        console.log('UserManager: Admin section element:', adminSection);
        
        if (user.role === 'admin' && adminSection) {
            console.log('UserManager: User is admin, showing admin section');
            adminSection.classList.remove('hidden');
        } else {
            console.log('UserManager: User is not admin or admin section not found');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Create user form
        const createUserForm = document.getElementById('createUserForm');
        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createUser();
            });
        }

        // Edit user form
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUser();
            });
        }

        // Change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Search input
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');
        const locationFilter = document.getElementById('locationFilter');

        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filters.role = e.target.value;
                this.applyFilters();
            });
        }

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

    // Load users data
    async loadUsers() {
        console.log('UserManager: Loading users...');
        
        // Use test data directly for now
        console.log('UserManager: Using test data directly...');
        this.users = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@techsupport.com',
                    role: 'admin',
                    location: 'MX',
                    full_name: 'System Administrator',
                    is_active: 1,
                    created_at: '2025-10-06T21:11:18.000Z'
                },
                {
                    id: 2,
                    username: 'auditor1',
                    email: 'auditor1@techsupport.com',
                    role: 'auditor',
                    location: 'CL',
                    full_name: 'Auditor Chile',
                    is_active: 1,
                    created_at: '2025-10-06T21:11:18.000Z'
                },
                {
                    id: 3,
                    username: 'auditor2',
                    email: 'auditor2@techsupport.com',
                    role: 'auditor',
                    location: 'REMOTO',
                    full_name: 'Remote Auditor',
                    is_active: 1,
                    created_at: '2025-10-06T21:11:18.000Z'
                },
                {
                    id: 19,
                    username: 'alex.munoz',
                    email: 'alex.munoz@xepelin.com',
                    role: 'admin',
                    location: 'MX',
                    full_name: 'Alex Muñoz',
                    is_active: 1,
                    created_at: '2025-10-10T16:39:19.000Z'
                },
                {
                    id: 10,
                    username: 'michael.chen',
                    email: 'michael.chen@techsupport.com',
                    role: 'auditor',
                    location: 'CL',
                    full_name: 'Michael Chen',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 18,
                    username: 'carlos.lopez',
                    email: 'carlos.lopez@techsupport.com',
                    role: 'auditor',
                    location: 'MX',
                    full_name: 'Carlos López',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 17,
                    username: 'sofia.martinez',
                    email: 'sofia.martinez@techsupport.com',
                    role: 'admin',
                    location: 'REMOTO',
                    full_name: 'Sofia Martínez',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 16,
                    username: 'alex.taylor',
                    email: 'alex.taylor@techsupport.com',
                    role: 'auditor',
                    location: 'CL',
                    full_name: 'Alex Taylor',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 15,
                    username: 'maria.santos',
                    email: 'maria.santos@techsupport.com',
                    role: 'auditor',
                    location: 'MX',
                    full_name: 'María Santos',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 14,
                    username: 'james.miller',
                    email: 'james.miller@techsupport.com',
                    role: 'admin',
                    location: 'REMOTO',
                    full_name: 'James Miller',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 13,
                    username: 'lisa.wang',
                    email: 'lisa.wang@techsupport.com',
                    role: 'auditor',
                    location: 'CL',
                    full_name: 'Lisa Wang',
                    is_active: 0,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 12,
                    username: 'david.kim',
                    email: 'david.kim@techsupport.com',
                    role: 'auditor',
                    location: 'MX',
                    full_name: 'David Kim',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 11,
                    username: 'elena.rodriguez',
                    email: 'elena.rodriguez@techsupport.com',
                    role: 'admin',
                    location: 'REMOTO',
                    full_name: 'Elena Rodríguez',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 9,
                    username: 'sarah.johnson',
                    email: 'sarah.johnson@techsupport.com',
                    role: 'auditor',
                    location: 'MX',
                    full_name: 'Sarah Johnson',
                    is_active: 1,
                    created_at: '2025-10-06T22:51:43.000Z'
                },
                {
                    id: 8,
                    username: 'luis.silva',
                    email: 'luis.silva@techsupport.com',
                    role: 'auditor',
                    location: 'CL',
                    full_name: 'Luis Silva',
                    is_active: 1,
                    created_at: '2025-10-06T21:22:00.000Z'
                },
                {
                    id: 7,
                    username: 'ana.martinez',
                    email: 'ana.martinez@techsupport.com',
                    role: 'auditor',
                    location: 'MX',
                    full_name: 'Ana Martínez',
                    is_active: 1,
                    created_at: '2025-10-06T21:22:00.000Z'
                },
                {
                    id: 6,
                    username: 'carlos.rodriguez',
                    email: 'carlos.rodriguez@techsupport.com',
                    role: 'auditor',
                    location: 'REMOTO',
                    full_name: 'Carlos Rodríguez',
                    is_active: 1,
                    created_at: '2025-10-06T21:22:00.000Z'
                },
                {
                    id: 5,
                    username: 'maria.gonzalez',
                    email: 'maria.gonzalez@techsupport.com',
                    role: 'auditor',
                    location: 'CL',
                    full_name: 'María González',
                    is_active: 1,
                    created_at: '2025-10-06T21:22:00.000Z'
                },
                {
                    id: 4,
                    username: 'juan.perez',
                    email: 'juan.perez@techsupport.com',
                    role: 'auditor',
                    location: 'MX',
                    full_name: 'Juan Pérez',
                    is_active: 1,
                    created_at: '2025-10-06T21:22:00.000Z'
                }
        ];
        
        this.applyFilters();
        this.updateStats();
        console.log('UserManager: Test data loaded successfully');
        showNotification('info', 'Modo Demo', 'Usando datos de prueba para demostración.');
    }

    // Apply filters and search
    applyFilters() {
        this.filteredUsers = this.users.filter(user => {
            // Search filter
            const matchesSearch = !this.searchTerm || 
                user.full_name.toLowerCase().includes(this.searchTerm) ||
                user.email.toLowerCase().includes(this.searchTerm) ||
                user.username.toLowerCase().includes(this.searchTerm);

            // Role filter
            const matchesRole = !this.filters.role || user.role === this.filters.role;

            // Status filter
            const matchesStatus = !this.filters.status || user.is_active.toString() === this.filters.status;

            // Location filter
            const matchesLocation = !this.filters.location || user.location === this.filters.location;

            return matchesSearch && matchesRole && matchesStatus && matchesLocation;
        });

        // Sort filtered users
        this.sortUsers();
        
        // Reset to first page
        this.currentPage = 1;
        
        // Update display
        this.renderUsersTable();
        this.updatePagination();
        this.updateUsersCount();
    }

    // Sort users
    sortUsers() {
        this.filteredUsers.sort((a, b) => {
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
        
        this.sortUsers();
        this.renderUsersTable();
        this.updateSortIndicators();
    }

    // Update sort indicators
    updateSortIndicators() {
        // Remove all sort indicators
        document.querySelectorAll('th i').forEach(icon => {
            icon.className = 'fas fa-sort ml-1';
        });

        // Add sort indicator to current field
        const currentHeader = document.querySelector(`th[onclick="userManager.sortBy('${this.sortField}')"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ml-1`;
        }
    }

    // Update stats
    updateStats() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(u => u.is_active).length;
        const adminUsers = this.users.filter(u => u.role === 'admin').length;
        const auditorUsers = this.users.filter(u => u.role === 'auditor').length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('adminUsers').textContent = adminUsers;
        document.getElementById('auditorUsers').textContent = auditorUsers;
    }

    // Update users count
    updateUsersCount() {
        const count = this.filteredUsers.length;
        const countElement = document.getElementById('usersCount');
        if (countElement) {
            countElement.textContent = `Mostrando ${count} usuario${count !== 1 ? 's' : ''}`;
        }
    }

    // Render users table
    renderUsersTable() {
        console.log('UserManager: Rendering users table...');
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) {
            console.error('UserManager: usersTableBody element not found!');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageUsers = this.filteredUsers.slice(startIndex, endIndex);
        
        console.log('UserManager: Page users:', pageUsers);

        if (pageUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</p>
                            <p class="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageUsers.map(user => `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="user-avatar">
                            <span>${user.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${user.full_name}</div>
                            <div class="text-sm text-gray-500">@${user.username}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                    }">
                        ${user.role === 'admin' ? 'Administrador' : 'Auditor'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${this.getLocationLabel(user.location)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        ${user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(user.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="userManager.editUser(${user.id})" 
                                class="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1 rounded hover:bg-blue-50"
                                title="Editar usuario">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="userManager.openChangePasswordModal(${user.id})" 
                                class="text-yellow-600 hover:text-yellow-900 transition-colors duration-150 p-1 rounded hover:bg-yellow-50"
                                title="Cambiar contraseña">
                            <i class="fas fa-key"></i>
                        </button>
                        <button onclick="userManager.toggleUserStatus(${user.id})" 
                                class="text-${user.is_active ? 'red' : 'green'}-600 hover:text-${user.is_active ? 'red' : 'green'}-900 transition-colors duration-150 p-1 rounded hover:bg-${user.is_active ? 'red' : 'green'}-50"
                                title="${user.is_active ? 'Desactivar' : 'Activar'} usuario">
                            <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                        </button>
                        ${user.id !== JSON.parse(localStorage.getItem('user') || '{}').id ? `
                            <button onclick="userManager.deleteUser(${user.id})" 
                                    class="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 rounded hover:bg-red-50"
                                    title="Eliminar usuario">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Update pagination
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers.length);
        const total = this.filteredUsers.length;
        
        document.getElementById('paginationInfo').textContent = 
            `Mostrando ${startIndex}-${endIndex} de ${total} usuarios`;

        // Update prev/next buttons
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === this.totalPages;

        // Update page numbers
        this.renderPageNumbers();
    }

    // Render page numbers
    renderPageNumbers() {
        const pageNumbersContainer = document.getElementById('pageNumbers');
        const pages = [];
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button onclick="userManager.goToPage(${i})" 
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
            this.renderUsersTable();
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
        this.filters = { role: '', status: '', location: '' };
        
        document.getElementById('userSearch').value = '';
        document.getElementById('roleFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('locationFilter').value = '';
        
        this.applyFilters();
    }

    // Get location label
    getLocationLabel(location) {
        const labels = {
            'MX': 'México',
            'CL': 'Chile',
            'REMOTO': 'Remoto'
        };
        return labels[location] || location;
    }

    // Create user
    async createUser() {
        try {
            const formData = {
                full_name: document.getElementById('userFullName').value,
                username: document.getElementById('userUsername').value,
                email: document.getElementById('userEmail').value,
                password: document.getElementById('userPassword').value,
                role: document.getElementById('userRole').value,
                location: document.getElementById('userLocation').value
            };

            const response = await auth.apiRequest(`${this.apiBase}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error creating user');
            }

            showNotification('success', 'Éxito', 'Usuario creado correctamente');
            this.closeCreateUserModal();
            this.loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Edit user
    async editUser(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            // Fill edit form
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserFullName').value = user.full_name;
            document.getElementById('editUserUsername').value = user.username;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserRole').value = user.role;
            document.getElementById('editUserLocation').value = user.location;
            document.getElementById('editUserStatus').value = user.is_active.toString();

            this.openEditUserModal();
        } catch (error) {
            console.error('Error editing user:', error);
            showNotification('error', 'Error', 'No se pudo cargar la información del usuario');
        }
    }

    // Update user
    async updateUser() {
        try {
            const userId = document.getElementById('editUserId').value;
            const formData = {
                full_name: document.getElementById('editUserFullName').value,
                username: document.getElementById('editUserUsername').value,
                email: document.getElementById('editUserEmail').value,
                role: document.getElementById('editUserRole').value,
                location: document.getElementById('editUserLocation').value,
                is_active: document.getElementById('editUserStatus').value === 'true'
            };

            const response = await auth.apiRequest(`${this.apiBase}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error updating user');
            }

            showNotification('success', 'Éxito', 'Usuario actualizado correctamente');
            this.closeEditUserModal();
            this.loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Toggle user status
    async toggleUserStatus(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            const action = user.is_active ? 'desactivar' : 'activar';
            
            if (!confirm(`¿Estás seguro de que quieres ${action} este usuario?`)) {
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/${userId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error updating user status');
            }

            showNotification('success', 'Éxito', `Usuario ${action}do correctamente`);
            this.loadUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Delete user
    async deleteUser(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            if (!confirm(`¿Estás seguro de que quieres eliminar el usuario "${user.full_name}"? Esta acción no se puede deshacer.`)) {
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/${userId}`, {
                method: 'DELETE',
                headers: {
                    ...auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error deleting user');
            }

            showNotification('success', 'Éxito', 'Usuario eliminado correctamente');
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Change password
    async changePassword() {
        try {
            const userId = document.getElementById('changePasswordUserId').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showNotification('error', 'Error', 'Las contraseñas no coinciden');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
                return;
            }

            const response = await auth.apiRequest(`${this.apiBase}/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error changing password');
            }

            showNotification('success', 'Éxito', 'Contraseña cambiada correctamente');
            this.closeChangePasswordModal();
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('error', 'Error', error.message);
        }
    }

    // Modal functions
    openCreateUserModal() {
        document.getElementById('createUserModal').classList.remove('hidden');
        document.getElementById('createUserForm').reset();
    }

    closeCreateUserModal() {
        document.getElementById('createUserModal').classList.add('hidden');
    }

    openEditUserModal() {
        document.getElementById('editUserModal').classList.remove('hidden');
    }

    closeEditUserModal() {
        document.getElementById('editUserModal').classList.add('hidden');
    }

    openChangePasswordModal(userId) {
        document.getElementById('changePasswordModal').classList.remove('hidden');
        document.getElementById('changePasswordUserId').value = userId;
        document.getElementById('changePasswordForm').reset();
    }

    closeChangePasswordModal() {
        document.getElementById('changePasswordModal').classList.add('hidden');
    }
}

// Global functions for modal controls
function openCreateUserModal() {
    if (window.userManager) {
        window.userManager.openCreateUserModal();
    }
}

function closeCreateUserModal() {
    if (window.userManager) {
        window.userManager.closeCreateUserModal();
    }
}

function closeEditUserModal() {
    if (window.userManager) {
        window.userManager.closeEditUserModal();
    }
}

function closeChangePasswordModal() {
    if (window.userManager) {
        window.userManager.closeChangePasswordModal();
    }
}

// Load users when section is shown
function loadUsers() {
    console.log('loadUsers() called');
    if (window.userManager) {
        console.log('UserManager found, calling loadUsers()');
        window.userManager.loadUsers();
    } else {
        console.error('UserManager not found!');
    }
}

// Force load users when users section is shown
function showUsersSection() {
    console.log('showUsersSection() called');
    
    // Show the section first
    showSection('users-section');
    
    // Force load users immediately
    console.log('Loading users immediately...');
    loadUsers();
    
    // Also try after a delay as backup
    setTimeout(() => {
        console.log('Delayed loadUsers() call as backup');
        loadUsers();
    }, 500);
}

// Initialize user manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('UserManager: Initializing...');
    window.userManager = new UserManager();
    console.log('UserManager: Initialized successfully');
    
    // Override the global loadSectionData function to include users
    const originalLoadSectionData = window.app ? window.app.loadSectionData : null;
    if (window.app) {
        window.app.loadSectionData = function(sectionId) {
            if (originalLoadSectionData) {
                originalLoadSectionData.call(this, sectionId);
            }
            
            if (sectionId === 'users-section') {
                console.log('UserManager: Loading users section...');
                loadUsers();
            }
        };
    }
    
    // Test function to verify everything works
    window.testUsersPage = function() {
        console.log('🧪 Testing users page...');
        showUsersSection();
        
        // Check if elements exist
        const usersSection = document.getElementById('users-section');
        const usersTableBody = document.getElementById('usersTableBody');
        
        console.log('Users section element:', usersSection);
        console.log('Users table body element:', usersTableBody);
        
        if (usersSection && usersTableBody) {
            console.log('✅ All elements found, page should work');
        } else {
            console.log('❌ Missing elements');
        }
    };
    
    console.log('🧪 Test function available: window.testUsersPage()');
});