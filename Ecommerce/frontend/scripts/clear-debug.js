// Script para limpiar logs de debug de autenticación
// Ejecutar en la consola del navegador

console.clear();

// Función para limpiar logs específicos de auth
function clearAuthLogs() {
  const originalLog = console.log;
  console.log = function(...args) {
    // Filtrar logs que contengan "AuthProvider" o "Auth State"
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('AuthProvider') || args[0].includes('Auth State'))) {
      return; // No mostrar estos logs
    }
    originalLog.apply(console, args);
  };
  
  console.log('🔧 Auth debug logs filtrados');
}

// Función para restaurar logs normales
function restoreLogs() {
  console.log = console.log;
  console.log('🔧 Logs restaurados');
}

// Función para mostrar estado actual de auth
function showAuthStatus() {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  
  console.log('🔐 Estado actual de autenticación:');
  console.log('- Token:', token ? 'Presente' : 'Ausente');
  console.log('- Usuario:', user ? JSON.parse(user).email : 'No autenticado');
  console.log('- Timestamp:', new Date().toLocaleString());
}

// Exportar funciones para uso en consola
window.authDebug = {
  clear: clearAuthLogs,
  restore: restoreLogs,
  status: showAuthStatus
};

console.log('🔧 Script de debug de auth cargado');
console.log('Comandos disponibles:');
console.log('- authDebug.clear() - Filtrar logs de auth');
console.log('- authDebug.restore() - Restaurar logs normales');
console.log('- authDebug.status() - Mostrar estado de auth'); 