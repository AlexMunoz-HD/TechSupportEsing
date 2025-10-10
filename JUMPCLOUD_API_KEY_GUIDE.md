# 🔑 Guía para Obtener API Key Válida de JumpCloud

## ❌ Problema Actual
La API key `jca_8kcA2r1Hf9bvwP97owgHpSv9oznrcMRUXFW4` **NO ES VÁLIDA** o no tiene permisos.

**Estado del sistema:**
- ✅ Formato de API key: Válido (empieza con `jca_` y tiene 40+ caracteres)
- ❌ Permisos: La API key no tiene acceso a los usuarios
- 🔄 Modo actual: Datos simulados (10 usuarios)

## 📋 Pasos para Obtener API Key Válida

### 1. Acceder a JumpCloud Console
1. Ve a [console.jumpcloud.com](https://console.jumpcloud.com)
2. Inicia sesión con tu cuenta de administrador

### 2. Generar Nueva API Key
1. Haz clic en tu **avatar/iniciales** en la esquina superior derecha
2. Selecciona **"API Key Management"** o **"Mi clave API"**
3. Si ya tienes una API key, haz clic en **"Generar nueva clave API"**
4. Si no tienes ninguna, haz clic en **"Crear nueva clave API"**

### 3. Configurar Permisos
**IMPORTANTE:** Asegúrate de que la API key tenga estos permisos:
- ✅ **Read Users** (Leer usuarios)
- ✅ **Read System Users** (Leer usuarios del sistema)
- ✅ **Read Groups** (Leer grupos) - opcional pero recomendado

### 4. Copiar la Nueva API Key
1. Copia la nueva API key (debería empezar con `jca_` y ser de 40+ caracteres)
2. **IMPORTANTE:** Guárdala en un lugar seguro, solo se muestra una vez

### 5. Configurar en el Sistema

#### Opción A: Variable de Entorno (Recomendado)
```bash
# En el archivo .env del backend
JUMPCLOUD_API_KEY=tu_nueva_api_key_aqui
```

#### Opción B: Docker Compose
```yaml
# En docker-compose.yml, agregar al servicio backend:
environment:
  - JUMPCLOUD_API_KEY=tu_nueva_api_key_aqui
```

### 6. Reiniciar el Servicio
```bash
cd /Users/alex.munoz/TechSupportEsing
docker-compose restart backend
```

### 7. Verificar la Configuración
```bash
# Probar configuración
curl -X GET "http://localhost:3001/api/jumpcloud/config" \
  -H "Authorization: Bearer <tu_token>"

# Probar usuarios
curl -X GET "http://localhost:3001/api/jumpcloud/users/count" \
  -H "Authorization: Bearer <tu_token>"
```

## 🧪 Testing Manual de la API Key

Antes de configurar en el sistema, prueba la API key directamente:

```bash
# Probar con curl
curl --request GET \
  --url 'https://console.jumpcloud.com/api/v2/users' \
  --header 'Accept: application/json' \
  --header 'x-api-key: TU_NUEVA_API_KEY_AQUI'
```

**Respuesta esperada si es válida:**
```json
{
  "results": [
    {
      "id": "usuario_id",
      "username": "usuario",
      "email": "usuario@empresa.com",
      "firstname": "Nombre",
      "lastname": "Apellido",
      "activated": true
    }
  ],
  "totalCount": 123
}
```

**Respuesta si NO es válida:**
```json
{"message":"Not Found"}
```

## 🔧 Solución Rápida Temporal

Si necesitas datos reales inmediatamente, puedes:

1. **Usar datos de tu base de datos local:**
   ```sql
   SELECT COUNT(*) as total_users FROM users WHERE is_active = 1;
   ```

2. **Modificar el endpoint para usar datos locales:**
   - Cambiar `/api/jumpcloud/users/count` para que consulte la tabla `users` local
   - Esto mostraría los usuarios reales de tu sistema TechSupport

## 📞 Contacto de Soporte

Si tienes problemas para obtener la API key:
1. **JumpCloud Support:** [support.jumpcloud.com](https://support.jumpcloud.com)
2. **Documentación API:** [jumpcloud.com/support/jumpcloud-apis](https://jumpcloud.com/support/jumpcloud-apis)

## ✅ Verificación Final

Una vez configurada la API key válida, deberías ver:
- ✅ Dashboard mostrando número real de usuarios de JumpCloud
- ✅ Fuente: "JumpCloud" (sin "Simulated" o "Invalid")
- ✅ Sin notificaciones de error en el frontend
- ✅ Datos actualizados en tiempo real

---

**Nota:** El sistema está completamente preparado para usar datos reales de JumpCloud. Solo necesitas una API key válida con los permisos correctos.
