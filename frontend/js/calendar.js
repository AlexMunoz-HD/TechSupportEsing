// Calendar View Manager - Vista de calendario estilo Google Calendar
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.viewMode = 'month'; // 'month' o 'week'
        this.events = [];
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.createCalendarSection();
        // Cargar eventos después de un delay más largo para evitar spam al inicio
        setTimeout(() => {
            this.loadEvents();
        }, 3000);
    }

    // Cargar eventos (asignaciones, onboarding, offboarding)
    async loadEvents() {
        try {
            // Cargar asignaciones
            const assignmentsResponse = await window.auth.apiRequest('/assets');
            const assignmentsData = await assignmentsResponse.json();
            
            // Cargar procesos de onboarding
            const onboardingResponse = await window.auth.apiRequest('/onboarding/processes');
            const onboardingData = await onboardingResponse.json();
            
            // Cargar procesos de offboarding
            const offboardingResponse = await window.auth.apiRequest('/offboarding/processes');
            const offboardingData = await offboardingResponse.json();

            this.events = [
                ...this.parseAssignments(assignmentsData.assets || []),
                ...this.parseOnboardingEvents(onboardingData.processes || []),
                ...this.parseOffboardingEvents(offboardingData.processes || [])
            ];

            this.renderCalendar();
        } catch (error) {
            console.error('[CalendarManager] Error cargando eventos:', error);
            this.events = [];
        }
    }

    // Parsear asignaciones a eventos
    parseAssignments(assets) {
        return assets
            .filter(asset => asset.assigned_date || asset.created_at)
            .map(asset => ({
                id: `assignment-${asset.id}`,
                title: asset.name || 'Sin nombre',
                type: 'assignment',
                start: new Date(asset.assigned_date || asset.created_at),
                end: asset.return_date ? new Date(asset.return_date) : null,
                color: '#4285f4',
                borderColor: '#1a73e8',
                data: asset
            }));
    }

    // Parsear eventos de onboarding
    parseOnboardingEvents(processes) {
        return processes.map(process => ({
            id: `onboarding-${process.id}`,
            title: process.employee_name || 'Nuevo empleado',
            type: 'onboarding',
            start: new Date(process.start_date),
            end: process.completion_date ? new Date(process.completion_date) : null,
            color: '#34a853',
            borderColor: '#137333',
            data: process
        }));
    }

    // Parsear eventos de offboarding
    parseOffboardingEvents(processes) {
        return processes.map(process => ({
            id: `offboarding-${process.id}`,
            title: process.employee_name || 'Empleado',
            type: 'offboarding',
            start: new Date(process.start_date),
            end: process.completion_date ? new Date(process.completion_date) : null,
            color: '#ea4335',
            borderColor: '#c5221f',
            data: process
        }));
    }

    // Crear sección de calendario
    createCalendarSection() {
        const calendarSection = document.createElement('div');
        calendarSection.id = 'calendar-section';
        calendarSection.className = 'hidden pt-16';
        calendarSection.style.cssText = 'min-height: 100vh; background: #f8f9fa;';
        calendarSection.innerHTML = `
            <div class="max-w-[1400px] mx-auto px-4 py-6">
                <!-- Header del calendario estilo Google -->
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <button id="calendarPrev" class="calendar-nav-btn" title="Mes anterior">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button id="calendarNext" class="calendar-nav-btn" title="Mes siguiente">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                        <button id="calendarToday" class="calendar-today-btn">Hoy</button>
                        <div id="calendarCurrentDate" class="calendar-date-title"></div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button id="calendarViewMonth" class="calendar-view-btn active">Mes</button>
                        <button id="calendarViewWeek" class="calendar-view-btn">Semana</button>
                    </div>
                </div>

                <!-- Leyenda estilo Google -->
                <div class="mb-3 flex items-center gap-5 text-xs">
                    <div class="flex items-center gap-2">
                        <div class="calendar-legend-dot" style="background-color: #4285f4;"></div>
                        <span class="calendar-legend-text">Asignaciones</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="calendar-legend-dot" style="background-color: #34a853;"></div>
                        <span class="calendar-legend-text">Onboarding</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="calendar-legend-dot" style="background-color: #ea4335;"></div>
                        <span class="calendar-legend-text">Offboarding</span>
                    </div>
                </div>

                <!-- Calendario -->
                <div id="calendarContainer" class="calendar-container"></div>
            </div>
        `;

        // Agregar estilos CSS
        this.addCalendarStyles();

        // Agregar al dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.appendChild(calendarSection);
        }

        this.setupEventListeners();
    }

    // Agregar estilos CSS estilo Google Calendar
    addCalendarStyles() {
        if (document.getElementById('calendar-styles')) return;

        const style = document.createElement('style');
        style.id = 'calendar-styles';
        style.textContent = `
            .calendar-nav-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: none;
                background: transparent;
                color: #5f6368;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            .calendar-nav-btn:hover {
                background-color: rgba(60, 64, 67, 0.08);
            }
            .calendar-today-btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid #dadce0;
                background: white;
                color: #3c4043;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .calendar-today-btn:hover {
                background-color: #f8f9fa;
            }
            .calendar-date-title {
                font-size: 22px;
                font-weight: 400;
                color: #3c4043;
                margin-left: 8px;
            }
            .calendar-view-btn {
                padding: 6px 12px;
                border-radius: 4px;
                border: none;
                background: transparent;
                color: #5f6368;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .calendar-view-btn:hover {
                background-color: rgba(60, 64, 67, 0.08);
            }
            .calendar-view-btn.active {
                background-color: #e8f0fe;
                color: #1a73e8;
            }
            .calendar-legend-dot {
                width: 12px;
                height: 12px;
                border-radius: 3px;
            }
            .calendar-legend-text {
                color: #5f6368;
                font-size: 12px;
            }
            .calendar-container {
                background: white;
                border-radius: 8px;
                border: 1px solid #dadce0;
                overflow: hidden;
            }
            .calendar-month-header {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                border-bottom: 1px solid #dadce0;
                background: white;
            }
            .calendar-month-day-header {
                padding: 8px;
                text-align: center;
                font-size: 11px;
                font-weight: 500;
                color: #70757a;
                text-transform: uppercase;
            }
            .calendar-month-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
            }
            .calendar-month-day {
                min-height: 100px;
                border-right: 1px solid #dadce0;
                border-bottom: 1px solid #dadce0;
                padding: 4px;
                position: relative;
                background: white;
            }
            .calendar-month-day:last-child,
            .calendar-month-day:nth-child(7n) {
                border-right: none;
            }
            .calendar-month-day.other-month {
                background: #f8f9fa;
            }
            .calendar-month-day.today {
                background: #e8f0fe;
            }
            .calendar-day-number {
                font-size: 13px;
                color: #3c4043;
                padding: 4px 8px;
                margin-bottom: 2px;
                display: inline-block;
            }
            .calendar-month-day.today .calendar-day-number {
                background: #1a73e8;
                color: white;
                border-radius: 50%;
                font-weight: 500;
            }
            .calendar-event {
                font-size: 12px;
                padding: 2px 6px;
                margin: 1px 0;
                border-radius: 3px;
                cursor: pointer;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                border-left: 3px solid;
                transition: opacity 0.2s, box-shadow 0.2s;
            }
            .calendar-event:hover {
                opacity: 0.9;
                box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            }
            .calendar-week-header {
                display: grid;
                grid-template-columns: 60px repeat(7, 1fr);
                border-bottom: 1px solid #dadce0;
                background: white;
            }
            .calendar-week-time-header {
                border-right: 1px solid #dadce0;
                padding: 8px;
            }
            .calendar-week-day-header {
                padding: 12px 8px;
                text-align: center;
                border-right: 1px solid #dadce0;
            }
            .calendar-week-day-header:last-child {
                border-right: none;
            }
            .calendar-week-day-name {
                font-size: 11px;
                color: #70757a;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            .calendar-week-day-number {
                font-size: 26px;
                color: #3c4043;
                font-weight: 400;
            }
            .calendar-week-day-header.today .calendar-week-day-number {
                color: #1a73e8;
            }
            .calendar-week-grid {
                display: grid;
                grid-template-columns: 60px repeat(7, 1fr);
                position: relative;
            }
            .calendar-week-time-slot {
                height: 60px;
                border-right: 1px solid #dadce0;
                border-bottom: 1px solid #e8eaed;
                position: relative;
            }
            .calendar-week-day-column {
                border-right: 1px solid #dadce0;
                position: relative;
            }
            .calendar-week-day-column:last-child {
                border-right: none;
            }
            .calendar-week-event {
                position: absolute;
                left: 2px;
                right: 2px;
                padding: 4px 6px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                border-left: 3px solid;
                overflow: hidden;
                transition: opacity 0.2s, box-shadow 0.2s;
            }
            .calendar-week-event:hover {
                opacity: 0.9;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            }
            .calendar-more-events {
                font-size: 11px;
                color: #5f6368;
                padding: 2px 6px;
                cursor: pointer;
                margin-top: 2px;
            }
            .calendar-more-events:hover {
                background: rgba(60, 64, 67, 0.08);
                border-radius: 3px;
            }
            [data-theme="dark"] .calendar-container,
            [data-theme="dark"] .calendar-month-day,
            [data-theme="dark"] .calendar-week-day-column {
                background: #1f2937;
                border-color: #374151;
            }
            [data-theme="dark"] .calendar-month-header,
            [data-theme="dark"] .calendar-week-header {
                background: #1f2937;
                border-color: #374151;
            }
            [data-theme="dark"] .calendar-month-day.other-month {
                background: #111827;
            }
            [data-theme="dark"] .calendar-month-day.today {
                background: rgba(26, 115, 232, 0.2);
            }
            [data-theme="dark"] .calendar-day-number {
                color: #f9fafb;
            }
            [data-theme="dark"] .calendar-date-title {
                color: #f9fafb;
            }
            [data-theme="dark"] .calendar-today-btn {
                background: #374151;
                border-color: #4b5563;
                color: #f9fafb;
            }
            [data-theme="dark"] .calendar-today-btn:hover {
                background: #4b5563;
            }
        `;
        document.head.appendChild(style);
    }

    // Configurar event listeners
    setupEventListeners() {
        setTimeout(() => {
            document.getElementById('calendarPrev')?.addEventListener('click', () => {
                this.navigateMonth(-1);
            });

            document.getElementById('calendarNext')?.addEventListener('click', () => {
                this.navigateMonth(1);
            });

            document.getElementById('calendarToday')?.addEventListener('click', () => {
                this.currentDate = new Date();
                this.renderCalendar();
            });

            document.getElementById('calendarViewMonth')?.addEventListener('click', () => {
                this.viewMode = 'month';
                this.updateViewButtons();
                this.renderCalendar();
            });

            document.getElementById('calendarViewWeek')?.addEventListener('click', () => {
                this.viewMode = 'week';
                this.updateViewButtons();
                this.renderCalendar();
            });
        }, 100);
    }

    // Actualizar botones de vista
    updateViewButtons() {
        const monthBtn = document.getElementById('calendarViewMonth');
        const weekBtn = document.getElementById('calendarViewWeek');
        
        if (monthBtn && weekBtn) {
            if (this.viewMode === 'month') {
                monthBtn.classList.add('active');
                weekBtn.classList.remove('active');
            } else {
                weekBtn.classList.add('active');
                monthBtn.classList.remove('active');
            }
        }
    }

    // Navegar meses
    navigateMonth(direction) {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        }
        this.renderCalendar();
    }

    // Renderizar calendario
    renderCalendar() {
        const container = document.getElementById('calendarContainer');
        if (!container) return;

        const currentDateEl = document.getElementById('calendarCurrentDate');
        if (currentDateEl) {
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            currentDateEl.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }

        if (this.viewMode === 'month') {
            container.innerHTML = this.renderMonthView();
        } else {
            container.innerHTML = this.renderWeekView();
        }
    }

    // Renderizar vista mensual estilo Google
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Días de la semana
        const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        let html = `
            <div class="calendar-month-header">
                ${weekDays.map(day => 
                    `<div class="calendar-month-day-header">${day}</div>`
                ).join('')}
            </div>
            <div class="calendar-month-grid">
        `;

        // Días vacíos al inicio (mes anterior)
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevMonthDate = new Date(year, month, -i);
            html += `<div class="calendar-month-day other-month"></div>`;
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayEvents = this.getEventsForDate(date);
            const isToday = this.isToday(date);
            
            html += `
                <div class="calendar-month-day ${isToday ? 'today' : ''}">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-events-container">
                        ${dayEvents.slice(0, 3).map(event => `
                            <div class="calendar-event" 
                                 style="background-color: ${event.color}; border-left-color: ${event.borderColor}; color: white;"
                                 onclick="event.stopPropagation(); window.calendarManager.showEventDetails('${event.id}')"
                                 title="${event.title}">
                                ${event.title}
                            </div>
                        `).join('')}
                        ${dayEvents.length > 3 ? `
                            <div class="calendar-more-events" 
                                 onclick="event.stopPropagation(); window.calendarManager.showAllEventsForDate(new Date(${date.getTime()}))">
                                +${dayEvents.length - 3} más
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // Calcular días restantes para completar la grid
        const totalCells = startingDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells; // 6 semanas * 7 días
        
        for (let i = 1; i <= remainingCells; i++) {
            html += `<div class="calendar-month-day other-month"></div>`;
        }

        html += '</div>';
        return html;
    }

    // Renderizar vista semanal estilo Google
    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDays = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            weekDays.push(date);
        }

        const weekDayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        let html = `
            <div class="calendar-week-header">
                <div class="calendar-week-time-header"></div>
                ${weekDays.map((day, idx) => {
                    const isToday = this.isToday(day);
                    return `
                        <div class="calendar-week-day-header ${isToday ? 'today' : ''}">
                            <div class="calendar-week-day-name">${weekDayNames[idx]}</div>
                            <div class="calendar-week-day-number">${day.getDate()}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="calendar-week-grid">
                ${hours.map(hour => `
                    <div class="calendar-week-time-slot">
                        <div style="position: absolute; left: 8px; top: -8px; font-size: 10px; color: #70757a;">
                            ${hour.toString().padStart(2, '0')}:00
                        </div>
                    </div>
                    ${weekDays.map(day => `
                        <div class="calendar-week-day-column" data-date="${day.toISOString()}"></div>
                    `).join('')}
                `).join('')}
            </div>
        `;

        // Agregar eventos posicionados
        setTimeout(() => {
            weekDays.forEach((day, dayIdx) => {
                const dayEvents = this.getEventsForDate(day);
                const dayColumn = document.querySelector(`.calendar-week-day-column[data-date="${day.toISOString()}"]`);
                
                if (dayColumn) {
                    dayEvents.forEach(event => {
                        const eventEl = document.createElement('div');
                        const startHour = event.start.getHours();
                        const startMin = event.start.getMinutes();
                        const top = (startHour * 60 + startMin) * (60 / 60); // 60px por hora
                        const duration = event.end ? 
                            ((event.end - event.start) / (1000 * 60)) : 60; // minutos
                        const height = duration * (60 / 60); // 60px por hora
                        
                        eventEl.className = 'calendar-week-event';
                        eventEl.style.cssText = `
                            top: ${top}px;
                            height: ${height}px;
                            background-color: ${event.color};
                            border-left-color: ${event.borderColor};
                            color: white;
                        `;
                        eventEl.textContent = event.title;
                        eventEl.title = event.title;
                        eventEl.onclick = (e) => {
                            e.stopPropagation();
                            this.showEventDetails(event.id);
                        };
                        
                        dayColumn.appendChild(eventEl);
                    });
                }
            });
        }, 10);

        return html;
    }

    // Obtener inicio de semana
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    // Obtener eventos para una fecha
    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === date.toDateString();
        });
    }

    // Verificar si es hoy
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    // Mostrar detalles del evento
    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.style.zIndex = '10000';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" style="background-color: var(--bg-primary);">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 rounded" style="background-color: ${event.color};"></div>
                        <h3 class="text-xl font-medium" style="color: var(--text-primary);">${event.title}</h3>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 mt-0.5" style="color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <div>
                            <div class="text-sm font-medium" style="color: var(--text-primary);">
                                ${event.start.toLocaleDateString('es-ES', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </div>
                            ${event.end ? `
                                <div class="text-xs mt-1" style="color: var(--text-secondary);">
                                    Hasta: ${event.end.toLocaleDateString('es-ES')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5" style="color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        <span class="text-sm px-3 py-1 rounded-full text-xs font-medium" 
                              style="background-color: ${event.color}; color: white;">
                            ${event.type === 'assignment' ? 'Asignación' : event.type === 'onboarding' ? 'Onboarding' : 'Offboarding'}
                        </span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Mostrar todos los eventos de una fecha
    showAllEventsForDate(date) {
        const events = this.getEventsForDate(date);
        if (events.length === 0) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.style.zIndex = '10000';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" style="background-color: var(--bg-primary);">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-medium" style="color: var(--text-primary);">
                        ${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-2">
                    ${events.map(event => `
                        <div class="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" 
                             style="border-left: 3px solid ${event.borderColor};"
                             onclick="this.closest('.fixed').remove(); window.calendarManager.showEventDetails('${event.id}')">
                            <div class="font-medium text-sm" style="color: var(--text-primary);">${event.title}</div>
                            <div class="text-xs mt-1" style="color: var(--text-secondary);">
                                ${event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

// Inicializar solo cuando el usuario esté autenticado
function initializeCalendarManager() {
    if (!window.calendarManager && window.auth && window.auth.isAuthenticated()) {
        console.log('[CalendarManager] Inicializando después de autenticación...');
        window.calendarManager = new CalendarManager();
    }
}

// NO inicializar automáticamente - solo después del login
// Escuchar evento de autenticación
window.addEventListener('userAuthenticated', () => {
    console.log('[CalendarManager] Evento userAuthenticated recibido');
    initializeCalendarManager();
});

// También intentar inicializar si ya está autenticado al cargar (después de un delay)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.auth && window.auth.isAuthenticated()) {
                initializeCalendarManager();
            }
        }, 2000);
    });
} else {
    setTimeout(() => {
        if (window.auth && window.auth.isAuthenticated()) {
            initializeCalendarManager();
        }
    }, 2000);
}
