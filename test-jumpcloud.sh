#!/bin/bash

# Script para probar la configuración de JumpCloud API
# Uso: ./test-jumpcloud.sh

echo "🔍 Probando configuración de JumpCloud API..."
echo "=============================================="

# Obtener token de autenticación
echo "1. Obteniendo token de autenticación..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alex.munoz@xepelin.com", "password": "admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Error: No se pudo obtener el token de autenticación"
    echo "Respuesta: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."

# Probar configuración
echo ""
echo "2. Verificando configuración de API..."
CONFIG_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/jumpcloud/config" \
  -H "Authorization: Bearer $TOKEN")

echo "$CONFIG_RESPONSE" | jq .

# Probar endpoint de usuarios
echo ""
echo "3. Probando endpoint de usuarios..."
USERS_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/jumpcloud/users/count" \
  -H "Authorization: Bearer $TOKEN")

echo "$USERS_RESPONSE" | jq .

# Probar endpoint de sistemas
echo ""
echo "4. Probando endpoint de sistemas..."
SYSTEMS_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/jumpcloud/systems/count" \
  -H "Authorization: Bearer $TOKEN")

echo "$SYSTEMS_RESPONSE" | jq .

# Verificar si hay errores
USERS_ERROR=$(echo "$USERS_RESPONSE" | jq -r '.error // empty')
SYSTEMS_ERROR=$(echo "$SYSTEMS_RESPONSE" | jq -r '.error // empty')
USERS_SOURCE=$(echo "$USERS_RESPONSE" | jq -r '.source // empty')
SYSTEMS_SOURCE=$(echo "$SYSTEMS_RESPONSE" | jq -r '.source // empty')

echo ""
echo "📊 Resumen:"
echo "==========="
echo "Usuarios - Fuente: $USERS_SOURCE"
echo "Sistemas - Fuente: $SYSTEMS_SOURCE"

if [ -n "$USERS_ERROR" ] || [ -n "$SYSTEMS_ERROR" ]; then
    echo "❌ Error detectado:"
    [ -n "$USERS_ERROR" ] && echo "  - Usuarios: $USERS_ERROR"
    [ -n "$SYSTEMS_ERROR" ] && echo "  - Sistemas: $SYSTEMS_ERROR"
    echo ""
    echo "🔧 Solución:"
    echo "1. Ve a console.jumpcloud.com"
    echo "2. Genera una nueva API key con permisos de 'Read Users' y 'Read Systems'"
    echo "3. Configura la variable JUMPCLOUD_API_KEY"
    echo "4. Reinicia el backend: docker-compose restart backend"
    echo ""
    echo "📖 Consulta JUMPCLOUD_API_KEY_GUIDE.md para instrucciones detalladas"
else
    echo "✅ API funcionando correctamente para usuarios y sistemas"
fi

echo ""
echo "🧪 Para probar la API key directamente:"
echo "curl --request GET \\"
echo "  --url 'https://console.jumpcloud.com/api/v2/users' \\"
echo "  --header 'Accept: application/json' \\"
echo "  --header 'x-api-key: TU_API_KEY_AQUI'"
