// Configuración de Firebase
import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAuR2-zHQAkjbLABtIuBcSo9MgIlCGWusg",
  authDomain: "cotizador-bba5a.firebaseapp.com",
  projectId: "cotizador-bba5a",
  storageBucket: "cotizador-bba5a.firebasestorage.app",
  messagingSenderId: "372617480143",
  appId: "1:372617480143:web:67bda8c05dbeebb6e6b4ba"
};

// Inicialización segura de Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // Si ya está inicializada, obtener la instancia existente
  app = getApp();
}

// Obtener servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar para uso en otros módulos
export { auth, db };

// Hacer disponibles globalmente para compatibilidad
window.auth = auth;
window.db = db;

console.log('✅ Firebase configurado correctamente'); 