// Assets module
class AssetsManager {
    constructor() {
        this.assets = [];
        this.users = [];
        this.currentPage = 1;
        this.filters = {
            status: '',
            location: '',
            category: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.loadUsers();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter event listeners
        const statusFilter = document.getElementById('assetStatusFilter');
        const locationFilter = document.getElementById('assetLocationFilter');
        const searchInput = document.getElementById('assetSearch');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.loadAssets();
            });
        }

        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.filters.location = e.target.value;
                this.loadAssets();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.debounce(() => this.loadAssets(), 300)();
            });
        }

        // Create asset form
        const createAssetForm = document.getElementById('createAssetForm');
        if (createAssetForm) {
            createAssetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAsset();
            });
        }

        // Assign asset form
        const assignAssetForm = document.getElementById('assignAssetForm');
        if (assignAssetForm) {
            assignAssetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.assignAsset();
            });
        }
    }

    // Load assets
    async loadAssets() {
        try {
            const params = new URLSearchParams();
            
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await auth.apiRequest(`/assets?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                this.assets = data.assets;
                this.renderAssets();
            } else {
                console.error('Error loading assets:', data.error);
            }
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    // Load users for assignment
    async loadUsers() {
        try {
            const response = await auth.apiRequest('/users');
            const data = await response.json();

            if (response.ok) {
                this.users = data.users;
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Render assets table
    renderAssets() {
        const tbody = document.getElementById('assetsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.assets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron assets
                    </td>
                </tr>
            `;
            return;
        }

        this.assets.forEach(asset => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const statusBadge = this.getStatusBadge(asset.status);
            const locationBadge = this.getLocationBadge(asset.location);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${asset.asset_tag}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${asset.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${asset.category}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${locationBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${asset.assigned_to_name || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        ${asset.status === 'available' ? 
                            `<button onclick="showAssignAssetModal(${asset.id}, '${asset.name}', '${asset.asset_tag}')" 
                                     class="text-primary-600 hover:text-primary-900">
                                <i class="fas fa-user-plus"></i>
                            </button>` : 
                            `<button onclick="returnAsset(${asset.id})" 
                                     class="text-green-600 hover:text-green-900">
                                <i class="fas fa-undo"></i>
                            </button>`
                        }
                        <button onclick="editAsset(${asset.id})" 
                                class="text-blue-600 hover:text-blue-900">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="viewAssetHistory(${asset.id})" 
                                class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Get status badge
    getStatusBadge(status) {
        const badges = {
            'available': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Disponible</span>',
            'assigned': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Asignado</span>',
            'maintenance': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Mantenimiento</span>',
            'retired': '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Retirado</span>'
        };
        return badges[status] || `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">${status}</span>`;
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

    // Create asset
    async createAsset() {
        const assetTag = document.getElementById('assetTag').value;
        const assetName = document.getElementById('assetName').value;
        const assetCategory = document.getElementById('assetCategory').value;
        const assetLocation = document.getElementById('assetLocation').value;

        try {
            const response = await auth.apiRequest('/assets', {
                method: 'POST',
                body: JSON.stringify({
                    asset_tag: assetTag,
                    name: assetName,
                    category: assetCategory,
                    location: assetLocation
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Asset creado exitosamente');
                closeCreateAssetModal();
                this.loadAssets();
            } else {
                alert('Error al crear asset: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating asset:', error);
            alert('Error al crear asset');
        }
    }

    // Assign asset
    async assignAsset() {
        const assetId = document.getElementById('assignAssetId').value;
        const userId = document.getElementById('assignUserId').value;
        const notes = document.getElementById('assignNotes').value;

        try {
            const response = await auth.apiRequest(`/assets/${assetId}/assign`, {
                method: 'POST',
                body: JSON.stringify({
                    userId: parseInt(userId),
                    notes: notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Asset asignado exitosamente');
                closeAssignAssetModal();
                this.loadAssets();
                
                // Refresh dashboard if it exists
                if (window.dashboard) {
                    window.dashboard.loadDashboardData();
                }
            } else {
                alert('Error al asignar asset: ' + data.error);
            }
        } catch (error) {
            console.error('Error assigning asset:', error);
            alert('Error al asignar asset');
        }
    }

    // Return asset
    async returnAsset(assetId) {
        const notes = prompt('Notas de devolución (opcional):');
        
        try {
            const response = await auth.apiRequest(`/assets/${assetId}/return`, {
                method: 'POST',
                body: JSON.stringify({
                    notes: notes || ''
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Asset devuelto exitosamente');
                this.loadAssets();
                
                // Refresh dashboard if it exists
                if (window.dashboard) {
                    window.dashboard.loadDashboardData();
                }
            } else {
                alert('Error al devolver asset: ' + data.error);
            }
        } catch (error) {
            console.error('Error returning asset:', error);
            alert('Error al devolver asset');
        }
    }

    // Edit asset
    async editAsset(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return;

        const name = prompt('Nombre del asset:', asset.name);
        if (!name) return;

        const category = prompt('Categoría:', asset.category);
        if (!category) return;

        const location = prompt('Ubicación (MX, CL, REMOTO):', asset.location);
        if (!location) return;

        const status = prompt('Estado (available, assigned, maintenance, retired):', asset.status);
        if (!status) return;

        try {
            const response = await auth.apiRequest(`/assets/${assetId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name,
                    category,
                    location,
                    status
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Asset actualizado exitosamente');
                this.loadAssets();
            } else {
                alert('Error al actualizar asset: ' + data.error);
            }
        } catch (error) {
            console.error('Error updating asset:', error);
            alert('Error al actualizar asset');
        }
    }

    // View asset history
    async viewAssetHistory(assetId) {
        try {
            const response = await auth.apiRequest(`/assets/${assetId}`);
            const data = await response.json();

            if (response.ok) {
                this.showAssetHistoryModal(data.asset, data.assignments);
            } else {
                alert('Error al cargar historial: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading asset history:', error);
            alert('Error al cargar historial');
        }
    }

    // Show asset history modal
    showAssetHistoryModal(asset, assignments) {
        // Create modal HTML
        const modalHTML = `
            <div id="assetHistoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Historial de ${asset.name} (${asset.asset_tag})</h3>
                            <button onclick="closeAssetHistoryModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div class="space-y-4">
                            ${assignments.map(assignment => `
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h4 class="font-medium text-gray-900">Asignado a: ${assignment.assigned_to_name}</h4>
                                            <p class="text-sm text-gray-500">Fecha: ${new Date(assignment.assignment_date).toLocaleDateString()}</p>
                                            ${assignment.return_date ? 
                                                `<p class="text-sm text-gray-500">Devuelto: ${new Date(assignment.return_date).toLocaleDateString()}</p>` : 
                                                '<p class="text-sm text-green-600">Actualmente asignado</p>'
                                            }
                                        </div>
                                        <div class="text-right">
                                            <p class="text-sm text-gray-500">Asignado por: ${assignment.assigned_by_name}</p>
                                        </div>
                                    </div>
                                    ${assignment.notes ? `<p class="text-sm text-gray-600 mt-2">${assignment.notes}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
}

// Global functions for modal handling
function showCreateAssetModal() {
    document.getElementById('createAssetModal').classList.remove('hidden');
}

function closeCreateAssetModal() {
    document.getElementById('createAssetModal').classList.add('hidden');
    document.getElementById('createAssetForm').reset();
}

function showAssignAssetModal(assetId, assetName, assetTag) {
    document.getElementById('assignAssetId').value = assetId;
    document.getElementById('assignAssetName').value = `${assetName} (${assetTag})`;
    
    // Populate users dropdown
    const userSelect = document.getElementById('assignUserId');
    userSelect.innerHTML = '<option value="">Seleccionar usuario</option>';
    
    if (window.assetsManager && window.assetsManager.users) {
        window.assetsManager.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.full_name} (${user.location})`;
            userSelect.appendChild(option);
        });
    }
    
    document.getElementById('assignAssetModal').classList.remove('hidden');
}

function closeAssignAssetModal() {
    document.getElementById('assignAssetModal').classList.add('hidden');
    document.getElementById('assignAssetForm').reset();
}

function closeAssetHistoryModal() {
    const modal = document.getElementById('assetHistoryModal');
    if (modal) {
        modal.remove();
    }
}

// Global functions for asset actions
function returnAsset(assetId) {
    if (window.assetsManager) {
        window.assetsManager.returnAsset(assetId);
    }
}

function editAsset(assetId) {
    if (window.assetsManager) {
        window.assetsManager.editAsset(assetId);
    }
}

function viewAssetHistory(assetId) {
    if (window.assetsManager) {
        window.assetsManager.viewAssetHistory(assetId);
    }
}

// Load assets when assets section is shown
function loadAssets() {
    if (!window.assetsManager) {
        window.assetsManager = new AssetsManager();
    } else {
        window.assetsManager.loadAssets();
    }
}

// Global functions for asset modals
window.showCreateAssetModal = showCreateAssetModal;
window.closeCreateAssetModal = closeCreateAssetModal;
window.showAssignAssetModal = showAssignAssetModal;
window.closeAssignAssetModal = closeAssignAssetModal;
window.closeAssetHistoryModal = closeAssetHistoryModal;
window.returnAsset = returnAsset;
window.editAsset = editAsset;
window.viewAssetHistory = viewAssetHistory;
