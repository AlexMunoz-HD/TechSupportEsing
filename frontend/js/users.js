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
        try {
            console.log('UserManager: Loading users from database...');
            console.log('UserManager: API Base:', this.apiBase);
            console.log('UserManager: Auth object:', auth);
            
            const response = await auth.apiRequest(`${this.apiBase}`);
            console.log('UserManager: API Response:', response);
            console.log('UserManager: Response status:', response.status);
            console.log('UserManager: Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log('UserManager: Error response:', errorText);
                throw new Error(`Error loading users: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('UserManager: Users data received:', data);
            console.log('UserManager: Users count:', data.users?.length);
            
            this.users = data.users;
            this.applyFilters();
            this.updateStats();
            console.log('UserManager: Users loaded successfully from database');
        } catch (error) {
            console.error('Error loading users:', error);
            console.log('UserManager: Error details:', error.message);
            showNotification('error', 'Error', `No se pudieron cargar los usuarios: ${error.message}`);
        }
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

        // Only update if elements exist
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        
        const activeUsersEl = document.getElementById('activeUsers');
        if (activeUsersEl) activeUsersEl.textContent = activeUsers;
        
        const adminUsersEl = document.getElementById('adminUsers');
        if (adminUsersEl) adminUsersEl.textContent = adminUsers;
        
        const auditorUsersEl = document.getElementById('auditorUsers');
        if (auditorUsersEl) auditorUsersEl.textContent = auditorUsers;
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
    console.log('🚀 showUsersSection() called - DIRECT IMPLEMENTATION');
    
    // PASO 1: Ocultar todas las demás secciones
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'users-section') {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    });
    console.log('✅ Otras secciones ocultas');
    
    // PASO 2: Encontrar y mostrar la sección de usuarios
    const usersSection = document.getElementById('users-section');
    if (!usersSection) {
        console.error('❌ users-section no encontrada en el DOM!');
        alert('Error: La sección de usuarios no está en el HTML. Por favor, recarga la página.');
        return;
    }
    
    // PASO 3: Forzar visibilidad completa
    usersSection.classList.remove('hidden');
    usersSection.style.display = 'block';
    usersSection.style.visibility = 'visible';
    usersSection.style.opacity = '1';
    usersSection.style.position = 'relative';
    usersSection.style.zIndex = '10';
    console.log('✅ Sección de usuarios visible');
    
    // PASO 4: Asegurar que el dashboard container esté visible
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'block';
        dashboard.style.visibility = 'visible';
        console.log('✅ Dashboard container visible');
    }
    
    // PASO 5: Cargar los datos de usuarios
    setTimeout(() => {
        console.log('📊 Cargando datos de usuarios...');
        if (window.userManager && window.userManager.loadUsers) {
            window.userManager.loadUsers();
            console.log('✅ Datos de usuarios cargados via UserManager');
        } else {
            console.error('❌ UserManager no disponible');
            alert('Error: El gestor de usuarios no está inicializado. Por favor, recarga la página.');
        }
    }, 100);
    
    console.log('✅ showUsersSection() completado');
}

// Inline implementation that always works - Uses existing HTML section
function createVisibleUsersPageInline() {
    console.log('💥 SHOWING EXISTING USERS SECTION...');
    
    // Find the existing users section from HTML
    const usersSection = document.getElementById('users-section');
    
    if (!usersSection) {
        console.error('❌ Users section not found in HTML!');
        return;
    }
    
    // Make sure dashboard container is visible
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'block';
        dashboard.style.visibility = 'visible';
        dashboard.style.opacity = '1';
        console.log('✅ Dashboard container visible');
    }
    
    // Make sure header is visible
    const header = document.querySelector('header');
    if (header) {
        header.style.display = 'flex';
        header.style.visibility = 'visible';
        header.style.opacity = '1';
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '40';
        console.log('✅ Header visible');
    }
    
    // Hide ALL other sections including dashboard-section
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'users-section') {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    });
    
    console.log('✅ Other sections hidden');
    
    // Show the users section with MAXIMUM forced visibility
    usersSection.classList.remove('hidden');
    usersSection.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 10 !important;
        min-height: 100vh !important;
        width: 100% !important;
    `;
    
    console.log('✅ Users section shown with forced styles');
    console.log('Users section element:', usersSection);
    console.log('Users section display:', window.getComputedStyle(usersSection).display);
    console.log('Users section visibility:', window.getComputedStyle(usersSection).visibility);
    
    // Setup event listeners and load users
    setTimeout(() => {
        console.log('🚨 Setting up event listeners and loading users...');
        
        // Load users using UserManager
        if (window.userManager && window.userManager.loadUsers) {
            window.userManager.loadUsers();
            console.log('✅ UserManager.loadUsers() called');
        } else {
            console.log('❌ UserManager not available');
        }
    }, 100);
}

// Debug function to check navbar visibility
window.debugNavbar = function() {
    console.log('🔍 DEBUGGING NAVBAR...');
    
    const dashboard = document.getElementById('dashboard');
    const header = document.querySelector('header');
    const usersSection = document.getElementById('users-section');
    
    console.log('Dashboard element:', dashboard);
    console.log('Dashboard classes:', dashboard ? dashboard.className : 'N/A');
    console.log('Dashboard display:', dashboard ? window.getComputedStyle(dashboard).display : 'N/A');
    
    console.log('Header element:', header);
    console.log('Header display:', header ? window.getComputedStyle(header).display : 'N/A');
    console.log('Header visibility:', header ? window.getComputedStyle(header).visibility : 'N/A');
    console.log('Header position:', header ? window.getComputedStyle(header).position : 'N/A');
    
    console.log('Users section:', usersSection);
    console.log('Users section display:', usersSection ? window.getComputedStyle(usersSection).display : 'N/A');
    
    if (header) {
        const rect = header.getBoundingClientRect();
        console.log('Header position and size:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        });
    }
};

// Force fix navbar visibility
window.forceFixNavbar = function() {
    console.log('🚨 FORCING NAVBAR TO SHOW...');
    
    const dashboard = document.getElementById('dashboard');
    const header = document.querySelector('header');
    
    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'block !important';
        dashboard.style.visibility = 'visible !important';
        dashboard.style.opacity = '1 !important';
        console.log('✅ Dashboard forced visible');
    }
    
    if (header) {
        header.style.display = 'flex !important';
        header.style.visibility = 'visible !important';
        header.style.opacity = '1 !important';
        header.style.position = 'sticky !important';
        header.style.top = '0 !important';
        header.style.zIndex = '40 !important';
        console.log('✅ Header forced visible');
    }
    
    // Debug after forcing
    setTimeout(() => {
        window.debugNavbar();
    }, 100);
};

// Make functions globally available
window.showUsersSection = showUsersSection;
window.loadUsers = loadUsers;

// Debug function to check admin section visibility
window.debugAdminSection = function() {
    console.log('🔍 DEBUGGING ADMIN SECTION...');
    
    const adminSection = document.getElementById('adminSection');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Current user:', user);
    console.log('User role:', user.role);
    console.log('Admin section element:', adminSection);
    console.log('Admin section classes:', adminSection ? adminSection.className : 'N/A');
    console.log('Admin section hidden:', adminSection ? adminSection.classList.contains('hidden') : 'N/A');
    
    if (adminSection) {
        const rect = adminSection.getBoundingClientRect();
        console.log('Admin section position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        });
    }
    
    // Force show admin section if user is admin
    if (user.role === 'admin' && adminSection) {
        console.log('🚨 FORCING ADMIN SECTION TO SHOW...');
        adminSection.classList.remove('hidden');
        adminSection.style.display = 'block';
        adminSection.style.visibility = 'visible';
        adminSection.style.opacity = '1';
        console.log('✅ Admin section forced to show');
    }
};

// Force show admin section
window.forceShowAdminSection = function() {
    console.log('🚨 FORCING ADMIN SECTION TO SHOW...');
    
    const adminSection = document.getElementById('adminSection');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (adminSection) {
        adminSection.classList.remove('hidden');
        adminSection.style.display = 'block';
        adminSection.style.visibility = 'visible';
        adminSection.style.opacity = '1';
        console.log('✅ Admin section forced to show');
        
        // Also show the users button specifically
        const usersButton = adminSection.querySelector('a[onclick="showUsersSection()"]');
        if (usersButton) {
            usersButton.style.display = 'block';
            usersButton.style.visibility = 'visible';
            console.log('✅ Users button forced to show');
        }
    } else {
        console.error('❌ Admin section not found!');
    }
};

// Debug function to check users section visibility
window.debugUsersSectionVisibility = function() {
    console.log('🔍 DEBUGGING USERS SECTION VISIBILITY...');
    
    const usersSection = document.getElementById('users-section');
    
    if (usersSection) {
        console.log('Users section found:', usersSection);
        console.log('Classes:', usersSection.className);
        console.log('Has hidden class:', usersSection.classList.contains('hidden'));
        console.log('Computed styles:');
        console.log('- display:', window.getComputedStyle(usersSection).display);
        console.log('- visibility:', window.getComputedStyle(usersSection).visibility);
        console.log('- opacity:', window.getComputedStyle(usersSection).opacity);
        console.log('- position:', window.getComputedStyle(usersSection).position);
        console.log('- z-index:', window.getComputedStyle(usersSection).zIndex);
        
        const rect = usersSection.getBoundingClientRect();
        console.log('Position and size:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        });
        
        // Check if it's actually visible on screen
        if (rect.width === 0 || rect.height === 0) {
            console.log('❌ Section has no visible dimensions!');
        } else {
            console.log('✅ Section has visible dimensions');
        }
        
        // Check parent containers
        let parent = usersSection.parentElement;
        let level = 0;
        while (parent && level < 5) {
            console.log(`Parent ${level}:`, parent.tagName, parent.className);
            console.log(`- display:`, window.getComputedStyle(parent).display);
            console.log(`- visibility:`, window.getComputedStyle(parent).visibility);
            console.log(`- hidden:`, parent.classList.contains('hidden'));
            parent = parent.parentElement;
            level++;
        }
        
    } else {
        console.error('❌ Users section not found!');
    }
};

// NUCLEAR OPTION: Create a completely new visible users page
window.createVisibleUsersPage = function() {
    console.log('💥 CREATING COMPLETELY NEW VISIBLE USERS PAGE...');
    
    // Remove any existing users section
    const existingUsersSection = document.getElementById('users-section');
    if (existingUsersSection) {
        existingUsersSection.remove();
    }
    
    // Hide all other sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
        section.style.display = 'none';
    });
    
    // Create a new users section that's impossible to hide
    const newUsersSection = document.createElement('div');
    newUsersSection.id = 'users-section';
    newUsersSection.innerHTML = `
        <div style="
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
        ">
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1F2937; font-size: 28px; font-weight: bold; margin-bottom: 10px;">
                        👥 Gestión de Usuarios
                    </h1>
                    <p style="color: #6B7280; font-size: 16px;">
                        Administra usuarios, roles y permisos del sistema
                    </p>
                </div>
                
                <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #3B82F6;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <input type="text" id="userSearch" placeholder="🔍 Buscar usuarios..." 
                                   style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; width: 250px;">
                            <select id="roleFilter" style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px;">
                                <option value="">Todos los roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">Usuario</option>
                            </select>
                        </div>
                        <button id="addUserBtn" style="background: #10B981; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
                            ➕ Agregar Usuario
                        </button>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #F9FAFB;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">ID</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Nombre</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Email</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Rol</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Estado</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 40px; color: #6B7280;">
                                        🔄 Cargando usuarios...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                        <span id="paginationInfo">Mostrando 0 de 0 usuarios</span>
                        <div style="display: flex; gap: 8px;">
                            <button id="prevPage" style="padding: 6px 12px; border: 1px solid #D1D5DB; background: white; border-radius: 4px; cursor: pointer;">Anterior</button>
                            <div id="pageNumbers" style="display: flex; gap: 4px;"></div>
                            <button id="nextPage" style="padding: 6px 12px; border: 1px solid #D1D5DB; background: white; border-radius: 4px; cursor: pointer;">Siguiente</button>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.hideUsersPage()" style="background: #EF4444; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
                        ❌ Cerrar Página de Usuarios
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(newUsersSection);
    
    console.log('✅ New visible users page created');
    
    // Load users
    setTimeout(() => {
        console.log('🚨 Loading users in new page...');
        loadUsers();
    }, 100);
};

// Hide the users page
window.hideUsersPage = function() {
    console.log('🚨 HIDING USERS PAGE...');
    const usersSection = document.getElementById('users-section');
    if (usersSection) {
        usersSection.remove();
        console.log('✅ Users page hidden');
    }
};

// Force show users section with maximum visibility
window.forceShowUsersSection = function() {
    console.log('🚨 FORCING USERS SECTION TO SHOW WITH MAXIMUM VISIBILITY...');
    
    const usersSection = document.getElementById('users-section');
    if (usersSection) {
        // Hide all other sections first
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            section.style.display = 'none';
            section.style.visibility = 'hidden';
            section.style.opacity = '0';
        });
        
        // Force show users section with maximum visibility
        usersSection.classList.remove('hidden');
        usersSection.style.display = 'block';
        usersSection.style.visibility = 'visible';
        usersSection.style.opacity = '1';
        usersSection.style.position = 'relative';
        usersSection.style.zIndex = '9999';
        usersSection.style.backgroundColor = '#ffffff';
        usersSection.style.minHeight = '100vh';
        usersSection.style.width = '100%';
        usersSection.style.top = '0';
        usersSection.style.left = '0';
        
        console.log('✅ Users section forced to show with maximum visibility');
        
        // Load users
        setTimeout(() => {
            console.log('🚨 Force loading users...');
            loadUsers();
        }, 100);
        
        // Debug visibility after forcing
        setTimeout(() => {
            window.debugUsersSectionVisibility();
        }, 200);
        
    } else {
        console.error('❌ Users section not found!');
    }
};

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
                showUsersSection();
            }
        };
    }
    
    // Test function to verify everything works
    window.testUsersPage = function() {
        console.log('🧪 Testing users page...');
        
        // Check if elements exist
        const usersSection = document.getElementById('users-section');
        const usersTableBody = document.getElementById('usersTableBody');
        
        console.log('Users section element:', usersSection);
        console.log('Users table body element:', usersTableBody);
        
        if (usersSection && usersTableBody) {
            console.log('✅ All elements found');
            
            // Show the section using the global showSection function
            console.log('🧪 Calling window.showSection("users-section")...');
            window.showSection('users-section');
            
        } else {
            console.log('❌ Missing elements');
            console.log('Available elements:');
            console.log('- users-section:', document.getElementById('users-section'));
            console.log('- usersTableBody:', document.getElementById('usersTableBody'));
        }
    };
    
    // Emergency function to force show users section
    window.forceShowUsers = function() {
        console.log('🚨 FORCE SHOWING USERS SECTION...');
        
        const usersSection = document.getElementById('users-section');
        if (usersSection) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
                section.style.display = 'none';
            });
            
            // Force show users section
            usersSection.classList.remove('hidden');
            usersSection.style.display = 'block';
            usersSection.style.visibility = 'visible';
            usersSection.style.opacity = '1';
            usersSection.style.position = 'relative';
            usersSection.style.zIndex = '1';
            
            console.log('✅ Users section forced to show');
            
            // Load users
            setTimeout(() => {
                console.log('🚨 Force loading users...');
                loadUsers();
            }, 100);
        } else {
            console.error('❌ Users section not found!');
        }
    };
    
    // NUCLEAR SOLUTION: Replace entire users section content
    window.replaceUsersSectionContent = function() {
        console.log('💥 REPLACING ENTIRE USERS SECTION CONTENT...');
        
        // Find the users section
        const usersSection = document.getElementById('users-section');
        if (!usersSection) {
            console.log('❌ Users section not found, creating emergency table instead');
            window.createEmergencyUsersTable();
            return;
        }
        
        // Clear all existing content
        usersSection.innerHTML = '';
        
        // Force visibility styles
        usersSection.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: 500px !important;
            background: #F8FAFC !important;
            padding: 20px !important;
            border: 3px solid #10B981 !important;
            border-radius: 12px !important;
            margin: 20px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        `;
        
        // Create new content
        const newContent = document.createElement('div');
        newContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1F2937; font-size: 28px; font-weight: bold; margin-bottom: 10px;">
                    👥 Gestión de Usuarios del Sistema
                </h1>
                <p style="color: #6B7280; font-size: 16px;">
                    Administra usuarios, roles y permisos del sistema
                </p>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #374151; font-size: 20px; font-weight: bold;">
                        Lista de Usuarios
                    </h2>
                    <div>
                        <button onclick="window.createEmergencyUsersTable()" style="background: #3B82F6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: bold;">
                            🚨 Vista de Emergencia
                        </button>
                        <button onclick="window.replaceUsersSectionContent()" style="background: #10B981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            🔄 Recargar
                        </button>
                    </div>
                </div>
                
                <div id="users-table-container" style="overflow-x: auto;">
                    <!-- Table will be inserted here -->
                </div>
            </div>
        `;
        
        // Add to users section
        usersSection.appendChild(newContent);
        
        // Create and add the table
        const tableContainer = document.getElementById('users-table-container');
        if (tableContainer) {
            const table = document.createElement('table');
            table.style.cssText = `
                width: 100%;
                border-collapse: collapse;
                font-family: Arial, sans-serif;
                background: white;
            `;
            
            // Create header
            table.innerHTML = `
                <thead>
                    <tr style="background: #F3F4F6;">
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: left; font-weight: bold; color: #374151;">ID</th>
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: left; font-weight: bold; color: #374151;">Usuario</th>
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: left; font-weight: bold; color: #374151;">Email</th>
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: left; font-weight: bold; color: #374151;">Rol</th>
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: left; font-weight: bold; color: #374151;">Ubicación</th>
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: left; font-weight: bold; color: #374151;">Estado</th>
                        <th style="border: 1px solid #D1D5DB; padding: 15px; text-align: center; font-weight: bold; color: #374151;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="replaced-users-tbody">
                    <!-- Users will be inserted here -->
                </tbody>
            `;
            
            tableContainer.appendChild(table);
            
            // Add users data
            if (window.userManager && window.userManager.users) {
                const tbody = document.getElementById('replaced-users-tbody');
                console.log('Adding users to replaced table:', window.userManager.users.length);
                
                window.userManager.users.forEach((user, index) => {
                    const row = document.createElement('tr');
                    row.style.cssText = `
                        background: ${index % 2 === 0 ? '#ffffff' : '#F9FAFB'};
                        border-bottom: 1px solid #E5E7EB;
                    `;
                    row.innerHTML = `
                        <td style="border: 1px solid #D1D5DB; padding: 12px; font-weight: 500;">${user.id}</td>
                        <td style="border: 1px solid #D1D5DB; padding: 12px; font-weight: 500;">${user.username}</td>
                        <td style="border: 1px solid #D1D5DB; padding: 12px;">${user.email}</td>
                        <td style="border: 1px solid #D1D5DB; padding: 12px;">
                            <span style="background: ${user.role === 'admin' ? '#FEF3C7' : '#DBEAFE'}; color: ${user.role === 'admin' ? '#92400E' : '#1E40AF'}; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                                ${user.role.toUpperCase()}
                            </span>
                        </td>
                        <td style="border: 1px solid #D1D5DB; padding: 12px;">${user.location}</td>
                        <td style="border: 1px solid #D1D5DB; padding: 12px;">
                            <span style="background: ${user.is_active ? '#D1FAE5' : '#FEE2E2'}; color: ${user.is_active ? '#065F46' : '#991B1B'}; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                                ${user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td style="border: 1px solid #D1D5DB; padding: 12px; text-align: center;">
                            <button onclick="alert('Editar usuario ${user.id}')" style="background: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 8px; font-weight: bold;">
                                ✏️ Editar
                            </button>
                            <button onclick="alert('Eliminar usuario ${user.id}')" style="background: #EF4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                🗑️ Eliminar
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                const tbody = document.getElementById('replaced-users-tbody');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="7" style="border: 1px solid #D1D5DB; padding: 30px; text-align: center; color: #6B7280; font-size: 16px;">
                        ⏳ Cargando usuarios...
                    </td>
                `;
                tbody.appendChild(row);
            }
        }
        
        console.log('✅ ENTIRE USERS SECTION REPLACED WITH NEW CONTENT');
        console.log('Users section:', usersSection);
        console.log('New content:', newContent);
    };

    // PERMANENT SOLUTION: Create a visible table inside the users section
    window.createPermanentUsersTable = function() {
        console.log('🔧 CREATING PERMANENT USERS TABLE...');
        
        // Find the users section
        const usersSection = document.getElementById('users-section');
        if (!usersSection) {
            console.log('❌ Users section not found, creating emergency table instead');
            window.createEmergencyUsersTable();
            return;
        }
        
        // Remove any existing permanent table
        const existingPermanent = document.getElementById('permanent-users-table');
        if (existingPermanent) {
            existingPermanent.remove();
        }
        
        // Create a new container inside the users section
        const permanentContainer = document.createElement('div');
        permanentContainer.id = 'permanent-users-table';
        permanentContainer.style.cssText = `
            width: 100% !important;
            background: white !important;
            border: 2px solid #3B82F6 !important;
            border-radius: 8px !important;
            padding: 20px !important;
            margin: 20px 0 !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        `;
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = '👥 Lista de Usuarios del Sistema';
        title.style.cssText = `
            color: #1F2937 !important;
            font-size: 20px !important;
            margin-bottom: 20px !important;
            text-align: center !important;
            font-weight: bold !important;
        `;
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1px solid #D1D5DB !important;
            font-family: Arial, sans-serif !important;
            background: white !important;
        `;
        
        // Create header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #F3F4F6 !important;">
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: left !important; font-weight: bold !important;">ID</th>
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: left !important; font-weight: bold !important;">Usuario</th>
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: left !important; font-weight: bold !important;">Email</th>
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: left !important; font-weight: bold !important;">Rol</th>
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: left !important; font-weight: bold !important;">Ubicación</th>
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: left !important; font-weight: bold !important;">Estado</th>
                <th style="border: 1px solid #D1D5DB !important; padding: 12px !important; text-align: center !important; font-weight: bold !important;">Acciones</th>
            </tr>
        `;
        
        // Create body
        const tbody = document.createElement('tbody');
        
        // Add users data
        if (window.userManager && window.userManager.users) {
            console.log('Adding users to permanent table:', window.userManager.users.length);
            window.userManager.users.forEach((user, index) => {
                const row = document.createElement('tr');
                row.style.cssText = `
                    background: ${index % 2 === 0 ? '#ffffff' : '#F9FAFB'} !important;
                    border-bottom: 1px solid #E5E7EB !important;
                `;
                row.innerHTML = `
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important;">${user.id}</td>
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important; font-weight: 500 !important;">${user.username}</td>
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important;">${user.email}</td>
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important;">
                        <span style="background: ${user.role === 'admin' ? '#FEF3C7' : '#DBEAFE'} !important; color: ${user.role === 'admin' ? '#92400E' : '#1E40AF'} !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important;">
                            ${user.role.toUpperCase()}
                        </span>
                    </td>
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important;">${user.location}</td>
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important;">
                        <span style="background: ${user.is_active ? '#D1FAE5' : '#FEE2E2'} !important; color: ${user.is_active ? '#065F46' : '#991B1B'} !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important;">
                            ${user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td style="border: 1px solid #D1D5DB !important; padding: 10px !important; text-align: center !important;">
                        <button onclick="editUser(${user.id})" style="background: #3B82F6 !important; color: white !important; border: none !important; padding: 6px 12px !important; border-radius: 4px !important; cursor: pointer !important; margin-right: 4px !important; font-size: 12px !important;">
                            ✏️ Editar
                        </button>
                        <button onclick="deleteUser(${user.id})" style="background: #EF4444 !important; color: white !important; border: none !important; padding: 6px 12px !important; border-radius: 4px !important; cursor: pointer !important; font-size: 12px !important;">
                            🗑️ Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="border: 1px solid #D1D5DB !important; padding: 20px !important; text-align: center !important; color: #6B7280 !important;">
                    ⏳ Cargando usuarios...
                </td>
            `;
            tbody.appendChild(row);
        }
        
        // Assemble table
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // Assemble container
        permanentContainer.appendChild(title);
        permanentContainer.appendChild(table);
        
        // Add to users section
        usersSection.appendChild(permanentContainer);
        
        console.log('✅ PERMANENT TABLE CREATED AND ADDED TO USERS SECTION');
        console.log('Permanent container:', permanentContainer);
        console.log('Table:', table);
        console.log('Users count:', tbody.children.length);
    };

    // EMERGENCY SOLUTION: Create a completely new visible table
    window.createEmergencyUsersTable = function() {
        console.log('🚨 CREATING EMERGENCY USERS TABLE...');
        
        // Remove any existing emergency table
        const existingEmergency = document.getElementById('emergency-users-table');
        if (existingEmergency) {
            existingEmergency.remove();
        }
        
        // Create a new container that will definitely be visible
        const emergencyContainer = document.createElement('div');
        emergencyContainer.id = 'emergency-users-table';
        emergencyContainer.style.cssText = `
            position: fixed !important;
            top: 50px !important;
            left: 50px !important;
            width: calc(100vw - 100px) !important;
            height: calc(100vh - 100px) !important;
            background: white !important;
            border: 5px solid red !important;
            z-index: 99999 !important;
            overflow: auto !important;
            padding: 20px !important;
            box-shadow: 0 0 20px rgba(0,0,0,0.5) !important;
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '❌ CERRAR';
        closeButton.style.cssText = `
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            background: red !important;
            color: white !important;
            border: none !important;
            padding: 10px !important;
            cursor: pointer !important;
            z-index: 100000 !important;
        `;
        closeButton.onclick = () => emergencyContainer.remove();
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = '🚨 TABLA DE USUARIOS DE EMERGENCIA';
        title.style.cssText = `
            color: red !important;
            font-size: 24px !important;
            margin-bottom: 20px !important;
            text-align: center !important;
        `;
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100% !important;
            border-collapse: collapse !important;
            border: 2px solid blue !important;
            font-family: Arial, sans-serif !important;
        `;
        
        // Create header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f0f0f0 !important;">
                <th style="border: 1px solid black !important; padding: 10px !important; text-align: left !important;">ID</th>
                <th style="border: 1px solid black !important; padding: 10px !important; text-align: left !important;">Usuario</th>
                <th style="border: 1px solid black !important; padding: 10px !important; text-align: left !important;">Email</th>
                <th style="border: 1px solid black !important; padding: 10px !important; text-align: left !important;">Rol</th>
                <th style="border: 1px solid black !important; padding: 10px !important; text-align: left !important;">Ubicación</th>
                <th style="border: 1px solid black !important; padding: 10px !important; text-align: left !important;">Estado</th>
            </tr>
        `;
        
        // Create body
        const tbody = document.createElement('tbody');
        
        // Add users data
        if (window.userManager && window.userManager.users) {
            console.log('Adding users to emergency table:', window.userManager.users.length);
            window.userManager.users.forEach((user, index) => {
                const row = document.createElement('tr');
                row.style.cssText = `
                    background: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'} !important;
                    border: 1px solid #ddd !important;
                `;
                row.innerHTML = `
                    <td style="border: 1px solid black !important; padding: 8px !important;">${user.id}</td>
                    <td style="border: 1px solid black !important; padding: 8px !important;">${user.username}</td>
                    <td style="border: 1px solid black !important; padding: 8px !important;">${user.email}</td>
                    <td style="border: 1px solid black !important; padding: 8px !important;">${user.role}</td>
                    <td style="border: 1px solid black !important; padding: 8px !important;">${user.location}</td>
                    <td style="border: 1px solid black !important; padding: 8px !important;">${user.is_active ? 'Activo' : 'Inactivo'}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" style="border: 1px solid black !important; padding: 20px !important; text-align: center !important; color: red !important;">
                    ❌ NO SE PUDIERON CARGAR LOS USUARIOS
                </td>
            `;
            tbody.appendChild(row);
        }
        
        // Assemble table
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // Assemble container
        emergencyContainer.appendChild(closeButton);
        emergencyContainer.appendChild(title);
        emergencyContainer.appendChild(table);
        
        // Add to body
        document.body.appendChild(emergencyContainer);
        
        console.log('✅ EMERGENCY TABLE CREATED AND ADDED TO BODY');
        console.log('Emergency container:', emergencyContainer);
        console.log('Table:', table);
        console.log('Users count:', tbody.children.length);
    };
    
    // Debug function to check visual elements
    window.debugUsersVisibility = function() {
        console.log('🔍 DEBUGGING USERS VISIBILITY...');
        
        const usersSection = document.getElementById('users-section');
        const usersTableBody = document.getElementById('usersTableBody');
        const usersTable = document.querySelector('#users-section table');
        
        console.log('Users section:', usersSection);
        console.log('Users section visible:', usersSection ? !usersSection.classList.contains('hidden') : 'N/A');
        console.log('Users section display:', usersSection ? window.getComputedStyle(usersSection).display : 'N/A');
        console.log('Users section visibility:', usersSection ? window.getComputedStyle(usersSection).visibility : 'N/A');
        
        console.log('Users table body:', usersTableBody);
        console.log('Users table body children:', usersTableBody ? usersTableBody.children.length : 'N/A');
        
        console.log('Users table:', usersTable);
        console.log('Users table display:', usersTable ? window.getComputedStyle(usersTable).display : 'N/A');
        
        // Check if section is actually visible
        if (usersSection) {
            const rect = usersSection.getBoundingClientRect();
            console.log('Users section position:', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0
            });
        }
        
        // Create emergency table
        console.log('🚨 Creating emergency table as fallback...');
        window.createEmergencyUsersTable();
    };
    
    console.log('🧪 Test function available: window.testUsersPage()');
});