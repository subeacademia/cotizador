// Variables globales
let contratoActual = null;
let signaturePadRepresentante = null;
let signaturePadCliente = null;
let firmaRepresentanteGuardada = false;
let firmaClienteGuardada = false;

// Elementos del DOM
const loadingFirma = document.getElementById('loading-firma');
const errorFirma = document.getElementById('error-firma');
const contenidoFirma = document.getElementById('contenido-firma');
const resumenContrato = document.getElementById('resumen-contrato');
const firmaRepresentanteCanvas = document.getElementById('firma-representante');
const firmaClienteCanvas = document.getElementById('firma-cliente');
const nombreCliente = document.getElementById('nombre-cliente');
const empresaCliente = document.getElementById('empresa-cliente');
const btnFinalizar = document.getElementById('btn-finalizar');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando sistema de firma digital con doble firma...');
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    inicializarFirma();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        inicializarFirma();
      }
    }, 100);
  }
});

// ===== SISTEMA DE NOTIFICACIONES =====
function mostrarNotificacion(mensaje, tipo = 'success') {
  console.log(`🔔 Notificación [${tipo}]:`, mensaje);
  
  // Remover notificaciones existentes para evitar superposiciones
  const notificacionesExistentes = document.querySelectorAll('.notificacion');
  notificacionesExistentes.forEach(notif => {
    notif.classList.remove('notificacion-mostrar');
    setTimeout(() => {
      if (notif.parentElement) {
        notif.remove();
      }
    }, 300);
  });
  
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.innerHTML = `
    <div class="notificacion-contenido">
      <span class="notificacion-icono">${tipo === 'success' ? '✅' : '❌'}</span>
      <span class="notificacion-mensaje">${mensaje}</span>
      <button class="notificacion-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notificacion);
  
  // Animación de entrada
  setTimeout(() => {
    notificacion.classList.add('notificacion-mostrar');
  }, 100);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notificacion.parentElement) {
      notificacion.classList.remove('notificacion-mostrar');
      setTimeout(() => {
        if (notificacion.parentElement) {
          notificacion.remove();
        }
      }, 300);
    }
  }, 5000);
}

// ===== INICIALIZACIÓN DEL SISTEMA DE FIRMA =====
async function inicializarFirma() {
  try {
    // Obtener ID del contrato desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');
    
    if (!contratoId) {
      mostrarError('No se proporcionó ID de contrato');
      return;
    }
    
    console.log('📋 Cargando contrato:', contratoId);
    
    // Cargar datos del contrato
    await cargarContrato(contratoId);
    
    // Inicializar signature pads
    inicializarSignaturePads();
    
    // Mostrar contenido
    mostrarContenido();
    
  } catch (error) {
    console.error('❌ Error al inicializar firma:', error);
    mostrarError('Error al inicializar el sistema de firma');
  }
}

// ===== CARGAR DATOS DEL CONTRATO =====
async function cargarContrato(contratoId) {
  try {
    // Importar Firebase dinámicamente
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const contratoRef = doc(window.db, 'contratos', contratoId);
    const contratoSnap = await getDoc(contratoRef);
    
    if (!contratoSnap.exists()) {
      throw new Error('Contrato no encontrado');
    }
    
    contratoActual = {
      id: contratoSnap.id,
      ...contratoSnap.data()
    };
    
    console.log('✅ Contrato cargado:', contratoActual);
    
    // Renderizar resumen del contrato
    renderizarResumenContrato();
    
    // Actualizar información del cliente
    actualizarInfoCliente();
    
  } catch (error) {
    console.error('❌ Error al cargar contrato:', error);
    throw error;
  }
}

// ===== RENDERIZAR RESUMEN DEL CONTRATO =====
function renderizarResumenContrato() {
  if (!contratoActual) return;
  
  const resumenHTML = `
    <div class="detalle-seccion">
      <h4>📋 Información General</h4>
      <p><strong>Título:</strong> ${contratoActual.tituloContrato || 'Sin título'}</p>
      <p><strong>Código:</strong> ${contratoActual.codigoCotizacion || 'Sin código'}</p>
      <p><strong>Estado:</strong> <span class="estado-badge estado-${contratoActual.estadoContrato ? contratoActual.estadoContrato.toLowerCase().replace(/\s+/g, '-') : 'pendiente-de-firma'}">${contratoActual.estadoContrato || 'Pendiente de Firma'}</span></p>
      <p><strong>Fecha de Creación:</strong> ${formatearFecha(contratoActual.fechaCreacionContrato)}</p>
    </div>
    
    <div class="detalle-seccion">
      <h4>👤 Información del Cliente</h4>
      <p><strong>Nombre:</strong> ${contratoActual.cliente?.nombre || 'No especificado'}</p>
      <p><strong>Email:</strong> ${contratoActual.cliente?.email || 'No especificado'}</p>
      <p><strong>RUT:</strong> ${contratoActual.cliente?.rut || 'No especificado'}</p>
      <p><strong>Empresa:</strong> ${contratoActual.cliente?.empresa || 'No especificada'}</p>
    </div>
    
    <div class="detalle-seccion">
      <h4>💰 Información Financiera</h4>
      <p><strong>Valor Total:</strong> $${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}</p>
      ${contratoActual.descuento > 0 ? `<p><strong>Descuento:</strong> ${contratoActual.descuento}%</p>` : ''}
      <p><strong>Atendido por:</strong> ${contratoActual.atendido || 'No especificado'}</p>
    </div>
    
    ${contratoActual.partesInvolucradas ? `
    <div class="detalle-seccion">
      <h4>🤝 Partes Involucradas</h4>
      <p>${contratoActual.partesInvolucradas}</p>
    </div>
    ` : ''}
    
    ${contratoActual.objetoContrato ? `
    <div class="detalle-seccion">
      <h4>📄 Objeto del Contrato</h4>
      <p>${contratoActual.objetoContrato.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    
    ${contratoActual.clausulas ? `
    <div class="detalle-seccion">
      <h4>📜 Cláusulas y Términos</h4>
      <p>${contratoActual.clausulas.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    
    ${contratoActual.fechaInicio || contratoActual.fechaFin ? `
    <div class="detalle-seccion">
      <h4>📅 Fechas del Contrato</h4>
      ${contratoActual.fechaInicio ? `<p><strong>Fecha de Inicio:</strong> ${formatearFecha(contratoActual.fechaInicio)}</p>` : ''}
      ${contratoActual.fechaFin ? `<p><strong>Fecha de Fin:</strong> ${formatearFecha(contratoActual.fechaFin)}</p>` : ''}
    </div>
    ` : ''}
  `;
  
  resumenContrato.innerHTML = resumenHTML;
}

// ===== ACTUALIZAR INFORMACIÓN DEL CLIENTE =====
function actualizarInfoCliente() {
  if (contratoActual && contratoActual.cliente) {
    nombreCliente.textContent = contratoActual.cliente.nombre || 'No especificado';
    empresaCliente.textContent = contratoActual.cliente.empresa || 'No especificada';
  }
}

// ===== INICIALIZAR SIGNATURE PADS =====
function inicializarSignaturePads() {
  try {
    // Verificar que SignaturePad esté disponible
    if (typeof SignaturePad === 'undefined') {
      throw new Error('SignaturePad no está disponible');
    }
    
    // Inicializar SignaturePad para representante
    signaturePadRepresentante = new SignaturePad(firmaRepresentanteCanvas, {
      backgroundColor: 'rgb(250, 250, 250)',
      penColor: 'rgb(0, 0, 0)',
      penWidth: 2
    });
    
    // Inicializar SignaturePad para cliente
    signaturePadCliente = new SignaturePad(firmaClienteCanvas, {
      backgroundColor: 'rgb(250, 250, 250)',
      penColor: 'rgb(0, 0, 0)',
      penWidth: 2
    });
    
    console.log('✅ SignaturePads inicializados correctamente');
    
    // Hacer disponibles globalmente para debugging
    window.signaturePadRepresentante = signaturePadRepresentante;
    window.signaturePadCliente = signaturePadCliente;
    
  } catch (error) {
    console.error('❌ Error al inicializar SignaturePads:', error);
    mostrarError('Error al inicializar los pads de firma: ' + error.message);
  }
}

// ===== FUNCIONES DE FIRMA DEL REPRESENTANTE =====
function limpiarFirmaRepresentante() {
  if (signaturePadRepresentante) {
    signaturePadRepresentante.clear();
    console.log('🧹 Firma del representante limpiada');
  }
}

async function guardarFirmaRepresentante() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!signaturePadRepresentante) {
    mostrarNotificacion('Error: Pad de firma del representante no inicializado', 'error');
    return;
  }
  
  // Verificar si se seleccionó un representante legal
  const representanteSelect = document.getElementById('representante-legal');
  const representanteSeleccionado = representanteSelect.value;
  
  if (!representanteSeleccionado) {
    mostrarNotificacion('Por favor, selecciona un representante legal', 'error');
    return;
  }
  
  // Verificar si el pad de firma está vacío
  if (signaturePadRepresentante.isEmpty()) {
    mostrarNotificacion('Por favor, firma en el área del representante antes de continuar', 'error');
    return;
  }
  
  try {
    console.log('✍️ Guardando firma del representante...');
    
    // Obtener la firma como imagen Base64
    const firmaBase64 = signaturePadRepresentante.toDataURL('image/png');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      firmaRepresentanteBase64: firmaBase64,
      representanteLegal: representanteSeleccionado,
      fechaFirmaRepresentante: new Date()
    });
    
    // Actualizar estado local
    firmaRepresentanteGuardada = true;
    actualizarEstadoFirmas();
    
    console.log('✅ Firma del representante guardada exitosamente');
    mostrarNotificacion('Firma del representante guardada exitosamente', 'success');
    
  } catch (error) {
    console.error('❌ Error al guardar firma del representante:', error);
    mostrarNotificacion('Error al guardar la firma del representante: ' + error.message, 'error');
  }
}

// ===== FUNCIONES DE FIRMA DEL CLIENTE =====
function limpiarFirmaCliente() {
  if (signaturePadCliente) {
    signaturePadCliente.clear();
    console.log('🧹 Firma del cliente limpiada');
  }
}

async function guardarFirmaCliente() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!signaturePadCliente) {
    mostrarNotificacion('Error: Pad de firma del cliente no inicializado', 'error');
    return;
  }
  
  // Verificar si el pad de firma está vacío
  if (signaturePadCliente.isEmpty()) {
    mostrarNotificacion('Por favor, firma en el área del cliente antes de continuar', 'error');
    return;
  }
  
  try {
    console.log('✍️ Guardando firma del cliente...');
    
    // Obtener la firma como imagen Base64
    const firmaBase64 = signaturePadCliente.toDataURL('image/png');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      firmaClienteBase64: firmaBase64,
      fechaFirmaCliente: new Date()
    });
    
    // Actualizar estado local
    firmaClienteGuardada = true;
    actualizarEstadoFirmas();
    
    console.log('✅ Firma del cliente guardada exitosamente');
    mostrarNotificacion('Firma del cliente guardada exitosamente', 'success');
    
  } catch (error) {
    console.error('❌ Error al guardar firma del cliente:', error);
    mostrarNotificacion('Error al guardar la firma del cliente: ' + error.message, 'error');
  }
}

// ===== ACTUALIZAR ESTADO DE LAS FIRMAS =====
function actualizarEstadoFirmas() {
  const statusRepresentante = document.getElementById('status-representante');
  const textoStatusRepresentante = document.getElementById('texto-status-representante');
  const statusCliente = document.getElementById('status-cliente');
  const textoStatusCliente = document.getElementById('texto-status-cliente');
  
  // Actualizar estado del representante
  if (firmaRepresentanteGuardada) {
    statusRepresentante.textContent = '✅';
    statusRepresentante.className = 'status-icon completado';
    textoStatusRepresentante.textContent = 'Completada';
  } else {
    statusRepresentante.textContent = '⏳';
    statusRepresentante.className = 'status-icon pendiente';
    textoStatusRepresentante.textContent = 'Pendiente';
  }
  
  // Actualizar estado del cliente
  if (firmaClienteGuardada) {
    statusCliente.textContent = '✅';
    statusCliente.className = 'status-icon completado';
    textoStatusCliente.textContent = 'Completada';
  } else {
    statusCliente.textContent = '⏳';
    statusCliente.className = 'status-icon pendiente';
    textoStatusCliente.textContent = 'Pendiente';
  }
  
  // Habilitar/deshabilitar botón finalizar
  if (firmaRepresentanteGuardada && firmaClienteGuardada) {
    btnFinalizar.disabled = false;
    btnFinalizar.textContent = 'Finalizar Contrato (Ambas firmas completadas)';
  } else {
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = 'Finalizar Contrato (Requiere ambas firmas)';
  }
}

// ===== FINALIZAR CONTRATO =====
async function finalizarContrato() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!firmaRepresentanteGuardada || !firmaClienteGuardada) {
    mostrarNotificacion('Error: Se requieren ambas firmas para finalizar el contrato', 'error');
    return;
  }
  
  try {
    console.log('🎯 Finalizando contrato...');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    const datosFinales = {
      estadoContrato: 'Firmado',
      fechaFirmaFinal: new Date(),
      contratoValido: true,
      esPreContrato: false,
      fechaCompletado: new Date()
    };
    
    await updateDoc(contratoRef, datosFinales);
    
    console.log('✅ Contrato finalizado exitosamente');
    console.log('📋 Estado actualizado a: Firmado');
    console.log('💰 Contrato válido - valor sumado al dashboard');
    
    // Mostrar notificación de éxito
    mostrarNotificacion('¡Contrato finalizado exitosamente! Ambas firmas completadas.', 'success');
    
    // Redirigir de vuelta al panel de contratos después de 2 segundos
    setTimeout(() => {
      window.location.href = 'contratos.html';
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error al finalizar contrato:', error);
    mostrarNotificacion('Error al finalizar el contrato: ' + error.message, 'error');
  }
}

// ===== FUNCIONES DE UTILIDAD =====
function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible';
  
  let fechaObj;
  
  // Si es un timestamp de Firestore
  if (fecha && typeof fecha === 'object' && fecha.toDate) {
    fechaObj = fecha.toDate();
  }
  // Si es una fecha válida
  else if (fecha instanceof Date) {
    fechaObj = fecha;
  }
  // Si es un string o número, intentar crear Date
  else {
    fechaObj = new Date(fecha);
  }
  
  // Verificar que la fecha sea válida
  if (isNaN(fechaObj.getTime())) {
    return 'Fecha no disponible';
  }
  
  return fechaObj.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function mostrarError(mensaje) {
  loadingFirma.style.display = 'none';
  errorFirma.style.display = 'block';
  errorFirma.textContent = mensaje;
}

function mostrarContenido() {
  loadingFirma.style.display = 'none';
  errorFirma.style.display = 'none';
  contenidoFirma.style.display = 'block';
}

// ===== RESPONSIVE DESIGN =====
window.addEventListener('resize', () => {
  if (signaturePadRepresentante) {
    signaturePadRepresentante.resizeCanvas();
  }
  if (signaturePadCliente) {
    signaturePadCliente.resizeCanvas();
  }
});

// ===== HACER FUNCIONES DISPONIBLES GLOBALMENTE =====
window.limpiarFirmaRepresentante = limpiarFirmaRepresentante;
window.guardarFirmaRepresentante = guardarFirmaRepresentante;
window.limpiarFirmaCliente = limpiarFirmaCliente;
window.guardarFirmaCliente = guardarFirmaCliente;
window.finalizarContrato = finalizarContrato;
window.mostrarNotificacion = mostrarNotificacion; 