// Variables globales
let contratoActual = null;
let linkFirmaGenerado = null;

// Elementos del DOM
const loadingEnviar = document.getElementById('loading-enviar');
const errorEnviar = document.getElementById('error-enviar');
const contenidoEnviar = document.getElementById('contenido-enviar');
const resumenContrato = document.getElementById('resumen-contrato');
const emailCliente = document.getElementById('email-cliente');
const asuntoEmail = document.getElementById('asunto-email');
const mensajeEmail = document.getElementById('mensaje-email');
const linkGenerado = document.getElementById('link-generado');
const linkFirma = document.getElementById('link-firma');
const btnEnviarEmail = document.getElementById('btn-enviar-email');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando sistema de envío de firma...');
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    inicializarEnviarFirma();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        inicializarEnviarFirma();
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
async function inicializarEnviarFirma() {
  try {
    // Obtener ID del contrato desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');
    
    if (!contratoId) {
      mostrarError('No se proporcionó ID de contrato');
      return;
    }
    
    console.log('📋 Cargando contrato para envío:', contratoId);
    
    // Cargar datos del contrato
    await cargarContrato(contratoId);
    
    // Llenar formulario con datos del cliente
    llenarFormularioCliente();
    
    // Mostrar contenido
    mostrarContenido();
    
  } catch (error) {
    console.error('❌ Error al inicializar envío de firma:', error);
    mostrarError('Error al inicializar el sistema de envío');
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
    
    console.log('✅ Contrato cargado para envío:', contratoActual);
    
    // Renderizar resumen del contrato
    renderizarResumenContrato();
    
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
  `;
  
  resumenContrato.innerHTML = resumenHTML;
}

// ===== LLENAR FORMULARIO CON DATOS DEL CLIENTE =====
function llenarFormularioCliente() {
  if (contratoActual && contratoActual.cliente) {
    emailCliente.value = contratoActual.cliente.email || '';
    
    // Personalizar asunto con información del contrato
    const tituloContrato = contratoActual.tituloContrato || contratoActual.codigoCotizacion || 'Contrato';
    asuntoEmail.value = `Firma de ${tituloContrato} - SUBE IA`;
    
    // Personalizar mensaje con información del cliente
    const nombreCliente = contratoActual.cliente.nombre || 'Cliente';
    const empresaCliente = contratoActual.cliente.empresa || '';
    const valorTotal = (contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString();
    
    mensajeEmail.value = `Estimado ${nombreCliente}${empresaCliente ? ` de ${empresaCliente}` : ''},

Adjunto encontrará el link para firmar su contrato de manera digital y segura.

Detalles del contrato:
- Título: ${tituloContrato}
- Valor: $${valorTotal}
- Fecha de creación: ${formatearFecha(contratoActual.fechaCreacionContrato)}

Por favor, haga clic en el enlace de abajo para acceder al sistema de firma:

[LINK DE FIRMA]

Una vez completada la firma, recibirá una copia del contrato firmado en su email.

Saludos cordiales,
Equipo SUBE IA`;
  }
}

// ===== GENERAR LINK DE FIRMA =====
async function generarLinkFirma() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  try {
    console.log('🔗 Generando link de firma...');
    
    // Generar token único para el link
    const tokenFirma = generarTokenUnico();
    
    // Crear el link de firma
    const baseUrl = window.location.origin;
    linkFirmaGenerado = `${baseUrl}/firmar-contrato-cliente.html?id=${contratoActual.id}&token=${tokenFirma}`;
    
    // Guardar el token en Firestore
    await guardarTokenFirma(tokenFirma);
    
    // Mostrar el link generado
    linkFirma.value = linkFirmaGenerado;
    linkGenerado.style.display = 'block';
    btnEnviarEmail.disabled = false;
    
    console.log('✅ Link de firma generado:', linkFirmaGenerado);
    mostrarNotificacion('Link de firma generado exitosamente', 'success');
    
  } catch (error) {
    console.error('❌ Error al generar link de firma:', error);
    mostrarNotificacion('Error al generar el link de firma: ' + error.message, 'error');
  }
}

// ===== GUARDAR TOKEN DE FIRMA =====
async function guardarTokenFirma(token) {
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato con el token de firma
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      tokenFirma: token,
      fechaGeneracionToken: new Date(),
      linkFirmaGenerado: true
    });
    
    console.log('✅ Token de firma guardado en Firestore');
    
  } catch (error) {
    console.error('❌ Error al guardar token de firma:', error);
    throw error;
  }
}

// ===== ENVIAR EMAIL DE FIRMA =====
async function enviarEmailFirma() {
  if (!contratoActual || !linkFirmaGenerado) {
    mostrarNotificacion('Error: No hay contrato o link de firma disponible', 'error');
    return;
  }
  
  const email = emailCliente.value.trim();
  const asunto = asuntoEmail.value.trim();
  const mensaje = mensajeEmail.value.trim();
  
  if (!email) {
    mostrarNotificacion('Por favor, ingrese el email del cliente', 'error');
    return;
  }
  
  try {
    console.log('📧 Enviando email de firma...');
    
    // Reemplazar placeholder del link en el mensaje
    const mensajeConLink = mensaje.replace('[LINK DE FIRMA]', linkFirmaGenerado);
    
    // Guardar información del envío en Firestore
    await guardarEnvioEmail(email, asunto, mensajeConLink);
    
    // Simular envío de email (aquí se integraría con un servicio de email real)
    await simularEnvioEmail(email, asunto, mensajeConLink);
    
    console.log('✅ Email de firma enviado exitosamente');
    mostrarNotificacion('Email de firma enviado exitosamente al cliente', 'success');
    
    // Redirigir de vuelta a contratos después de 2 segundos
    setTimeout(() => {
      window.location.href = 'contratos.html';
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error al enviar email de firma:', error);
    mostrarNotificacion('Error al enviar el email: ' + error.message, 'error');
  }
}

// ===== GUARDAR ENVÍO DE EMAIL =====
async function guardarEnvioEmail(email, asunto, mensaje) {
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato con información del envío
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      emailEnviado: email,
      asuntoEmail: asunto,
      fechaEnvioEmail: new Date(),
      estadoContrato: 'Enviado'
    });
    
    console.log('✅ Información de envío guardada en Firestore');
    
  } catch (error) {
    console.error('❌ Error al guardar información de envío:', error);
    throw error;
  }
}

// ===== SIMULAR ENVÍO DE EMAIL =====
async function simularEnvioEmail(email, asunto, mensaje) {
  // Simular delay de envío
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('📧 Simulando envío de email:');
  console.log('   Destinatario:', email);
  console.log('   Asunto:', asunto);
  console.log('   Mensaje:', mensaje);
  
  // En un entorno real, aquí se integraría con un servicio como:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Firebase Functions + Nodemailer
}

// ===== COPIAR LINK =====
function copiarLink() {
  if (!linkFirmaGenerado) {
    mostrarNotificacion('No hay link generado para copiar', 'error');
    return;
  }
  
  navigator.clipboard.writeText(linkFirmaGenerado).then(() => {
    mostrarNotificacion('Link copiado al portapapeles', 'success');
  }).catch(() => {
    // Fallback para navegadores que no soportan clipboard API
    linkFirma.select();
    document.execCommand('copy');
    mostrarNotificacion('Link copiado al portapapeles', 'success');
  });
}

// ===== VOLVER A CONTRATOS =====
function volverContratos() {
  window.location.href = 'contratos.html';
}

// ===== FUNCIONES DE UTILIDAD =====
function generarTokenUnico() {
  // Generar un token único de 32 caracteres
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
}

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
  loadingEnviar.style.display = 'none';
  errorEnviar.style.display = 'block';
  errorEnviar.textContent = mensaje;
}

function mostrarContenido() {
  loadingEnviar.style.display = 'none';
  errorEnviar.style.display = 'none';
  contenidoEnviar.style.display = 'block';
}

// ===== HACER FUNCIONES DISPONIBLES GLOBALMENTE =====
window.generarLinkFirma = generarLinkFirma;
window.enviarEmailFirma = enviarEmailFirma;
window.copiarLink = copiarLink;
window.volverContratos = volverContratos;
window.mostrarNotificacion = mostrarNotificacion; 