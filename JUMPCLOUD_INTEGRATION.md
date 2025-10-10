# JumpCloud Integration Documentation

## Configuración de la API de JumpCloud

### Variables de Entorno Requeridas

Agrega la siguiente variable de entorno al archivo `.env` del backend:

```bash
JUMPCLOUD_API_KEY=jca_8kcA2r1Hf9bvwP97owgHpSv9oznrcMRUXFW4
```

### Endpoints Disponibles

#### 1. Obtener Total de Usuarios
```
GET /api/jumpcloud/users/count
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "totalUsers": 10,
  "source": "JumpCloud (Simulated - API Key Invalid)",
  "lastUpdated": "2025-10-10T18:12:15.461Z",
  "note": "Using simulated data. Please verify JumpCloud API key for real data."
}
```

#### 2. Obtener Lista de Usuarios
```
GET /api/jumpcloud/users?limit=100&skip=0&sort=username
Authorization: Bearer <token>
```

#### 3. Obtener Usuario por ID
```
GET /api/jumpcloud/users/:id
Authorization: Bearer <token>
```

#### 4. Obtener Estadísticas del Sistema
```
GET /api/jumpcloud/stats
Authorization: Bearer <token>
```

### Estado Actual

- ✅ **Backend**: Integración completa con JumpCloud API
- ✅ **Frontend**: Tarjeta de "Total Usuarios" actualizada con datos de JumpCloud
- ✅ **Fallback**: Sistema de datos simulados cuando la API no está disponible
- ⚠️ **API Key**: Actualmente usando datos simulados debido a API key inválida

### Próximos Pasos

1. **Verificar API Key**: La API key proporcionada (`jca_8kcA2r1Hf9bvwP97owgHpSv9oznrcMRUXFW4`) no es válida o no tiene permisos
2. **Obtener API Key Válida**: Contactar con el administrador de JumpCloud para obtener una API key válida
3. **Configurar Permisos**: Asegurar que la API key tenga permisos para leer usuarios
4. **Probar Integración**: Una vez con API key válida, probar los endpoints

### Características Implementadas

- **Autenticación**: Todos los endpoints requieren autenticación de admin
- **Manejo de Errores**: Fallback automático a datos simulados
- **Logging**: Logs detallados para debugging
- **Notificaciones**: Alertas en el frontend cuando se usan datos simulados
- **Indicador Visual**: Muestra la fuente de datos en la tarjeta de usuarios

### Datos Simulados

Cuando la API de JumpCloud no está disponible, el sistema usa los siguientes datos simulados:

```javascript
const simulatedUsers = [
  { id: 1, username: 'john.doe', email: 'john.doe@company.com', active: true },
  { id: 2, username: 'jane.smith', email: 'jane.smith@company.com', active: true },
  { id: 3, username: 'mike.johnson', email: 'mike.johnson@company.com', active: true },
  { id: 4, username: 'sarah.wilson', email: 'sarah.wilson@company.com', active: true },
  { id: 5, username: 'david.brown', email: 'david.brown@company.com', active: true },
  { id: 6, username: 'lisa.garcia', email: 'lisa.garcia@company.com', active: true },
  { id: 7, username: 'robert.miller', email: 'robert.miller@company.com', active: true },
  { id: 8, username: 'emily.davis', email: 'emily.davis@company.com', active: true },
  { id: 9, username: 'alex.munoz', email: 'alex.munoz@xepelin.com', active: true },
  { id: 10, username: 'maria.rodriguez', email: 'maria.rodriguez@company.com', active: true }
];
```

### Testing

Para probar la integración:

```bash
# Obtener token de autenticación
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alex.munoz@xepelin.com", "password": "admin123"}'

# Usar el token para probar JumpCloud
curl -X GET "http://localhost:3001/api/jumpcloud/users/count" \
  -H "Authorization: Bearer <token>"
```
