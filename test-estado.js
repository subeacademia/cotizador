// Script para probar específicamente la función cambiarEstadoDirecto
console.log('🧪 Probando función cambiarEstadoDirecto...');

// Verificar que la función esté disponible
if (typeof window.cambiarEstadoDirecto === 'function') {
  console.log('✅ Función cambiarEstadoDirecto disponible');
  
  // Verificar que hay cotizaciones cargadas
  if (window.cotizaciones && window.cotizaciones.length > 0) {
    console.log('✅ Hay cotizaciones cargadas:', window.cotizaciones.length);
    
    // Mostrar la primera cotización para referencia
    const primeraCotizacion = window.cotizaciones[0];
    console.log('📋 Primera cotización:', {
      id: primeraCotizacion.id,
      codigo: primeraCotizacion.codigo,
      estado: primeraCotizacion.estado
    });
    
    console.log('💡 Para probar, ejecuta en la consola:');
    console.log(`cambiarEstadoDirecto('${primeraCotizacion.id}', 'Aceptada')`);
    
  } else {
    console.log('❌ No hay cotizaciones cargadas');
    console.log('💡 Ejecuta: cargarCotizaciones()');
  }
  
} else {
  console.log('❌ Función cambiarEstadoDirecto NO disponible');
  console.log('🔍 Funciones disponibles:', Object.keys(window).filter(key => 
    typeof window[key] === 'function' && key.includes('cambiar')
  ));
}

// Verificar otras funciones relacionadas
console.log('🔍 Verificando funciones relacionadas:', {
  cambiarEstado: typeof window.cambiarEstado,
  confirmarCambioEstado: typeof window.confirmarCambioEstado,
  crearPreContrato: typeof window.crearPreContrato,
  mostrarNotificacion: typeof window.mostrarNotificacion
}); 