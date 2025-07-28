// Script para la vista previa de contratos

// Variables globales
let contratoActual = null;

// Elementos del DOM
const loadingPreview = document.getElementById('loading-preview');
const errorPreview = document.getElementById('error-preview');
const contenidoPreview = document.getElementById('contenido-preview');
const contratoTitulo = document.getElementById('contrato-titulo');
const contratoCodigo = document.getElementById('contrato-codigo');
const previewContent = document.getElementById('preview-content');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando vista previa del contrato...');
  
  // Verificar que html2pdf esté disponible
  if (typeof html2pdf === 'undefined') {
    console.log('⚠️ html2pdf aún no está cargado, esperando...');
    const checkHtml2pdf = setInterval(() => {
      if (typeof html2pdf !== 'undefined') {
        clearInterval(checkHtml2pdf);
        console.log('✅ html2pdf cargado correctamente');
        inicializarSistema();
      }
    }, 100);
  } else {
    console.log('✅ html2pdf ya está disponible');
    inicializarSistema();
  }
});

function inicializarSistema() {
  // Esperar a que Firebase esté disponible
  if (window.db) {
    inicializarPreview();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        inicializarPreview();
      }
    }, 100);
  }
}

// ===== INICIALIZACIÓN DEL SISTEMA =====
async function inicializarPreview() {
  try {
    // Obtener datos del contrato desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoData = urlParams.get('data');
    
    if (!contratoData) {
      mostrarError('No se proporcionaron datos del contrato');
      return;
    }
    
    console.log('📋 Cargando datos del contrato...');
    
    // Parsear datos del contrato
    contratoActual = JSON.parse(decodeURIComponent(contratoData));
    
    console.log('✅ Contrato cargado para preview:', contratoActual);
    
    // Renderizar vista previa
    renderizarPreview();
    
    // Mostrar contenido
    mostrarContenido();
    
  } catch (error) {
    console.error('❌ Error al inicializar preview:', error);
    mostrarError('Error al cargar el contrato: ' + error.message);
  }
}

// ===== RENDERIZAR VISTA PREVIA =====
function renderizarPreview() {
  if (!contratoActual) return;
  
  // Actualizar información del header
  const tituloContrato = contratoActual.estadoContrato === 'Firmado' ? 'Contrato de Servicios' : 'Pre-Contrato de Servicios';
  contratoTitulo.textContent = tituloContrato;
  contratoCodigo.textContent = contratoActual.codigoCotizacion || 'Sin código';
  
  // Generar contenido HTML del contrato
  const contenidoHTML = `
    <div class="contrato-header">
      <div class="contrato-logo">
        <div class="contrato-logo-icon">🤝</div>
        <div class="contrato-logo-text">SUBE IA TECH</div>
      </div>
      <h1 class="contrato-titulo">${contratoActual.estadoContrato === 'Firmado' ? 'Contrato de Servicios' : 'Pre-Contrato de Servicios'}</h1>
      <p class="contrato-codigo">Código: ${contratoActual.codigoCotizacion || 'Sin código'}</p>
    </div>
    
    <div class="contrato-seccion">
      <h3>📋 Información General</h3>
      <div class="contrato-info">
        <div class="info-item">
          <strong>Estado del Contrato:</strong>
          <span>${contratoActual.estadoContrato || 'Pendiente de Firma'}</span>
        </div>
        <div class="info-item">
          <strong>Fecha de Creación:</strong>
          <span>${formatearFecha(contratoActual.fechaCreacionContrato)}</span>
        </div>
        <div class="info-item">
          <strong>Atendido por:</strong>
          <span>${contratoActual.atendido || 'No especificado'}</span>
        </div>
        ${contratoActual.fechaInicio ? `
        <div class="info-item">
          <strong>Fecha de Inicio:</strong>
          <span>${formatearFecha(contratoActual.fechaInicio)}</span>
        </div>
        ` : ''}
        ${contratoActual.fechaFin ? `
        <div class="info-item">
          <strong>Fecha de Fin:</strong>
          <span>${formatearFecha(contratoActual.fechaFin)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <div class="contrato-seccion">
      <h3>👤 Información del Cliente</h3>
      <div class="contrato-info">
        <div class="info-item">
          <strong>Nombre:</strong>
          <span>${contratoActual.cliente?.nombre || 'No especificado'}</span>
        </div>
        <div class="info-item">
          <strong>Email:</strong>
          <span>${contratoActual.cliente?.email || 'No especificado'}</span>
        </div>
        <div class="info-item">
          <strong>RUT:</strong>
          <span>${contratoActual.cliente?.rut || 'No especificado'}</span>
        </div>
        <div class="info-item">
          <strong>Empresa:</strong>
          <span>${contratoActual.cliente?.empresa || 'No especificada'}</span>
        </div>
      </div>
    </div>
    
    <div class="contrato-seccion">
      <h3>💰 Información Financiera</h3>
      <div class="contrato-info">
        <div class="info-item">
          <strong>Valor Total:</strong>
          <span>$${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}</span>
        </div>
        ${contratoActual.descuento > 0 ? `
        <div class="info-item">
          <strong>Descuento Aplicado:</strong>
          <span>${contratoActual.descuento}%</span>
        </div>
        ` : ''}
        <div class="info-item">
          <strong>Moneda:</strong>
          <span>Pesos Chilenos (CLP)</span>
        </div>
      </div>
    </div>
    
    ${contratoActual.partesInvolucradas ? `
    <div class="contrato-seccion">
      <h3>🤝 Partes Involucradas</h3>
      <div class="contrato-detalle">
        <p>${contratoActual.partesInvolucradas}</p>
      </div>
    </div>
    ` : ''}
    
    ${contratoActual.objetoContrato ? `
    <div class="contrato-seccion">
      <h3>📄 Objeto del Contrato</h3>
      <div class="contrato-detalle">
        <p>${contratoActual.objetoContrato}</p>
      </div>
    </div>
    ` : ''}
    
    ${contratoActual.clausulas ? `
    <div class="contrato-seccion">
      <h3>📜 Cláusulas y Términos</h3>
      <div class="contrato-detalle">
        <p>${contratoActual.clausulas}</p>
      </div>
    </div>
    ` : ''}
    
    ${contratoActual.descripcionServicios ? `
    <div class="contrato-seccion">
      <h3>🔧 Descripción de Servicios</h3>
      <div class="contrato-detalle">
        <p>${contratoActual.descripcionServicios}</p>
      </div>
    </div>
    ` : ''}
    
    ${contratoActual.terminosCondiciones ? `
    <div class="contrato-seccion">
      <h3>📋 Términos y Condiciones</h3>
      <div class="contrato-detalle">
        <p>${contratoActual.terminosCondiciones}</p>
      </div>
    </div>
    ` : ''}
    
    ${(contratoActual.firmaRepresentanteBase64 || contratoActual.firmaClienteBase64) ? `
    <div class="contrato-seccion">
      <h3>✍️ Firmas</h3>
      <div class="contrato-firmas">
        ${contratoActual.firmaRepresentanteBase64 ? `
        <div class="firma-item">
          <h4>Representante Legal</h4>
          <img src="${contratoActual.firmaRepresentanteBase64}" alt="Firma del Representante" class="firma-imagen">
          <p><strong>${contratoActual.representanteLegal || 'No especificado'}</strong></p>
          <p class="firma-fecha">${formatearFecha(contratoActual.fechaFirmaRepresentante)}</p>
        </div>
        ` : ''}
        
        ${contratoActual.firmaClienteBase64 ? `
        <div class="firma-item">
          <h4>Cliente</h4>
          <img src="${contratoActual.firmaClienteBase64}" alt="Firma del Cliente" class="firma-imagen">
          <p><strong>${contratoActual.cliente?.nombre || 'No especificado'}</strong></p>
          <p class="firma-fecha">${formatearFecha(contratoActual.fechaFirmaCliente)}</p>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${contratoActual.estadoContrato === 'Firmado' ? `
    <div class="contrato-seccion">
      <h3>✅ Estado del Contrato</h3>
      <div class="contrato-detalle">
        <h4>Contrato Firmado</h4>
        <p>Este contrato ha sido firmado digitalmente por todas las partes involucradas y es válido legalmente.</p>
        <p><strong>Fecha de Firma Final:</strong> ${formatearFecha(contratoActual.fechaFirmaFinal)}</p>
        <p><strong>Contrato Válido:</strong> Sí</p>
      </div>
    </div>
    ` : ''}
  `;
  
  previewContent.innerHTML = contenidoHTML;
}

// ===== FUNCIONES DE PREVISUALIZACIÓN MEJORADAS =====
function previsualizarContrato() {
  console.log('👁️ Abriendo modal de previsualización mejorada...');
  
  if (!contratoActual) {
    alert('Error: No hay contrato cargado.');
    return;
  }
  
  // Llenar información del estado del contrato
  llenarEstadoContrato();
  
  // Llenar previsualización del contrato
  llenarPreviewContrato();
  
  // Llenar información de firmas
  llenarEstadoFirmas();
  
  // Actualizar estado de botones
  actualizarEstadoBotones();
  
  // Mostrar modal
  document.getElementById('modal-previsualizar').style.display = 'flex';
}

function llenarEstadoContrato() {
  const estadoInfo = document.getElementById('estado-contrato-info');
  
  const estadoHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <strong>Estado General:</strong>
        <span class="estado-badge ${contratoActual.estadoContrato === 'Firmado' ? 'completo' : 'pendiente'}">
          ${contratoActual.estadoContrato || 'Pendiente de Firma'}
        </span>
      </div>
      <div>
        <strong>Código:</strong> ${contratoActual.codigoCotizacion || 'Sin código'}
      </div>
      <div>
        <strong>Cliente:</strong> ${contratoActual.cliente?.nombre || 'No especificado'}
      </div>
      <div>
        <strong>Valor:</strong> $${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}
      </div>
    </div>
  `;
  
  estadoInfo.innerHTML = estadoHTML;
}

function llenarPreviewContrato() {
  const previewContent = document.getElementById('preview-contrato-content');
  
  // Generar el HTML del contrato completo
  const contenidoHTML = generarHTMLContrato(contratoActual);
  
  // Agregar sección de firmas al preview
  const firmasHTML = generarHTMLFirmas();
  
  // Mostrar el contenido del contrato con firmas
  const previewHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="max-height: 500px; overflow-y: auto;">
        ${contenidoHTML}
        ${firmasHTML}
      </div>
    </div>
    <div style="margin-top: 15px; text-align: center;">
      <button onclick="generarPDFPreview()" class="btn btn-primary" style="margin-right: 10px;">
        📄 Generar PDF
      </button>
      <button onclick="descargarPDFPreview()" class="btn btn-success">
        📥 Descargar PDF
      </button>
    </div>
  `;
  
  previewContent.innerHTML = previewHTML;
}

function llenarEstadoFirmas() {
  const firmasInfo = document.getElementById('firmas-info');
  
  const tieneFirmaRepresentante = !!contratoActual.firmaRepresentanteBase64;
  const tieneFirmaCliente = !!contratoActual.firmaClienteBase64;
  
  const firmasHTML = `
    <div class="firma-status ${tieneFirmaRepresentante ? 'completa' : 'faltante'}">
      <h5 style="margin: 0 0 10px 0;">Representante Legal</h5>
      ${tieneFirmaRepresentante ? `
        <img src="${contratoActual.firmaRepresentanteBase64}" alt="Firma del Representante" class="firma-imagen-preview">
        <p style="margin: 5px 0;"><strong>${contratoActual.representanteLegal || contratoActual.atendido || 'No especificado'}</strong></p>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">${formatearFecha(contratoActual.fechaFirmaRepresentante)}</p>
        <span class="estado-badge completo">✅ Firmado</span>
      ` : `
        <p style="margin: 10px 0; color: #666;">Firma pendiente</p>
        <span class="estado-badge faltante">❌ Falta Firma</span>
      `}
    </div>
    
    <div class="firma-status ${tieneFirmaCliente ? 'completa' : 'pendiente'}">
      <h5 style="margin: 0 0 10px 0;">Cliente</h5>
      ${tieneFirmaCliente ? `
        <img src="${contratoActual.firmaClienteBase64}" alt="Firma del Cliente" class="firma-imagen-preview">
        <p style="margin: 5px 0;"><strong>${contratoActual.cliente?.nombre || 'No especificado'}</strong></p>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">${formatearFecha(contratoActual.fechaFirmaCliente)}</p>
        <span class="estado-badge completo">✅ Firmado</span>
      ` : `
        <p style="margin: 10px 0; color: #666;">Esperando firma del cliente</p>
        <span class="estado-badge pendiente">⏳ Pendiente</span>
      `}
    </div>
  `;
  
  firmasInfo.innerHTML = firmasHTML;
}

function actualizarEstadoBotones() {
  const btnFirmaRepresentante = document.getElementById('btn-firma-representante');
  const btnLinkCliente = document.getElementById('btn-link-cliente');
  const btnEnviarEmail = document.getElementById('btn-enviar-email');
  
  const tieneFirmaRepresentante = !!contratoActual.firmaRepresentanteBase64;
  const tieneFirmaCliente = !!contratoActual.firmaClienteBase64;
  
  // Botón de firma del representante
  if (tieneFirmaRepresentante) {
    btnFirmaRepresentante.classList.add('disabled');
    btnFirmaRepresentante.onclick = null;
  } else {
    btnFirmaRepresentante.classList.remove('disabled');
    btnFirmaRepresentante.onclick = agregarFirmaRepresentante;
  }
  
  // Botón de envío al cliente
  if (!tieneFirmaRepresentante) {
    btnLinkCliente.classList.add('disabled');
    btnLinkCliente.onclick = null;
  } else {
    btnLinkCliente.classList.remove('disabled');
    btnLinkCliente.onclick = generarLinkFirmaCliente;
  }
  
  // Botón de envío por email
  if (!tieneFirmaRepresentante && !tieneFirmaCliente) {
    btnEnviarEmail.classList.add('disabled');
    btnEnviarEmail.onclick = null;
  } else {
    btnEnviarEmail.classList.remove('disabled');
    btnEnviarEmail.onclick = enviarPorEmail;
  }
}

// ===== NUEVAS FUNCIONES DE ACCIÓN =====
function agregarFirmaRepresentante() {
  console.log('✍️ Redirigiendo a firma del representante...');
  if (!contratoActual) {
    alert('Error: No hay contrato cargado.');
    return;
  }
  
  // Redirigir a la página de firma
          window.router.navigate(`/firmar-contrato?id=${contratoActual.id}`);
}

function generarLinkFirmaCliente() {
  console.log('🔗 Redirigiendo a generación de link para cliente...');
  if (!contratoActual) {
    alert('Error: No hay contrato cargado.');
    return;
  }
  
  // Redirigir a la página de envío de firma
          window.router.navigate(`/enviar-firma?id=${contratoActual.id}`);
}

function enviarPorEmail() {
  console.log('📧 Abriendo modal de envío por email...');
  
  if (!contratoActual) {
    alert('Error: No hay contrato cargado.');
    return;
  }
  
  // Llenar formulario con datos del cliente
  const emailDestinatario = document.getElementById('email-destinatario');
  const asuntoEmail = document.getElementById('asunto-email');
  const mensajeEmail = document.getElementById('mensaje-email');
  
  emailDestinatario.value = contratoActual.cliente?.email || '';
  
  const tituloContrato = contratoActual.tituloContrato || contratoActual.codigoCotizacion || 'Contrato';
  asuntoEmail.value = `${tituloContrato} - SUBE IA`;
  
  const nombreCliente = contratoActual.cliente?.nombre || 'Cliente';
  const valorTotal = (contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString();
  
  mensajeEmail.value = `Estimado ${nombreCliente},

Adjunto encontrará su contrato de servicios.

Detalles del contrato:
- Título: ${tituloContrato}
- Valor: $${valorTotal}
- Fecha de creación: ${formatearFecha(contratoActual.fechaCreacionContrato)}

Saludos cordiales,
Equipo SUBE IA`;
  
  // Mostrar modal de email
  document.getElementById('modal-email').style.display = 'flex';
}

function cerrarModalEmail() {
  document.getElementById('modal-email').style.display = 'none';
}

async function enviarEmailReal() {
  const email = document.getElementById('email-destinatario').value.trim();
  const asunto = document.getElementById('asunto-email').value.trim();
  const mensaje = document.getElementById('mensaje-email').value.trim();
  
  if (!email) {
    alert('Por favor, ingrese el email del destinatario.');
    return;
  }
  
  try {
    console.log('📧 Enviando email con EmailJS...');
    
    // Inicializar EmailJS
    emailjs.init('jlnRLQBCJ1JiBM2bJ');
    
    // Generar PDF del contrato
    const pdfBlob = await generarPDFBlob();
    
    // Preparar datos para EmailJS
    const templateParams = {
      to_email: email,
      to_name: contratoActual.cliente?.nombre || 'Cliente',
      subject: asunto,
      message: mensaje,
      contract_code: contratoActual.codigoCotizacion || 'Sin código',
      contract_value: `$${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}`,
      contract_date: formatearFecha(contratoActual.fechaCreacionContrato)
    };
    
    // Enviar email usando EmailJS
    const response = await emailjs.send(
      'service_d0m6iqn',
      'template_im18rqj',
      templateParams
    );
    
    console.log('✅ Email enviado exitosamente:', response);
    alert('✅ Email enviado exitosamente al cliente.');
    
    // Cerrar modal
    cerrarModalEmail();
    
    // Actualizar estado en Firestore
    await actualizarEstadoEnvioEmail(email, asunto);
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    alert('❌ Error al enviar email: ' + error.message);
  }
}

async function generarPDFBlob() {
  try {
    // Crear contenido HTML para PDF
    const contenidoHTML = generarHTMLContrato(contratoActual);
    
    // Crear elemento temporal
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contenidoHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.color = '#000';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.6';
    
    document.body.appendChild(tempDiv);
    
    // Generar PDF
    const pdfBlob = await html2pdf().from(tempDiv).outputPdf('blob');
    
    // Limpiar
    document.body.removeChild(tempDiv);
    
    return pdfBlob;
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    throw error;
  }
}

async function actualizarEstadoEnvioEmail(email, asunto) {
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
    
    console.log('✅ Estado de envío actualizado en Firestore');
    
  } catch (error) {
    console.error('❌ Error al actualizar estado de envío:', error);
  }
}

// Función para generar HTML del contrato directamente
function generarHTMLContrato(contratoData) {
  const {
    tituloContrato = 'Contrato de Servicios',
    codigoCotizacion = 'Sin código',
    estadoContrato = 'Pendiente de Firma',
    fechaCreacionContrato,
    atendido = 'No especificado',
    fechaInicio,
    fechaFin,
    cliente = {},
    totalConDescuento,
    total,
    descuento = 0,
    descripcionServicios,
    terminosCondiciones
  } = contratoData;

  const { nombre = 'No especificado', email = 'No especificado', rut = 'No especificado', empresa = 'No especificada' } = cliente;

  // Calcular total
  const totalFinal = totalConDescuento || total || 0;

  // Formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  return `
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #00B8D9; padding-bottom: 20px;">
    <h1 style="font-size:2.5rem;color:#23263A;font-weight:bold;margin:0;">SUBE IA TECH</h1>
    <h2 style="font-size:1.8rem;color:#23263A;font-weight:600;margin:10px 0;">${tituloContrato}</h2>
    <div style="color:#23263A;font-weight:bold;margin:10px 0;">
      <strong>Sube IA Tech Ltda.</strong><br>
      Fco. Mansilla 1007, Castro, Chile<br>
      RUT: 77.994.591-K<br>
      contacto@subeia.tech
    </div>
    <div style="color:#23263A;font-weight:bold;margin-top: 15px;">
      <span style="margin: 0 15px;"><b>Código:</b> <span style="font-family:monospace;color:#00B8D9;font-size:1.1em;">${codigoCotizacion}</span></span>
      <span style="margin: 0 15px;"><b>Estado:</b> <span style="color:#FF4EFF;">${estadoContrato}</span></span>
    </div>
  </div>

  <div style="color:#23263A;font-size:14px;line-height:1.6;">
    
    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📋 Información General</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
        <div style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Fecha de Creación:</strong><br>
          <span style="color:#64748b;">${formatearFecha(fechaCreacionContrato)}</span>
        </div>
        <div style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Atendido por:</strong><br>
          <span style="color:#64748b;">${atendido}</span>
        </div>
        ${fechaInicio ? `
        <div style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Fecha de Inicio:</strong><br>
          <span style="color:#64748b;">${formatearFecha(fechaInicio)}</span>
        </div>
        ` : ''}
        ${fechaFin ? `
        <div style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Fecha de Fin:</strong><br>
          <span style="color:#64748b;">${formatearFecha(fechaFin)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">👤 Información del Cliente</h3>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
          <div><strong>Nombre:</strong> ${nombre}</div>
          <div><strong>Email:</strong> ${email}</div>
          <div><strong>RUT:</strong> ${rut}</div>
          <div><strong>Empresa:</strong> ${empresa}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">💰 Información Financiera</h3>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>Valor Total del Contrato:</strong>
            ${descuento > 0 ? `<br><span style="color:#64748b;text-decoration:line-through;">$${(total || 0).toLocaleString()}</span>` : ''}
          </div>
          <div style="text-align:right;">
            <span style="font-size:1.2em;font-weight:bold;color:#00B8D9;">$${totalFinal.toLocaleString()}</span>
          </div>
        </div>
        ${descuento > 0 ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
          <strong>Descuento aplicado:</strong> ${descuento}%
        </div>
        ` : ''}
      </div>
    </div>

    ${descripcionServicios ? `
    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📝 Descripción de Servicios</h3>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;">
        <div style="white-space: pre-wrap;">${descripcionServicios}</div>
      </div>
    </div>
    ` : ''}

    ${terminosCondiciones ? `
    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📋 Términos y Condiciones</h3>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;">
        <div style="white-space: pre-wrap;">${terminosCondiciones}</div>
      </div>
    </div>
    ` : ''}
    
    ${generarHTMLFirmas()}
  </div>
  `;
}

// Función para generar HTML de las firmas
function generarHTMLFirmas() {
  const tieneFirmaRepresentante = !!contratoActual.firmaRepresentanteBase64;
  const tieneFirmaCliente = !!contratoActual.firmaClienteBase64;
  
  if (!tieneFirmaRepresentante && !tieneFirmaCliente) {
    return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">✍️ Firmas</h3>
      <div style="text-align: center; color: #64748b; padding: 20px;">
        <p>Este contrato aún no ha sido firmado.</p>
      </div>
    </div>
    `;
  }
  
  return `
  <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
    <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">✍️ Firmas</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div style="text-align: center;">
        <h4 style="color:#23263A;margin-bottom: 15px;">Representante Legal</h4>
        ${tieneFirmaRepresentante ? `
          <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <img src="${contratoActual.firmaRepresentanteBase64}" alt="Firma del Representante" style="max-width: 200px; max-height: 100px; margin-bottom: 10px;">
            <p style="margin: 5px 0; font-weight: bold;">${contratoActual.representanteLegal || contratoActual.atendido || 'No especificado'}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #64748b;">${formatearFecha(contratoActual.fechaFirmaRepresentante)}</p>
          </div>
        ` : `
          <div style="border: 1px dashed #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <p style="color: #64748b; margin: 0;">Firma pendiente</p>
          </div>
        `}
      </div>
      
      <div style="text-align: center;">
        <h4 style="color:#23263A;margin-bottom: 15px;">Cliente</h4>
        ${tieneFirmaCliente ? `
          <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <img src="${contratoActual.firmaClienteBase64}" alt="Firma del Cliente" style="max-width: 200px; max-height: 100px; margin-bottom: 10px;">
            <p style="margin: 5px 0; font-weight: bold;">${contratoActual.cliente?.nombre || 'No especificado'}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #64748b;">${formatearFecha(contratoActual.fechaFirmaCliente)}</p>
          </div>
        ` : `
          <div style="border: 1px dashed #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <p style="color: #64748b; margin: 0;">Firma pendiente</p>
          </div>
        `}
      </div>
    </div>
  </div>
  `;
}

function volverContratos() {
          window.router.navigate('/contratos');
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
  loadingPreview.style.display = 'none';
  errorPreview.style.display = 'block';
  errorPreview.textContent = mensaje;
}

function mostrarContenido() {
  loadingPreview.style.display = 'none';
  errorPreview.style.display = 'none';
  contenidoPreview.style.display = 'block';
}

// ===== FUNCIONES DE PDF =====
function generarPDF() {
  console.log('📄 Generando PDF desde modal...');
  // Cerrar modal y ejecutar descarga de PDF
  cerrarModalPrevisualizar();
  setTimeout(() => {
    descargarPDF();
  }, 300);
}

function descargarPDF() {
  console.log('📥 Descargando PDF...');
  
  // Verificar que contratoActual esté disponible
  if (!contratoActual) {
    console.error('❌ Datos del contrato no disponibles');
    alert('Error: No se pueden obtener los datos del contrato.');
    return;
  }
  
  console.log('📋 Datos del contrato disponibles:', contratoActual);
  
  try {
    // Método alternativo: Usar window.print() con contenido específico
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Generar contenido HTML para imprimir
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${contratoActual.estadoContrato === 'Firmado' ? 'Contrato' : 'Pre-Contrato'} - ${contratoActual.codigoCotizacion}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            color: #000;
            background: white;
            font-size: 12pt;
            line-height: 1.5;
          }
          .page {
            max-width: 21cm;
            margin: 0 auto;
            padding: 2cm;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28pt;
            font-weight: bold;
            margin: 0;
            color: #000;
          }
          .document-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 15px 0;
            color: #000;
          }
          .company-info {
            font-size: 11pt;
            margin: 10px 0;
            color: #000;
          }
          .contract-details {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 11pt;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .info-table td {
            padding: 8px;
            border: 1px solid #ccc;
            vertical-align: top;
          }
          .info-table td:first-child {
            font-weight: bold;
            width: 30%;
            background: #f9f9f9;
          }
          .services-section {
            margin: 20px 0;
          }
          .service-item {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ccc;
            background: #f9f9f9;
          }
          .service-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .service-description {
            margin-bottom: 5px;
          }
          .service-price {
            text-align: right;
            font-weight: bold;
          }
          .total-section {
            margin: 20px 0;
            text-align: right;
          }
          .subtotal {
            font-size: 11pt;
            margin-bottom: 5px;
          }
          .discount {
            font-size: 11pt;
            color: #666;
            margin-bottom: 5px;
          }
          .total {
            font-size: 14pt;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .terms-section {
            margin: 30px 0;
          }
          .terms-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
          }
          .terms-content {
            text-align: justify;
            margin-bottom: 15px;
          }
          .signatures-section {
            margin-top: 50px;
            page-break-inside: avoid;
          }
          .signature-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-box {
            width: 45%;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .signature-name {
            margin-bottom: 5px;
          }
          .signature-date {
            font-size: 10pt;
            color: #666;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 20px;
            font-size: 10pt;
            color: #666;
          }
          .page-number {
            text-align: center;
            margin-top: 20px;
            font-size: 10pt;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .page { padding: 0; }
            .signatures-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1 class="logo">SUBE IA TECH</h1>
            <h2 class="document-title">${contratoActual.estadoContrato === 'Firmado' ? 'CONTRATO DE SERVICIOS' : 'PRE-CONTRATO DE SERVICIOS'}</h2>
            <div class="company-info">
              <strong>Sube IA Tech Ltda.</strong><br>
              Fco. Mansilla 1007, Castro, Chile<br>
              RUT: 77.994.591-K | Email: contacto@subeia.tech
            </div>
            <div class="contract-details">
              <div><strong>Código:</strong> ${contratoActual.codigoCotizacion}</div>
              <div><strong>Estado:</strong> ${contratoActual.estadoContrato || 'Pendiente de Firma'}</div>
              <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">1. INFORMACIÓN DE LAS PARTES</h3>
            
            <h4 style="margin: 15px 0 10px 0; font-size: 12pt; font-weight: bold;">1.1 PRESTADOR DE SERVICIOS</h4>
            <table class="info-table">
              <tr>
                <td>Razón Social</td>
                <td>Sube IA Tech Ltda.</td>
              </tr>
              <tr>
                <td>RUT</td>
                <td>77.994.591-K</td>
              </tr>
              <tr>
                <td>Domicilio</td>
                <td>Fco. Mansilla 1007, Castro, Chile</td>
              </tr>
              <tr>
                <td>Email</td>
                <td>contacto@subeia.tech</td>
              </tr>
              <tr>
                <td>Representante</td>
                <td>${contratoActual.atendido || 'No especificado'}</td>
              </tr>
            </table>

            <h4 style="margin: 15px 0 10px 0; font-size: 12pt; font-weight: bold;">1.2 CLIENTE</h4>
            <table class="info-table">
              <tr>
                <td>Nombre/Razón Social</td>
                <td>${contratoActual.cliente?.nombre || 'No especificado'}</td>
              </tr>
              <tr>
                <td>RUT</td>
                <td>${contratoActual.cliente?.rut || 'No especificado'}</td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${contratoActual.cliente?.email || 'No especificado'}</td>
              </tr>
              <tr>
                <td>Empresa</td>
                <td>${contratoActual.cliente?.empresa || 'No especificada'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3 class="section-title">2. OBJETO DEL CONTRATO</h3>
            <div class="terms-content">
              El presente contrato tiene por objeto la prestación de servicios de desarrollo de software, consultoría tecnológica y servicios relacionados con inteligencia artificial por parte de Sube IA Tech Ltda. al cliente antes mencionado, conforme a las especificaciones y condiciones establecidas en este documento.
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">3. SERVICIOS CONTRATADOS</h3>
            ${contratoActual.descripcionServicios ? `
            <div class="services-section">
              <div class="service-item">
                <div class="service-title">Descripción de Servicios</div>
                <div class="service-description">${contratoActual.descripcionServicios}</div>
              </div>
            </div>
            ` : `
            <div class="services-section">
              <div class="service-item">
                <div class="service-title">Servicios de Desarrollo y Consultoría</div>
                <div class="service-description">Servicios de desarrollo de software, consultoría tecnológica y servicios relacionados con inteligencia artificial.</div>
              </div>
            </div>
            `}
          </div>

          <div class="section">
            <h3 class="section-title">4. VALOR Y FORMA DE PAGO</h3>
            <div class="total-section">
              ${contratoActual.descuento > 0 ? `
              <div class="subtotal">Subtotal: $${(contratoActual.total || 0).toLocaleString()}</div>
              <div class="discount">Descuento (${contratoActual.descuento}%): -$${((contratoActual.total || 0) * contratoActual.descuento / 100).toLocaleString()}</div>
              ` : ''}
              <div class="total">VALOR TOTAL: $${contratoActual.descuento > 0 ? (contratoActual.total - (contratoActual.total * contratoActual.descuento / 100)).toLocaleString() : (contratoActual.total || 0).toLocaleString()}</div>
            </div>
            
            <div class="terms-content" style="margin-top: 20px;">
              <strong>Condiciones de Pago:</strong><br>
              • 50% al momento de la firma del contrato<br>
              • 50% contra entrega de los servicios<br>
              • Forma de pago: Transferencia bancaria o depósito
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">5. PLAZOS Y ENTREGA</h3>
            <div class="terms-content">
              Los servicios serán entregados según los plazos acordados entre las partes. En caso de no especificarse fechas específicas, los servicios se entregarán en un plazo máximo de 30 días hábiles desde la firma del presente contrato.
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">6. OBLIGACIONES DE LAS PARTES</h3>
            
            <h4 style="margin: 15px 0 10px 0; font-size: 12pt; font-weight: bold;">6.1 OBLIGACIONES DEL PRESTADOR</h4>
            <div class="terms-content">
              • Ejecutar los servicios contratados con la calidad y profesionalismo requeridos<br>
              • Cumplir con los plazos establecidos<br>
              • Mantener la confidencialidad de la información del cliente<br>
              • Proporcionar soporte técnico durante la ejecución del proyecto
            </div>

            <h4 style="margin: 15px 0 10px 0; font-size: 12pt; font-weight: bold;">6.2 OBLIGACIONES DEL CLIENTE</h4>
            <div class="terms-content">
              • Proporcionar la información necesaria para la ejecución de los servicios<br>
              • Realizar los pagos en los plazos establecidos<br>
              • Colaborar en la revisión y aprobación de entregables<br>
              • Notificar oportunamente cualquier cambio en los requerimientos
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">7. CONFIDENCIALIDAD</h3>
            <div class="terms-content">
              Ambas partes se comprometen a mantener la confidencialidad de toda la información técnica, comercial y estratégica que se intercambie durante la ejecución del presente contrato, obligación que subsistirá por un período de 5 años después de la terminación del contrato.
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">8. PROPIEDAD INTELECTUAL</h3>
            <div class="terms-content">
              Los derechos de propiedad intelectual sobre los desarrollos realizados serán transferidos al cliente una vez cancelado el valor total del contrato. Sube IA Tech Ltda. mantendrá los derechos sobre las herramientas, librerías y componentes de uso general desarrollados.
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">9. TERMINACIÓN</h3>
            <div class="terms-content">
              El presente contrato podrá ser terminado por mutuo acuerdo o por incumplimiento de cualquiera de las partes. En caso de terminación anticipada, se procederá a la liquidación de los servicios ejecutados hasta la fecha de terminación.
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">10. DISPOSICIONES GENERALES</h3>
            <div class="terms-content">
              • Este contrato se rige por las leyes chilenas<br>
              • Cualquier controversia será resuelta en los tribunales de Castro, Chile<br>
              • Las modificaciones al contrato deben realizarse por escrito<br>
              • El contrato entra en vigencia desde la fecha de firma
            </div>
          </div>

          <div class="signatures-section">
            <h3 class="section-title">FIRMAS</h3>
            <div class="signature-grid">
              <div class="signature-box">
                <div class="signature-title">PRESTADOR DE SERVICIOS</div>
                <div class="signature-name">Sube IA Tech Ltda.</div>
                <div class="signature-name">Representante: ${contratoActual.atendido || 'No especificado'}</div>
                <div class="signature-date">Fecha: ${contratoActual.estadoContrato === 'Firmado' ? new Date().toLocaleDateString('es-CL') : '_________________'}</div>
                ${contratoActual.firmaRepresentanteBase64 ? `
                <div style="margin-top: 20px; text-align: center;">
                  <img src="${contratoActual.firmaRepresentanteBase64}" alt="Firma del Representante" style="max-width: 200px; max-height: 80px; border: 1px solid #ccc;">
                </div>
                ` : `
                <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; font-weight: bold;">
                  ${contratoActual.estadoContrato === 'Firmado' ? 'FIRMADO' : 'Firma'}
                </div>
                `}
              </div>
              <div class="signature-box">
                <div class="signature-title">CLIENTE</div>
                <div class="signature-name">${contratoActual.cliente?.nombre || 'No especificado'}</div>
                <div class="signature-name">RUT: ${contratoActual.cliente?.rut || 'No especificado'}</div>
                <div class="signature-date">Fecha: ${contratoActual.estadoContrato === 'Firmado' ? new Date().toLocaleDateString('es-CL') : '_________________'}</div>
                ${contratoActual.firmaClienteBase64 ? `
                <div style="margin-top: 20px; text-align: center;">
                  <img src="${contratoActual.firmaClienteBase64}" alt="Firma del Cliente" style="max-width: 200px; max-height: 80px; border: 1px solid #ccc;">
                </div>
                ` : `
                <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; font-weight: bold;">
                  ${contratoActual.estadoContrato === 'Firmado' ? 'FIRMADO' : 'Firma'}
                </div>
                `}
              </div>
            </div>
          </div>

          <div class="footer">
            <div>Documento generado el ${new Date().toLocaleDateString('es-CL')}</div>
            <div>Sube IA Tech Ltda. - Todos los derechos reservados</div>
          </div>

          <div class="page-number">
            Página 1 de 1
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Escribir contenido en la nueva ventana
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
    
    console.log('✅ Ventana de impresión abierta');
    
  } catch (error) {
    console.error('❌ Error en descargarPDF:', error);
    alert('Error al generar PDF. Por favor, inténtalo de nuevo.');
  }
}

// ===== FUNCIONES DE PDF PREVIEW =====
async function generarPDFPreview() {
  try {
    console.log('📄 Generando PDF preview...');
    
    // Generar el HTML del contrato
    const contenidoHTML = generarHTMLContrato(contratoActual);
    
    // Crear un elemento temporal para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contenidoHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '20px';
    document.body.appendChild(tempDiv);
    
    // Configuración de html2pdf
    const opt = {
      margin: 10,
      filename: `contrato-${contratoActual.codigoCotizacion || contratoActual.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar PDF
    await html2pdf().set(opt).from(tempDiv).save();
    
    // Limpiar elemento temporal
    document.body.removeChild(tempDiv);
    
    console.log('✅ PDF generado exitosamente');
    mostrarNotificacion('PDF generado exitosamente', 'success');
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
  }
}

async function descargarPDFPreview() {
  try {
    console.log('📥 Descargando PDF...');
    
    // Generar el HTML del contrato
    const contenidoHTML = generarHTMLContrato(contratoActual);
    
    // Crear un elemento temporal para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contenidoHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '20px';
    document.body.appendChild(tempDiv);
    
    // Configuración de html2pdf
    const opt = {
      margin: 10,
      filename: `contrato-${contratoActual.codigoCotizacion || contratoActual.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar y descargar PDF
    await html2pdf().set(opt).from(tempDiv).save();
    
    // Limpiar elemento temporal
    document.body.removeChild(tempDiv);
    
    console.log('✅ PDF descargado exitosamente');
    mostrarNotificacion('PDF descargado exitosamente', 'success');
    
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error);
    mostrarNotificacion('Error al descargar PDF: ' + error.message, 'error');
  }
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

// ===== HACER FUNCIONES DISPONIBLES GLOBALMENTE =====
window.previsualizarContrato = previsualizarContrato;
window.cerrarModalPrevisualizar = cerrarModalPrevisualizar;
window.cerrarModalEmail = cerrarModalEmail;
window.agregarFirmaRepresentante = agregarFirmaRepresentante;
window.generarLinkFirmaCliente = generarLinkFirmaCliente;
window.enviarPorEmail = enviarPorEmail;
window.enviarEmailReal = enviarEmailReal;
window.generarPDF = generarPDF;
window.descargarPDF = descargarPDF;
window.generarPDFPreview = generarPDFPreview;
window.descargarPDFPreview = descargarPDFPreview;
window.mostrarNotificacion = mostrarNotificacion;
window.volverContratos = volverContratos;

// Verificar que las funciones estén disponibles
console.log('✅ Funciones globales configuradas:', {
  previsualizarContrato: typeof window.previsualizarContrato,
  cerrarModalPrevisualizar: typeof window.cerrarModalPrevisualizar,
  cerrarModalEmail: typeof window.cerrarModalEmail,
  agregarFirmaRepresentante: typeof window.agregarFirmaRepresentante,
  generarLinkFirmaCliente: typeof window.generarLinkFirmaCliente,
  enviarPorEmail: typeof window.enviarPorEmail,
  enviarEmailReal: typeof window.enviarEmailReal,
  generarPDF: typeof window.generarPDF,
  descargarPDF: typeof window.descargarPDF,
  volverContratos: typeof window.volverContratos
});