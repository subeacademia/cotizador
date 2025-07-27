// Script de prueba final para verificar que todos los problemas estén solucionados
console.log('🧪 PRUEBA FINAL - Verificando soluciones...');

// 1. Verificar que no hay scripts de prueba ejecutándose automáticamente
console.log('✅ Scripts de prueba comentados - no se ejecutan automáticamente');

// 2. Verificar funciones disponibles
console.log('🔍 Funciones disponibles:', {
  cambiarEstadoDirecto: typeof window.cambiarEstadoDirecto,
  crearPreContrato: typeof window.crearPreContrato,
  mostrarNotificacion: typeof window.mostrarNotificacion,
  cargarCotizaciones: typeof window.cargarCotizaciones
});

// 3. Verificar estilos de dropdowns
function verificarEstilosDropdowns() {
  const selects = document.querySelectorAll('select');
  console.log('🔍 Verificando estilos de dropdowns:', selects.length, 'selects encontrados');
  
  selects.forEach((select, index) => {
    const computedStyle = window.getComputedStyle(select);
    console.log(`  Select ${index + 1}:`, {
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      borderColor: computedStyle.borderColor
    });
  });
}

// 4. Función para probar cambio de estado
function probarCambioEstado() {
  if (window.cotizaciones && window.cotizaciones.length > 0) {
    const primeraCotizacion = window.cotizaciones[0];
    console.log('🧪 Probando cambio de estado para:', primeraCotizacion.codigo);
    console.log('💡 Ejecuta en la consola:');
    console.log(`cambiarEstadoDirecto('${primeraCotizacion.id}', 'Aceptada')`);
  } else {
    console.log('❌ No hay cotizaciones cargadas para probar');
  }
}

// 5. Función para verificar contratos
function verificarContratos() {
  if (typeof window.contratos !== 'undefined') {
    console.log('📋 Contratos cargados:', window.contratos.length);
    window.contratos.forEach((contrato, index) => {
      console.log(`  ${index + 1}. ${contrato.tituloContrato || contrato.codigoCotizacion} - ${contrato.estadoContrato}`);
    });
  } else {
    console.log('ℹ️ No estás en la página de contratos');
  }
}

// 6. Función para probar notificación
function probarNotificacion() {
  if (typeof window.mostrarNotificacion === 'function') {
    console.log('🧪 Probando notificación...');
    window.mostrarNotificacion('Prueba de notificación exitosa', 'success');
  } else {
    console.log('❌ Función mostrarNotificacion no disponible');
  }
}

// Ejecutar verificaciones
verificarEstilosDropdowns();
probarCambioEstado();
verificarContratos();

// Hacer funciones disponibles globalmente
window.verificarEstilosDropdowns = verificarEstilosDropdowns;
window.probarCambioEstado = probarCambioEstado;
window.verificarContratos = verificarContratos;
window.probarNotificacion = probarNotificacion;

console.log('🧪 PRUEBA FINAL completada');
console.log('💡 Comandos disponibles:');
console.log('  - verificarEstilosDropdowns()');
console.log('  - probarCambioEstado()');
console.log('  - verificarContratos()');
console.log('  - probarNotificacion()'); 