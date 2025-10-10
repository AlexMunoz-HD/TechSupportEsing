# TechSupport - Dashboard de Orquestación y Auditoría

Un sistema completo de gestión y auditoría con una interfaz moderna estilo SaaS para la orquestación de assets y usuarios.

## 🚀 Características Principales

### Dashboard en Tiempo Real
- **Alertas de Nuevos Usuarios**: Detección automática de nuevos empleados desde Hibob
- **Estadísticas en Vivo**: Métricas de usuarios, assets y actividad
- **Gráficos Interactivos**: Visualización de datos por ubicación y actividad
- **Notificaciones Push**: Sistema de notificaciones en tiempo real

### Gestión de Assets
- **Asignación Automática**: Sistema completo de asignación de assets a empleados
- **Generación de Documentos**: Creación automática de documentos de asignación en formato DOCX
- **Seguimiento de Historial**: Registro completo de asignaciones y devoluciones
- **Filtros Avanzados**: Búsqueda y filtrado por estado, ubicación y categoría

### Sistema de Auditoría
- **Log Completo**: Registro de todas las acciones del sistema
- **Filtros y Búsqueda**: Herramientas avanzadas para consultar registros
- **Exportación**: Exportación de logs en formato CSV
- **Estadísticas**: Análisis de actividad y tendencias

### Seguridad y Roles
- **Autenticación JWT**: Sistema seguro de autenticación
- **Roles de Usuario**: Admin y Auditor con permisos diferenciados
- **Segmentación Geográfica**: Soporte para MX, CL y REMOTO
- **Auditoría de Accesos**: Registro completo de accesos y acciones

## 🏗️ Arquitectura

### Backend (Node.js + Express)
- **API RESTful**: Endpoints para todas las funcionalidades
- **Base de Datos MySQL**: Persistencia robusta con relaciones
- **Socket.IO**: Comunicación en tiempo real
- **Generación de Documentos**: Creación automática de documentos Word
- **Middleware de Seguridad**: Autenticación, rate limiting y CORS

### Frontend (HTML + JavaScript + Tailwind CSS)
- **Diseño SaaS Moderno**: Interfaz limpia y profesional
- **Responsive Design**: Compatible con todos los dispositivos
- **Tiempo Real**: Actualizaciones instantáneas via WebSocket
- **Componentes Modulares**: Arquitectura escalable y mantenible

### Base de Datos (MySQL)
- **Tablas Principales**: users, assets, asset_assignments, audit_log
- **Relaciones**: Claves foráneas y integridad referencial
- **Índices**: Optimización para consultas rápidas
- **Datos de Prueba**: Usuarios y assets de ejemplo

## 🐳 Instalación con Docker

### Prerrequisitos
- Docker
- Docker Compose

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd TechSupportEsing
```

2. **Iniciar los servicios**
```bash
docker-compose up -d
```

3. **Verificar que los servicios estén corriendo**
```bash
docker-compose ps
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Base de datos: localhost:3306

### Credenciales por Defecto

**Usuarios de Prueba:**
- **Admin**: `admin` / `admin123`
- **Auditor Chile**: `auditor1` / `admin123`
- **Auditor Remoto**: `auditor2` / `admin123`

**Base de Datos:**
- Host: `localhost`
- Puerto: `3306`
- Base de datos: `techsupport_db`
- Usuario: `techsupport_user`
- Contraseña: `techsupport_pass`

## 📊 Funcionalidades Detalladas

### Dashboard Principal
- **Tarjetas de Estadísticas**: Usuarios totales, assets disponibles/asignados, actividad del día
- **Gráfico de Ubicaciones**: Distribución de usuarios por país (MX, CL, REMOTO)
- **Actividad Reciente**: Últimas acciones del sistema
- **Asignaciones Recientes**: Assets asignados recientemente
- **Alertas de Hibob**: Notificaciones de nuevos usuarios

### Gestión de Assets
- **Crear Assets**: Formulario completo con validaciones
- **Asignar Assets**: Selección de usuario y generación de documento
- **Devolver Assets**: Proceso de devolución con notas
- **Historial Completo**: Seguimiento de todas las asignaciones
- **Filtros Avanzados**: Por estado, ubicación, categoría y búsqueda de texto

### Sistema de Auditoría
- **Log Completo**: Todas las acciones del sistema registradas
- **Filtros Múltiples**: Por acción, ubicación, fecha y usuario
- **Paginación**: Navegación eficiente de grandes volúmenes de datos
- **Exportación CSV**: Descarga de registros para análisis externo
- **Estadísticas**: Resúmenes y tendencias de actividad

### Generación de Documentos
- **Plantilla Profesional**: Documentos de asignación en formato Word
- **Datos Automáticos**: Relleno automático con información del asset y usuario
- **Términos y Condiciones**: Cláusulas estándar incluidas
- **Firmas**: Espacios para firmas de empleado y supervisor
- **Almacenamiento**: Archivos guardados en el servidor para descarga

## 🔧 Configuración y Personalización

### Variables de Entorno
```env
# Backend
NODE_ENV=development
DB_HOST=db
DB_PORT=3306
DB_NAME=techsupport_db
DB_USER=techsupport_user
DB_PASSWORD=techsupport_pass
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Personalización de Estilos
El frontend utiliza Tailwind CSS con configuración personalizada:
- Colores primarios: Azul (#3B82F6)
- Diseño minimalista estilo Apple
- Componentes reutilizables
- Responsive design

### Extensión del Sistema
- **Nuevas Integraciones**: Fácil agregar nuevos sistemas (Snipe-IT, Hibob, etc.)
- **Nuevos Roles**: Sistema de permisos extensible
- **Nuevas Ubicaciones**: Soporte para más países/regiones
- **Nuevos Tipos de Assets**: Categorías personalizables

## 🚀 Desarrollo

### Estructura del Proyecto
```
TechSupportEsing/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── database/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── js/
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Comandos de Desarrollo
```bash
# Desarrollo del backend
cd backend
npm install
npm run dev

# Desarrollo del frontend
cd frontend
# Servir archivos estáticos o usar live server
```

### API Endpoints
- `POST /api/auth/login` - Autenticación
- `GET /api/dashboard/stats` - Estadísticas del dashboard
- `GET /api/assets` - Listar assets
- `POST /api/assets/:id/assign` - Asignar asset
- `GET /api/audit` - Logs de auditoría
- `POST /api/dashboard/simulate-hibob-user` - Simular nuevo usuario

## 🔒 Seguridad

### Medidas Implementadas
- **JWT Tokens**: Autenticación segura con expiración
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración segura de origen cruzado
- **Helmet**: Headers de seguridad HTTP
- **Validación**: Sanitización de inputs
- **Auditoría**: Registro completo de accesos

### Mejores Prácticas
- Cambiar JWT_SECRET en producción
- Usar HTTPS en producción
- Configurar firewall apropiado
- Monitoreo de logs de seguridad
- Backup regular de base de datos

## 📈 Monitoreo y Mantenimiento

### Logs del Sistema
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Backup de Base de Datos
```bash
# Crear backup
docker-compose exec db mysqldump -u techsupport_user -p techsupport_db > backup.sql

# Restaurar backup
docker-compose exec -T db mysql -u techsupport_user -p techsupport_db < backup.sql
```

### Actualizaciones
```bash
# Actualizar imágenes
docker-compose pull
docker-compose up -d

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de la API

---

**TechSupport Dashboard** - Sistema profesional de orquestación y auditoría desarrollado con tecnologías modernas y mejores prácticas de seguridad.
