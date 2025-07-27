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
});

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
  
  // En un entorno real, aquí se generaría el PDF
  // Por ahora, simulamos la descarga
  alert('Función de descarga de PDF en desarrollo. Use la función de imprimir para guardar como PDF.');
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