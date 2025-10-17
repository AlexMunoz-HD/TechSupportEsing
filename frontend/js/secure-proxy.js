/**
 * SECURE PROXY ARCHITECTURE FOR ONBOARDING AUTOMATION
 * 
 * Este módulo implementa una arquitectura de proxy seguro para interactuar
 * con sistemas internos (HiBob y Snipe-IT) sin exponer credenciales en el frontend.
 * 
 * CRITICAL SECURITY RULE: 
 * NO credentials, tokens, or API keys should EVER be included in this frontend code.
 * All API calls go through secure backend proxy endpoints.
 */

class SecureOnboardingProxy {
    constructor() {
        // Endpoints del backend proxy seguro (NO credenciales aquí)
        this.endpoints = {
            usuariosConActivos: 'http://localhost:3001/api/users',
            dispararESign: 'http://localhost:3001/api/disparar-esign'
        };
        
        this.usuarios = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listeners para botones de generación de documentos
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="generar-documento"]')) {
                const userId = e.target.dataset.userId;
                const userEmail = e.target.dataset.userEmail;
                this.enviarDocumento(userId, userEmail);
            }
        });
    }

    /**
     * CARGAR USUARIOS CON ACTIVOS
     * 
     * Función que reemplaza llamadas directas a HiBob y Snipe-IT.
     * Hace una sola llamada GET al proxy backend que combina datos de ambos sistemas.
     */
    async cargarUsuarios() {
        try {
            
            // Mostrar loading state
            this.showLoadingState();
            
            // Llamada segura al proxy backend (SIN credenciales en el frontend)
            const response = await fetch(this.endpoints.usuariosConActivos, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // NOTA: Las credenciales de autenticación se manejan en el backend proxy
                    // NO se incluyen aquí por seguridad
                }
            });

            if (!response.ok) {
                throw new Error(`Error del proxy: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validar estructura de respuesta
            if (!data.usuarios || !Array.isArray(data.usuarios)) {
                throw new Error('Formato de respuesta inválido del proxy');
            }

            this.usuarios = data.usuarios;
            
            // Renderizar tabla de usuarios
            this.renderizarTablaUsuarios();
            
            // Ocultar loading state
            this.hideLoadingState();
            
            // Mostrar notificación de éxito
            this.showNotification('success', 'Usuarios Cargados', 
                `Se cargaron ${this.usuarios.length} usuarios desde HiBob y Snipe-IT`);

        } catch (error) {
            console.error('❌ Error cargando usuarios desde proxy:', error);
            this.hideLoadingState();
            this.showNotification('error', 'Error de Conexión', 
                'No se pudieron cargar los usuarios. Verifique la conexión con el proxy backend.');
            
            // Cargar estado vacío como fallback
            this.mostrarEstadoVacio();
        }
    }

    /**
     * ENVIAR DOCUMENTO DE ASIGNACIÓN
     * 
     * Función asociada al botón "Generar Documento de Asignación".
     * Hace una llamada POST al webhook de automatización para disparar eSign.
     */
    async enviarDocumento(userId, userEmail) {
        try {
            console.log(`📄 Generando documento para usuario: ${userId} (${userEmail})`);
            
            // Validar parámetros
            if (!userId && !userEmail) {
                throw new Error('Se requiere userId o userEmail para generar el documento');
            }

            // Mostrar loading en el botón específico
            this.showButtonLoading(userId);

            // Preparar payload (SOLO datos necesarios, SIN credenciales)
            const payload = {
                userId: userId,
                email: userEmail,
                timestamp: new Date().toISOString(),
                source: 'frontend-onboarding'
            };

            // Llamada segura al webhook de automatización
            const response = await fetch(this.endpoints.dispararESign, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // NOTA: La autenticación se maneja en el backend
                    // NO se incluyen tokens aquí por seguridad
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            
            // Ocultar loading del botón
            this.hideButtonLoading(userId);
            
            // Mostrar notificación de éxito
            this.showNotification('success', 'Documento Generado', 
                `El documento de asignación para ${userEmail} ha sido enviado para firma electrónica.`);

            // Opcional: Actualizar estado del usuario en la tabla
            this.actualizarEstadoUsuario(userId, 'documento_enviado');

        } catch (error) {
            console.error('❌ Error enviando documento:', error);
            this.hideButtonLoading(userId);
            this.showNotification('error', 'Error al Generar Documento', 
                `No se pudo generar el documento para ${userEmail}. Intente nuevamente.`);
        }
    }

    /**
     * RENDERIZAR TABLA DE USUARIOS
     * 
     * Renderiza la tabla con los usuarios cargados desde el proxy.
     * Incluye botones "Generar Documento de Asignación" para cada usuario.
     */
    renderizarTablaUsuarios() {
        const tableBody = document.getElementById('usuariosTableBody');
        if (!tableBody) {
            console.error('❌ Elemento usuariosTableBody no encontrado');
            return;
        }

        if (this.usuarios.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium text-gray-900 mb-2">No hay usuarios disponibles</p>
                            <p class="text-sm text-gray-500">No se encontraron usuarios en HiBob o no tienen activos asignados</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.usuarios.map(usuario => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span class="text-sm font-medium text-blue-600">
                                    ${this.getInitials(usuario.nombre || usuario.full_name)}
                                </span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">
                                ${usuario.nombre || usuario.full_name}
                            </div>
                            <div class="text-sm text-gray-500">
                                ${usuario.email}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${usuario.posicion || usuario.position || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${usuario.departamento || usuario.department || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${usuario.ubicacion || usuario.location || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${usuario.activos_asignados || 0} activos
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.estado_documento === 'enviado' ? 'bg-blue-100 text-blue-800' :
                        usuario.estado_documento === 'firmado' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }">
                        ${this.getEstadoDocumentoText(usuario.estado_documento)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        data-action="generar-documento"
                        data-user-id="${usuario.id || usuario.userId}"
                        data-user-email="${usuario.email}"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        ${usuario.estado_documento === 'firmado' ? 'disabled' : ''}
                    >
                        <i class="fas fa-file-signature mr-2"></i>
                        Generar Documento de Asignación
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * FUNCIONES DE UTILIDAD
     */
    
    getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getEstadoDocumentoText(estado) {
        const estados = {
            'pendiente': 'Pendiente',
            'enviado': 'Enviado',
            'firmado': 'Firmado',
            'error': 'Error'
        };
        return estados[estado] || 'Pendiente';
    }

    showLoadingState() {
        const tableBody = document.getElementById('usuariosTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p class="text-sm text-gray-500">Cargando usuarios desde HiBob y Snipe-IT...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState() {
        // El loading se oculta cuando se renderiza la tabla
    }

    showButtonLoading(userId) {
        const button = document.querySelector(`[data-user-id="${userId}"][data-action="generar-documento"]`);
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
            `;
        }
    }

    hideButtonLoading(userId) {
        const button = document.querySelector(`[data-user-id="${userId}"][data-action="generar-documento"]`);
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <i class="fas fa-file-signature mr-2"></i>
                Generar Documento de Asignación
            `;
        }
    }

    actualizarEstadoUsuario(userId, nuevoEstado) {
        const usuario = this.usuarios.find(u => (u.id || u.userId) === userId);
        if (usuario) {
            usuario.estado_documento = nuevoEstado;
            // Re-renderizar solo la fila específica si es necesario
        }
    }

    showNotification(type, title, message) {
        // Usar el sistema de notificaciones existente o crear uno simple
        if (typeof showNotification === 'function') {
            showNotification(type, title, message);
        } else {
            console.log(`🔔 ${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    /**
     * Mostrar estado vacío cuando no hay datos disponibles
     */
    mostrarEstadoVacio() {
        
        this.usuarios = [];
        this.renderizarTablaUsuarios();
    }
}

// Inicializar el proxy seguro cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.secureOnboardingProxy = new SecureOnboardingProxy();
    
    // Cargar usuarios automáticamente al inicializar
    window.secureOnboardingProxy.cargarUsuarios();
});

// Hacer disponible globalmente para debugging
window.SecureOnboardingProxy = SecureOnboardingProxy;
