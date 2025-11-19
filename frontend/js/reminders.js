// Reminders Manager - Sistema de recordatorios visuales
class RemindersManager {
    constructor() {
        this.reminders = [];
        this.checkInterval = null;
        this.init();
    }

    init() {
        // Solo cargar recordatorios una vez, no en startReminderChecks también
        this.setupNotificationPermission();
        // Cargar recordatorios después de un delay para evitar spam al inicio
        setTimeout(() => {
            this.loadReminders();
        }, 2000);
        this.startReminderChecks();
    }

    // Solicitar permiso para notificaciones
    async setupNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.error('[RemindersManager] Error solicitando permiso:', error);
            }
        }
    }

    // Cargar recordatorios desde eventos
    async loadReminders() {
        try {
            // Cargar asignaciones próximas a vencer
            const assignmentsResponse = await window.auth.apiRequest('/assets');
            const assignmentsData = await assignmentsResponse.json();
            
            // Cargar procesos de onboarding
            const onboardingResponse = await window.auth.apiRequest('/onboarding/processes');
            const onboardingData = await onboardingResponse.json();
            
            // Cargar procesos de offboarding
            const offboardingResponse = await window.auth.apiRequest('/offboarding/processes');
            const offboardingData = await offboardingResponse.json();

            this.reminders = [
                ...this.createAssignmentReminders(assignmentsData.assets || []),
                ...this.createOnboardingReminders(onboardingData.processes || []),
                ...this.createOffboardingReminders(offboardingData.processes || [])
            ];

            this.displayUpcomingReminders();
        } catch (error) {
            console.error('[RemindersManager] Error cargando recordatorios:', error);
        }
    }

    // Crear recordatorios de asignaciones
    createAssignmentReminders(assets) {
        const reminders = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        assets.forEach(asset => {
            if (asset.warranty_expiry) {
                const expiryDate = new Date(asset.warranty_expiry);
                expiryDate.setHours(0, 0, 0, 0);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
                    reminders.push({
                        id: `warranty-${asset.id}`,
                        type: 'warranty',
                        title: `Garantía próxima a vencer: ${asset.name}`,
                        message: `La garantía de ${asset.name} vence en ${daysUntilExpiry} días`,
                        date: expiryDate,
                        daysUntil: daysUntilExpiry,
                        priority: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low',
                        data: asset
                    });
                }
            }
        });

        return reminders;
    }

    // Crear recordatorios de onboarding
    createOnboardingReminders(processes) {
        const reminders = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        processes.forEach(process => {
            if (process.status === 'in_progress') {
                // Recordatorio para pasos pendientes
                if (process.steps) {
                    const pendingSteps = process.steps.filter(step => step.status === 'pending');
                    if (pendingSteps.length > 0) {
                        reminders.push({
                            id: `onboarding-pending-${process.id}`,
                            type: 'onboarding',
                            title: `Onboarding pendiente: ${process.employee_name}`,
                            message: `${pendingSteps.length} paso(s) pendiente(s) en el proceso de onboarding`,
                            date: new Date(process.start_date),
                            daysUntil: 0,
                            priority: 'medium',
                            data: process
                        });
                    }
                }
            }
        });

        return reminders;
    }

    // Crear recordatorios de offboarding
    createOffboardingReminders(processes) {
        const reminders = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        processes.forEach(process => {
            if (process.status === 'in_progress') {
                // Recordatorio para pasos pendientes
                if (process.steps) {
                    const pendingSteps = process.steps.filter(step => step.status === 'pending');
                    if (pendingSteps.length > 0) {
                        reminders.push({
                            id: `offboarding-pending-${process.id}`,
                            type: 'offboarding',
                            title: `Offboarding pendiente: ${process.employee_name}`,
                            message: `${pendingSteps.length} paso(s) pendiente(s) en el proceso de offboarding`,
                            date: new Date(process.start_date),
                            daysUntil: 0,
                            priority: 'high',
                            data: process
                        });
                    }
                }
            }
        });

        return reminders;
    }

    // Mostrar recordatorios próximos
    displayUpcomingReminders() {
        const upcoming = this.reminders
            .filter(r => r.daysUntil <= 7)
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .slice(0, 5);

        if (upcoming.length === 0) return;

        // Crear o actualizar contenedor de recordatorios
        let container = document.getElementById('remindersContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'remindersContainer';
            container.className = 'fixed top-20 right-4 z-40 space-y-2 max-w-sm';
            document.body.appendChild(container);
        }

        container.innerHTML = upcoming.map(reminder => `
            <div class="reminder-card p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 cursor-pointer hover:shadow-xl"
                 style="background-color: ${this.getReminderColor(reminder.priority)}; border-left-color: ${this.getReminderBorderColor(reminder.priority)};"
                 onclick="window.remindersManager.showReminderDetails('${reminder.id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-semibold uppercase" style="color: rgba(0,0,0,0.7);">
                                ${reminder.type === 'warranty' ? 'Garantía' : reminder.type === 'onboarding' ? 'Onboarding' : 'Offboarding'}
                            </span>
                            ${reminder.priority === 'high' ? '<span class="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Urgente</span>' : ''}
                        </div>
                        <h4 class="font-semibold text-sm mb-1" style="color: rgba(0,0,0,0.9);">${reminder.title}</h4>
                        <p class="text-xs" style="color: rgba(0,0,0,0.7);">${reminder.message}</p>
                        ${reminder.daysUntil >= 0 ? `
                            <p class="text-xs mt-2 font-medium" style="color: rgba(0,0,0,0.6);">
                                ${reminder.daysUntil === 0 ? 'Hoy' : reminder.daysUntil === 1 ? 'Mañana' : `En ${reminder.daysUntil} días`}
                            </p>
                        ` : ''}
                    </div>
                    <button onclick="event.stopPropagation(); window.remindersManager.dismissReminder('${reminder.id}')" 
                            class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Aplicar estilos dark mode
        this.applyDarkModeStyles();
    }

    // Obtener color según prioridad
    getReminderColor(priority) {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            return priority === 'high' ? '#7f1d1d' : priority === 'medium' ? '#78350f' : '#1e3a8a';
        }
        return priority === 'high' ? '#fee2e2' : priority === 'medium' ? '#fef3c7' : '#dbeafe';
    }

    // Obtener color de borde según prioridad
    getReminderBorderColor(priority) {
        return priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#3b82f6';
    }

    // Aplicar estilos dark mode
    applyDarkModeStyles() {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.querySelectorAll('.reminder-card').forEach(card => {
                const title = card.querySelector('h4');
                const text = card.querySelectorAll('p, span');
                if (title) title.style.color = '#f9fafb';
                text.forEach(el => {
                    if (!el.classList.contains('bg-red-500')) {
                        el.style.color = '#d1d5db';
                    }
                });
            });
        }
    }

    // Iniciar verificaciones periódicas
    startReminderChecks() {
        // Limpiar intervalo anterior si existe
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // Verificar cada hora (no cargar inmediatamente, ya se carga en init)
        this.checkInterval = setInterval(() => {
            this.loadReminders();
        }, 3600000); // 1 hora
    }

    // Mostrar detalles del recordatorio
    showReminderDetails(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        // Navegar a la sección relevante
        if (reminder.type === 'warranty') {
            showSection('assets-section');
        } else if (reminder.type === 'onboarding') {
            showSection('onboarding-section');
        } else if (reminder.type === 'offboarding') {
            showSection('offboarding-section');
        }
    }

    // Descartar recordatorio
    dismissReminder(reminderId) {
        this.reminders = this.reminders.filter(r => r.id !== reminderId);
        this.displayUpcomingReminders();
    }

    // Enviar notificación del navegador
    sendBrowserNotification(reminder) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(reminder.title, {
                body: reminder.message,
                icon: '/favicon.svg',
                tag: reminder.id,
                requireInteraction: reminder.priority === 'high'
            });
        }
    }
}

// Inicializar solo cuando el usuario esté autenticado
function initializeRemindersManager() {
    if (!window.remindersManager && window.auth && window.auth.isAuthenticated()) {
        console.log('[RemindersManager] Inicializando después de autenticación...');
        window.remindersManager = new RemindersManager();
    }
}

// NO inicializar automáticamente - solo después del login
// Escuchar evento de autenticación
window.addEventListener('userAuthenticated', () => {
    console.log('[RemindersManager] Evento userAuthenticated recibido');
    initializeRemindersManager();
});

// También intentar inicializar si ya está autenticado al cargar (después de un delay)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.auth && window.auth.isAuthenticated()) {
                initializeRemindersManager();
            }
        }, 2000);
    });
} else {
    setTimeout(() => {
        if (window.auth && window.auth.isAuthenticated()) {
            initializeRemindersManager();
        }
    }, 2000);
}

