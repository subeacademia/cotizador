// Script de prueba rápida para verificar que el error de sintaxis se haya solucionado
console.log('🧪 Prueba rápida iniciada...');

// Verificar que las variables estén disponibles
console.log('Variables globales:', {
  cotizaciones: typeof cotizaciones,
  cotizacionActualEstado: typeof cotizacionActualEstado
});

// Verificar que las funciones estén disponibles
console.log('Funciones disponibles:', {
  mostrarNotificacion: typeof window.mostrarNotificacion,
  crearPreContrato: typeof window.crearPreContrato,
  cambiarEstadoDirecto: typeof window.cambiarEstadoDirecto
});

// Probar notificación
if (typeof window.mostrarNotificacion === 'function') {
  console.log('✅ Función mostrarNotificacion disponible');
  window.mostrarNotificacion('¡Error de sintaxis solucionado!', 'success');
} else {
  console.log('❌ Función mostrarNotificacion NO disponible');
}

// Probar carga de cotizaciones
if (typeof window.cargarCotizaciones === 'function') {
  console.log('✅ Función cargarCotizaciones disponible');
  // No ejecutar automáticamente para evitar conflictos
} else {
  console.log('❌ Función cargarCotizaciones NO disponible');
}

console.log('🧪 Prueba rápida completada'); 