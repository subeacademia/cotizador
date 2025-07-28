// ===== SCRIPT DE PRUEBA PARA CORRECCIÓN AUTOMÁTICA DE ESTADOS =====
// Este archivo se puede ejecutar desde la consola del navegador para probar la funcionalidad

console.log('🧪 Iniciando pruebas de corrección automática de estados...');

// Función para simular un contrato con ambas firmas pero estado incorrecto
async function crearContratoDePrueba() {
  console.log('📝 Creando contrato de prueba...');
  
  try {
    // Importar Firebase dinámicamente
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const contratoPrueba = {
      codigoCotizacion: 'TEST-2025-001',
      tituloContrato: 'Contrato de Prueba - Corrección Automática',
      fechaCreacionContrato: new Date(),
      estadoContrato: 'Pendiente de Firma', // Estado incorrecto
      cliente: {
        nombre: 'Cliente de Prueba',
        email: 'test@example.com',
        rut: '12345678-9',
        empresa: 'Empresa de Prueba'
      },
      totalConDescuento: 100000,
      atendido: 'Usuario de Prueba',
      // Firmas simuladas (Base64 de una imagen pequeña)
      firmaRepresentanteBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      firmaClienteBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      fechaFirmaRepresentante: new Date(),
      fechaFirmaCliente: new Date()
    };
    
    const contratoRef = doc(window.db, 'contratos', 'test-contrato-correccion');
    await setDoc(contratoRef, contratoPrueba);
    
    console.log('✅ Contrato de prueba creado con estado incorrecto');
    console.log('📋 ID: test-contrato-correccion');
    console.log('🔍 Estado actual: Pendiente de Firma');
    console.log('✍️ Firmas: Ambas presentes');
    
  } catch (error) {
    console.error('❌ Error al crear contrato de prueba:', error);
  }
}

// Función para verificar el estado después de la corrección
async function verificarEstadoContrato() {
  console.log('🔍 Verificando estado del contrato de prueba...');
  
  try {
    // Importar Firebase dinámicamente
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const contratoRef = doc(window.db, 'contratos', 'test-contrato-correccion');
    const contratoSnap = await getDoc(contratoRef);
    
    if (contratoSnap.exists()) {
      const contrato = contratoSnap.data();
      console.log('📋 Estado actual:', contrato.estadoContrato);
      console.log('✅ Contrato válido:', contrato.contratoValido);
      console.log('📅 Fecha de firma final:', contrato.fechaFirmaFinal);
      console.log('🎯 Ambas firmas completadas:', contrato.ambasFirmasCompletadas);
    } else {
      console.log('❌ Contrato de prueba no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
  }
}

// Función para limpiar el contrato de prueba
async function limpiarContratoPrueba() {
  console.log('🧹 Limpiando contrato de prueba...');
  
  try {
    // Importar Firebase dinámicamente
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const contratoRef = doc(window.db, 'contratos', 'test-contrato-correccion');
    await deleteDoc(contratoRef);
    
    console.log('✅ Contrato de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error al eliminar contrato de prueba:', error);
  }
}

// Función para ejecutar prueba completa
async function ejecutarPruebaCompleta() {
  console.log('🚀 Iniciando prueba completa de corrección automática...');
  
  // 1. Crear contrato de prueba
  await crearContratoDePrueba();
  
  // 2. Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. Ejecutar corrección automática
  if (typeof corregirEstadosContratosManual === 'function') {
    await corregirEstadosContratosManual();
  } else {
    console.log('⚠️ Función corregirEstadosContratosManual no disponible');
  }
  
  // 4. Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 5. Verificar estado
  await verificarEstadoContrato();
  
  console.log('✅ Prueba completa finalizada');
}

// Hacer funciones disponibles globalmente
window.crearContratoDePrueba = crearContratoDePrueba;
window.verificarEstadoContrato = verificarEstadoContrato;
window.limpiarContratoPrueba = limpiarContratoPrueba;
window.ejecutarPruebaCompleta = ejecutarPruebaCompleta;

console.log('✅ Script de prueba cargado');
console.log('📋 Funciones disponibles:');
console.log('   - crearContratoDePrueba()');
console.log('   - verificarEstadoContrato()');
console.log('   - limpiarContratoPrueba()');
console.log('   - ejecutarPruebaCompleta()');
console.log('   - corregirEstadosContratosManual() (si está disponible)'); 