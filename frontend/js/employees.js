// Employees and Responsibility Letters module
class EmployeesManager {
    constructor() {
        this.newHires = [];
        this.responsibilityLetters = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.selectedAssets = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Create responsibility letter form
        const createLetterForm = document.getElementById('createResponsibilityLetterForm');
        if (createLetterForm) {
            createLetterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createResponsibilityLetter();
            });
        }
    }

    // Load new hires data
    async loadNewHires() {
        try {
            const response = await auth.apiRequest('/employees/new-hires');
            const data = await response.json();

            if (response.ok) {
                this.newHires = data.newHires;
                this.renderNewHires();
            } else {
                console.error('Error loading new hires:', data.error);
                // Load demo data when API fails
                this.loadDemoNewHires();
            }
        } catch (error) {
            console.error('Error loading new hires:', error);
            // Load demo data when connection fails
            this.loadDemoNewHires();
        }
    }

    // Load demo new hires data
    loadDemoNewHires() {
        this.newHires = [
            {
                id: 1,
                full_name: 'María González',
                position: 'Desarrolladora Frontend',
                department: 'IT',
                location: 'MX',
                start_date: new Date(Date.now() - 86400000).toISOString(),
                email: 'maria.gonzalez@empresa.com'
            },
            {
                id: 2,
                full_name: 'Carlos Rodríguez',
                position: 'Analista de Datos',
                department: 'Analytics',
                location: 'CL',
                start_date: new Date(Date.now() - 172800000).toISOString(),
                email: 'carlos.rodriguez@empresa.com'
            },
            {
                id: 3,
                full_name: 'Ana Martínez',
                position: 'Diseñadora UX',
                department: 'Design',
                location: 'REMOTO',
                start_date: new Date(Date.now() - 259200000).toISOString(),
                email: 'ana.martinez@empresa.com'
            }
        ];
        this.renderNewHires();
    }

    // Render new hires list
    renderNewHires() {
        const container = document.getElementById('newHiresList');
        if (!container) return;

        container.innerHTML = '';

        if (this.newHires.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay nuevos ingresos recientes</p>';
            return;
        }

        this.newHires.slice(0, 5).forEach(hire => {
            const hireItem = document.createElement('div');
            hireItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            
            const timeAgo = this.getTimeAgo(new Date(hire.created_at));
            const locationBadge = this.getLocationBadge(hire.location);
            
            hireItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user-plus text-green-600 text-sm"></i>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-900">${hire.name}</h4>
                        <p class="text-xs text-gray-500">${hire.created_by} • ${timeAgo}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${locationBadge}
                    <button onclick="createLetterForHire('${hire.name}', '${hire.location}')" 
                            class="text-green-600 hover:text-green-800 text-xs">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(hireItem);
        });
    }

    // Load responsibility letters
    async loadResponsibilityLetters() {
        try {
            const response = await auth.apiRequest('/employees/responsibility-letters');
            const data = await response.json();

            if (response.ok) {
                this.renderPendingLetters(data.pendingLetters);
                this.renderSentLetters(data.sentLetters);
                this.updateCounts(data.pendingCount, data.sentCount);
            } else {
                console.error('Error loading responsibility letters:', data.error);
            }
        } catch (error) {
            console.error('Error loading responsibility letters:', error);
        }
    }

    renderPendingLetters(pendingLetters) {
        const pendingList = document.getElementById('pendingLettersList');
        if (!pendingList) return;

        pendingList.innerHTML = '';
        if (pendingLetters.length === 0) {
            pendingList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-clock text-4xl mb-4 text-gray-300"></i>
                    <p>No hay cartas pendientes</p>
                </div>
            `;
            return;
        }

        pendingLetters.forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-4';
            letterElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${letter.employeeName}</h4>
                        <p class="text-sm text-gray-600">${letter.position} - ${letter.department}</p>
                        <p class="text-xs text-gray-500">${letter.location} • ${new Date(letter.created_at).toLocaleDateString()}</p>
                        ${letter.assets && letter.assets.length > 0 ? `
                            <div class="mt-2">
                                <p class="text-xs text-gray-500">Assets:</p>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${letter.assets.map(asset => `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${asset.name}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col space-y-2 ml-4">
                        <button onclick="markLetterAsSent(${letter.id})" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition duration-200">
                            <i class="fas fa-check mr-1"></i>Marcar Enviada
                        </button>
                        ${letter.document_path ? `
                            <a href="${letter.document_path}" target="_blank" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition duration-200 text-center">
                                <i class="fas fa-download mr-1"></i>Descargar
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
            pendingList.appendChild(letterElement);
        });
    }

    renderSentLetters(sentLetters) {
        const sentList = document.getElementById('sentLettersList');
        if (!sentList) return;

        sentList.innerHTML = '';
        if (sentLetters.length === 0) {
            sentList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-check-circle text-4xl mb-4 text-gray-300"></i>
                    <p>No hay cartas enviadas</p>
                </div>
            `;
            return;
        }

        sentLetters.forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.className = 'bg-green-50 border border-green-200 rounded-lg p-4';
            letterElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${letter.employeeName}</h4>
                        <p class="text-sm text-gray-600">${letter.position} - ${letter.department}</p>
                        <p class="text-xs text-gray-500">${letter.location} • ${new Date(letter.created_at).toLocaleDateString()}</p>
                        ${letter.assets && letter.assets.length > 0 ? `
                            <div class="mt-2">
                                <p class="text-xs text-gray-500">Assets:</p>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${letter.assets.map(asset => `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${asset.name}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col space-y-2 ml-4">
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-medium">
                            <i class="fas fa-check mr-1"></i>Enviada
                        </span>
                        ${letter.document_path ? `
                            <a href="${letter.document_path}" target="_blank" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition duration-200 text-center">
                                <i class="fas fa-download mr-1"></i>Descargar
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
            sentList.appendChild(letterElement);
        });
    }

    updateCounts(pendingCount, sentCount) {
        const pendingCountEl = document.getElementById('pendingCount');
        const sentCountEl = document.getElementById('sentCount');
        
        if (pendingCountEl) pendingCountEl.textContent = pendingCount;
        if (sentCountEl) sentCountEl.textContent = sentCount;
    }

    async markLetterAsSent(letterId) {
        try {
            const response = await auth.apiRequest(`/employees/responsibility-letters/${letterId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'sent' })
            });

            if (response.ok) {
                alert('Carta marcada como enviada exitosamente!');
                this.loadResponsibilityLetters(); // Reload the data
            } else {
                const data = await response.json();
                alert(`Error al marcar carta: ${data.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error marking letter as sent:', error);
            alert('Error de conexión al marcar la carta como enviada.');
        }
    }

    // Render responsibility letters table
    renderResponsibilityLetters() {
        const tbody = document.getElementById('responsibilityTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.responsibilityLetters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron cartas de responsabilidad
                    </td>
                </tr>
            `;
            return;
        }

        this.responsibilityLetters.forEach(letter => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const locationBadge = this.getLocationBadge(letter.location);
            const formattedDate = new Date(letter.created_at).toLocaleDateString();
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${letter.employeeName}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${letter.position}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${letter.department}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${locationBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formattedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${letter.created_by}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        ${letter.document_path ? 
                            `<button onclick="downloadResponsibilityLetter('${letter.document_path}')" 
                                     class="text-green-600 hover:text-green-900">
                                <i class="fas fa-download"></i>
                            </button>` : 
                            '<span class="text-gray-400">N/A</span>'
                        }
                        <button onclick="viewResponsibilityLetter(${letter.id})" 
                                class="text-blue-600 hover:text-blue-900">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Render pagination
    renderResponsibilityPagination() {
        const container = document.getElementById('responsibilityPagination');
        if (!container) return;

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="flex items-center justify-between">';
        
        // Previous button
        paginationHTML += `
            <button onclick="window.employeesManager.loadResponsibilityLetters(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                Anterior
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button onclick="window.employeesManager.loadResponsibilityLetters(${i})" 
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
            <button onclick="window.employeesManager.loadResponsibilityLetters(${this.currentPage + 1})" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === this.totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                Siguiente
            </button>
        `;

        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;
    }

    // Create responsibility letter
    async createResponsibilityLetter() {
        const employeeName = document.getElementById('employeeName').value;
        const employeeId = document.getElementById('employeeId').value;
        const position = document.getElementById('position').value;
        const department = document.getElementById('department').value;
        const location = document.getElementById('location').value;
        const startDate = document.getElementById('startDate').value;
        const additionalTerms = document.getElementById('additionalTerms').value;

        try {
            const response = await auth.apiRequest('/employees/responsibility-letter', {
                method: 'POST',
                body: JSON.stringify({
                    employeeName,
                    employeeId,
                    position,
                    department,
                    location,
                    startDate,
                    assets: this.selectedAssets,
                    additionalTerms
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Carta de responsabilidad creada exitosamente');
                closeCreateResponsibilityLetterModal();
                this.loadResponsibilityLetters();
                
                // Refresh dashboard if it exists
                if (window.dashboard) {
                    window.dashboard.loadDashboardData();
                }
            } else {
                alert('Error al crear carta: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating responsibility letter:', error);
            alert('Error al crear carta de responsabilidad');
        }
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
}

// Global functions for modal handling
function showCreateResponsibilityLetterModal() {
    const modal = document.getElementById('createResponsibilityLetterModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Ensure employeesManager exists
        if (!window.employeesManager) {
            window.employeesManager = new EmployeesManager();
        }
        loadAvailableAssets();
    }
}

function closeCreateResponsibilityLetterModal() {
    const modal = document.getElementById('createResponsibilityLetterModal');
    const form = document.getElementById('createResponsibilityLetterForm');
    const assetsList = document.getElementById('assetsList');
    
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
    if (window.employeesManager) {
        window.employeesManager.selectedAssets = [];
    }
    if (assetsList) assetsList.innerHTML = '';
}

function createLetterForHire(name, location) {
    showCreateResponsibilityLetterModal();
    // Wait for modal to be visible before setting values
    setTimeout(() => {
        const employeeNameField = document.getElementById('employeeName');
        const locationField = document.getElementById('location');
        if (employeeNameField) employeeNameField.value = name;
        if (locationField) locationField.value = location;
    }, 100);
}

function addAssetToLetter() {
    const assetName = prompt('Nombre del asset:');
    if (!assetName) return;
    
    const assetTag = prompt('Tag del asset:');
    if (!assetTag) return;
    
    const asset = { name: assetName, asset_tag: assetTag };
    
    // Ensure employeesManager exists
    if (!window.employeesManager) {
        window.employeesManager = new EmployeesManager();
    }
    
    window.employeesManager.selectedAssets.push(asset);
    
    const assetsList = document.getElementById('assetsList');
    if (assetsList) {
        const assetItem = document.createElement('div');
        assetItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded';
        assetItem.innerHTML = `
            <span class="text-sm">${assetName} (${assetTag})</span>
            <button onclick="removeAssetFromLetter('${assetName}')" class="text-red-600 hover:text-red-800">
                <i class="fas fa-times"></i>
            </button>
        `;
        assetsList.appendChild(assetItem);
    }
}

function removeAssetFromLetter(assetName) {
    if (window.employeesManager) {
        window.employeesManager.selectedAssets = window.employeesManager.selectedAssets.filter(asset => asset.name !== assetName);
        loadAvailableAssets();
    }
}

function loadAvailableAssets() {
    const assetsList = document.getElementById('assetsList');
    if (!assetsList) return;
    
    assetsList.innerHTML = '';
    
    if (window.employeesManager && window.employeesManager.selectedAssets) {
        window.employeesManager.selectedAssets.forEach(asset => {
            const assetItem = document.createElement('div');
            assetItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded';
            assetItem.innerHTML = `
                <span class="text-sm">${asset.name} (${asset.asset_tag})</span>
                <button onclick="removeAssetFromLetter('${asset.name}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-times"></i>
                </button>
            `;
            assetsList.appendChild(assetItem);
        });
    }
}

function downloadResponsibilityLetter(documentPath) {
    const url = `/uploads/${documentPath.split('/').pop()}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = documentPath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function viewResponsibilityLetter(letterId) {
    // This could open a preview modal or redirect to a view page
    alert('Función de vista previa en desarrollo');
}

// Global function for marking letter as sent
function markLetterAsSent(letterId) {
    if (window.employeesManager) {
        window.employeesManager.markLetterAsSent(letterId);
    }
}

// Global functions for modals (called from HTML)
window.showCreateResponsibilityLetterModal = showCreateResponsibilityLetterModal;
window.closeCreateResponsibilityLetterModal = closeCreateResponsibilityLetterModal;
window.addAssetToLetter = addAssetToLetter;
window.markLetterAsSent = markLetterAsSent;
window.createLetterForHire = createLetterForHire;
window.removeAssetFromLetter = removeAssetFromLetter;
window.loadAvailableAssets = loadAvailableAssets;
window.downloadResponsibilityLetter = downloadResponsibilityLetter;
window.viewResponsibilityLetter = viewResponsibilityLetter;
window.toggleDetailedView = () => {
    const detailedView = document.getElementById('detailedView');
    if (detailedView) {
        detailedView.classList.toggle('hidden');
    }
};

// Load employees data when employees section is shown
function loadEmployees() {
    if (!window.employeesManager) {
        window.employeesManager = new EmployeesManager();
    }
    window.employeesManager.loadNewHires();
    window.employeesManager.loadResponsibilityLetters();
}

// Load new hires for dashboard
function loadNewHires() {
    if (!window.employeesManager) {
        window.employeesManager = new EmployeesManager();
    }
    window.employeesManager.loadNewHires();
}

