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
let cotizacionesList, totalCotizaciones, cotizacionesMes, valorTotal;
let filtroFecha, filtroAtendedor, aplicarFiltros;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando panel de administración...');
  
  // Inicializar elementos del DOM
  inicializarElementosDOM();
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    console.log('✅ Firebase ya está disponible');
    iniciarAplicacion();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        console.log('✅ Firebase cargado, iniciando aplicación...');
        iniciarAplicacion();
      }
    }, 100);
  }
});

// Inicializar elementos del DOM
function inicializarElementosDOM() {
  console.log('🔍 Inicializando elementos del DOM...');
  
  cotizacionesList = document.getElementById('cotizaciones-list');
  totalCotizaciones = document.getElementById('total-cotizaciones');
  cotizacionesMes = document.getElementById('cotizaciones-mes');
  valorTotal = document.getElementById('valor-total');
  filtroFecha = document.getElementById('filtro-fecha');
  filtroAtendedor = document.getElementById('filtro-atendedor');
  aplicarFiltros = document.getElementById('aplicar-filtros');
  
  // Verificar elementos críticos
  if (!cotizacionesList) {
    console.error('❌ Elemento crítico no encontrado: cotizaciones-list');
  } else {
    console.log('✅ Elementos del DOM inicializados correctamente');
  }
}

// Iniciar aplicación
function iniciarAplicacion() {
  try {
    cargarCotizaciones();
    setupEventListeners();
    console.log('✅ Aplicación iniciada correctamente');
  } catch (error) {
    console.error('❌ Error al iniciar aplicación:', error);
  }
}

// Configurar event listeners
function setupEventListeners() {
  console.log('🔧 Configurando event listeners...');
  
  if (aplicarFiltros) {
    aplicarFiltros.addEventListener('click', filtrarCotizaciones);
    console.log('✅ Event listener para filtros configurado');
  } else {
    console.warn('⚠️ Elemento aplicar-filtros no encontrado');
  }
  
  // Configurar buscador en tiempo real
  const buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', buscarEnTiempoReal);
    console.log('✅ Buscador configurado');
  } else {
    console.warn('⚠️ Elemento buscador no encontrado');
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
    mostrarLoading(false);
    mostrarNoData(false);
    
  } catch (error) {
    console.error('❌ Error al cargar cotizaciones:', error);
    mostrarNotificacion('Error al cargar las cotizaciones: ' + error.message, 'error');
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

function cargarEstadosFiltro() {
  const filtroEstado = document.getElementById('filtro-estado');
  if (filtroEstado) {
    filtroEstado.innerHTML = `
      <option value="todos">Todos los estados</option>
      ${ESTADOS_COTIZACION.map(estado => `<option value="${estado}">${estado}</option>`).join('')}
    `;
    console.log('✅ Estados de filtro cargados');
  }
}

function actualizarEstadisticas() {
  try {
    const total = cotizaciones.length;
    const mesActual = new Date().getMonth();
    const cotizacionesDelMes = cotizaciones.filter(c => {
      const fechaCotizacion = c.fecha instanceof Date ? c.fecha : new Date(c.fecha);
      return fechaCotizacion.getMonth() === mesActual;
    }).length;
    
    const valorTotalCalculado = cotizaciones.reduce((sum, c) => sum + (c.totalConDescuento || c.total || 0), 0);
    const valorAceptadas = cotizaciones
      .filter(c => c.estado === 'Aceptada')
      .reduce((sum, c) => sum + (c.totalConDescuento || c.total || 0), 0);
    
    if (totalCotizaciones) totalCotizaciones.textContent = total;
    if (cotizacionesMes) cotizacionesMes.textContent = cotizacionesDelMes;
    if (valorTotal) valorTotal.textContent = `$${valorTotalCalculado.toLocaleString()}`;
    
    // Actualizar total aceptadas si existe el elemento
    const totalAceptadas = document.getElementById('total-aceptadas');
    if (totalAceptadas) totalAceptadas.textContent = `$${valorAceptadas.toLocaleString()}`;
    
    console.log('✅ Estadísticas actualizadas');
  } catch (error) {
    console.error('❌ Error al actualizar estadísticas:', error);
  }
}

function renderizarCotizaciones() {
  if (!cotizacionesList) {
    console.error('❌ Elemento cotizaciones-list no encontrado');
    return;
  }
  
  if (cotizaciones.length === 0) {
    cotizacionesList.innerHTML = '<div class="no-data">No hay cotizaciones disponibles</div>';
    return;
  }
  
  try {
    const html = cotizaciones.map(cotizacion => `
      <div class="cotizacion-card">
        <div class="cotizacion-header">
          <h3>${cotizacion.codigo || 'Sin código'}</h3>
          <span class="fecha">${formatearFecha(cotizacion.fecha)}</span>
          <select class="estado-select" onchange="cambiarEstadoDirecto('${cotizacion.id}', this.value)">
            ${ESTADOS_COTIZACION.map(estado => 
              `<option value="${estado}" ${cotizacion.estado === estado ? 'selected' : ''}>${estado}</option>`
            ).join('')}
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
          <button class="btn btn-action" onclick="verDetalles('${cotizacion.id}')" title="Ver Detalles">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </button>
          <button class="btn btn-action" onclick="previsualizarCotizacion('${cotizacion.id}')" title="Previsualizar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </button>
          <button class="btn btn-action" onclick="generarPDF('${cotizacion.id}')" title="Generar PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
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
    console.log('✅ Cotizaciones renderizadas correctamente');
    
  } catch (error) {
    console.error('❌ Error al renderizar cotizaciones:', error);
    cotizacionesList.innerHTML = '<div class="error">Error al cargar las cotizaciones</div>';
  }
}

// ===== SISTEMA DE NOTIFICACIONES =====
function mostrarNotificacion(mensaje, tipo = 'success') {
  console.log(`🔔 Notificación [${tipo}]:`, mensaje);
  
  try {
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
    
  } catch (error) {
    console.error('❌ Error al mostrar notificación:', error);
    // Fallback a alert si falla la notificación
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
  }
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
      total: cotizacion.total,
      totalConDescuento: cotizacion.totalConDescuento,
      descuento: cotizacion.descuento,
      moneda: cotizacion.moneda,
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

// ===== FUNCIONES DE CAMBIO DE ESTADO =====
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
    mostrarNotificacion('Error al actualizar el estado: ' + error.message, 'error');
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

// ===== FUNCIONES STUB PARA COMPATIBILIDAD =====
function filtrarCotizaciones() {
  console.log('🔍 Función de filtrado llamada');
  // Implementar lógica de filtrado aquí
}

function buscarEnTiempoReal(event) {
  console.log('🔍 Búsqueda en tiempo real:', event.target.value);
  // Implementar lógica de búsqueda aquí
}

function verDetalles(cotizacionId) {
  console.log('👁️ Ver detalles de cotización:', cotizacionId);
  // Implementar lógica de detalles aquí
}

function previsualizarCotizacion(cotizacionId) {
  console.log('👁️ Previsualizar cotización:', cotizacionId);
  // Implementar lógica de previsualización aquí
}

function generarPDF(cotizacionId) {
  console.log('📄 Generar PDF de cotización:', cotizacionId);
  // Implementar lógica de generación de PDF aquí
}

function eliminarCotizacion(cotizacionId) {
  console.log('🗑️ Eliminar cotización:', cotizacionId);
  if (confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
    // Implementar lógica de eliminación aquí
  }
}

// Hacer funciones disponibles globalmente
window.mostrarNotificacion = mostrarNotificacion;
window.crearPreContrato = crearPreContrato;
window.cambiarEstadoDirecto = cambiarEstadoDirecto;
window.verDetalles = verDetalles;
window.previsualizarCotizacion = previsualizarCotizacion;
window.generarPDF = generarPDF;
window.eliminarCotizacion = eliminarCotizacion;
window.cargarCotizaciones = cargarCotizaciones;

console.log('✅ admin-fixed.js cargado correctamente'); 