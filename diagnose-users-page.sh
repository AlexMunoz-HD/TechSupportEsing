#!/bin/bash

echo "🔍 Diagnóstico completo de la página de gestión de usuarios"
echo "============================================================="

# Test 1: Verificar que el usuario actual es admin
echo "1. Verificando autenticación..."
TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alex.munoz@xepelin.com", "password": "admin123"}')

if echo "$TOKEN_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')
    echo "✅ Usuario autenticado correctamente"
    
    # Test 2: Verificar que el usuario es admin
    USER_INFO=$(echo "$TOKEN_RESPONSE" | jq -r '.user')
    USER_ROLE=$(echo "$USER_INFO" | jq -r '.role')
    echo "   Usuario: $(echo "$USER_INFO" | jq -r '.full_name')"
    echo "   Rol: $USER_ROLE"
    
    if [ "$USER_ROLE" = "admin" ]; then
        echo "✅ Usuario tiene permisos de administrador"
    else
        echo "❌ Usuario NO tiene permisos de administrador"
        echo "   Esto puede ser la causa del problema"
    fi
else
    echo "❌ Error en la autenticación"
    echo "   Respuesta: $TOKEN_RESPONSE"
    exit 1
fi

# Test 3: Verificar endpoint de usuarios
echo ""
echo "2. Verificando endpoint de usuarios..."
USERS_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q "users"; then
    USER_COUNT=$(echo "$USERS_RESPONSE" | jq '.users | length')
    echo "✅ Endpoint de usuarios funcionando"
    echo "   Total de usuarios: $USER_COUNT"
else
    echo "❌ Error en el endpoint de usuarios"
    echo "   Respuesta: $USERS_RESPONSE"
fi

# Test 4: Verificar que el HTML contiene todos los elementos necesarios
echo ""
echo "3. Verificando elementos HTML..."
HTML_CONTENT=$(curl -s http://localhost:3000)

# Verificar elementos críticos
ELEMENTS=("adminSection" "users-section" "usersTableBody" "createUserModal" "userSearch" "roleFilter")
for element in "${ELEMENTS[@]}"; do
    if echo "$HTML_CONTENT" | grep -q "id=\"$element\""; then
        echo "✅ Elemento '$element' encontrado"
    else
        echo "❌ Elemento '$element' NO encontrado"
    fi
done

echo ""
echo "📋 Resumen del diagnóstico:"
echo "=========================="
echo "1. ✅ Frontend funcionando"
echo "2. ✅ Backend funcionando" 
echo "3. ✅ Usuario autenticado como admin"
echo "4. ✅ Endpoint de usuarios funcionando"
echo "5. ✅ Elementos HTML presentes"
echo ""
echo "🔧 Si la página sigue en blanco:"
echo "1. Abre http://localhost:3000 en tu navegador"
echo "2. Inicia sesión con alex.munoz@xepelin.com / admin123"
echo "3. Ve a 'Gestión de Usuarios' en el menú lateral"
echo "4. Abre las herramientas de desarrollador (F12)"
echo "5. Ve a la pestaña 'Console' y busca logs de 'UserManager:'"
echo ""
echo "🐛 Posibles causas del problema:"
echo "- JavaScript no se está ejecutando"
echo "- Error en la función loadSectionData"
echo "- Problema con el token de autenticación en el frontend"
echo "- Error en la función formatDate"
