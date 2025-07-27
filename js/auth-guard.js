// Guardián de autenticación para proteger el panel de administración
import { auth } from './firebase-config.js';

console.log('🛡️ Inicializando guardián de autenticación...');

// Ocultar el contenido inicialmente para evitar parpadeo
document.body.style.display = 'none';

// Variable para controlar si ya se ha verificado la autenticación
let authChecked = false;

// Verificar estado de autenticación al cargar la página
auth.onAuthStateChanged((user) => {
  console.log('🔍 Verificando estado de autenticación...');
  
  // Marcar que ya se verificó la autenticación
  authChecked = true;
  
  if (!user) {
    console.log('❌ Usuario no autenticado, redirigiendo a login...');
    
    // Redirigir a la página de login si no hay usuario autenticado
    window.location.href = 'login.html';
    return;
  }
  
  console.log('✅ Usuario autenticado:', user.email);
  
  // Mostrar información del usuario en el header si existe el elemento
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement) {
    userInfoElement.innerHTML = `
      <span class="user-email">
        <i class="fas fa-user"></i>
        ${user.email}
      </span>
    `;
  }
  
  // Mostrar el contenido de la página
  document.body.style.display = 'flex';
  
  // Permitir que la página se cargue normalmente
  console.log('✅ Acceso autorizado al panel de administración');
});

// Función para verificar autenticación en cualquier momento
function verificarAutenticacion() {
  return new Promise((resolve, reject) => {
    // Si ya se verificó la autenticación, usar el estado actual
    if (authChecked) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        resolve(currentUser);
      } else {
        reject(new Error('Usuario no autenticado'));
      }
      return;
    }
    
    // Si no se ha verificado, esperar a que se verifique
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe(); // Desuscribirse después de la primera verificación
      
      if (user) {
        resolve(user);
      } else {
        reject(new Error('Usuario no autenticado'));
      }
    });
  });
}

// Función para esperar a que se complete la verificación de autenticación
function esperarVerificacionAuth() {
  return new Promise((resolve) => {
    if (authChecked) {
      resolve();
      return;
    }
    
    const checkInterval = setInterval(() => {
      if (authChecked) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

// Exportar funciones para uso en otros módulos
window.verificarAutenticacion = verificarAutenticacion;
window.esperarVerificacionAuth = esperarVerificacionAuth;

// Función para cerrar sesión
window.cerrarSesion = async function() {
  try {
    console.log('🚪 Cerrando sesión...');
    
    await auth.signOut();
    window.location.href = 'login.html';
    
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
}; 