# Datos Mock para Demostración

## Descripción
Se han agregado datos mock a todas las secciones principales de la aplicación para permitir la visualización completa de la interfaz sin necesidad de datos reales de la base de datos.

## Secciones con Datos Mock

### 1. Dashboard (`/dashboard/stats`)
**Datos incluidos:**
- Estadísticas de usuarios por ubicación (MX: 45, CL: 32, REMOTO: 28)
- Estadísticas de activos por estado (available: 25, assigned: 78, maintenance: 5, retired: 12)
- Logs recientes de auditoría (8 registros)
- Asignaciones activas (3 registros)
- Alertas de nuevos usuarios (1 registro)

### 2. Offboarding (`/offboarding`)
**Datos incluidos:**
- 5 procesos de offboarding con diferentes estados:
  - Carlos Mendoza (IT, En Progreso, 65%)
  - Ana Rodríguez (HR, Pendiente, 0%)
  - Miguel Torres (Sales, Completado, 100%)
  - Laura Jiménez (Finance, En Progreso, 40%)
  - Roberto Silva (Operations, Pendiente, 0%)

### 3. Empleados de Jira (`/offboarding/jira-employees`)
**Datos incluidos:**
- 6 empleados pendientes de offboarding:
  - Juan Pérez (IT, Software Developer)
  - María García (HR, HR Specialist)
  - Pedro López (Sales, Account Manager)
  - Sofia Martínez (Finance, Financial Analyst)
  - Diego Herrera (Operations, Operations Coordinator)
  - Carmen Vega (IT, DevOps Engineer)

### 4. Onboarding (`/onboarding`)
**Datos incluidos:**
- 5 procesos de onboarding:
  - Sofia Martínez (Finance, En Progreso, 75%)
  - Diego Herrera (Operations, Pendiente, 0%)
  - Carmen Vega (IT, Completado, 100%)
  - Alejandro Ramírez (IT, En Progreso, 50%)
  - Valentina Torres (Marketing, Pendiente, 0%)

### 5. Empleados (`/employees/new-hires`)
**Datos incluidos:**
- 5 nuevos empleados de los últimos 30 días:
  - Sofia Martínez (Finance, CL)
  - Diego Herrera (Operations, MX)
  - Carmen Vega (IT, REMOTO)
  - Alejandro Ramírez (IT, MX)
  - Valentina Torres (Marketing, CL)

### 6. Assets (`/assets`)
**Datos incluidos:**
- 8 activos con diferentes estados:
  - MacBook Pro 16" (Asignado a Juan Pérez)
  - Dell Monitor 27" (Asignado a María García)
  - iPhone 14 (Asignado a Pedro López)
  - Dell Laptop 15" (Disponible)
  - Samsung Monitor 24" (En Mantenimiento)
  - iPad Pro 12.9" (Asignado a Laura Jiménez)
  - MacBook Air 13" (Retirado)
  - Dell Desktop PC (Disponible)

### 7. Audit Logs (`/dashboard/audit-logs`)
**Datos incluidos:**
- 8 registros de auditoría con diferentes acciones:
  - USER_CREATED
  - ASSET_ASSIGNED
  - OFFBOARDING_STARTED
  - ASSET_RETURNED
  - EXIT_LETTER_CREATED
  - USER_LOGIN
  - ASSET_MAINTENANCE
  - ONBOARDING_COMPLETED

## Características de los Datos Mock

### Consistencia
- Los nombres de empleados son consistentes entre secciones
- Las ubicaciones (MX, CL, REMOTO) son coherentes
- Los departamentos están alineados entre diferentes secciones

### Realismo
- Fechas realistas y progresivas
- Estados de progreso variados (0%, 40%, 50%, 65%, 75%, 100%)
- Diferentes tipos de activos y categorías
- Razones de offboarding variadas

### Funcionalidad
- Los filtros funcionan correctamente con los datos mock
- La paginación está implementada
- Los estados y categorías son consistentes con la UI

## Cómo Usar los Datos Mock

### Para Desarrollo
1. Los datos mock se cargan automáticamente al acceder a cada sección
2. No se requiere configuración adicional
3. Los filtros y búsquedas funcionan normalmente

### Para Testing
1. Puedes probar todas las funcionalidades de la UI
2. Los botones y acciones están habilitados
3. Las notificaciones funcionan correctamente

### Para Demostración
1. La interfaz se ve completamente funcional
2. Los datos son realistas y profesionales
3. Se puede mostrar el flujo completo de la aplicación

## Transición a Datos Reales

Cuando estés listo para usar datos reales:

1. **Comentar los datos mock** en cada archivo de ruta
2. **Descomentar las consultas SQL** originales
3. **Configurar la base de datos** con las tablas necesarias
4. **Probar la conectividad** con la base de datos

### Ejemplo de Transición:
```javascript
// Comentar esto:
const mockData = { ... };
res.json(mockData);

// Descomentar esto:
const data = await executeQuery(`SELECT ...`);
res.json(data);
```

## Archivos Modificados

- `backend/routes/dashboard.js` - Estadísticas y logs de auditoría
- `backend/routes/offboarding.js` - Procesos de offboarding y empleados de Jira
- `backend/routes/onboarding.js` - Procesos de onboarding
- `backend/routes/employees.js` - Nuevos empleados
- `backend/routes/assets.js` - Inventario de activos

## Notas Importantes

- Los datos mock están diseñados para ser realistas y profesionales
- Todos los IDs y referencias son consistentes entre secciones
- Las fechas están en formato ISO 8601 para compatibilidad
- Los datos incluyen todos los campos necesarios para la UI
- Los filtros y búsquedas funcionan correctamente con los datos mock
