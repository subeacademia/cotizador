// Script de login
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

console.log('🔐 Inicializando sistema de login...');

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error-message';
  }
}

// Función para limpiar mensajes de error
function limpiarError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

// Función para manejar el login
async function manejarLogin(event) {
  event.preventDefault();
  
  console.log('🔐 Procesando login...');
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // Validar campos
  if (!email || !password) {
    mostrarError('Por favor, completa todos los campos.');
    return;
  }
  
  // Limpiar errores previos
  limpiarError();
  
  // Mostrar estado de carga
  const loginButton = event.target.querySelector('button[type="submit"]');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = 'Iniciando Sesión...';
  }
  
  try {
    console.log('🔥 Intentando autenticación con Firebase...');
    
    // Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Autenticación exitosa:', userCredential.user.email);
    
    // Redirigir al panel de administración
    window.location.href = 'admin.html';
    
  } catch (error) {
    console.error('❌ Error de autenticación:', error);
    
    let errorMessage = 'Credenciales incorrectas.';
    
    if (error.code) {
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
        case 'auth/invalid-credential':
          errorMessage = 'Credenciales inválidas.';
          break;
        default:
          errorMessage = `Error de autenticación: ${error.message}`;
      }
    }
    
    mostrarError(errorMessage);
    
    // Restaurar botón
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = 'Iniciar Sesión';
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM cargado, configurando login...');
  
  // Configurar el formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', manejarLogin);
    console.log('✅ Formulario de login configurado');
  } else {
    console.error('❌ No se encontró el formulario de login');
  }
  
  // Verificar si ya hay una sesión activa
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      window.location.href = 'admin.html';
    }
  });
}); 