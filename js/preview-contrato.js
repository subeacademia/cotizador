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
  contratoTitulo.textContent = contratoActual.tituloContrato || 'Sin título';
  contratoCodigo.textContent = contratoActual.codigoCotizacion || 'Sin código';
  
  // Generar contenido HTML del contrato
  const contenidoHTML = `
    <div class="contrato-header">
      <div class="contrato-logo">
        <div class="contrato-logo-icon">🤝</div>
        <div class="contrato-logo-text">SUBE IA TECH</div>
      </div>
      <h1 class="contrato-titulo">${contratoActual.tituloContrato || 'Contrato de Servicios'}</h1>
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

// ===== FUNCIONES DE ACCIÓN =====
function imprimirContrato() {
  console.log('🖨️ Imprimiendo contrato...');
  window.print();
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
  
  // Debug: Mostrar información básica
  alert(`Debug: Generando PDF\nTítulo: ${contratoActual.tituloContrato}\nCódigo: ${contratoActual.codigoCotizacion}\nCliente: ${contratoActual.cliente?.nombre}\nTotal: $${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}`);
  
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
               <div class="total">VALOR TOTAL: $${(contratoActual.totalConDescuento || contratoActual.total || 0).toLocaleString()}</div>
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
                 <div class="signature-date">Fecha: _________________</div>
                 <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 10px;">
                   Firma
                 </div>
               </div>
               <div class="signature-box">
                 <div class="signature-title">CLIENTE</div>
                 <div class="signature-name">${contratoActual.cliente?.nombre || 'No especificado'}</div>
                 <div class="signature-name">RUT: ${contratoActual.cliente?.rut || 'No especificado'}</div>
                 <div class="signature-date">Fecha: _________________</div>
                 <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 10px;">
                   Firma
                 </div>
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
            ${descuento > 0 ? `<br><span style="color:#FF4EFF;font-weight:bold;">Con ${descuento}% descuento</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    ${descripcionServicios ? `
    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📝 Descripción de Servicios</h3>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;white-space:pre-wrap;">
        ${descripcionServicios}
      </div>
    </div>
    ` : ''}

    ${terminosCondiciones ? `
    <div style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📋 Términos y Condiciones</h3>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;white-space:pre-wrap;">
        ${terminosCondiciones}
      </div>
    </div>
    ` : ''}

  </div>

  <div style="margin-top: 40px;text-align: center;border-top: 3px solid #00B8D9;padding-top: 20px;color:#23263A;">
    <div style="font-weight:bold;margin-bottom: 10px;">Sube IA Tech Ltda.</div>
    <div style="font-size:0.9em;color:#64748b;margin-bottom: 15px;">
      contacto@subeia.tech &mdash; Fco. Mansilla 1007, Castro, Chile
    </div>
    <div style="font-size:0.8em;color:#64748b;">
      Documento generado el ${new Date().toLocaleDateString('es-CL')}
    </div>
  </div>
  `;
}



function volverContratos() {
  window.location.href = 'contratos.html';
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

// ===== HACER FUNCIONES DISPONIBLES GLOBALMENTE =====
window.imprimirContrato = imprimirContrato;
window.descargarPDF = descargarPDF;
window.volverContratos = volverContratos;

// Verificar que las funciones estén disponibles
console.log('✅ Funciones globales configuradas:', {
  imprimirContrato: typeof window.imprimirContrato,
  descargarPDF: typeof window.descargarPDF,
  volverContratos: typeof window.volverContratos
}); 