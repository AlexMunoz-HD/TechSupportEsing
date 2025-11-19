# 🔗 Integración con Slack y HelloSign

Esta guía explica cómo configurar las integraciones con Slack y HelloSign (Dropbox Sign) para enviar notificaciones automáticas y solicitar firmas electrónicas cuando se generan documentos de onboarding.

## 📋 Características

- ✅ **Notificaciones automáticas en Slack** cuando se genera un documento de onboarding
- ✅ **Solicitud de firma electrónica** a través de HelloSign (Dropbox Sign)
- ✅ **Link directo para firmar** incluido en el mensaje de Slack
- ✅ **Mensajes personalizados** con información del empleado
- ✅ **Manejo de errores** sin interrumpir el flujo principal

## 🚀 Configuración

### 1. Configurar Slack Webhook

#### Paso 1: Crear Incoming Webhook en Slack

1. Ve a tu workspace de Slack
2. Navega a: **Apps** → **Incoming Webhooks**
3. O visita directamente: https://api.slack.com/apps
4. Crea una nueva app o selecciona una existente
5. Ve a **Incoming Webhooks** y actívalo
6. Haz clic en **Add New Webhook to Workspace**
7. Selecciona el canal donde quieres recibir las notificaciones
8. Copia la **Webhook URL** que Slack te proporciona

#### Paso 2: Configurar Variable de Entorno

Agrega la siguiente variable de entorno en tu archivo `.env` o en tu servidor:

```env
SLACK_WEBHOOK_URL=tu_webhook_url_aqui
```

**Nota:** Reemplaza `tu_webhook_url_aqui` con tu webhook URL real obtenida de Slack.

### 2. Configurar HelloSign (Dropbox Sign)

#### Paso 1: Crear Cuenta en HelloSign

1. Ve a https://www.hellosign.com/ (ahora Dropbox Sign)
2. Crea una cuenta gratuita (plan gratuito incluye 3 documentos/mes)
3. Ve a **Settings** → **API**
4. Genera una **API Key**
5. Copia tu **API Key**

#### Paso 2: Obtener Client ID (Opcional pero recomendado)

1. En la misma sección de API, también encontrarás tu **Client ID**
2. Copia el **Client ID**

#### Paso 3: Configurar Variables de Entorno

Agrega las siguientes variables de entorno:

```env
HELLOSIGN_API_KEY=tu_api_key_aqui
HELLOSIGN_CLIENT_ID=tu_client_id_aqui
```

**Nota:** En modo desarrollo, HelloSign usará el modo "test" automáticamente, que no cuenta contra tu límite mensual.

## 📝 Cómo Funciona

### Flujo Automático

1. **Usuario genera documento de onboarding** desde la interfaz
2. **Sistema genera el PDF** del documento
3. **Si HelloSign está configurado:**
   - El PDF se sube a HelloSign
   - Se crea una solicitud de firma
   - Se genera un link único para firmar
4. **Si Slack está configurado:**
   - Se envía un mensaje a Slack con:
     - Información del empleado
     - Link directo para firmar el documento
     - Mensaje personalizado

### Ejemplo de Mensaje en Slack

```
📝 Documento de Onboarding Listo para Firma

Empleado: Juan Pérez
Email: juan.perez@empresa.com

El documento de onboarding ha sido generado y está listo para ser firmado.

*Firma el documento aquí 👈* (link clickeable)

💡 Haz clic en el enlace de arriba para acceder a la plataforma de firma 
electrónica y completar el proceso.
```

## 🔧 Endpoints de API

### Verificar Estado de Integraciones

```http
GET /api/integrations/status
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "slack": {
    "configured": true,
    "status": "active"
  },
  "hellosign": {
    "configured": true,
    "status": "active"
  }
}
```

### Probar Integración con Slack

```http
POST /api/integrations/slack/test
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Mensaje de prueba enviado a Slack exitosamente"
}
```

### Verificar Estado de Solicitud de Firma

```http
GET /api/integrations/signature/:signatureRequestId/status
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "status": "signed",
  "isComplete": true,
  "details": { ... }
}
```

### Descargar Documento Firmado

```http
GET /api/integrations/signature/:signatureRequestId/download
Authorization: Bearer <token>
```

Descarga el PDF firmado.

## 🎯 Casos de Uso

### Caso 1: Solo Slack (sin firma electrónica)

Si solo configuras Slack sin HelloSign:
- Se enviará un mensaje simple indicando que el documento fue generado
- No habrá link de firma

### Caso 2: Slack + HelloSign (recomendado)

Si configuras ambas:
- Se crea la solicitud de firma en HelloSign
- Se envía mensaje a Slack con link directo para firmar
- El empleado puede firmar directamente desde Slack

### Caso 3: Solo HelloSign (sin Slack)

Si solo configuras HelloSign:
- Se crea la solicitud de firma
- HelloSign envía el email directamente al empleado
- No hay notificación en Slack

## 🔒 Seguridad

- Las API keys se almacenan en variables de entorno (nunca en el código)
- Los webhooks de Slack son únicos y seguros
- HelloSign usa autenticación básica con API key
- Todas las rutas requieren autenticación JWT y rol de admin

## 🐛 Troubleshooting

### Slack no envía mensajes

1. Verifica que `SLACK_WEBHOOK_URL` esté configurada correctamente
2. Prueba el endpoint `/api/integrations/slack/test`
3. Revisa los logs del servidor para ver errores
4. Verifica que el webhook no haya sido revocado en Slack

### HelloSign no funciona

1. Verifica que `HELLOSIGN_API_KEY` esté configurada
2. Verifica que el archivo PDF existe antes de subirlo
3. Revisa los logs para ver errores específicos de la API
4. Verifica que no hayas excedido el límite del plan gratuito (3 docs/mes)

### El link de firma no aparece en Slack

1. Verifica que HelloSign esté configurado correctamente
2. Verifica que la solicitud de firma se haya creado exitosamente
3. Revisa los logs para ver si hay errores en la creación

## 📚 Recursos

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [HelloSign API Documentation](https://developers.hellosign.com/api)
- [HelloSign Pricing](https://www.hellosign.com/pricing)

## 💡 Mejoras Futuras

- [ ] Integración con Microsoft Teams
- [ ] Webhooks de HelloSign para notificar cuando se firma
- [ ] Recordatorios automáticos si no se firma en X días
- [ ] Dashboard de documentos pendientes de firma
- [ ] Múltiples firmantes (empleado + manager)

---

**Nota:** Las integraciones son opcionales. Si no están configuradas, el sistema funcionará normalmente sin ellas.

