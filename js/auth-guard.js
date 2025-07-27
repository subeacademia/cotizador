// Guardián de autenticación para proteger el panel de administración
import { auth } from './firebase-config.js';

console.log('🛡️ Inicializando guardián de autenticación...');

// Ocultar el contenido inicialmente
document.body.style.display = 'none';

// Función para verificar autenticación
function verificarAutenticacion() {
  console.log('🔍 Verificando estado de autenticación...');
  
  auth.onAuthStateChanged((user) => {
    if (!user) {
      console.log('❌ Usuario no autenticado, redirigiendo a login.html...');
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
}

// Función para cerrar sesión
window.cerrarSesion = async function() {
  console.log('🚪 Cerrando sesión...');
  
  try {
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    await signOut(auth);
    
    console.log('✅ Sesión cerrada exitosamente');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
};

// Inicializar verificación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacion();
}); 