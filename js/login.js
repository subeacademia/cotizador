// Importar configuración de Firebase
import { auth } from './firebase-config.js';

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const loginButton = document.querySelector('.btn-login');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando página de login...');
  setupEventListeners();
  checkAuthState();
});

// Configurar event listeners
function setupEventListeners() {
  if (!loginForm) {
    console.error('❌ Formulario de login no encontrado');
    return;
  }
  
  loginForm.addEventListener('submit', handleLogin);
  
  // Limpiar error al escribir
  if (emailInput) emailInput.addEventListener('input', clearError);
  if (passwordInput) passwordInput.addEventListener('input', clearError);
}

// Verificar estado de autenticación
function checkAuthState() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      window.location.href = 'admin.html';
    }
  });
}

// Manejar el envío del formulario de login
async function handleLogin(event) {
  event.preventDefault();
  
  console.log('🔐 Procesando login...');
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Validar campos
  if (!email || !password) {
    showError('Por favor, completa todos los campos.');
    return;
  }
  
  if (!isValidEmail(email)) {
    showError('Por favor, ingresa un email válido.');
    return;
  }
  
  // Mostrar estado de carga
  setLoadingState(true);
  clearError();
  
  try {
    console.log('🔥 Intentando autenticación con Firebase...');
    
    // Intentar autenticación usando .then() y .catch() como especificado
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('✅ Autenticación exitosa:', userCredential.user.email);
        
        // Redirigir al panel de administración
        window.location.href = 'admin.html';
      })
      .catch((error) => {
        console.error('❌ Error de autenticación:', error);
        
        // Manejar diferentes tipos de errores
        let errorMessage = 'Credenciales incorrectas.';
        
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No existe una cuenta con este email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Contraseña incorrecta.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Email inválido.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta cuenta ha sido deshabilitada.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Error de conexión. Verifica tu internet.';
            break;
          default:
            errorMessage = 'Credenciales incorrectas.';
        }
        
        showError(errorMessage);
        setLoadingState(false);
      });
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    showError('Error inesperado. Por favor, inténtalo de nuevo.');
    setLoadingState(false);
  }
}

// Validar formato de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Mostrar mensaje de error
function showError(message) {
  if (!errorMessage) {
    console.error('❌ Elemento error-message no encontrado');
    alert(message);
    return;
  }
  
  errorMessage.textContent = message;
  errorMessage.style.display = 'flex';
  
  // Hacer scroll al error si es necesario
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Limpiar mensaje de error
function clearError() {
  if (errorMessage) {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
  }
}

// Establecer estado de carga
function setLoadingState(loading) {
  if (!loginButton) {
    console.error('❌ Botón de login no encontrado');
    return;
  }
  
  if (loading) {
    loginButton.disabled = true;
    loginButton.classList.add('loading');
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando Sesión...';
  } else {
    loginButton.disabled = false;
    loginButton.classList.remove('loading');
    loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
  }
}

// Función para cerrar sesión (exportada para uso global)
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