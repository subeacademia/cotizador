// Variables globales
let contratoActual = null;
let signaturePadCliente = null;

// Elementos del DOM
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const contenido = document.getElementById('contenido');
const success = document.getElementById('success');
const resumenContrato = document.getElementById('resumen-contrato');
const nombreCliente = document.getElementById('nombre-cliente');
const empresaCliente = document.getElementById('empresa-cliente');
const firmaClienteCanvas = document.getElementById('firma-cliente');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando sistema de firma para cliente...');
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    inicializarFirmaCliente();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        inicializarFirmaCliente();
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

// ===== INICIALIZACIÓN DEL SISTEMA =====
async function inicializarFirmaCliente() {
  try {
    // Obtener parámetros desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');
    const token = urlParams.get('token');
    
    if (!contratoId || !token) {
      mostrarError('Enlace inválido. Faltan parámetros requeridos.');
      return;
    }
    
    console.log('📋 Cargando contrato para firma del cliente:', contratoId);
    
    // Validar token y cargar contrato
    await validarTokenYCargarContrato(contratoId, token);
    
    // Inicializar signature pad
    inicializarSignaturePad();
    
    // Mostrar contenido
    mostrarContenido();
    
  } catch (error) {
    console.error('❌ Error al inicializar firma del cliente:', error);
    mostrarError('Error al inicializar el sistema de firma');
  }
}

// ===== VALIDAR TOKEN Y CARGAR CONTRATO =====
async function validarTokenYCargarContrato(contratoId, token) {
  try {
    // Importar Firebase dinámicamente
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const contratoRef = doc(window.db, 'contratos', contratoId);
    const contratoSnap = await getDoc(contratoRef);
    
    if (!contratoSnap.exists()) {
      throw new Error('Contrato no encontrado');
    }
    
    const contratoData = contratoSnap.data();
    
    // Validar token
    if (contratoData.tokenFirma !== token) {
      throw new Error('Token de firma inválido');
    }
    
    // Verificar que el contrato esté en estado válido para firma
    if (contratoData.estadoContrato !== 'Enviado' && contratoData.estadoContrato !== 'Pendiente de Firma') {
      throw new Error('El contrato no está disponible para firma');
    }
    
    // Verificar que no haya sido firmado ya
    if (contratoData.firmaClienteBase64) {
      throw new Error('Este contrato ya ha sido firmado');
    }
    
    contratoActual = {
      id: contratoSnap.id,
      ...contratoData
    };
    
    console.log('✅ Contrato validado y cargado para firma del cliente:', contratoActual);
    
    // Renderizar resumen del contrato
    renderizarResumenContrato();
    
    // Actualizar información del cliente
    actualizarInfoCliente();
    
  } catch (error) {
    console.error('❌ Error al validar token y cargar contrato:', error);
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

// ===== INICIALIZAR SIGNATURE PAD =====
function inicializarSignaturePad() {
  try {
    // Verificar que SignaturePad esté disponible
    if (typeof SignaturePad === 'undefined') {
      throw new Error('SignaturePad no está disponible');
    }
    
    // Inicializar SignaturePad para cliente
    signaturePadCliente = new SignaturePad(firmaClienteCanvas, {
      backgroundColor: 'rgb(250, 250, 250)',
      penColor: 'rgb(0, 0, 0)',
      penWidth: 2
    });
    
    console.log('✅ SignaturePad inicializado correctamente para cliente');
    
    // Hacer disponible globalmente para debugging
    window.signaturePadCliente = signaturePadCliente;
    
  } catch (error) {
    console.error('❌ Error al inicializar SignaturePad:', error);
    mostrarError('Error al inicializar el pad de firma: ' + error.message);
  }
}

// ===== FUNCIONES DE FIRMA =====
function limpiarFirma() {
  if (signaturePadCliente) {
    signaturePadCliente.clear();
    console.log('🧹 Firma del cliente limpiada');
    mostrarNotificacion('Firma limpiada', 'success');
  }
}

async function firmarContrato() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!signaturePadCliente) {
    mostrarNotificacion('Error: Pad de firma no inicializado', 'error');
    return;
  }
  
  // Verificar si el pad de firma está vacío
  if (signaturePadCliente.isEmpty()) {
    mostrarNotificacion('Por favor, firme en el área antes de continuar', 'error');
    return;
  }
  
  try {
    console.log('✍️ Guardando firma del cliente...');
    
    // Obtener la firma como imagen Base64
    const firmaBase64 = signaturePadCliente.toDataURL('image/png');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Verificar si ya tiene firma del representante
    const tieneFirmaRepresentante = contratoActual.firmaRepresentanteBase64;
    
    // Determinar el estado final
    let estadoFinal = 'Firmado';
    if (tieneFirmaRepresentante) {
      estadoFinal = 'Finalizado'; // Ambas firmas completadas
    }
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    const datosActualizados = {
      firmaClienteBase64: firmaBase64,
      fechaFirmaCliente: new Date(),
      estadoContrato: estadoFinal,
      fechaFirmaFinal: new Date(),
      contratoValido: true,
      esPreContrato: false,
      fechaCompletado: new Date(),
      ambasFirmasCompletadas: tieneFirmaRepresentante ? true : false
    };
    
    await updateDoc(contratoRef, datosActualizados);
    
    console.log('✅ Firma del cliente guardada exitosamente');
    console.log(`📋 Estado actualizado a: ${estadoFinal}`);
    
    // Mostrar mensaje de éxito
    mostrarMensajeExito();
    
    // Enviar email de confirmación
    await enviarEmailConfirmacion();
    
  } catch (error) {
    console.error('❌ Error al guardar firma del cliente:', error);
    mostrarNotificacion('Error al guardar la firma: ' + error.message, 'error');
  }
}

// ===== MOSTRAR MENSAJE DE ÉXITO =====
function mostrarMensajeExito() {
  contenido.style.display = 'none';
  success.style.display = 'block';
  
  // Scroll hacia arriba para mostrar el mensaje
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ENVIAR EMAIL DE CONFIRMACIÓN =====
async function enviarEmailConfirmacion() {
  try {
    console.log('📧 Enviando email de confirmación...');
    
    // Generar contenido del email de confirmación
    const asunto = `✅ Contrato Firmado - ${contratoActual.tituloContrato || contratoActual.codigoCotizacion}`;
    const mensaje = `
Estimado ${contratoActual.cliente?.nombre || 'Cliente'},

Su contrato ha sido firmado exitosamente.

Detalles del contrato:
- Título: ${contratoActual.tituloContrato || 'Sin título'}
- Código: ${contratoActual.codigoCotizacion || 'Sin código'}
- Valor: $${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}
- Fecha de firma: ${formatearFecha(new Date())}

Adjunto encontrará una copia del contrato firmado.

Saludos cordiales,
Equipo SUBE IA
www.subeia.tech
    `;
    
    // Enviar email al cliente
    await enviarEmail(contratoActual.cliente?.email, asunto, mensaje);
    
    // Enviar copia al administrador
    const asuntoAdmin = `📋 Contrato Firmado - ${contratoActual.cliente?.nombre} - ${contratoActual.codigoCotizacion}`;
    const mensajeAdmin = `
Se ha firmado un nuevo contrato:

Cliente: ${contratoActual.cliente?.nombre}
Empresa: ${contratoActual.cliente?.empresa}
Email: ${contratoActual.cliente?.email}
Contrato: ${contratoActual.tituloContrato}
Código: ${contratoActual.codigoCotizacion}
Valor: $${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}
Fecha: ${formatearFecha(new Date())}

El contrato está listo para ser marcado como finalizado.
    `;
    
    // Enviar al email del administrador (configurar en variables de entorno)
    await enviarEmail('admin@subeia.tech', asuntoAdmin, mensajeAdmin);
    
    console.log('✅ Emails de confirmación enviados');
    
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error);
  }
}

// ===== FUNCIÓN DE ENVÍO DE EMAIL =====
async function enviarEmail(destinatario, asunto, mensaje) {
  try {
    // Simular envío de email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📧 Enviando email:');
    console.log('   Destinatario:', destinatario);
    console.log('   Asunto:', asunto);
    console.log('   Mensaje:', mensaje);
    
    // En un entorno real, aquí se integraría con un servicio de email
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Firebase Functions + Nodemailer
    
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
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
  loading.style.display = 'none';
  error.style.display = 'block';
  error.textContent = mensaje;
}

function mostrarContenido() {
  loading.style.display = 'none';
  error.style.display = 'none';
  contenido.style.display = 'block';
}

// ===== RESPONSIVE DESIGN =====
window.addEventListener('resize', () => {
  if (signaturePadCliente) {
    signaturePadCliente.resizeCanvas();
  }
});

// ===== HACER FUNCIONES DISPONIBLES GLOBALMENTE =====
window.limpiarFirma = limpiarFirma;
window.firmarContrato = firmarContrato;
window.mostrarNotificacion = mostrarNotificacion; 