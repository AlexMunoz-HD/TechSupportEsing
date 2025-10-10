#!/bin/bash

echo "🔍 Probando página de gestión de usuarios..."
echo "=============================================="

# Test 1: Verificar que el frontend está funcionando
echo "1. Verificando frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend funcionando (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend no disponible (HTTP $FRONTEND_STATUS)"
    exit 1
fi

# Test 2: Verificar que el backend está funcionando
echo ""
echo "2. Verificando backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/users)
if [ "$BACKEND_STATUS" = "401" ]; then
    echo "✅ Backend funcionando (HTTP $BACKEND_STATUS - requiere autenticación)"
else
    echo "❌ Backend no disponible (HTTP $BACKEND_STATUS)"
    exit 1
fi

# Test 3: Verificar que el archivo users.js está siendo servido
echo ""
echo "3. Verificando archivo users.js..."
USERS_JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/js/users.js)
if [ "$USERS_JS_STATUS" = "200" ]; then
    echo "✅ Archivo users.js disponible (HTTP $USERS_JS_STATUS)"
else
    echo "❌ Archivo users.js no disponible (HTTP $USERS_JS_STATUS)"
    exit 1
fi

# Test 4: Verificar que el HTML contiene la tabla de usuarios
echo ""
echo "4. Verificando HTML de la tabla de usuarios..."
HTML_CHECK=$(curl -s http://localhost:3000 | grep -c "usersTableBody")
if [ "$HTML_CHECK" -gt 0 ]; then
    echo "✅ Tabla de usuarios encontrada en HTML"
else
    echo "❌ Tabla de usuarios NO encontrada en HTML"
    exit 1
fi

echo ""
echo "🎉 Todas las verificaciones pasaron!"
echo ""
echo "📋 Próximos pasos para debuggear:"
echo "1. Abre http://localhost:3000 en tu navegador"
echo "2. Ve a la sección 'Gestión de Usuarios'"
echo "3. Abre las herramientas de desarrollador (F12)"
echo "4. Ve a la pestaña 'Console'"
echo "5. Busca los logs que empiezan con 'UserManager:'"
echo ""
echo "🔧 Si la página sigue en blanco:"
echo "- Verifica que tienes permisos de administrador"
echo "- Revisa la consola del navegador para errores"
echo "- Verifica que el token de autenticación es válido"
