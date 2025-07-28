// Importaciones
import { renderInvoice } from '../templates/invoice-template.js';

// Constantes
const ESTADOS_COTIZACION = [
  'Emitida', 'Contestada', 'En Negociación', 
  'Aceptada', 'Rechazada', 'Pendiente de Confirmación'
];

// Variables globales
let cotizaciones = [];
let cotizacionActualEstado = null;

// Elementos del DOM
const cotizacionesList = document.getElementById('cotizaciones-list');
const totalCotizaciones = document.getElementById('total-cotizaciones');
const cotizacionesMes = document.getElementById('cotizaciones-mes');
const valorTotal = document.getElementById('valor-total');
const filtroFecha = document.getElementById('filtro-fecha');
const filtroAtendedor = document.getElementById('filtro-atendedor');
const filtroMes = document.getElementById('filtro-mes');
const filtroAno = document.getElementById('filtro-ano');
const aplicarFiltros = document.getElementById('aplicar-filtros');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando panel de administración...');
  console.log('✅ Variables globales inicializadas correctamente');
  
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
  
  // Cargar estados dinámicamente en el filtro
  cargarEstadosFiltro();
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
    
    // Verificar y actualizar automáticamente el estado de firmas
    await verificarYActualizarEstadoFirmas();
    
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

// Cargar estados en el filtro
function cargarEstadosFiltro() {
  const filtroEstado = document.getElementById('filtro-estado');
  if (filtroEstado) {
    ESTADOS_COTIZACION.forEach(estado => {
      const option = document.createElement('option');
      option.value = estado;
      option.textContent = estado;
      filtroEstado.appendChild(option);
    });
    console.log('✅ Estados cargados en el filtro');
  }
}

async function actualizarEstadisticas() {
  console.log('📊 Actualizando estadísticas...');
  console.log('📊 Total de cotizaciones:', cotizaciones.length);
  
  const total = cotizaciones.length;
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  
  const delMes = cotizaciones.filter(c => c.fecha >= inicioMes).length;
  
  // Calcular valor total cotizado con mejor manejo de tipos
  const valorTotalCalculado = cotizaciones.reduce((sum, c) => {
    const valor = c.totalConDescuento || c.total || 0;
    const valorNumerico = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
    console.log(`📊 Cotización ${c.codigo}: valor = ${valor}, valorNumerico = ${valorNumerico}`);
    return sum + valorNumerico;
  }, 0);
  
  // Calcular total de cotizaciones aceptadas con mejor manejo de tipos
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'Aceptada');
  const valorTotalAceptadas = cotizacionesAceptadas.reduce((sum, c) => {
    const valor = c.totalConDescuento || c.total || 0;
    const valorNumerico = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
    console.log(`📊 Cotización aceptada ${c.codigo}: valor = ${valor}, valorNumerico = ${valorNumerico}`);
    return sum + valorNumerico;
  }, 0);
  
  // Obtener estadísticas de contratos firmados
  let valorTotalContratosFirmados = 0;
  let totalContratosFirmados = 0;
  
  try {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const contratosSnapshot = await getDocs(collection(window.db, 'contratos'));
    const contratos = contratosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calcular solo contratos firmados y válidos
    contratos.forEach(contrato => {
      if (contrato.estadoContrato === 'Firmado' && contrato.contratoValido === true) {
        const valor = parseFloat(contrato.totalConDescuento || contrato.total) || 0;
        valorTotalContratosFirmados += valor;
        totalContratosFirmados++;
      }
    });
    
    console.log('📊 Contratos firmados:', totalContratosFirmados);
    console.log('📊 Valor total contratos firmados:', valorTotalContratosFirmados);
  } catch (error) {
    console.error('❌ Error al cargar contratos para estadísticas:', error);
  }
  
  console.log('📊 Valor total cotizado:', valorTotalCalculado);
  console.log('📊 Total aceptado:', valorTotalAceptadas);
  
  if (totalCotizaciones) totalCotizaciones.textContent = total;
  if (cotizacionesMes) cotizacionesMes.textContent = delMes;
  if (valorTotal) valorTotal.textContent = `$${valorTotalCalculado.toLocaleString()}`;
  
  const totalAceptadas = document.getElementById('total-aceptadas');
  if (totalAceptadas) totalAceptadas.textContent = `$${valorTotalAceptadas.toLocaleString()}`;
  
  // Agregar estadísticas de contratos firmados si existen los elementos
  const totalContratosElement = document.getElementById('total-contratos-firmados');
  if (totalContratosElement) totalContratosElement.textContent = totalContratosFirmados;
  
  const valorContratosElement = document.getElementById('valor-contratos-firmados');
  if (valorContratosElement) valorContratosElement.textContent = `$${valorTotalContratosFirmados.toLocaleString()}`;
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
        <select class="estado-select" onchange="cambiarEstadoDirecto('${cotizacion.id}', this.value)">
          <option value="Emitida" ${cotizacion.estado === 'Emitida' ? 'selected' : ''}>Emitida</option>
          <option value="Contestada" ${cotizacion.estado === 'Contestada' ? 'selected' : ''}>Contestada</option>
          <option value="En Negociación" ${cotizacion.estado === 'En Negociación' ? 'selected' : ''}>En Negociación</option>
          <option value="Aceptada" ${cotizacion.estado === 'Aceptada' ? 'selected' : ''}>Aceptada</option>
          <option value="Rechazada" ${cotizacion.estado === 'Rechazada' ? 'selected' : ''}>Rechazada</option>
          <option value="Pendiente de Confirmación" ${cotizacion.estado === 'Pendiente de Confirmación' ? 'selected' : ''}>Pendiente de Confirmación</option>
        </select>
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
        <button class="btn btn-action" onclick="previsualizarCotizacion('${cotizacion.id}')" title="Previsualizar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
        <button class="btn btn-action" onclick="generarPDFAlternativo('${cotizacion.id}')" title="Ver PDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </button>
        <button class="btn btn-action" onclick="verDetalles('${cotizacion.id}')" title="Ver Detalles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </button>
        <button class="btn btn-action btn-danger" onclick="eliminarCotizacion('${cotizacion.id}')" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  cotizacionesList.innerHTML = html;
}

function filtrarCotizaciones() {
  const filtroFechaValor = filtroFecha?.value || 'todos';
  const filtroAtendedorValor = filtroAtendedor?.value || 'todos';
  const filtroEstadoValor = document.getElementById('filtro-estado')?.value || 'todos';
  const filtroMesValor = filtroMes?.value || 'todos';
  const filtroAnoValor = filtroAno?.value || 'todos';
  
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
  
  // Aplicar filtros de estado
  if (filtroEstadoValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => c.estado === filtroEstadoValor);
  }
  
  // Aplicar filtros de mes
  if (filtroMesValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => {
      if (!c.fecha) return false;
      return c.fecha.getMonth() + 1 === parseInt(filtroMesValor);
    });
  }
  
  // Aplicar filtros de año
  if (filtroAnoValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => {
      if (!c.fecha) return false;
      return c.fecha.getFullYear() === parseInt(filtroAnoValor);
    });
  }
  
  // Filtrar por estado
  if (filtroEstadoValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => c.estado === filtroEstadoValor);
  }
  
  // Filtrar por mes
  if (filtroMesValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => {
      if (!c.fecha) return false;
      return c.fecha.getMonth() + 1 === parseInt(filtroMesValor);
    });
  }
  
  // Filtrar por año
  if (filtroAnoValor !== 'todos') {
    cotizacionesFiltradas = cotizacionesFiltradas.filter(c => {
      if (!c.fecha) return false;
      return c.fecha.getFullYear() === parseInt(filtroAnoValor);
    });
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
  
  // Obtener cotizaciones filtradas por fecha, atendido, estado, mes y año
  let cotizacionesFiltradas = [...cotizaciones];
  
  const filtroFechaValor = filtroFecha?.value || 'todos';
  const filtroAtendedorValor = filtroAtendedor?.value || 'todos';
  const filtroEstadoValor = document.getElementById('filtro-estado')?.value || 'todos';
  const filtroMesValor = filtroMes?.value || 'todos';
  const filtroAnoValor = filtroAno?.value || 'todos';
  
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
            <span class="estado ${cotizacion.estado ? 'estado-' + cotizacion.estado.toLowerCase().replace(/\s+/g, '-') : 'estado-emitida'}">${cotizacion.estado || 'Emitida'}</span>
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
            <button class="btn btn-dropdown" onclick="toggleDropdown('${cotizacion.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              Acciones
            </button>
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

// Variables para el modal de estado
// cotizacionActualEstado ya está declarada arriba

// ===== MENÚ DE ACCIONES INTEGRADO =====
let currentDropdownMenu = null;

function toggleDropdown(cotizacionId) {
  console.log('🔄 Toggle dropdown para cotización:', cotizacionId);
  
  // Si ya hay un menú abierto, cerrarlo
  if (currentDropdownMenu) {
    currentDropdownMenu.remove();
    currentDropdownMenu = null;
    return;
  }
  
  // Obtener el botón que se hizo clic
  const button = document.querySelector(`[onclick="toggleDropdown('${cotizacionId}')"]`);
  if (!button) {
    console.error('❌ Botón no encontrado');
    return;
  }
  
  // Obtener la tarjeta de cotización (contenedor padre)
  const cotizacionCard = button.closest('.cotizacion-card');
  if (!cotizacionCard) {
    console.error('❌ Tarjeta de cotización no encontrada');
    return;
  }
  
  // Obtener los datos de la cotización
  const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
  if (!cotizacion) {
    console.error('❌ Cotización no encontrada');
    return;
  }
  
  // Crear el menú integrado
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'acciones-dropdown-menu-integrado';
  dropdownMenu.id = `dropdown-menu-${cotizacionId}`;
  
  // Crear el contenido del menú con event listeners directos
  dropdownMenu.innerHTML = `
    <a href="#" data-action="previsualizar" data-id="${cotizacionId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
      Previsualizar
    </a>
    <a href="#" data-action="pdf" data-id="${cotizacionId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
      Ver PDF
    </a>
    <a href="#" data-action="detalles" data-id="${cotizacionId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Ver Detalles
    </a>
    <a href="#" data-action="estado" data-id="${cotizacionId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
      Cambiar Estado
    </a>
    ${cotizacion.estado === 'Aceptada' ? `
    <a href="#" data-action="contrato" data-id="${cotizacionId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
      </svg>
      Generar Contrato
    </a>` : ''}
    <a href="#" data-action="eliminar" data-id="${cotizacionId}" class="danger">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
      Eliminar
    </a>
  `;
  
  // Agregar event listeners a cada enlace
  dropdownMenu.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const link = e.target.closest('a');
    if (!link) return;
    
    const action = link.getAttribute('data-action');
    const id = link.getAttribute('data-id');
    
    console.log('🖱️ Clic en acción:', action, 'para ID:', id);
    
    switch(action) {
      case 'previsualizar':
        previsualizarCotizacion(id);
        break;
      case 'pdf':
        generarPDFAlternativo(id);
        break;
      case 'detalles':
        verDetalles(id);
        break;
      case 'estado':
        cambiarEstado(id);
        break;
      case 'contrato':
        mostrarModalContrato(id);
        break;
      case 'eliminar':
        eliminarCotizacion(id);
        break;
    }
    
    // Pequeño retraso para asegurar que el clic se registre
    setTimeout(() => {
      closeDropdown();
    }, 50);
  });
  
  // Agregar el menú dentro de la tarjeta de cotización
  cotizacionCard.appendChild(dropdownMenu);
  currentDropdownMenu = dropdownMenu;
  
  console.log('✅ Menú integrado creado y mostrado');
}

function closeDropdown() {
  if (currentDropdownMenu) {
    currentDropdownMenu.remove();
    currentDropdownMenu = null;
    console.log('❌ Menú integrado cerrado');
  }
}

// Cerrar dropdown al hacer clic fuera (temporalmente comentado)
/*
document.addEventListener('click', function(event) {
  const isDropdownButton = event.target.closest('.btn-dropdown');
  const isDropdownMenu = event.target.closest('.acciones-dropdown-menu-integrado');
  
  if (!isDropdownButton && !isDropdownMenu) {
    closeDropdown();
  }
});
*/

// Prevenir que el clic en el botón se propague
document.addEventListener('click', function(event) {
  if (event.target.closest('.btn-dropdown')) {
    event.stopPropagation();
  }
});

// Cerrar menús al hacer clic en cualquier lugar
document.addEventListener('click', function(event) {
  const isDropdownButton = event.target.closest('.btn-dropdown');
  const isDropdownMenu = event.target.closest('.acciones-dropdown-menu-integrado');
  
  if (!isDropdownButton && !isDropdownMenu) {
    closeDropdown();
  }
});

// Funciones para cambiar estado
async function cambiarEstadoDirecto(cotizacionId, nuevoEstado) {
  console.log('🔄 Cambiando estado directo para cotización:', cotizacionId, 'a:', nuevoEstado);
  
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar en Firestore
    const docRef = doc(window.db, 'cotizaciones', cotizacionId);
    await updateDoc(docRef, {
      estado: nuevoEstado
    });
    
    // Actualizar el array local
    const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
    if (cotizacion) {
      cotizacion.estado = nuevoEstado;
    }
    
    // Si el estado es "Aceptada", crear pre-contrato automáticamente
    if (nuevoEstado === 'Aceptada') {
      console.log('✅ Cotización aceptada, creando pre-contrato automáticamente...');
      await crearPreContrato(cotizacionId);
    }
    
    // Actualizar la interfaz
    actualizarEstadisticas();
    renderizarCotizaciones();
    
    // Mostrar notificación de éxito
    mostrarNotificacion(`Estado actualizado a: ${nuevoEstado}`, 'success');
    console.log('✅ Estado actualizado correctamente a:', nuevoEstado);
    
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    alert('Error al actualizar el estado: ' + error.message);
  }
}

function cambiarEstado(cotizacionId) {
  console.log('🔄 Cambiando estado para cotización:', cotizacionId);
  
  const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
  if (!cotizacion) {
    alert('Cotización no encontrada');
    return;
  }
  
  cotizacionActualEstado = cotizacionId;
  document.getElementById('modal-cotizacion-codigo').textContent = cotizacion.codigo;
  
  // Llenar el select con los estados disponibles
  const selectEstado = document.getElementById('nuevo-estado');
  selectEstado.innerHTML = `
    <option value="">Seleccionar estado...</option>
    <option value="Emitida" ${cotizacion.estado === 'Emitida' ? 'selected' : ''}>Emitida</option>
    <option value="Contestada" ${cotizacion.estado === 'Contestada' ? 'selected' : ''}>Contestada</option>
    <option value="En Negociación" ${cotizacion.estado === 'En Negociación' ? 'selected' : ''}>En Negociación</option>
    <option value="Aceptada" ${cotizacion.estado === 'Aceptada' ? 'selected' : ''}>Aceptada</option>
    <option value="Rechazada" ${cotizacion.estado === 'Rechazada' ? 'selected' : ''}>Rechazada</option>
    <option value="Pendiente de Confirmación" ${cotizacion.estado === 'Pendiente de Confirmación' ? 'selected' : ''}>Pendiente de Confirmación</option>
    <option value="Contratada" ${cotizacion.estado === 'Contratada' ? 'selected' : ''}>Contratada</option>
  `;
  
  // Asegurar que el select tenga la clase correcta
  selectEstado.className = 'estado-select';
  
  // Mostrar modal
  document.getElementById('modal-estado').style.display = 'block';
  console.log('✅ Modal de estado mostrado');
}

async function confirmarCambioEstado() {
  if (!cotizacionActualEstado) return;
  
  const nuevoEstado = document.getElementById('nuevo-estado').value;
  
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const docRef = doc(window.db, 'cotizaciones', cotizacionActualEstado);
    await updateDoc(docRef, {
      estado: nuevoEstado
    });
    
    // Actualizar el array local
    const cotizacion = cotizaciones.find(c => c.id === cotizacionActualEstado);
    if (cotizacion) {
      cotizacion.estado = nuevoEstado;
    }
    
    // Si el estado es "Aceptada", crear pre-contrato automáticamente
    if (nuevoEstado === 'Aceptada') {
      console.log('✅ Cotización aceptada, creando pre-contrato automáticamente...');
      await crearPreContrato(cotizacionActualEstado);
    }
    
    // Actualizar la interfaz
    actualizarEstadisticas();
    renderizarCotizaciones();
    
    cerrarModalEstado();
    mostrarNotificacion(`Estado actualizado a: ${nuevoEstado}`, 'success');
    
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    alert('Error al actualizar el estado');
  }
}

function cerrarModalEstado() {
  document.getElementById('modal-estado').style.display = 'none';
  cotizacionActualEstado = null;
}

// ===== FUNCIONES PARA EL MODAL DE CONTRATO =====
let cotizacionActualContrato = null;

function mostrarModalContrato(cotizacionId) {
  console.log('📝 Mostrando modal de contrato para cotización:', cotizacionId);
  
  // Obtener los datos de la cotización
  const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
  if (!cotizacion) {
    console.error('❌ Cotización no encontrada');
    alert('Cotización no encontrada');
    return;
  }
  
  // Verificar que la cotización esté aceptada
  if (cotizacion.estado !== 'Aceptada') {
    alert('Solo se pueden generar contratos para cotizaciones aceptadas');
    return;
  }
  
  cotizacionActualContrato = cotizacionId;
  
  // Pre-llenar campos con datos de la cotización
  document.getElementById('titulo-contrato').value = `Contrato de Servicios - ${cotizacion.codigo}`;
  document.getElementById('fecha-inicio').value = new Date().toISOString().split('T')[0];
  document.getElementById('fecha-fin').value = '';
  document.getElementById('terminos-contrato').value = `Términos y condiciones para el contrato de servicios con ${cotizacion.nombre || cotizacion.cliente?.nombre || 'el cliente'}.\n\nServicios incluidos:\n${cotizacion.servicios ? cotizacion.servicios.map(s => `- ${s.nombre}: $${s.precio.toLocaleString()}`).join('\n') : 'Servicios detallados en la cotización'}\n\nTotal del contrato: $${(cotizacion.totalConDescuento || cotizacion.total || 0).toLocaleString()}`;
  document.getElementById('documento-contrato').value = '';
  
  // Mostrar el modal
  document.getElementById('modal-contrato').style.display = 'block';
  
  console.log('✅ Modal de contrato mostrado');
}

function cerrarModalContrato() {
  document.getElementById('modal-contrato').style.display = 'none';
  cotizacionActualContrato = null;
  console.log('❌ Modal de contrato cerrado');
}

async function guardarContrato() {
  if (!cotizacionActualContrato) {
    alert('No hay cotización seleccionada');
    return;
  }
  
  try {
    console.log('📝 Guardando contrato para cotización:', cotizacionActualContrato);
    
    // Obtener los datos del formulario
    const tituloContrato = document.getElementById('titulo-contrato').value.trim();
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    const terminos = document.getElementById('terminos-contrato').value.trim();
    const documento = document.getElementById('documento-contrato').files[0];
    
    // Validar campos requeridos
    if (!tituloContrato) {
      alert('El título del contrato es obligatorio');
      return;
    }
    
    if (!fechaInicio) {
      alert('La fecha de inicio es obligatoria');
      return;
    }
    
    if (!terminos) {
      alert('Los términos y condiciones son obligatorios');
      return;
    }
    
    // Obtener datos de la cotización
    const cotizacion = cotizaciones.find(c => c.id === cotizacionActualContrato);
    if (!cotizacion) {
      alert('Cotización no encontrada');
      return;
    }
    
    // Importar Firebase dinámicamente
    const { doc, setDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Crear objeto contrato completo
    const contrato = {
      cotizacionId: cotizacionActualContrato,
      codigoCotizacion: cotizacion.codigo,
      tituloContrato: tituloContrato,
      fechaInicio: new Date(fechaInicio),
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      terminosCondiciones: terminos,
      documentoAdjunto: documento ? documento.name : null,
      cliente: {
        nombre: cotizacion.nombre,
        email: cotizacion.email,
        rut: cotizacion.rut,
        empresa: cotizacion.empresa
      },
      servicios: cotizacion.servicios,
      total: cotizacion.total,
      totalConDescuento: cotizacion.totalConDescuento,
      descuento: cotizacion.descuento,
      moneda: cotizacion.moneda,
      atendido: cotizacion.atendido,
      notas: cotizacion.notas,
      fechaCreacionContrato: new Date(),
      estadoContrato: 'Pendiente de Firma',
      fechaCotizacion: cotizacion.fecha
    };
    
    console.log('📝 Objeto contrato creado:', contrato);
    
    // Guardar en la colección contratos
    const contratoRef = doc(window.db, 'contratos', cotizacionActualContrato);
    await setDoc(contratoRef, contrato);
    console.log('✅ Contrato guardado en Firestore');
    
    // Actualizar estado de la cotización
    const cotizacionRef = doc(window.db, 'cotizaciones', cotizacionActualContrato);
    await updateDoc(cotizacionRef, {
      estado: 'Contratada'
    });
    console.log('✅ Estado de cotización actualizado');
    
    // Actualizar array local
    const cotizacionLocal = cotizaciones.find(c => c.id === cotizacionActualContrato);
    if (cotizacionLocal) {
      cotizacionLocal.estado = 'Contratada';
    }
    
    // Cerrar modal
    cerrarModalContrato();
    
    // Actualizar interfaz
    actualizarEstadisticas();
    renderizarCotizaciones();
    
    alert('Contrato generado correctamente');
    console.log('✅ Contrato generado exitosamente:', contrato);
    
  } catch (error) {
    console.error('❌ Error al generar contrato:', error);
    alert('Error al generar el contrato: ' + error.message);
  }
}

// Función para generar contrato (deprecada - usar modal)
async function generarContrato(cotizacionId) {
  console.log('⚠️ Función generarContrato deprecada, usando modal en su lugar');
  mostrarModalContrato(cotizacionId);
}

// ===== FUNCIÓN PARA CREAR CONTRATO AUTOMÁTICAMENTE =====
async function crearContratoDesdeCotizacion(cotizacionId) {
  console.log('📝 Creando contrato automáticamente desde cotización:', cotizacionId);
  
  try {
    // Importar Firebase dinámicamente
    const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Obtener datos completos de la cotización
    const cotizacionRef = doc(window.db, 'cotizaciones', cotizacionId);
    const cotizacionSnap = await getDoc(cotizacionRef);
    
    if (!cotizacionSnap.exists()) {
      console.error('❌ Cotización no encontrada en Firestore');
      return;
    }
    
    const cotizacion = cotizacionSnap.data();
    console.log('📝 Datos de cotización obtenidos:', cotizacion);
    
    // Crear objeto contrato
    const contrato = {
      cotizacionIdOriginal: cotizacionId,
      codigoCotizacion: cotizacion.codigo,
      tituloContrato: `Contrato de Servicios - ${cotizacion.codigo}`,
      fechaCreacionContrato: new Date(),
      estadoContrato: 'Pendiente de Firma',
      cliente: {
        nombre: cotizacion.nombre,
        email: cotizacion.email,
        rut: cotizacion.rut,
        empresa: cotizacion.empresa
      },
      servicios: cotizacion.servicios,
      total: cotizacion.total,
      totalConDescuento: cotizacion.totalConDescuento,
      descuento: cotizacion.descuento,
      moneda: cotizacion.moneda,
      atendido: cotizacion.atendido,
      notas: cotizacion.notas,
      fechaCotizacion: cotizacion.fecha,
      terminosCondiciones: `Términos y condiciones para el contrato de servicios con ${cotizacion.nombre || 'el cliente'}.\n\nServicios incluidos:\n${cotizacion.servicios ? cotizacion.servicios.map(s => `- ${s.nombre}: $${s.precio.toLocaleString()}`).join('\n') : 'Servicios detallados en la cotización'}\n\nTotal del contrato: $${(cotizacion.totalConDescuento || cotizacion.total || 0).toLocaleString()}`
    };
    
    console.log('📝 Objeto contrato creado:', contrato);
    
    // Guardar en la colección contratos
    const contratoRef = doc(window.db, 'contratos', cotizacionId);
    await setDoc(contratoRef, contrato);
    console.log('✅ Contrato guardado en Firestore');
    
    // Mostrar notificación de éxito
    alert(`Cotización ${cotizacion.codigo} movida a Gestión de Contratos`);
    console.log('✅ Contrato creado exitosamente:', contrato);
    
  } catch (error) {
    console.error('❌ Error al crear contrato:', error);
    alert('Error al crear el contrato: ' + error.message);
  }
}

// Función para eliminar cotización
async function eliminarCotizacion(cotizacionId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    // Importar Firebase dinámicamente
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const docRef = doc(window.db, 'cotizaciones', cotizacionId);
    await deleteDoc(docRef);
    
    // Remover del array local
    cotizaciones = cotizaciones.filter(c => c.id !== cotizacionId);
    
    // Actualizar interfaz
    actualizarEstadisticas();
    renderizarCotizaciones();
    
    alert('Cotización eliminada correctamente');
    
  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    alert('Error al eliminar la cotización');
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

// ===== FUNCIÓN MEJORADA PARA CREAR PRE-CONTRATO =====
async function crearPreContrato(cotizacionId) {
  console.log('📝 Creando pre-contrato automáticamente desde cotización:', cotizacionId);
  
  try {
    // Importar Firebase dinámicamente
    const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Obtener datos completos de la cotización
    const cotizacionRef = doc(window.db, 'cotizaciones', cotizacionId);
    const cotizacionSnap = await getDoc(cotizacionRef);
    
    if (!cotizacionSnap.exists()) {
      console.error('❌ Cotización no encontrada en Firestore');
      mostrarNotificacion('Error: Cotización no encontrada', 'error');
      return;
    }
    
    const cotizacion = cotizacionSnap.data();
    console.log('📝 Datos de cotización obtenidos:', cotizacion);
    
    // Crear objeto pre-contrato
    const preContrato = {
      cotizacionIdOriginal: cotizacionId,
      codigoCotizacion: cotizacion.codigo,
      tituloContrato: `Pre-Contrato de Servicios - ${cotizacion.codigo}`,
      fechaCreacionContrato: new Date(),
      estadoContrato: 'Pendiente de Completar',
      cliente: {
        nombre: cotizacion.nombre,
        email: cotizacion.email,
        rut: cotizacion.rut,
        empresa: cotizacion.empresa
      },
      servicios: cotizacion.servicios,
      total: cotizacion.total || 0,
      totalConDescuento: cotizacion.totalConDescuento || cotizacion.total || 0,
      descuento: cotizacion.descuento || 0,
      moneda: cotizacion.moneda || 'CLP',
      atendido: cotizacion.atendido,
      notas: cotizacion.notas,
      fechaCotizacion: cotizacion.fecha,
      objetoContrato: `Servicios incluidos:\n${cotizacion.servicios ? cotizacion.servicios.map(s => `- ${s.nombre}: ${s.detalle}`).join('\n') : 'Servicios detallados en la cotización'}`,
      clausulas: `Términos y condiciones para el contrato de servicios con ${cotizacion.nombre || 'el cliente'}.\n\nTotal del contrato: $${(cotizacion.totalConDescuento || cotizacion.total || 0).toLocaleString()}`,
      esPreContrato: true
    };
    
    console.log('📝 Objeto pre-contrato creado:', preContrato);
    
    // Guardar en la colección contratos
    const contratoRef = doc(window.db, 'contratos', cotizacionId);
    await setDoc(contratoRef, preContrato);
    console.log('✅ Pre-contrato guardado en Firestore');
    
    // Mostrar notificación de éxito
    mostrarNotificacion(`Cotización ${cotizacion.codigo} enviada a Gestión de Contratos`, 'success');
    console.log('✅ Pre-contrato creado exitosamente:', preContrato);
    
  } catch (error) {
    console.error('❌ Error al crear pre-contrato:', error);
    mostrarNotificacion('Error al crear el pre-contrato: ' + error.message, 'error');
  }
}

// Hacer funciones disponibles globalmente
window.generarPDF = generarPDF;
window.generarPDFAlternativo = generarPDFAlternativo;
window.verDetalles = verDetalles;
window.previsualizarCotizacion = previsualizarCotizacion;
window.toggleDropdown = toggleDropdown;
window.cambiarEstado = cambiarEstado;
window.cambiarEstadoDirecto = cambiarEstadoDirecto;
window.confirmarCambioEstado = confirmarCambioEstado;
window.cerrarModalEstado = cerrarModalEstado;
window.generarContrato = generarContrato;
window.eliminarCotizacion = eliminarCotizacion;
window.mostrarNotificacion = mostrarNotificacion;
window.crearPreContrato = crearPreContrato;
window.cargarCotizaciones = cargarCotizaciones; 

// ===== VERIFICAR Y ACTUALIZAR ESTADO AUTOMÁTICO DE FIRMAS =====
async function verificarYActualizarEstadoFirmas() {
  console.log('🔍 Verificando estado automático de firmas en admin...');
  
  try {
    // Importar Firebase dinámicamente
    const { collection, query, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Obtener todos los contratos
    const contratosQuery = query(collection(window.db, 'contratos'));
    const contratosSnapshot = await getDocs(contratosQuery);
    
    let contratosActualizados = 0;
    
    // Revisar cada contrato
    for (const doc of contratosSnapshot.docs) {
      const contrato = doc.data();
      
      // Solo verificar contratos que estén en "Pendiente de Firma"
      if (contrato.estadoContrato === 'Pendiente de Firma') {
        const tieneFirmaRepresentante = !!contrato.firmaRepresentanteBase64;
        const tieneFirmaCliente = !!contrato.firmaClienteBase64;
        
        // Si tiene ambas firmas, actualizar automáticamente el estado
        if (tieneFirmaRepresentante && tieneFirmaCliente) {
          console.log(`✅ Contrato ${contrato.codigoCotizacion} tiene ambas firmas - actualizando a Firmado`);
          
          // Actualizar en Firestore
          const contratoRef = doc(window.db, 'contratos', doc.id);
          await updateDoc(contratoRef, {
            estadoContrato: 'Firmado',
            fechaFirmaFinal: new Date(),
            contratoValido: true,
            esPreContrato: false,
            fechaCompletado: new Date(),
            ambasFirmasCompletadas: true
          });
          
          contratosActualizados++;
        }
      }
    }
    
    if (contratosActualizados > 0) {
      console.log(`✅ ${contratosActualizados} contratos actualizados automáticamente a Firmado desde admin`);
      mostrarNotificacion(`${contratosActualizados} contratos actualizados automáticamente a Firmado`, 'success');
    } else {
      console.log('ℹ️ No se encontraron contratos que requieran actualización automática');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estado automático de firmas:', error);
  }
} 