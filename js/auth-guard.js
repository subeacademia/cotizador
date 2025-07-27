// Guardián de autenticación para proteger el panel de administración
import { auth } from './firebase-config.js';

console.log('🛡️ Inicializando guardián de autenticación...');

// Ocultar el contenido inicialmente
document.body.style.display = 'none';

// Verificar estado de autenticación
auth.onAuthStateChanged((user) => {
  console.log('🔍 Verificando estado de autenticación...');
  
  if (!user) {
    console.log('❌ Usuario no autenticado, redirigiendo a login...');
    window.location.href = 'login.html';
    return;
  }
  
  console.log('✅ Usuario autenticado:', user.email);
  
  // Mostrar información del usuario en el header
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
  console.log('✅ Acceso autorizado al panel de administración');
});

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