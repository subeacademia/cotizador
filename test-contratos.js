// Script para probar específicamente la gestión de contratos
console.log('🧪 Probando gestión de contratos...');

// Verificar que las funciones estén disponibles
console.log('🔍 Verificando funciones de contratos:', {
  cargarContratos: typeof window.cargarContratos,
  cambiarEstadoContratoDirecto: typeof window.cambiarEstadoContratoDirecto,
  mostrarModalCompletarContrato: typeof window.mostrarModalCompletarContrato,
  verDetallesContrato: typeof window.verDetallesContrato
});

// Verificar variables globales
console.log('🔍 Verificando variables globales:', {
  contratos: typeof window.contratos,
  contratosList: typeof window.contratosList
});

// Verificar elementos del DOM
console.log('🔍 Verificando elementos del DOM:', {
  contratosList: document.getElementById('contratos-list'),
  totalContratos: document.getElementById('total-contratos'),
  contratosPendientes: document.getElementById('contratos-pendientes'),
  contratosFirmados: document.getElementById('contratos-firmados'),
  valorTotalContratos: document.getElementById('valor-total-contratos')
});

// Función para forzar recarga de contratos
function recargarContratos() {
  console.log('🔄 Forzando recarga de contratos...');
  if (typeof window.cargarContratos === 'function') {
    window.cargarContratos();
  } else {
    console.log('❌ Función cargarContratos no disponible');
  }
}

// Función para mostrar información de contratos
function mostrarInfoContratos() {
  if (window.contratos && window.contratos.length > 0) {
    console.log('📋 Contratos cargados:', window.contratos.length);
    window.contratos.forEach((contrato, index) => {
      console.log(`  ${index + 1}. ${contrato.tituloContrato || contrato.codigoCotizacion} - ${contrato.estadoContrato}`);
    });
  } else {
    console.log('❌ No hay contratos cargados');
  }
}

// Hacer funciones disponibles globalmente
window.recargarContratos = recargarContratos;
window.mostrarInfoContratos = mostrarInfoContratos;

console.log('🧪 Prueba de contratos completada');
console.log('💡 Comandos disponibles:');
console.log('  - recargarContratos()');
console.log('  - mostrarInfoContratos()'); 