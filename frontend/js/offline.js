// Offline Manager - Maneja modo offline, sincronización y estado de conexión
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingActions = [];
        this.syncQueue = [];
        this.connectionIndicator = null;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupConnectionListeners();
        this.createConnectionIndicator();
        this.loadPendingActions();
        this.startSyncInterval();
    }

    // Registrar Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[OfflineManager] Service Worker registrado:', registration.scope);
                
                // Escuchar actualizaciones
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[OfflineManager] Nueva versión disponible');
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('[OfflineManager] Error registrando Service Worker:', error);
            }
        }
    }

    // Configurar listeners de conexión
    setupConnectionListeners() {
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Verificar estado periódicamente - DESHABILITADO para evitar spam
        // Usar solo los eventos online/offline del navegador
        // setInterval(() => {
        //     this.checkConnection();
        // }, 60000);
    }

    // Manejar cuando vuelve la conexión
    async handleOnline() {
        this.isOnline = true;
        this.updateConnectionIndicator();
        console.log('[OfflineManager] Conexión restaurada');
        
        if (window.showToast) {
            window.showToast('success', 'Conexión restaurada', 'Sincronizando datos...');
        }

        // Sincronizar acciones pendientes
        await this.syncPendingActions();
    }

    // Manejar cuando se pierde la conexión
    handleOffline() {
        this.isOnline = false;
        this.updateConnectionIndicator();
        console.log('[OfflineManager] Sin conexión');
        
        if (window.showToast) {
            window.showToast('warning', 'Sin conexión', 'La aplicación funciona en modo offline');
        }
    }

    // Verificar estado de conexión
    async checkConnection() {
        try {
            const response = await fetch('/api/dashboard/stats', {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 3000
            });
            this.isOnline = response.ok;
        } catch (error) {
            this.isOnline = false;
        }
        this.updateConnectionIndicator();
    }

    // Crear indicador de conexión
    createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.className = 'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300';
        indicator.style.display = 'none';
        
        const icon = document.createElement('div');
        icon.className = 'w-3 h-3 rounded-full';
        
        const text = document.createElement('span');
        text.className = 'text-sm font-medium';
        text.textContent = 'Sin conexión';
        
        indicator.appendChild(icon);
        indicator.appendChild(text);
        document.body.appendChild(indicator);
        
        this.connectionIndicator = indicator;
        this.updateConnectionIndicator();
    }

    // Actualizar indicador de conexión
    updateConnectionIndicator() {
        if (!this.connectionIndicator) return;

        const icon = this.connectionIndicator.querySelector('div');
        const text = this.connectionIndicator.querySelector('span');

        if (this.isOnline) {
            this.connectionIndicator.style.display = 'none';
        } else {
            this.connectionIndicator.style.display = 'flex';
            this.connectionIndicator.className = 'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg bg-yellow-500 text-white';
            icon.className = 'w-3 h-3 rounded-full bg-white animate-pulse';
            text.textContent = 'Modo offline';
        }
    }

    // Guardar acción pendiente
    savePendingAction(action) {
        const pendingActions = this.getPendingActions();
        pendingActions.push({
            ...action,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
        this.pendingActions = pendingActions;
    }

    // Obtener acciones pendientes
    getPendingActions() {
        try {
            const stored = localStorage.getItem('pendingActions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[OfflineManager] Error cargando acciones pendientes:', error);
            return [];
        }
    }

    // Cargar acciones pendientes
    loadPendingActions() {
        this.pendingActions = this.getPendingActions();
        if (this.pendingActions.length > 0 && this.isOnline) {
            this.syncPendingActions();
        }
    }

    // Sincronizar acciones pendientes
    async syncPendingActions() {
        if (!this.isOnline || this.pendingActions.length === 0) {
            return;
        }

        const actionsToSync = [...this.pendingActions];
        const successful = [];
        const failed = [];

        for (const action of actionsToSync) {
            try {
                const response = await fetch(action.url, {
                    method: action.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(action.data)
                });

                if (response.ok) {
                    successful.push(action.id);
                } else {
                    failed.push(action);
                }
            } catch (error) {
                console.error('[OfflineManager] Error sincronizando acción:', error);
                failed.push(action);
            }
        }

        // Remover acciones exitosas
        this.pendingActions = failed;
        localStorage.setItem('pendingActions', JSON.stringify(failed));

        if (successful.length > 0) {
            console.log(`[OfflineManager] ${successful.length} acciones sincronizadas`);
            if (window.showToast) {
                window.showToast('success', 'Sincronización completa', `${successful.length} acciones sincronizadas`);
            }
        }
    }

    // Intervalo de sincronización
    startSyncInterval() {
        setInterval(() => {
            if (this.isOnline && this.pendingActions.length > 0) {
                this.syncPendingActions();
            }
        }, 30000); // Sincronizar cada 30 segundos
    }

    // Wrapper para requests que maneja offline
    async apiRequest(url, options = {}) {
        if (this.isOnline) {
            try {
                const response = await fetch(url, options);
                return response;
            } catch (error) {
                // Si falla, guardar como pendiente si es POST/PUT/DELETE
                if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
                    this.savePendingAction({
                        url,
                        method: options.method,
                        data: options.body ? JSON.parse(options.body) : {}
                    });
                    return new Response(JSON.stringify({ 
                        offline: true, 
                        message: 'Acción guardada para sincronizar cuando vuelva la conexión' 
                    }), {
                        status: 202,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw error;
            }
        } else {
            // Modo offline - guardar acciones de escritura
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
                this.savePendingAction({
                    url,
                    method: options.method,
                    data: options.body ? JSON.parse(options.body) : {}
                });
                return new Response(JSON.stringify({ 
                    offline: true, 
                    message: 'Acción guardada para sincronizar cuando vuelva la conexión' 
                }), {
                    status: 202,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            // Para GET, intentar desde cache
            const cached = await caches.match(url);
            if (cached) {
                return cached;
            }
            throw new Error('Sin conexión y sin datos en caché');
        }
    }

    // Mostrar notificación de actualización
    showUpdateNotification() {
        if (window.showToast) {
            window.showToast('info', 'Nueva versión disponible', 'Recarga la página para actualizar', {
                duration: 10000,
                action: {
                    label: 'Actualizar',
                    onClick: () => window.location.reload()
                }
            });
        }
    }

    // Obtener estado de conexión
    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            pendingActions: this.pendingActions.length
        };
    }
}

// Inicializar OfflineManager cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.offlineManager = new OfflineManager();
    });
} else {
    window.offlineManager = new OfflineManager();
}

