# Integración con Jira para Offboarding

## Descripción
Esta funcionalidad permite obtener empleados pendientes de offboarding desde Jira a través de N8N y crear cartas de salida automáticamente.

## Flujo de la Funcionalidad

### 1. Obtención de Empleados desde Jira
- **Endpoint**: `GET /offboarding/jira-employees`
- **Fuente**: N8N obtiene datos de Jira
- **Datos**: Lista de empleados que requieren offboarding

### 2. Interfaz de Usuario
- **Nueva Sección**: "Empleados Jira" en el menú de navegación
- **Tabla**: Muestra empleados pendientes con información básica
- **Estadísticas**: Total de empleados y empleados pendientes

### 3. Creación de Carta de Salida
- **Botón**: "Crear Carta" para cada empleado
- **Endpoint**: `POST /offboarding/create-exit-letter`
- **Proceso**: 
  1. Obtiene datos del empleado
  2. Consulta activos en Snipe IT
  3. Envía datos a N8N
  4. N8N genera documento y lo envía a Hibob eSign

## Estructura de Datos

### Empleado de Jira
```json
{
  "id": "jira-001",
  "name": "Juan Pérez",
  "email": "juan.perez@company.com",
  "department": "IT",
  "position": "Software Developer",
  "lastWorkingDay": "2024-01-15",
  "reason": "Resignation",
  "jiraTicket": "OFF-2024-001",
  "status": "pending_offboarding"
}
```

### Datos para Carta de Salida
```json
{
  "employee": {
    "id": "jira-001",
    "name": "Juan Pérez",
    "email": "juan.perez@company.com",
    "department": "IT",
    "position": "Software Developer",
    "lastWorkingDay": "2024-01-15",
    "reason": "Resignation",
    "jiraTicket": "OFF-2024-001"
  },
  "assets": [
    {
      "asset_tag": "LAPTOP-001",
      "name": "MacBook Pro 16\"",
      "category": "Laptop",
      "assigned_date": "2023-01-15",
      "location": "Mexico City"
    }
  ],
  "timestamp": "2024-01-10T10:30:00.000Z",
  "requestedBy": 1,
  "requestedByName": "Admin User"
}
```

## Archivos Modificados

### Backend
- `backend/routes/offboarding.js`: Nuevos endpoints para Jira y cartas de salida

### Frontend
- `frontend/js/offboarding.js`: Funcionalidad para manejar empleados de Jira
- `frontend/js/app.js`: Carga de datos para la nueva sección
- `frontend/index.html`: Nueva sección de UI y enlaces de navegación

## Próximos Pasos

### Integración Real con N8N
1. **Webhook de Jira**: Configurar webhook en N8N para recibir datos de Jira
2. **API de Snipe IT**: Implementar consulta real a Snipe IT para obtener activos
3. **Hibob eSign**: Configurar envío real de documentos a Hibob

### Mejoras Futuras
1. **Filtros**: Agregar filtros por departamento, fecha, etc.
2. **Notificaciones**: Sistema de notificaciones cuando se crean cartas
3. **Historial**: Tracking del estado de las cartas de salida
4. **Plantillas**: Diferentes plantillas según el tipo de salida

## Configuración de N8N

### Workflow Sugerido
1. **Trigger**: Webhook de Jira cuando se crea ticket de offboarding
2. **Transform**: Formatear datos del empleado
3. **Store**: Guardar en base de datos local
4. **Notify**: Notificar a la aplicación web

### Workflow para Carta de Salida
1. **Trigger**: Webhook desde la aplicación web
2. **Snipe IT**: Consultar activos del empleado
3. **Template**: Generar documento usando plantilla
4. **Hibob**: Enviar documento para firma electrónica
5. **Response**: Confirmar creación del documento

## Consideraciones de Seguridad
- Autenticación requerida para todos los endpoints
- Logging de auditoría para todas las acciones
- Validación de datos de entrada
- Sanitización de datos antes de enviar a servicios externos
