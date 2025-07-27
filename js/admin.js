// Importaciones
import { renderInvoice } from '../templates/invoice-template.js';

// Variables globales
let cotizaciones = [];

// Elementos del DOM
const cotizacionesList = document.getElementById('cotizaciones-list');
const totalCotizaciones = document.getElementById('total-cotizaciones');
const cotizacionesMes = document.getElementById('cotizaciones-mes');
const valorTotal = document.getElementById('valor-total');
const filtroFecha = document.getElementById('filtro-fecha');
const filtroAtendedor = document.getElementById('filtro-atendedor');
const aplicarFiltros = document.getElementById('aplicar-filtros');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando panel de administración...');
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    cargarCotizaciones();
    setupEventListeners();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
  cargarCotizaciones();
  setupEventListeners();
      }
    }, 100);
  }
});

// Configurar event listeners
function setupEventListeners() {
  if (aplicarFiltros) {
    aplicarFiltros.addEventListener('click', filtrarCotizaciones);
  }
  
  // Configurar buscador en tiempo real
  const buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', buscarEnTiempoReal);
    console.log('✅ Buscador configurado');
  }
}

// Cargar cotizaciones desde Firestore
async function cargarCotizaciones() {
  try {
    console.log('🔄 Cargando cotizaciones...');
    mostrarLoading(true);
    
    // Usar la nueva API de Firestore
    const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const q = query(
      collection(window.db, 'cotizaciones'),
      orderBy('fechaTimestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    console.log(`📊 Snapshot obtenido: ${snapshot.size} documentos`);
    
    if (snapshot.empty) {
      console.log('📭 No hay cotizaciones disponibles');
      cotizaciones = [];
      mostrarLoading(false);
      mostrarNoData(true);
      actualizarEstadisticas();
      return;
    }
    
    cotizaciones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fechaTimestamp?.toDate() || new Date()
    }));
    
    console.log(`✅ ${cotizaciones.length} cotizaciones cargadas`);
    
    actualizarEstadisticas();
    renderizarCotizaciones();
    mostrarLoading(false);
    mostrarNoData(false);
    
  } catch (error) {
    console.error('❌ Error al cargar cotizaciones:', error);
    alert('Error al cargar las cotizaciones. Por favor, inténtalo de nuevo.');
    mostrarLoading(false);
    mostrarNoData(true);
  }
}

function mostrarLoading(mostrar) {
  if (cotizacionesList) {
    if (mostrar) {
      cotizacionesList.innerHTML = '<div class="loading">Cargando cotizaciones...</div>';
  }
  }
}

function mostrarNoData(mostrar) {
  if (cotizacionesList && mostrar) {
    cotizacionesList.innerHTML = '<div class="no-data">No hay cotizaciones disponibles</div>';
  }
}

function actualizarEstadisticas() {
  const total = cotizaciones.length;
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  
  const delMes = cotizaciones.filter(c => c.fecha >= inicioMes).length;
  const valorTotalCalculado = cotizaciones.reduce((sum, c) => sum + (c.totalConDescuento || 0), 0);
  
  if (totalCotizaciones) totalCotizaciones.textContent = total;
  if (cotizacionesMes) cotizacionesMes.textContent = delMes;
  if (valorTotal) valorTotal.textContent = `$${valorTotalCalculado.toLocaleString()}`;
}

function renderizarCotizaciones() {
  if (!cotizacionesList) return;
  
  if (cotizaciones.length === 0) {
    cotizacionesList.innerHTML = '<div class="no-data">No hay cotizaciones disponibles</div>';
    return;
  }
  
  const html = cotizaciones.map(cotizacion => `
    <div class="cotizacion-card">
      <div class="cotizacion-header">
        <h3>${cotizacion.codigo}</h3>
        <span class="fecha">${formatearFecha(cotizacion.fecha)}</span>
      </div>
      <div class="cotizacion-body">
        <p><strong>Cliente:</strong> ${cotizacion.nombre}</p>
        <p><strong>Empresa:</strong> ${cotizacion.empresa}</p>
        <p><strong>Atendido por:</strong> ${cotizacion.atendido}</p>
        <p><strong>Total:</strong> $${(cotizacion.totalConDescuento || 0).toLocaleString()}</p>
      </div>
      <div class="cotizacion-actions">
        <button onclick="previsualizarCotizacion('${cotizacion.id}')" class="btn btn-preview">👁️ Previsualizar</button>
        <button onclick="generarPDFAlternativo('${cotizacion.id}')" class="btn btn-pdf">📄 PDF</button>
        <button onclick="verDetalles('${cotizacion.id}')" class="btn btn-details">📋 Ver</button>
      </div>
    </div>
  `).join('');
  
  cotizacionesList.innerHTML = html;
}

function filtrarCotizaciones() {
  const filtroFechaValor = filtroFecha?.value || 'todos';
  const filtroAtendedorValor = filtroAtendedor?.value || 'todos';
  
  let cotizacionesFiltradas = [...cotizaciones];
  
  // Filtrar por fecha
  if (filtroFechaValor !== 'todos') {
    const ahora = new Date();
    let fechaInicio;
    
    switch (filtroFechaValor) {
      case 'hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        break;
      case 'semana':
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
    }
    
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => c.fecha >= fechaInicio);
  }
  
  // Filtrar por atendido
  if (filtroAtendedorValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => c.atendido === filtroAtendedorValor);
  }
  
  // Renderizar cotizaciones filtradas
  renderizarCotizacionesFiltradas(cotizacionesFiltradas);
}

// Función de búsqueda en tiempo real
function buscarEnTiempoReal(event) {
  const termino = event.target.value.toLowerCase().trim();
  console.log('🔍 Buscando:', termino);
  console.log('🔍 Total de cotizaciones disponibles:', cotizaciones.length);
  
  if (cotizaciones.length === 0) {
    console.log('⚠️ No hay cotizaciones cargadas para buscar');
    return;
  }
  
  if (termino === '') {
    // Si no hay término de búsqueda, aplicar solo filtros
    filtrarCotizaciones();
    return;
  }
  
  // Obtener cotizaciones filtradas por fecha y atendido
  let cotizacionesFiltradas = [...cotizaciones];
  
  const filtroFechaValor = filtroFecha?.value || 'todos';
  const filtroAtendedorValor = filtroAtendedor?.value || 'todos';
  
  // Aplicar filtros de fecha y atendido
  if (filtroFechaValor !== 'todos') {
    const ahora = new Date();
    let fechaInicio;
    
    switch (filtroFechaValor) {
      case 'hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        break;
      case 'semana':
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
    }
    
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => c.fecha >= fechaInicio);
  }
  
  if (filtroAtendedorValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => c.atendido === filtroAtendedorValor);
  }
  
  // Aplicar búsqueda en tiempo real - BUSQUEDA COMPLETA EN TODAS LAS VARIABLES
  const cotizacionesBuscadas = cotizacionesFiltradas.filter(cotizacion => {
    // Convertir toda la cotización a string para búsqueda completa
    const cotizacionString = JSON.stringify(cotizacion).toLowerCase();
    
    // Búsqueda específica en campos principales
    const busquedaEspecifica = (
      cotizacion.codigo?.toLowerCase().includes(termino) ||
      cotizacion.nombre?.toLowerCase().includes(termino) ||
      cotizacion.empresa?.toLowerCase().includes(termino) ||
      cotizacion.email?.toLowerCase().includes(termino) ||
      cotizacion.atendido?.toLowerCase().includes(termino) ||
      cotizacion.rut?.toLowerCase().includes(termino) ||
      (cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString('es-CL').toLowerCase() : '').includes(termino) ||
      cotizacion.total?.toString().includes(termino) ||
      cotizacion.totalConDescuento?.toString().includes(termino) ||
      cotizacion.descuento?.toString().includes(termino) ||
      cotizacion.notas?.toLowerCase().includes(termino)
    );
    
    // Búsqueda en servicios
    const busquedaServicios = cotizacion.servicios?.some(servicio => 
      servicio.nombre?.toLowerCase().includes(termino) ||
      servicio.detalle?.toLowerCase().includes(termino) ||
      servicio.modalidad?.toLowerCase().includes(termino) ||
      servicio.tipoCobro?.toLowerCase().includes(termino) ||
      servicio.cantidad?.toString().includes(termino) ||
      servicio.valorUnitario?.toString().includes(termino) ||
      servicio.subtotal?.toString().includes(termino)
    );
    
    // Búsqueda completa en toda la estructura
    const busquedaCompleta = cotizacionString.includes(termino);
    
    return busquedaEspecifica || busquedaServicios || busquedaCompleta;
  });
  
  console.log(`🔍 Búsqueda completada: ${cotizacionesBuscadas.length} resultados`);
  console.log('🔍 Resultados encontrados:', cotizacionesBuscadas.map(c => c.codigo));
  renderizarCotizacionesFiltradas(cotizacionesBuscadas);
}

// Función para renderizar cotizaciones filtradas
function renderizarCotizacionesFiltradas(cotizacionesFiltradas) {
  if (cotizacionesList) {
    if (cotizacionesFiltradas.length === 0) {
      cotizacionesList.innerHTML = '<div class="no-data">No hay cotizaciones que coincidan con los filtros</div>';
    } else {
      const html = cotizacionesFiltradas.map(cotizacion => `
        <div class="cotizacion-card">
          <div class="cotizacion-header">
            <h3>${cotizacion.codigo}</h3>
            <span class="fecha">${formatearFecha(cotizacion.fecha)}</span>
          </div>
          <div class="cotizacion-body">
            <div class="cliente-info">
              <p><strong>👤 Cliente:</strong> ${cotizacion.nombre || 'No especificado'}</p>
              <p><strong>🏢 Empresa:</strong> ${cotizacion.empresa || 'No especificada'}</p>
              <p><strong>📧 Email:</strong> ${cotizacion.email || 'No especificado'}</p>
              <p><strong>🆔 RUT:</strong> ${cotizacion.rut || 'No especificado'}</p>
            </div>
            <p><strong>👨‍💼 Atendido por:</strong> ${cotizacion.atendido || 'No especificado'}</p>
            <div class="total-info">
              <strong>💰 Total:</strong> $${(cotizacion.totalConDescuento || cotizacion.total || 0).toLocaleString()}
              ${cotizacion.descuento > 0 ? `<br><small>Descuento: ${cotizacion.descuento}%</small>` : ''}
            </div>
          </div>
          <div class="cotizacion-actions">
            <button onclick="generarPDFAlternativo('${cotizacion.id}')" class="btn btn-pdf">📄 PDF</button>
            <button onclick="verDetalles('${cotizacion.id}')" class="btn btn-details">👁️ Ver</button>
            <button onclick="previsualizarCotizacion('${cotizacion.id}')" class="btn btn-preview">👁️ Previsualizar</button>
          </div>
        </div>
      `).join('');
      
      cotizacionesList.innerHTML = html;
    }
  }
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

// Función para generar PDF
async function generarPDF(cotizacionId) {
  try {
    console.log('📄 Generando PDF para cotización:', cotizacionId);
    console.log('📄 Cotizaciones disponibles:', cotizaciones.length);
    
    const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
    if (!cotizacion) {
      console.error('❌ Cotización no encontrada en el array local');
      alert('Cotización no encontrada');
      return;
    }
    
    console.log('📄 Datos de cotización encontrados:', cotizacion);
    
    // Verificar que todos los datos necesarios estén presentes
    const datosRequeridos = ['nombre', 'email', 'servicios', 'codigo', 'total'];
    const datosFaltantes = datosRequeridos.filter(campo => !cotizacion[campo]);
    
    if (datosFaltantes.length > 0) {
      console.error('❌ Datos faltantes en la cotización:', datosFaltantes);
      console.error('❌ Datos completos de la cotización:', cotizacion);
      alert(`La cotización tiene datos incompletos: ${datosFaltantes.join(', ')}. Por favor, previsualiza primero para verificar los datos.`);
      return;
    }
    
    if (typeof html2pdf === 'undefined') {
      alert('Error: La librería de generación de PDF no está cargada.');
      return;
    }
    
    // Importar la plantilla dinámicamente si no está disponible
    let renderInvoice;
    try {
      const templateModule = await import('../templates/invoice-template.js');
      renderInvoice = templateModule.renderInvoice;
      console.log('✅ Plantilla importada correctamente');
    } catch (error) {
      console.error('❌ Error al importar plantilla:', error);
      alert('Error: La función de renderizado no está disponible.');
      return;
    }
    
    // Preparar datos para la plantilla con validación adicional
    const datosPlantilla = {
      nombre: cotizacion.nombre || '',
      email: cotizacion.email || '',
      rut: cotizacion.rut || '',
      empresa: cotizacion.empresa || '',
      moneda: cotizacion.moneda || 'CLP',
      codigo: cotizacion.codigo || '',
      fecha: cotizacion.fecha ? formatearFecha(cotizacion.fecha) : new Date().toLocaleDateString('es-CL'),
      serviciosData: Array.isArray(cotizacion.servicios) ? cotizacion.servicios : [],
      total: typeof cotizacion.total === 'number' ? cotizacion.total : 0,
      atendedor: cotizacion.atendido || '',
      notasAdicionales: cotizacion.notas || '',
      descuento: typeof cotizacion.descuento === 'number' ? cotizacion.descuento : 0
    };
    
    console.log('📄 Datos preparados para PDF:', datosPlantilla);
    console.log('📄 Servicios:', datosPlantilla.serviciosData);
    
    // Verificar que los servicios tengan la estructura correcta
    if (datosPlantilla.serviciosData.length === 0) {
      console.error('❌ No hay servicios en la cotización');
      alert('La cotización no tiene servicios. Por favor, previsualiza primero para verificar los datos.');
      return;
    }
    
    // Crear elemento temporal para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.zIndex = '-1';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Generar HTML usando la plantilla
    const htmlGenerado = renderInvoice(datosPlantilla);
    console.log('📄 HTML generado (primeros 500 caracteres):', htmlGenerado.substring(0, 500));
    
    tempDiv.innerHTML = htmlGenerado;
    
    // Verificar que el HTML se haya generado correctamente
    if (!tempDiv.innerHTML || tempDiv.innerHTML.trim() === '') {
      console.error('❌ HTML generado está vacío');
      alert('Error: No se pudo generar el contenido del PDF. Por favor, inténtalo de nuevo.');
      return;
    }
    
    // Esperar a que las imágenes se carguen
    const images = tempDiv.querySelectorAll('img');
    if (images.length > 0) {
      console.log('📄 Esperando a que las imágenes se carguen...');
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            console.log('📄 Imagen ya cargada:', img.src);
            resolve();
          } else {
            img.onload = () => {
              console.log('📄 Imagen cargada exitosamente:', img.src);
              resolve();
            };
            img.onerror = () => {
              console.warn('⚠️ Error al cargar imagen:', img.src);
              resolve(); // Continuar incluso si hay error
            };
          }
        });
      }));
    }
    
    // Agregar estilos CSS necesarios
    const style = document.createElement('style');
    style.textContent = `
      .pdf-header img { height: 80px; max-width: 100%; }
      .gradient { border: none; height: 2px; background: linear-gradient(90deg, #00B8D9, #FF4EFF); margin: 20px 0; }
      .tabla-servicios { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
      .tabla-servicios th, .tabla-servicios td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .tabla-servicios th { background-color: #f2f2f2; font-weight: bold; }
      .total-row { text-align: right; font-size: 1.2em; margin: 10px 0; color: #00B8D9; font-weight: bold; }
      .descuento-aplicado { color: #FF4EFF; font-weight: bold; text-align: right; margin: 10px 0; }
      .footer img { height: 48px; max-width: 100%; }
      body { font-family: Arial, sans-serif; }
    `;
    tempDiv.appendChild(style);
    
    document.body.appendChild(tempDiv);
    
    // Verificar que el elemento se haya agregado correctamente
    console.log('📄 Elemento temporal agregado al DOM');
    console.log('📄 Contenido del elemento temporal:', tempDiv.innerHTML.substring(0, 200));
    
    // Configuración optimizada para html2pdf
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${cotizacion.codigo}_cotizacion.pdf`,
      image: { type: 'jpeg', quality: 0.8 },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true, // Habilitar logging para debug
        imageTimeout: 15000,
        removeContainer: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };
    
    console.log('📄 Iniciando generación de PDF...');
    console.log('📄 Configuración html2pdf:', opt);
    
    // Generar PDF
    await html2pdf().set(opt).from(tempDiv).save();
    
    console.log('✅ PDF generado exitosamente');
    
    // Limpiar elemento temporal
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
      console.log('📄 Elemento temporal removido del DOM');
    }
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Limpiar elemento temporal en caso de error
    const tempDiv = document.querySelector('div[style*="-9999px"]');
    if (tempDiv && document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
      console.log('📄 Elemento temporal removido del DOM después del error');
    }
    
    alert('Error al generar el PDF. Por favor, inténtalo de nuevo o usa la previsualización primero. Revisa la consola para más detalles.');
  }
}

// Función para ver detalles
function verDetalles(cotizacionId) {
  const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
  if (!cotizacion) {
    alert('Cotización no encontrada');
    return;
  }
  
  const detalles = `
Código: ${cotizacion.codigo}
Cliente: ${cotizacion.nombre}
Email: ${cotizacion.email}
RUT: ${cotizacion.rut}
Empresa: ${cotizacion.empresa}
Atendido por: ${cotizacion.atendido}
Fecha: ${formatearFecha(cotizacion.fecha)}
Total: $${(cotizacion.totalConDescuento || 0).toLocaleString()}
Descuento: ${cotizacion.descuento || 0}%

Servicios:
${cotizacion.servicios?.map(s => `- ${s.nombre}: ${s.detalle}`).join('\n') || 'No hay servicios'}

Notas: ${cotizacion.notas || 'Sin notas adicionales'}

DATOS COMPLETOS PARA DEBUG:
${JSON.stringify(cotizacion, null, 2)}
  `;
  
  alert(detalles);
}

// Función para previsualizar cotización
function previsualizarCotizacion(cotizacionId) {
  console.log('👁️ Previsualizando cotización:', cotizacionId);
  
  // Buscar la cotización en el array local
  const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
  if (!cotizacion) {
    alert('Cotización no encontrada');
    return;
  }
  
  // Guardar datos en sessionStorage para la previsualización
  try {
    sessionStorage.setItem('cotizacion_temp', JSON.stringify(cotizacion));
    console.log('💾 Datos guardados en sessionStorage para previsualización');
  } catch (error) {
    console.error('❌ Error al guardar datos en sessionStorage:', error);
  }
  
  // Redirigir a la página de previsualización
  window.location.href = `preview.html?id=${cotizacionId}`;
}

// Función alternativa para generar PDF usando el mismo enfoque que la previsualización
async function generarPDFAlternativo(cotizacionId) {
  try {
    console.log('📄 Generando PDF alternativo para cotización:', cotizacionId);
    
    const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
    if (!cotizacion) {
      alert('Cotización no encontrada');
      return;
    }
    
    // Verificar que todos los datos necesarios estén presentes
    if (!cotizacion.nombre || !cotizacion.email || !cotizacion.servicios) {
      console.error('❌ Datos incompletos en la cotización:', cotizacion);
      alert('La cotización tiene datos incompletos. Por favor, previsualiza primero para verificar los datos.');
      return;
    }
    
    // Guardar datos en sessionStorage como lo hace la previsualización
    sessionStorage.setItem('cotizacion_temp', JSON.stringify(cotizacion));
    console.log('💾 Datos guardados en sessionStorage para PDF alternativo');
    
    // Redirigir a la página de previsualización con parámetro para generar PDF automáticamente
    window.location.href = `preview.html?id=${cotizacionId}&pdf=true`;
    
  } catch (error) {
    console.error('❌ Error en método alternativo:', error);
    alert('Error al generar el PDF. Por favor, usa la previsualización.');
  }
}

// Hacer funciones disponibles globalmente
window.generarPDF = generarPDF;
window.generarPDFAlternativo = generarPDFAlternativo;
window.verDetalles = verDetalles;
window.previsualizarCotizacion = previsualizarCotizacion; 