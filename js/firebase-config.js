// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con tu configuración real de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAuR2-zHQAkjbLABtIuBcSo9MgIlCGWusg",
    authDomain: "cotizador-bba5a.firebaseapp.com",
    projectId: "cotizador-bba5a",
    storageBucket: "cotizador-bba5a.firebasestorage.app",
    messagingSenderId: "372617480143",
    appId: "1:372617480143:web:67bda8c05dbeebb6e6b4ba"
  };

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener referencia a Firestore
const db = firebase.firestore();

// Obtener referencia a Auth
const auth = firebase.auth();

export { db, auth }; 