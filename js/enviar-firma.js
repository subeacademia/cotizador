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
  console.log('🚀 Inicializando sistema de envío de firma con EmailJS...');
  
  // Inicializar EmailJS
  inicializarEmailJS();
  
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

// ===== INICIALIZAR EMAILJS =====
function inicializarEmailJS() {
  try {
    console.log('🔧 Iniciando inicialización de EmailJS...');
    
    // Verificar si EmailJS está disponible
    if (typeof emailjs === 'undefined') {
      console.warn('⚠️ EmailJS no está cargado, cargando dinámicamente...');
      cargarEmailJS();
      return;
    }
    
    console.log('📧 EmailJS detectado, verificando versión...');
    console.log('📧 EmailJS version:', emailjs.version || 'No disponible');
    
    // Inicializar EmailJS con las credenciales proporcionadas
    console.log('🔑 Inicializando EmailJS con clave pública: jlnRLQBCJ1JiBM2bJ');
    emailjs.init('jlnRLQBCJ1JiBM2bJ');
    console.log('✅ EmailJS inicializado correctamente');
    
    // Verificar que la inicialización fue exitosa
    if (emailjs && typeof emailjs.send === 'function') {
      console.log('✅ EmailJS está inicializado y listo para enviar');
      console.log('✅ Función emailjs.send disponible');
    } else {
      console.warn('⚠️ EmailJS no se inicializó correctamente');
      console.warn('⚠️ emailjs.send no está disponible');
    }
    
    // Verificar que tenemos acceso a los servicios
    console.log('🔍 Verificando acceso a servicios de EmailJS...');
    
    // Probar la conexión con EmailJS
    testEmailJSConnection();
    
  } catch (error) {
    console.error('❌ Error al inicializar EmailJS:', error);
    console.error('❌ Detalles del error:', error.message);
  }
}

// ===== FUNCIÓN PARA PROBAR CONEXIÓN CON EMAILJS =====
async function testEmailJSConnection() {
  try {
    console.log('🧪 Probando conexión con EmailJS...');
    
    // Crear parámetros de prueba
    const testParams = {
      to_email: 'test@example.com',
      to_name: 'Test User',
      subject: 'Test Email',
      message: 'This is a test email'
    };
    
    console.log('🧪 Enviando email de prueba...');
    
    // Intentar enviar un email de prueba
    const response = await emailjs.send(
      'service_d0m6iqn',
      'template_im18rqj',
      testParams
    );
    
    console.log('✅ Conexión con EmailJS exitosa:', response);
    
  } catch (error) {
    console.error('❌ Error en conexión con EmailJS:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ Text:', error.text);
    
    if (error.status === 404) {
      console.error('❌ PROBLEMA: Cuenta de EmailJS no encontrada');
      console.error('❌ SOLUCIÓN: Verifica las credenciales en el dashboard de EmailJS');
      mostrarNotificacion('Error: Cuenta de EmailJS no encontrada. Verifica las credenciales en el dashboard.', 'error');
    }
  }
}

// ===== CARGAR EMAILJS DINÁMICAMENTE =====
function cargarEmailJS() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
  script.onload = function() {
    console.log('✅ EmailJS cargado dinámicamente');
    setTimeout(() => {
      inicializarEmailJS();
    }, 100);
  };
  script.onerror = function() {
    console.error('❌ Error al cargar EmailJS');
    mostrarNotificacion('Error al cargar EmailJS. El envío de emails no estará disponible.', 'error');
  };
  document.head.appendChild(script);
}

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
    mostrarError('Error al inicializar el sistema de envío: ' + error.message);
  }
}

// ===== CARGAR CONTRATO =====
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

// ===== LLENAR FORMULARIO CON DATOS DEL CLIENTE =====
function llenarFormularioCliente() {
  if (!contratoActual || !contratoActual.cliente) return;
  
  // Llenar email del cliente
  if (emailCliente && contratoActual.cliente.email) {
    emailCliente.value = contratoActual.cliente.email;
  }
  
  // Llenar asunto del email
  if (asuntoEmail) {
    asuntoEmail.value = `Firma de Contrato - ${contratoActual.codigoCotizacion || 'SUBE IA'}`;
  }
  
  // Llenar mensaje personalizado
  if (mensajeEmail) {
    const mensajePersonalizado = `Estimado ${contratoActual.cliente.nombre || 'cliente'},

Adjunto encontrará el link para firmar su contrato de manera digital y segura.

Por favor, haga clic en el enlace de abajo para acceder al sistema de firma:

[LINK DE FIRMA]

Una vez completada la firma, recibirá una copia del contrato firmado en su email.

Saludos cordiales,
Equipo SUBE IA`;
    
    mensajeEmail.value = mensajePersonalizado;
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
    
    // Guardar token en Firestore
    await guardarTokenFirma(tokenFirma);
    
    // Generar URL del link
    const baseUrl = window.location.origin;
    const linkCompleto = `${baseUrl}/firmar-contrato-cliente.html?token=${tokenFirma}&id=${contratoActual.id}`;
    
    linkFirmaGenerado = linkCompleto;
    
    // Mostrar link generado
    if (linkFirma) {
      linkFirma.value = linkCompleto;
    }
    
    // Mostrar sección del link
    if (linkGenerado) {
      linkGenerado.style.display = 'block';
    }
    
    // Habilitar botones de envío
    if (btnEnviarEmail) {
      btnEnviarEmail.disabled = false;
    }
    
    // Habilitar botón de envío manual
    const btnEnviarManual = document.getElementById('btn-enviar-manual');
    if (btnEnviarManual) {
      btnEnviarManual.disabled = false;
    }
    
    console.log('✅ Link de firma generado:', linkCompleto);
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
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      tokenFirma: token,
      fechaGeneracionToken: new Date(),
      linkFirmaActivo: true
    });
    
    console.log('✅ Token de firma guardado en Firestore');
    
  } catch (error) {
    console.error('❌ Error al guardar token de firma:', error);
    throw error;
  }
}

// ===== ENVIAR EMAIL CON EMAILJS =====
async function enviarEmailFirma() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!linkFirmaGenerado) {
    mostrarNotificacion('Error: Debe generar el link de firma primero', 'error');
    return;
  }
  
  const email = emailCliente.value.trim();
  const asunto = asuntoEmail.value.trim();
  const mensaje = mensajeEmail.value.trim();
  
  if (!email) {
    mostrarNotificacion('Error: Debe ingresar el email del cliente', 'error');
    return;
  }
  
  if (!asunto) {
    mostrarNotificacion('Error: Debe ingresar el asunto del email', 'error');
    return;
  }
  
  if (!mensaje) {
    mostrarNotificacion('Error: Debe ingresar el mensaje del email', 'error');
    return;
  }
  
  try {
    console.log('📧 Enviando email con EmailJS...');
    console.log('📧 Estado de EmailJS:', typeof emailjs);
    
    // Verificar que EmailJS esté disponible
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está disponible');
    }
    
    console.log('📧 EmailJS está disponible, verificando inicialización...');
    console.log('📧 emailjs.send disponible:', typeof emailjs.send);
    
    // Verificar que EmailJS esté inicializado
    if (!emailjs || typeof emailjs.send !== 'function') {
      console.log('🔄 Reinicializando EmailJS...');
      emailjs.init('jlnRLQBCJ1JiBM2bJ');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('🔄 EmailJS reinicializado');
    }
    
    // Preparar parámetros del template
    const templateParams = {
      to_email: email,
      to_name: contratoActual.cliente?.nombre || 'Cliente',
      subject: asunto,
      message: mensaje.replace('[LINK DE FIRMA]', linkFirmaGenerado),
      contract_code: contratoActual.codigoCotizacion || 'Sin código',
      contract_title: contratoActual.tituloContrato || 'Sin título',
      company_name: contratoActual.cliente?.empresa || 'Sin empresa',
      signature_link: linkFirmaGenerado
    };
    
    console.log('📋 Parámetros del email:', templateParams);
    console.log('🔑 Service ID: service_d0m6iqn');
    console.log('🔑 Template ID: template_im18rqj');
    
    // Enviar email usando EmailJS con método más robusto
    console.log('📧 Intentando envío con EmailJS...');
    
    // Método 1: Usar emailjs.sendForm (más confiable)
    const formData = new FormData();
    formData.append('service_id', 'service_d0m6iqn');
    formData.append('template_id', 'template_im18rqj');
    formData.append('user_id', 'jlnRLQBCJ1JiBM2bJ');
    
    // Agregar parámetros del template
    Object.keys(templateParams).forEach(key => {
      formData.append(key, templateParams[key]);
    });
    
    console.log('📧 Usando método emailjs.sendForm...');
    const response = await emailjs.sendForm(
      'service_d0m6iqn',
      'template_im18rqj',
      formData
    );
    
    console.log('✅ Email enviado exitosamente:', response);
    
    // Guardar registro del envío
    await guardarEnvioEmail(email, asunto, mensaje);
    
    // Mostrar notificación de éxito
    mostrarNotificacion('Email enviado exitosamente al cliente', 'success');
    
    // Deshabilitar botón para evitar envíos múltiples
    if (btnEnviarEmail) {
      btnEnviarEmail.disabled = true;
      btnEnviarEmail.textContent = 'Email Enviado ✅';
    }
    
  } catch (error) {
    console.error('❌ Error al enviar email con EmailJS:', error);
    
    // Mostrar error más específico
    let errorMessage = 'Error al enviar email';
    if (error.status === 404) {
      errorMessage = 'Error: Cuenta de EmailJS no encontrada. Verifica las credenciales.';
    } else if (error.status === 400) {
      errorMessage = 'Error: Parámetros incorrectos en el template de EmailJS.';
    } else if (error.text) {
      errorMessage = `Error: ${error.text}`;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    mostrarNotificacion(errorMessage, 'error');
    
    // Ofrecer método de fallback
    console.log('🔄 Ofreciendo método de fallback...');
    const usarFallback = confirm(`
      EmailJS no está funcionando. 
      
      ¿Deseas usar el método de envío manual?
      
      Esto abrirá tu cliente de email con el mensaje pre-rellenado.
    `);
    
    if (usarFallback) {
      await enviarEmailFallback(email, asunto, mensaje);
    }
  }
}

// ===== FUNCIÓN DE FALLBACK PARA ENVÍO DE EMAILS =====
async function enviarEmailFallback(email, asunto, mensaje) {
  try {
    console.log('📧 Usando método de fallback para envío de email...');
    
    // Crear un enlace mailto como fallback
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    
    // Mostrar instrucciones al usuario
    const instrucciones = `
      EmailJS no está funcionando. Para enviar el email manualmente:
      
      1. Se abrirá tu cliente de email predeterminado
      2. El email estará pre-rellenado con:
         - Para: ${email}
         - Asunto: ${asunto}
         - Mensaje: ${mensaje}
      
      3. Solo necesitas hacer clic en "Enviar"
      
      ¿Deseas continuar?
    `;
    
    if (confirm(instrucciones)) {
      // Abrir el cliente de email
      window.open(mailtoLink, '_blank');
      
      // Guardar registro del envío manual
      await guardarEnvioEmail(email, asunto, mensaje + ' (Enviado manualmente)');
      
      mostrarNotificacion('Cliente de email abierto. Por favor, envía el email manualmente.', 'success');
      
      // Deshabilitar botón
      if (btnEnviarEmail) {
        btnEnviarEmail.disabled = true;
        btnEnviarEmail.textContent = 'Email Manual ✅';
      }
    }
    
  } catch (error) {
    console.error('❌ Error en método de fallback:', error);
    mostrarNotificacion('Error en método de fallback: ' + error.message, 'error');
  }
}

// ===== GUARDAR REGISTRO DE ENVÍO =====
async function guardarEnvioEmail(email, asunto, mensaje) {
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      emailEnviado: true,
      fechaEnvioEmail: new Date(),
      emailDestinatario: email,
      asuntoEmail: asunto,
      mensajeEmail: mensaje,
      linkEnviado: linkFirmaGenerado
    });
    
    console.log('✅ Registro de envío guardado en Firestore');
    
  } catch (error) {
    console.error('❌ Error al guardar registro de envío:', error);
    // No lanzar error aquí para no interrumpir el flujo
  }
}

// ===== COPIAR LINK =====
function copiarLink() {
  if (!linkFirmaGenerado) {
    mostrarNotificacion('Error: No hay link generado para copiar', 'error');
    return;
  }
  
  try {
    // Usar la API moderna de clipboard
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(linkFirmaGenerado).then(() => {
        mostrarNotificacion('Link copiado al portapapeles', 'success');
      });
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = linkFirmaGenerado;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        mostrarNotificacion('Link copiado al portapapeles', 'success');
      } catch (err) {
        console.error('Error al copiar:', err);
        mostrarNotificacion('Error al copiar el link', 'error');
      }
      
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('❌ Error al copiar link:', error);
    mostrarNotificacion('Error al copiar el link: ' + error.message, 'error');
  }
}

// ===== VOLVER A CONTRATOS =====
function volverContratos() {
  window.location.href = 'contratos.html';
}

// ===== GENERAR TOKEN ÚNICO =====
function generarTokenUnico() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const token = `${timestamp}-${random}`;
  return token;
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
    month: 'long',
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
window.enviarEmailManual = enviarEmailManual; 

// ===== FUNCIÓN PARA ENVÍO MANUAL DE EMAIL =====
async function enviarEmailManual() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!linkFirmaGenerado) {
    mostrarNotificacion('Error: Debe generar el link de firma primero', 'error');
    return;
  }
  
  const email = emailCliente.value.trim();
  const asunto = asuntoEmail.value.trim();
  const mensaje = mensajeEmail.value.trim();
  
  if (!email) {
    mostrarNotificacion('Error: Debe ingresar el email del cliente', 'error');
    return;
  }
  
  if (!asunto) {
    mostrarNotificacion('Error: Debe ingresar el asunto del email', 'error');
    return;
  }
  
  if (!mensaje) {
    mostrarNotificacion('Error: Debe ingresar el mensaje del email', 'error');
    return;
  }
  
  console.log('📮 Iniciando envío manual de email...');
  await enviarEmailFallback(email, asunto, mensaje);
} 