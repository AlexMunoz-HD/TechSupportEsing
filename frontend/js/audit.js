// Audit module
class AuditManager {
    constructor() {
        this.logs = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {
            action: '',
            location: '',
            startDate: '',
            endDate: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter event listeners
        const actionFilter = document.getElementById('auditActionFilter');
        const locationFilter = document.getElementById('auditLocationFilter');
        const startDateFilter = document.getElementById('auditStartDate');
        const endDateFilter = document.getElementById('auditEndDate');

        if (actionFilter) {
            actionFilter.addEventListener('change', (e) => {
                this.filters.action = e.target.value;
                this.loadAuditLogs();
            });
        }

        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.filters.location = e.target.value;
                this.loadAuditLogs();
            });
        }

        if (startDateFilter) {
            startDateFilter.addEventListener('change', (e) => {
                this.filters.startDate = e.target.value;
                this.loadAuditLogs();
            });
        }

        if (endDateFilter) {
            endDateFilter.addEventListener('change', (e) => {
                this.filters.endDate = e.target.value;
                this.loadAuditLogs();
            });
        }
    }

    // Load audit logs
    async loadAuditLogs(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });
            
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await auth.apiRequest(`/audit?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                this.logs = data.logs;
                this.currentPage = data.pagination.page;
                this.totalPages = data.pagination.pages;
                this.renderAuditLogs();
                this.renderPagination();
            } else {
                console.error('Error loading audit logs:', data.error);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    }

    // Render audit logs table
    renderAuditLogs() {
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron registros de auditoría
                    </td>
                </tr>
            `;
            return;
        }

        this.logs.forEach(log => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const actionBadge = this.getActionBadge(log.action);
            const locationBadge = this.getLocationBadge(log.location);
            const details = this.formatDetails(log.details);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${new Date(log.created_at).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${actionBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${log.full_name || 'Sistema'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${log.resource_type} ${log.resource_id ? `(${log.resource_id})` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${locationBadge}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    ${details}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="viewAuditDetails(${log.id})" 
                            class="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Render pagination
    renderPagination() {
        const container = document.getElementById('auditPagination');
        if (!container) return;

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="flex items-center justify-between">';
        
        // Previous button
        paginationHTML += `
            <div class="flex-1 flex justify-between sm:hidden">
                <button onclick="window.auditManager.loadAuditLogs(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                    Anterior
                </button>
                <button onclick="window.auditManager.loadAuditLogs(${this.currentPage + 1})" 
                        ${this.currentPage === this.totalPages ? 'disabled' : ''}
                        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === this.totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                    Siguiente
                </button>
            </div>
        `;

        // Desktop pagination
        paginationHTML += `
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Página <span class="font-medium">${this.currentPage}</span> de <span class="font-medium">${this.totalPages}</span>
                    </p>
                </div>
                <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        `;

        // Previous button
        paginationHTML += `
            <button onclick="window.auditManager.loadAuditLogs(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button onclick="window.auditManager.loadAuditLogs(${i})" 
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === this.currentPage ? 
                            'z-10 bg-primary-50 border-primary-500 text-primary-600' : 
                            'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button onclick="window.auditManager.loadAuditLogs(${this.currentPage + 1})" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === this.totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHTML += '</nav></div></div>';

        container.innerHTML = paginationHTML;
    }

    // Get action badge
    getActionBadge(action) {
        const badges = {
            'LOGIN': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Login</span>',
            'LOGOUT': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Logout</span>',
            'ASSET_ASSIGNED': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Asset Asignado</span>',
            'ASSET_RETURNED': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Asset Devuelto</span>',
            'USER_CREATED': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Usuario Creado</span>',
            'ASSET_CREATED': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Asset Creado</span>',
            'ASSET_UPDATED': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Asset Actualizado</span>',
            'PASSWORD_CHANGED': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Contraseña Cambiada</span>'
        };
        return badges[action] || `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">${action.replace(/_/g, ' ')}</span>`;
    }

    // Get location badge
    getLocationBadge(location) {
        const badges = {
            'MX': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">México</span>',
            'CL': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Chile</span>',
            'REMOTO': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Remoto</span>'
        };
        return badges[location] || `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">${location}</span>`;
    }

    // Format details
    formatDetails(details) {
        if (!details) return '-';
        
        try {
            const parsed = JSON.parse(details);
            const keys = Object.keys(parsed);
            
            if (keys.length === 0) return '-';
            
            // Show first few key-value pairs
            const displayItems = keys.slice(0, 2).map(key => {
                const value = parsed[key];
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value)}`;
                }
                return `${key}: ${value}`;
            });
            
            let result = displayItems.join(', ');
            if (keys.length > 2) {
                result += `... (+${keys.length - 2} más)`;
            }
            
            return result;
        } catch (error) {
            return details.length > 50 ? details.substring(0, 50) + '...' : details;
        }
    }

    // Export audit logs
    async exportAuditLogs() {
        try {
            const params = new URLSearchParams();
            
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await auth.apiRequest(`/audit/export/csv?${params.toString()}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const data = await response.json();
                alert('Error al exportar: ' + data.error);
            }
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            alert('Error al exportar registros de auditoría');
        }
    }

    // Load audit statistics
    async loadAuditStats() {
        try {
            const response = await auth.apiRequest('/audit/stats/summary');
            const data = await response.json();

            if (response.ok) {
                this.renderAuditStats(data);
            }
        } catch (error) {
            console.error('Error loading audit stats:', error);
        }
    }

    // Render audit statistics
    renderAuditStats(stats) {
        // This could be used to show statistics in a separate section
        console.log('Audit statistics:', stats);
    }

    // View audit details
    viewAuditDetails(logId) {
        const log = this.logs.find(l => l.id === logId);
        if (!log) {
            console.error('Log not found:', logId);
            return;
        }

        // Create modal content
        const modalContent = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="auditDetailsModal">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Detalles de Auditoría</h3>
                            <button onclick="closeAuditDetailsModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                                <p class="mt-1 text-sm text-gray-900">${new Date(log.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Acción</label>
                                <p class="mt-1 text-sm text-gray-900">${log.action.replace(/_/g, ' ')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Usuario</label>
                                <p class="mt-1 text-sm text-gray-900">${log.full_name || 'Sistema'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Recurso</label>
                                <p class="mt-1 text-sm text-gray-900">${log.resource_type} ${log.resource_id ? `(${log.resource_id})` : ''}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Ubicación</label>
                                <p class="mt-1 text-sm text-gray-900">${log.location}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Detalles Completos</label>
                                <div class="mt-1 p-3 bg-gray-50 rounded-md">
                                    <pre class="text-sm text-gray-900 whitespace-pre-wrap">${log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : 'Sin detalles adicionales'}</pre>
                                </div>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button onclick="closeAuditDetailsModal()" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalContent);
    }
}

// Global function to export audit logs
function exportAuditLogs() {
    if (window.auditManager) {
        window.auditManager.exportAuditLogs();
    }
}

// Load audit logs when audit section is shown
function loadAuditLogs() {
    if (!window.auditManager) {
        window.auditManager = new AuditManager();
    }
    window.auditManager.loadAuditLogs();
}

// Global function for export audit logs
window.exportAuditLogs = exportAuditLogs;

// Global function to view audit details
function viewAuditDetails(logId) {
    if (window.auditManager) {
        window.auditManager.viewAuditDetails(logId);
    }
}

// Global function to close audit details modal
function closeAuditDetailsModal() {
    const modal = document.getElementById('auditDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Make functions globally available
window.viewAuditDetails = viewAuditDetails;
window.closeAuditDetailsModal = closeAuditDetailsModal;
