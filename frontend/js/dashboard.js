// Dashboard module
class Dashboard {
    constructor() {
        this.socket = null;
        this.locationChart = null;
        this.notifications = [];
        this.init();
    }

    init() {
        this.initializeSocket();
        this.setupEventListeners();
        
        // Only load data if auth is available
        if (window.auth && window.auth.token) {
            console.log('Auth available in Dashboard.init(), loading data...');
            this.loadDashboardData();
        } else {
            console.log('Auth not available in Dashboard.init(), will wait...');
        }
    }

    // Initialize Socket.IO connection
    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('new_user_alert', (data) => {
            this.addNotification({
                type: 'info',
                title: 'Nuevo Usuario de Hibob',
                message: `${data.name} se ha registrado desde ${data.location}`,
                timestamp: new Date(data.timestamp)
            });
            this.loadDashboardData(); // Refresh data
        });

        this.socket.on('asset_assigned', (data) => {
            this.addNotification({
                type: 'success',
                title: 'Asset Asignado',
                message: `${data.assetName} asignado a ${data.assignedTo}`,
                timestamp: new Date(data.timestamp)
            });
            this.loadDashboardData(); // Refresh data
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Notification button
        const notificationButton = document.getElementById('notificationButton');
        const notificationDropdown = document.getElementById('notificationDropdown');
        
        if (notificationButton && notificationDropdown) {
            notificationButton.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                notificationDropdown.classList.add('hidden');
            });
        }

        // User menu button
        const userMenuButton = document.getElementById('userMenuButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });
        }

        // Mobile menu button
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.classList.toggle('hidden');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }

        // Responsibility dropdown button
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

    // Load dashboard data
    async loadDashboardData() {
        try {
            console.log('=== LOAD DASHBOARD DATA DEBUG ===');
            console.log('Auth object:', window.auth);
            console.log('Auth user:', window.auth?.user);
            console.log('Auth token:', window.auth?.token);
            
            if (!window.auth) {
                console.error('Auth object not available');
                return;
            }
            
            if (!window.auth.token) {
                console.error('No auth token available');
                return;
            }
            
            console.log('Making API request to /dashboard/stats...');
            const response = await window.auth.apiRequest('/dashboard/stats');
            console.log('API response received:', response);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const data = await response.json();
            console.log('Parsed response data:', data);

            if (response.ok) {
                console.log('Response OK, calling updateStats...');
                this.updateStats(data);
                this.updateCharts(data);
                this.updateRecentActivity(data.recentLogs);
                this.updateRecentAssignments(data.activeAssignments);
                this.updateAlerts(data.alerts);
                
                // Load JumpCloud users count
                this.loadJumpCloudUsersCount();
                
                // Load JumpCloud systems count
                this.loadJumpCloudSystemsCount();
                
                // Load JumpCloud groups for location chart
                this.loadJumpCloudGroupsForChart();
                
                // Load new hires
                if (window.employeesManager) {
                    console.log('Loading new hires...');
                    window.employeesManager.loadNewHires();
                } else {
                    console.log('employeesManager not available, calling loadNewHires directly...');
                    loadNewHires();
                }
            } else {
                console.error('Dashboard API error:', data);
                // Show demo data when API fails
                this.loadDemoData();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show demo data when connection fails
            this.loadDemoData();
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
    }

    // Load demo data when API is not available
    loadDemoData() {
        console.log('Loading demo data...');
        
        // Demo statistics
        const demoData = {
            userStats: {
                'MX': 25,
                'CL': 18,
                'REMOTO': 12
            },
            assetStats: {
                available: 45,
                assigned: 38,
                maintenance: 7,
                retired: 3
            },
            recentLogs: [
                {
                    id: 1,
                    action: 'ASSET_ASSIGNED',
                    description: 'Laptop Dell XPS asignada a Juan Pérez',
                    timestamp: new Date().toISOString(),
                    user_name: 'Admin User'
                },
                {
                    id: 2,
                    action: 'ASSET_RETURNED',
                    description: 'Monitor Dell devuelto por María García',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    user_name: 'Admin User'
                },
                {
                    id: 3,
                    action: 'USER_CREATED',
                    description: 'Nuevo usuario creado: Carlos López',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    user_name: 'Admin User'
                }
            ],
            activeAssignments: [
                {
                    id: 1,
                    asset_name: 'MacBook Pro 16"',
                    asset_tag: 'MBP-001',
                    assigned_to: 'Ana Martínez',
                    assigned_date: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 2,
                    asset_name: 'Dell Monitor 27"',
                    asset_tag: 'MON-002',
                    assigned_to: 'Roberto Silva',
                    assigned_date: new Date(Date.now() - 172800000).toISOString()
                }
            ],
            alerts: [
                {
                    id: 1,
                    type: 'warning',
                    message: '3 assets requieren mantenimiento',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    type: 'info',
                    message: '2 procesos de onboarding pendientes',
                    timestamp: new Date(Date.now() - 1800000).toISOString()
                }
            ]
        };

        // Update all dashboard components with demo data
        this.updateStats(demoData);
        this.updateCharts(demoData);
        this.updateRecentActivity(demoData.recentLogs);
        this.updateRecentAssignments(demoData.activeAssignments);
        this.updateAlerts(demoData.alerts);

        // Show demo indicator
        this.showDemoIndicator();
    }

    // Show demo data indicator
    showDemoIndicator() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            // Remove existing demo indicator
            const existingIndicator = document.getElementById('demoIndicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Create demo indicator
            const demoIndicator = document.createElement('div');
            demoIndicator.id = 'demoIndicator';
            demoIndicator.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6';
            demoIndicator.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-info-circle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            <strong>Modo Demo:</strong> Se están mostrando datos de demostración. Los datos reales aparecerán cuando se conecte al servidor.
                        </p>
                    </div>
                </div>
            `;

            // Insert at the beginning of dashboard section
            const firstChild = dashboardSection.firstElementChild;
            if (firstChild) {
                dashboardSection.insertBefore(demoIndicator, firstChild);
            }
        }
    }

    // Update statistics cards
    updateStats(data) {
        console.log('=== UPDATE STATS DEBUG ===');
        console.log('Data received:', data);
        console.log('Data type:', typeof data);
        
        if (!data) {
            console.error('No data provided to updateStats');
            return;
        }
        
        if (!data.userStats) {
            console.error('userStats not found in data:', data);
            return;
        }
        
        if (!data.assetStats) {
            console.error('assetStats not found in data:', data);
            return;
        }
        
        const totalUsers = Object.values(data.userStats).reduce((sum, count) => sum + count, 0);
        const availableAssets = data.assetStats.available || 0;
        const assignedAssets = data.assetStats.assigned || 0;
        const todayActivity = data.recentLogs ? data.recentLogs.length : 0;

        console.log('Calculated values:', { totalUsers, availableAssets, assignedAssets, todayActivity });

        const totalUsersEl = document.getElementById('totalUsers');
        const availableAssetsEl = document.getElementById('availableAssets');
        const assignedAssetsEl = document.getElementById('assignedAssets');
        const todayActivityEl = document.getElementById('todayActivity');

        console.log('DOM elements found:', { 
            totalUsersEl: !!totalUsersEl, 
            availableAssetsEl: !!availableAssetsEl, 
            assignedAssetsEl: !!assignedAssetsEl, 
            todayActivityEl: !!todayActivityEl 
        });

        if (totalUsersEl) {
            totalUsersEl.textContent = totalUsers;
            console.log('Updated totalUsers to:', totalUsers);
        } else {
            console.error('totalUsers element not found!');
        }
        
        if (availableAssetsEl) {
            availableAssetsEl.textContent = availableAssets;
            console.log('Updated availableAssets to:', availableAssets);
        } else {
            console.error('availableAssets element not found!');
        }
        
        if (assignedAssetsEl) {
            assignedAssetsEl.textContent = assignedAssets;
            console.log('Updated assignedAssets to:', assignedAssets);
        } else {
            console.error('assignedAssets element not found!');
        }
        
        if (todayActivityEl) {
            todayActivityEl.textContent = todayActivity;
            console.log('Updated todayActivity to:', todayActivity);
        } else {
            console.error('todayActivity element not found!');
        }
        
        console.log('=== END UPDATE STATS DEBUG ===');
    }

    // Update charts
    updateCharts(data) {
        this.updateLocationChart(data.userStats);
    }

    // Update location chart
    updateLocationChart(userStats) {
        const ctx = document.getElementById('locationChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.locationChart) {
            this.locationChart.destroy();
        }

        const locationLabels = {
            'MX': 'México',
            'CL': 'Chile',
            'REMOTO': 'Remoto'
        };

        this.locationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(userStats).map(key => locationLabels[key] || key),
                datasets: [{
                    data: Object.values(userStats),
                    backgroundColor: [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#F59E0B'  // Yellow
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Update recent activity
    updateRecentActivity(recentLogs) {
        const container = document.getElementById('recentActivity');
        if (!container || !recentLogs) return;

        container.innerHTML = '';

        // Exclude responsibility letters and onboarding events from dashboard feed
        const excludedActions = new Set([
            'RESPONSIBILITY_LETTER_CREATED',
            'RESPONSIBILITY_LETTER_SENT',
            'RESPONSIBILITY_LETTER_SIGNED',
            'ONBOARDING_STARTED',
            'ONBOARDING_COMPLETED'
        ]);

        const filteredLogs = recentLogs.filter(log => !excludedActions.has(log.action));

        filteredLogs.slice(0, 5).forEach(log => {
            const activityItem = document.createElement('div');
            activityItem.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
            
            const icon = this.getActionIcon(log.action);
            const timeAgo = this.getTimeAgo(new Date(log.created_at));
            
            activityItem.innerHTML = `
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <i class="${icon} text-primary-600 text-sm"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                        ${log.action.replace(/_/g, ' ')}
                    </p>
                    <p class="text-sm text-gray-500">
                        ${log.full_name || 'Sistema'} • ${timeAgo}
                    </p>
                </div>
            `;
            
            container.appendChild(activityItem);
        });
    }

    // Update recent assignments
    updateRecentAssignments(assignments) {
        const container = document.getElementById('recentAssignments');
        if (!container || !assignments) return;

        container.innerHTML = '';

        if (assignments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay asignaciones recientes</p>';
            return;
        }

        assignments.forEach(assignment => {
            const assignmentItem = document.createElement('div');
            assignmentItem.className = 'flex items-center justify-between p-4 border border-gray-200 rounded-lg';
            
            const timeAgo = this.getTimeAgo(new Date(assignment.assignment_date));
            
            assignmentItem.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-laptop text-green-600"></i>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-900">${assignment.asset_name}</h4>
                        <p class="text-sm text-gray-500">${assignment.asset_tag}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">${assignment.assigned_to_name}</p>
                    <p class="text-sm text-gray-500">${timeAgo}</p>
                </div>
            `;
            
            container.appendChild(assignmentItem);
        });
    }

    // Update alerts - Send to notification system instead of dashboard
    updateAlerts(alerts) {
        if (!alerts) return;

        // Clear any existing alerts from dashboard
        const container = document.getElementById('alertsContainer');
        if (container) {
            container.innerHTML = '';
        }

        // Send alerts to notification system
        alerts.forEach(alert => {
            const timeAgo = this.getTimeAgo(new Date(alert.created_at));
            
            this.addNotification({
                type: 'info',
                title: 'Nuevo Usuario Detectado',
                message: `${alert.full_name || 'Usuario'} se ha registrado desde ${alert.location}`,
                timestamp: new Date(alert.created_at),
                timeAgo: timeAgo
            });
        });
    }

    // Add notification
    addNotification(notification) {
        this.notifications.unshift(notification);
        
        // Keep only last 10 notifications
        if (this.notifications.length > 10) {
            this.notifications = this.notifications.slice(0, 10);
        }
        
        this.updateNotificationUI();
    }

    // Update notification UI
    updateNotificationUI() {
        const badge = document.getElementById('notificationBadge');
        const list = document.getElementById('notificationList');
        
        if (badge) {
            if (this.notifications.length > 0) {
                badge.textContent = this.notifications.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        if (list) {
            list.innerHTML = '';
            
            if (this.notifications.length === 0) {
                list.innerHTML = '<p class="text-gray-500 text-sm">No hay notificaciones</p>';
                return;
            }
            
            this.notifications.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg';
                
                const iconClass = this.getNotificationIcon(notification.type);
                const timeAgo = this.getTimeAgo(notification.timestamp);
                
                notificationItem.innerHTML = `
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-${notification.type === 'success' ? 'green' : 'blue'}-100 rounded-full flex items-center justify-center">
                            <i class="${iconClass} text-${notification.type === 'success' ? 'green' : 'blue'}-600 text-sm"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                        <p class="text-sm text-gray-500">${notification.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${timeAgo}</p>
                    </div>
                `;
                
                list.appendChild(notificationItem);
            });
        }
    }

    // Get action icon
    getActionIcon(action) {
        const icons = {
            'LOGIN': 'fas fa-sign-in-alt',
            'LOGOUT': 'fas fa-sign-out-alt',
            'ASSET_ASSIGNED': 'fas fa-laptop',
            'ASSET_RETURNED': 'fas fa-undo',
            'USER_CREATED': 'fas fa-user-plus',
            'ASSET_CREATED': 'fas fa-plus-circle',
            'ASSET_UPDATED': 'fas fa-edit'
        };
        return icons[action] || 'fas fa-info-circle';
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'info': 'fas fa-info-circle',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle'
        };
        return icons[type] || 'fas fa-bell';
    }

    // Get time ago
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Hace un momento';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        }
    }

    // Simulate Hibob user (for testing)
    async simulateHibobUser() {
        const name = prompt('Nombre del nuevo usuario:');
        if (!name) return;
        
        const location = prompt('Ubicación (MX, CL, REMOTO):', 'REMOTO');
        if (!location) return;
        
        try {
            const response = await auth.apiRequest('/dashboard/simulate-hibob-user', {
                method: 'POST',
                body: JSON.stringify({ name, location })
            });
            
            if (response.ok) {
                console.log('Hibob user simulation created');
            }
        } catch (error) {
            console.error('Error simulating Hibob user:', error);
        }
    }

    // Load JumpCloud users count
    async loadJumpCloudUsersCount() {
        try {
            console.log('Loading JumpCloud users count...');
            const response = await window.auth.apiRequest('/jumpcloud/users/count');
            
            if (response.ok) {
                const data = await response.json();
                console.log('JumpCloud users data:', data);
                
                // Update the total users card with JumpCloud data
                const totalUsersEl = document.getElementById('totalUsers');
                if (totalUsersEl) {
                    totalUsersEl.textContent = data.totalUsers;
                    console.log('Updated totalUsers from JumpCloud to:', data.totalUsers);
                    
                    // Add a small indicator showing the data source
                    const sourceIndicator = document.getElementById('totalUsersSource');
                    if (sourceIndicator) {
                        sourceIndicator.textContent = data.source;
                        sourceIndicator.title = data.note || 'Data from JumpCloud';
                    }
                }
                
                // Show a notification about the data source
                if (data.note && data.note.includes('Simulated')) {
                    this.addNotification({
                        type: 'warning',
                        title: 'JumpCloud API',
                        message: 'Usando datos simulados. Verifica la API key de JumpCloud para datos reales.',
                        timestamp: new Date()
                    });
                }
                
                // Show detailed error information if available
                if (data.error) {
                    this.addNotification({
                        type: 'error',
                        title: 'JumpCloud API Error',
                        message: `${data.error}. Consulta JUMPCLOUD_API_KEY_GUIDE.md para solución.`,
                        timestamp: new Date(),
                        persistent: true
                    });
                }
            } else {
                console.error('Failed to load JumpCloud users count:', response.status);
            }
        } catch (error) {
            console.error('Error loading JumpCloud users count:', error);
        }
    }

    // Load JumpCloud systems count
    async loadJumpCloudSystemsCount() {
        try {
            console.log('Loading JumpCloud systems count...');
            const response = await window.auth.apiRequest('/jumpcloud/systems/count');
            
            if (response.ok) {
                const data = await response.json();
                console.log('JumpCloud systems data:', data);
                
                // Update the assigned assets card with JumpCloud data
                const assignedAssetsEl = document.getElementById('assignedAssets');
                if (assignedAssetsEl) {
                    assignedAssetsEl.textContent = data.totalSystems;
                    console.log('Updated assignedAssets from JumpCloud to:', data.totalSystems);
                    
                    // Add a small indicator showing the data source
                    const sourceIndicator = document.getElementById('assignedAssetsSource');
                    if (sourceIndicator) {
                        sourceIndicator.textContent = data.source;
                        sourceIndicator.title = data.note || 'Data from JumpCloud';
                    }
                }
                
                // Show a notification about the data source
                if (data.note && data.note.includes('Simulated')) {
                    this.addNotification({
                        type: 'warning',
                        title: 'JumpCloud Systems API',
                        message: 'Usando datos simulados para sistemas. Verifica la API key de JumpCloud para datos reales.',
                        timestamp: new Date()
                    });
                }
            } else {
                console.error('Failed to load JumpCloud systems count:', response.status);
            }
        } catch (error) {
            console.error('Error loading JumpCloud systems count:', error);
        }
    }

    // Load JumpCloud groups for location chart
    async loadJumpCloudGroupsForChart() {
        try {
            console.log('Loading JumpCloud groups for location chart...');
            const response = await window.auth.apiRequest('/jumpcloud/groups/counts');
            
            if (response.ok) {
                const data = await response.json();
                console.log('JumpCloud groups data:', data);
                
                // Update the location chart with JumpCloud data
                this.updateLocationChartWithJumpCloudData(data.groupCounts);
                
                // Show notification if some groups are simulated
                if (data.note && data.note.includes('simulated')) {
                    this.addNotification({
                        type: 'warning',
                        title: 'JumpCloud Groups',
                        message: 'Algunos grupos están simulados. Verifica los nombres de grupos en JumpCloud.',
                        timestamp: new Date()
                    });
                }
            } else {
                console.error('Failed to load JumpCloud groups:', response.status);
            }
        } catch (error) {
            console.error('Error loading JumpCloud groups:', error);
        }
    }

    // Update location chart with JumpCloud data
    updateLocationChartWithJumpCloudData(groupCounts) {
        const ctx = document.getElementById('locationChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.locationChart) {
            this.locationChart.destroy();
        }

        // Prepare data for chart
        const labels = groupCounts.map(group => group.name);
        const data = groupCounts.map(group => group.count);
        const colors = ['#3B82F6', '#10B981', '#F59E0B']; // Blue, Green, Yellow

        this.locationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value} dispositivos`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Location chart updated with JumpCloud data:', groupCounts);
    }
}

// Clear notifications
function clearNotifications() {
    if (window.dashboardManager) {
        window.dashboardManager.notifications = [];
        window.dashboardManager.updateNotificationUI();
    }
}

// Initialize dashboard
function initializeDashboard() {
    console.log('=== INITIALIZE DASHBOARD DEBUG ===');
    console.log('Current window.dashboardManager:', window.dashboardManager);
    console.log('Auth object:', window.auth);
    console.log('Auth user:', window.auth?.user);
    console.log('Auth token:', window.auth?.token);
    
    if (!window.dashboardManager) {
        console.log('Creating new Dashboard instance...');
        window.dashboardManager = new Dashboard();
        console.log('Dashboard created:', window.dashboardManager);
    } else {
        console.log('Dashboard already exists, reloading data...');
        // Wait for auth to be ready before loading data
        waitForAuthAndLoadData();
    }
    
    console.log('=== END INITIALIZE DASHBOARD DEBUG ===');
}

// Wait for auth to be ready and then load dashboard data
function waitForAuthAndLoadData() {
    console.log('Waiting for auth to be ready...');
    
    const checkAuth = () => {
        if (window.auth && window.auth.token) {
            console.log('Auth is ready, loading dashboard data...');
            window.dashboardManager.loadDashboardData();
        } else {
            console.log('Auth not ready yet, retrying in 100ms...');
            setTimeout(checkAuth, 100);
        }
    };
    
    checkAuth();
}

// Test dashboard function
function testDashboard() {
    console.log('Testing dashboard...');
    console.log('Auth object:', window.auth);
    console.log('Dashboard object:', window.dashboardManager);
    
    if (window.dashboardManager) {
        console.log('Calling loadDashboardData...');
        window.dashboardManager.loadDashboardData();
    } else {
        console.log('Dashboard not initialized, initializing now...');
        initializeDashboard();
        if (window.dashboardManager) {
            window.dashboardManager.loadDashboardData();
        }
    }
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Close mobile menu if it's open
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }

    // Close responsibility dropdown if it's open
    const responsibilityDropdown = document.getElementById('responsibilityDropdown');
    const responsibilityDropdownButton = document.getElementById('responsibilityDropdownButton');
    if (responsibilityDropdown) {
        responsibilityDropdown.classList.add('hidden');
        responsibilityDropdown.classList.remove('dropdown-enter');
        
        // Reset chevron
        if (responsibilityDropdownButton) {
            const chevron = responsibilityDropdownButton.querySelector('i');
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
        }
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('text-primary-600', 'border-primary-500');
        link.classList.add('text-gray-500');
    });
    
    // Update active link
    const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.remove('text-gray-500');
        activeLink.classList.add('text-primary-600', 'border-primary-500');
    }
    
    // Update responsibility dropdown button if any of its sections is active
    if (responsibilityDropdownButton && ['responsibility-section', 'offboarding-section'].includes(sectionId)) {
        responsibilityDropdownButton.classList.remove('text-gray-500');
        responsibilityDropdownButton.classList.add('text-primary-600', 'border-primary-500');
        
        // Update dropdown items to show active state
        const dropdownItems = document.querySelectorAll('#responsibilityDropdown a');
        dropdownItems.forEach(item => {
            item.classList.remove('bg-primary-50', 'text-primary-600');
            item.classList.add('text-gray-700', 'dark:text-gray-200');
        });
        
        // Highlight active item
        const activeItem = document.querySelector(`#responsibilityDropdown a[onclick="showSection('${sectionId}')"]`);
        if (activeItem) {
            activeItem.classList.remove('text-gray-700', 'dark:text-gray-200');
            activeItem.classList.add('bg-primary-50', 'text-primary-600');
        }
    }
    
    // Load section-specific data
    if (sectionId === 'audit-section') {
        loadAuditLogs();
    } else if (sectionId === 'responsibility-section') {
        loadEmployees();
    } else if (sectionId === 'offboarding-section') {
        loadOffboarding();
    }
}

// Global functions for dashboard
window.showSection = showSection;
window.testDashboard = testDashboard;
window.clearNotifications = clearNotifications;
window.initializeDashboard = initializeDashboard;
