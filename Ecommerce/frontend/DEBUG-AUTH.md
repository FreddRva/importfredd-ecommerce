# 🔐 Debug de Autenticación - Axiora E-commerce

## 📋 Problema Identificado

El AuthProvider se estaba montando múltiples veces, causando logs repetitivos en la consola. Esto es normal en React debido a:
- Re-renders del componente
- Modo estricto de React (Strict Mode)
- Cambios de estado

## ✅ Soluciones Implementadas

### 1. **Debug Inteligente**
- Solo muestra logs cuando hay cambios significativos en el estado
- Usa `useRef` para comparar estados anteriores
- Evita spam de logs innecesarios

### 2. **Control por Variables de Entorno**
```bash
# En tu archivo .env.local
NEXT_PUBLIC_AUTH_DEBUG=true  # Habilitar debug
NEXT_PUBLIC_AUTH_DEBUG=false # Deshabilitar debug (por defecto)
```

### 3. **Componente de Debug Visual**
- Panel flotante en la esquina inferior derecha
- Solo visible en desarrollo
- Muestra estado actual de autenticación en tiempo real

### 4. **Script de Limpieza**
- Archivo: `scripts/clear-debug.js`
- Ejecutar en consola del navegador para limpiar logs

## 🛠️ Cómo Usar

### **Habilitar Debug:**
1. Crear archivo `.env.local` en la raíz del frontend
2. Agregar: `NEXT_PUBLIC_AUTH_DEBUG=true`
3. Reiniciar el servidor de desarrollo

### **Deshabilitar Debug:**
1. Cambiar a: `NEXT_PUBLIC_AUTH_DEBUG=false`
2. O eliminar la variable del archivo `.env.local`

### **Limpiar Logs en Consola:**
```javascript
// En la consola del navegador
authDebug.clear()    // Filtrar logs de auth
authDebug.restore()  // Restaurar logs normales
authDebug.status()   // Mostrar estado actual
```

## 📊 Información del Debug

### **Logs Mostrados:**
- ✅ Cambios de estado de autenticación
- ✅ Login/Logout exitosos
- ✅ Errores de autenticación
- ❌ Re-renders normales (filtrados)

### **Panel Visual:**
- Número de montajes del componente
- Estado de carga
- Estado de autenticación
- Rol de administrador
- Usuario actual
- Presencia de token
- Timestamp

## 🔧 Comandos Útiles

```javascript
// Verificar estado de localStorage
localStorage.getItem('accessToken')
localStorage.getItem('user')

// Limpiar sesión manualmente
localStorage.clear()

// Verificar si el usuario está autenticado
const user = JSON.parse(localStorage.getItem('user') || 'null')
console.log('Usuario:', user)
```

## 🚨 ¿Es Normal Ver Múltiples Montajes?

**SÍ, es completamente normal** en React, especialmente en:
- Desarrollo con Hot Reload
- Modo estricto (Strict Mode)
- Cambios de estado que causan re-renders
- Navegación entre páginas

**No afecta el rendimiento** en producción porque:
- Los logs solo aparecen en desarrollo
- El componente está optimizado con `useCallback` y `useRef`
- La lógica de autenticación es eficiente

## 🎯 Recomendaciones

1. **Desarrollo:** Mantener `NEXT_PUBLIC_AUTH_DEBUG=true` para monitorear
2. **Producción:** Asegurar que `NEXT_PUBLIC_AUTH_DEBUG=false`
3. **Testing:** Usar el panel visual para verificar estados
4. **Debugging:** Usar `authDebug.status()` para diagnóstico rápido

## 📝 Notas Técnicas

- El AuthProvider usa `useRef` para evitar re-renders innecesarios
- Los logs se filtran automáticamente en producción
- El componente AuthDebug es opcional y no afecta el rendimiento
- La autenticación funciona correctamente independientemente de los logs 