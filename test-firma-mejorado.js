// Script de prueba mejorado para la página de firma
console.log('🧪 PRUEBA DE FIRMA MEJORADA - Verificando funcionalidades...');

// 1. Verificar elementos del DOM
function verificarElementosFirma() {
  console.log('🔍 Verificando elementos de firma:');
  
  const elementos = {
    representanteLegal: document.getElementById('representante-legal'),
    firmaPad: document.getElementById('firma-pad'),
    resumenContrato: document.getElementById('resumen-contrato'),
    loadingFirma: document.getElementById('loading-firma'),
    errorFirma: document.getElementById('error-firma'),
    contenidoFirma: document.getElementById('contenido-firma')
  };
  
  Object.entries(elementos).forEach(([nombre, elemento]) => {
    if (elemento) {
      console.log(`  ✅ ${nombre}: Encontrado`);
      if (nombre === 'representanteLegal') {
        console.log(`    Opciones: ${elemento.options.length}`);
        Array.from(elemento.options).forEach((opt, i) => {
          console.log(`      ${i + 1}. ${opt.value || opt.text}`);
        });
      }
    } else {
      console.log(`  ❌ ${nombre}: NO encontrado`);
    }
  });
  
  return elementos;
}

// 2. Verificar funciones disponibles
function verificarFuncionesFirma() {
  console.log('🔍 Verificando funciones de firma:');
  
  const funciones = {
    limpiarFirma: typeof window.limpiarFirma,
    firmarYAcceptar: typeof window.firmarYAcceptar,
    mostrarNotificacion: typeof window.mostrarNotificacion
  };
  
  Object.entries(funciones).forEach(([nombre, tipo]) => {
    if (tipo === 'function') {
      console.log(`  ✅ ${nombre}: Disponible`);
    } else {
      console.log(`  ❌ ${nombre}: NO disponible`);
    }
  });
  
  return funciones;
}

// 3. Verificar contrato cargado
function verificarContratoCargado() {
  console.log('🔍 Verificando contrato cargado:');
  
  if (window.contratoActual) {
    console.log('  ✅ Contrato cargado:', {
      id: window.contratoActual.id,
      titulo: window.contratoActual.tituloContrato,
      estado: window.contratoActual.estadoContrato,
      cliente: window.contratoActual.cliente?.nombre,
      representanteLegal: window.contratoActual.representanteLegal
    });
  } else {
    console.log('  ❌ No hay contrato cargado');
  }
}

// 4. Verificar SignaturePad
function verificarSignaturePad() {
  console.log('🔍 Verificando SignaturePad:');
  
  if (window.signaturePad) {
    console.log('  ✅ SignaturePad inicializado');
    console.log('  📊 Estado del pad:', {
      isEmpty: window.signaturePad.isEmpty(),
      data: window.signaturePad.toData() ? 'Con datos' : 'Sin datos',
      canvas: window.signaturePad.canvas ? 'Canvas disponible' : 'Sin canvas'
    });
  } else {
    console.log('  ❌ SignaturePad NO inicializado');
  }
}

// 5. Función para probar selección de representante
function probarSeleccionRepresentante() {
  const select = document.getElementById('representante-legal');
  if (select) {
    console.log('🧪 Probando selección de representante...');
    console.log('  Opciones disponibles:', select.options.length);
    
    Array.from(select.options).forEach((option, index) => {
      console.log(`    ${index + 1}. ${option.value || option.text}`);
    });
    
    console.log('  Valor seleccionado:', select.value);
    
    // Probar selección automática
    if (!select.value) {
      console.log('  💡 Seleccionando primer representante...');
      select.value = 'Bruno Villalobos - CEO';
      console.log('  ✅ Representante seleccionado:', select.value);
    }
  } else {
    console.log('❌ Select de representante no encontrado');
  }
}

// 6. Función para simular firma (solo para pruebas)
function simularFirma() {
  if (window.signaturePad) {
    console.log('🧪 Simulando firma...');
    
    // Crear una firma simple (solo para pruebas)
    const canvas = window.signaturePad.canvas;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(150, 100);
    ctx.lineTo(200, 80);
    ctx.lineTo(250, 120);
    ctx.stroke();
    
    console.log('  ✅ Firma simulada creada');
    console.log('  📊 Pad vacío:', window.signaturePad.isEmpty());
  } else {
    console.log('❌ SignaturePad no disponible para simulación');
  }
}

// 7. Función para probar el flujo completo
function probarFlujoCompleto() {
  console.log('🧪 Probando flujo completo de firma...');
  
  // 1. Seleccionar representante
  probarSeleccionRepresentante();
  
  // 2. Simular firma
  simularFirma();
  
  // 3. Verificar que todo esté listo
  const select = document.getElementById('representante-legal');
  const representanteSeleccionado = select ? select.value : '';
  const firmaLista = window.signaturePad && !window.signaturePad.isEmpty();
  
  console.log('📋 Estado del flujo:', {
    representanteSeleccionado: representanteSeleccionado || 'No seleccionado',
    firmaLista: firmaLista ? 'Sí' : 'No',
    listoParaFirmar: representanteSeleccionado && firmaLista ? 'Sí' : 'No'
  });
  
  if (representanteSeleccionado && firmaLista) {
    console.log('✅ Todo listo para firmar. Ejecuta: firmarYAcceptar()');
  } else {
    console.log('❌ Faltan elementos para completar la firma');
  }
}

// Ejecutar todas las verificaciones
verificarElementosFirma();
verificarFuncionesFirma();
verificarContratoCargado();
verificarSignaturePad();
probarSeleccionRepresentante();

// Hacer funciones disponibles globalmente
window.verificarElementosFirma = verificarElementosFirma;
window.verificarFuncionesFirma = verificarFuncionesFirma;
window.verificarContratoCargado = verificarContratoCargado;
window.verificarSignaturePad = verificarSignaturePad;
window.probarSeleccionRepresentante = probarSeleccionRepresentante;
window.simularFirma = simularFirma;
window.probarFlujoCompleto = probarFlujoCompleto;

console.log('🧪 PRUEBA DE FIRMA MEJORADA completada');
console.log('💡 Comandos disponibles:');
console.log('  - verificarElementosFirma()');
console.log('  - verificarFuncionesFirma()');
console.log('  - verificarContratoCargado()');
console.log('  - verificarSignaturePad()');
console.log('  - probarSeleccionRepresentante()');
console.log('  - simularFirma() (solo para pruebas)');
console.log('  - probarFlujoCompleto() (prueba completa)'); 