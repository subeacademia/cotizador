// Guardián de autenticación para proteger el panel de administración

console.log('🛡️ Inicializando guardián de autenticación...');

// Ocultar el contenido inicialmente
document.body.style.display = 'none';

// Función para verificar autenticación
function verificarAutenticacion() {
  if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
      console.log('🔍 Verificando estado de autenticación...');
      
      if (!user) {
        console.log('❌ Usuario no autenticado, redirigiendo a index.html...');
        window.location.href = 'index.html';
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
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    // Esperar a que Firebase se cargue
    const checkFirebase = setInterval(() => {
      if (window.auth) {
        clearInterval(checkFirebase);
        verificarAutenticacion();
      }
    }, 100);
  }
}

// Función para cerrar sesión
window.cerrarSesion = function() {
  console.log('🚪 Cerrando sesión...');
  
  import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js').then(({ signOut }) => {
    return signOut(window.auth);
  })
  .then(() => {
    console.log('✅ Sesión cerrada exitosamente');
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error('❌ Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  });
};

// Inicializar verificación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacion();
}); 