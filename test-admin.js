// Script de prueba para verificar funcionalidades básicas
console.log('🧪 Iniciando pruebas de funcionalidades...');

// Función de prueba para notificaciones
function testNotificacion() {
  console.log('🔔 Probando sistema de notificaciones...');
  
  // Crear elemento de notificación de prueba
  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion notificacion-success';
  notificacion.innerHTML = `
    <div class="notificacion-contenido">
      <span class="notificacion-icono">✅</span>
      <span class="notificacion-mensaje">Prueba de notificación exitosa</span>
      <button class="notificacion-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notificacion);
  
  // Animación de entrada
  setTimeout(() => {
    notificacion.classList.add('notificacion-mostrar');
  }, 100);
  
  console.log('✅ Notificación de prueba creada');
}

// Función de prueba para verificar elementos del DOM
function testElementosDOM() {
  console.log('🔍 Verificando elementos del DOM...');
  
  const elementos = [
    'cotizaciones-list',
    'total-cotizaciones',
    'cotizaciones-mes',
    'valor-total',
    'buscador',
    'aplicar-filtros'
  ];
  
  elementos.forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) {
      console.log(`✅ Elemento ${id} encontrado`);
    } else {
      console.log(`❌ Elemento ${id} NO encontrado`);
    }
  });
}

// Función de prueba para verificar Firebase
function testFirebase() {
  console.log('🔥 Verificando Firebase...');
  
  if (window.db) {
    console.log('✅ Firebase DB disponible');
  } else {
    console.log('❌ Firebase DB NO disponible');
  }
  
  if (window.auth) {
    console.log('✅ Firebase Auth disponible');
  } else {
    console.log('❌ Firebase Auth NO disponible');
  }
}

// Ejecutar pruebas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM cargado, ejecutando pruebas...');
  
  // Esperar un poco para que Firebase se cargue
  setTimeout(() => {
    testElementosDOM();
    testFirebase();
    testNotificacion();
    
    console.log('🧪 Pruebas completadas. Revisa la consola para resultados.');
  }, 2000);
});

// Función para probar la carga de cotizaciones
async function testCargarCotizaciones() {
  console.log('📊 Probando carga de cotizaciones...');
  
  if (!window.db) {
    console.log('❌ Firebase no disponible para la prueba');
    return;
  }
  
  try {
    const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const q = query(
      collection(window.db, 'cotizaciones'),
      orderBy('fechaTimestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`✅ Snapshot obtenido: ${snapshot.size} documentos`);
    
    if (snapshot.empty) {
      console.log('📭 No hay cotizaciones en la base de datos');
    } else {
      console.log('📋 Cotizaciones encontradas:', snapshot.size);
      snapshot.docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.data().codigo || 'Sin código'} - ${doc.data().estado || 'Sin estado'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al cargar cotizaciones:', error);
  }
}

// Hacer funciones disponibles globalmente
window.testNotificacion = testNotificacion;
window.testCargarCotizaciones = testCargarCotizaciones; 