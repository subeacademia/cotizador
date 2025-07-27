// Importaciones
import { renderInvoice } from '../templates/invoice-template.js';
import { db } from './firebase-config.js';

// Variables globales
let cotizaciones = [];
let cotizacionSeleccionada = null;

// Elementos del DOM
const cotizacionesTbody = document.getElementById('cotizaciones-tbody');
const loadingElement = document.getElementById('loading');
const noDataElement = document.getElementById('no-data');
const refreshBtn = document.getElementById('refresh-btn');
const filterEstado = document.getElementById('filter-estado');
const confirmModal = document.getElementById('confirm-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');
const modalClose = document.getElementById('modal-close');

// Elementos de estadísticas
const totalCotizaciones = document.getElementById('total-cotizaciones');
const cotizacionesEmitidas = document.getElementById('cotizaciones-emitidas');
const cotizacionesAceptadas = document.getElementById('cotizaciones-aceptadas');
const cotizacionesContratadas = document.getElementById('cotizaciones-contratadas');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarCotizaciones();
  setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
  if (refreshBtn) refreshBtn.addEventListener('click', cargarCotizaciones);
  if (filterEstado) filterEstado.addEventListener('change', filtrarCotizaciones);
  if (modalCancel) modalCancel.addEventListener('click', cerrarModal);
  if (modalClose) modalClose.addEventListener('click', cerrarModal);
  if (modalConfirm) modalConfirm.addEventListener('click', ejecutarAccionConfirmada);
  
  // Cerrar modal al hacer clic fuera
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        cerrarModal();
      }
    });
  }
}

// Cargar cotizaciones desde Firestore
async function cargarCotizaciones() {
  try {
    console.log('🔄 Cargando cotizaciones...');
    mostrarLoading(true);
    
    const snapshot = await db.collection('cotizaciones')
      .orderBy('fecha', 'desc')
      .get();
    
    console.log(`📊 Snapshot obtenido: ${snapshot.size} documentos`);
    
    // CRÍTICO: Verificar si el snapshot está vacío
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
      fecha: doc.data().fecha?.toDate() || new Date()
    }));
    
    console.log(`✅ ${cotizaciones.length} cotizaciones cargadas`);
    
    actualizarEstadisticas();
    renderizarTabla();
    mostrarLoading(false);
    mostrarNoData(false);
    
  } catch (error) {
    console.error('❌ Error al cargar cotizaciones:', error);
    alert('Error al cargar las cotizaciones. Por favor, inténtalo de nuevo.');
    mostrarLoading(false);
    mostrarNoData(true);
  }
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
  if (loadingElement) {
    loadingElement.style.display = mostrar ? 'block' : 'none';
  }
  if (cotizacionesTbody) {
    cotizacionesTbody.style.display = mostrar ? 'none' : 'table-row-group';
  }
}

// Mostrar/ocultar mensaje de no datos
function mostrarNoData(mostrar) {
  if (noDataElement) {
    noDataElement.style.display = mostrar ? 'block' : 'none';
  }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
  const total = cotizaciones.length;
  const emitidas = cotizaciones.filter(c => c.estado === 'Emitida').length;
  const aceptadas = cotizaciones.filter(c => c.estado === 'Aceptada').length;
  const contratadas = cotizaciones.filter(c => c.estado === 'Contratada').length;
  
  if (totalCotizaciones) totalCotizaciones.textContent = total;
  if (cotizacionesEmitidas) cotizacionesEmitidas.textContent = emitidas;
  if (cotizacionesAceptadas) cotizacionesAceptadas.textContent = aceptadas;
  if (cotizacionesContratadas) cotizacionesContratadas.textContent = contratadas;
}

// Renderizar tabla de cotizaciones
function renderizarTabla() {
  const cotizacionesFiltradas = filtrarCotizaciones();
  
  if (!cotizacionesTbody) {
    console.error('❌ Elemento cotizaciones-tbody no encontrado');
    return;
  }
  
  if (cotizacionesFiltradas.length === 0) {
    mostrarNoData(true);
    cotizacionesTbody.innerHTML = '';
    return;
  }
  
  mostrarNoData(false);
  
  cotizacionesTbody.innerHTML = cotizacionesFiltradas.map(cotizacion => {
    const totalConDescuento = calcularTotalConDescuento(cotizacion);
    const fechaFormateada = formatearFecha(cotizacion.fecha);
    
    return `
      <tr>
        <td>${cotizacion.codigo || cotizacion.id}</td>
        <td>${fechaFormateada}</td>
        <td>${cotizacion.nombre || 'N/A'}</td>
        <td>${totalConDescuento.toLocaleString()}</td>
        <td>
          <span class="status-badge status-${cotizacion.estado?.toLowerCase() || 'emitida'}">
            ${cotizacion.estado || 'Emitida'}
          </span>
        </td>
        <td class="actions">
          <button onclick="marcarAceptada('${cotizacion.codigo || cotizacion.id}')" 
                  class="btn-action btn-accept" 
                  title="Marcar como Aceptada"
                  ${cotizacion.estado === 'Aceptada' || cotizacion.estado === 'Contratada' ? 'disabled' : ''}>
            <i class="fas fa-check"></i>
          </button>
          <button onclick="generarContrato('${cotizacion.codigo || cotizacion.id}')" 
                  class="btn-action btn-contract" 
                  title="Generar Contrato"
                  ${cotizacion.estado === 'Contratada' ? 'disabled' : ''}>
            <i class="fas fa-file-contract"></i>
          </button>
          <button onclick="verPDF('${cotizacion.codigo || cotizacion.id}')" 
                  class="btn-action btn-view" 
                  title="Ver PDF">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="eliminarCotizacion('${cotizacion.codigo || cotizacion.id}')" 
                  class="btn-action btn-delete" 
                  title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Filtrar cotizaciones por estado
function filtrarCotizaciones() {
  const estadoSeleccionado = filterEstado.value;
  
  if (estadoSeleccionado === 'todos') {
    return cotizaciones;
  }
  
  return cotizaciones.filter(cotizacion => 
    cotizacion.estado === estadoSeleccionado
  );
}

// Calcular total con descuento
function calcularTotalConDescuento(cotizacion) {
  const total = cotizacion.total || 0;
  const descuento = cotizacion.descuento || 0;
  
  if (descuento > 0) {
    return Math.round(total * (1 - descuento / 100));
  }
  
  return total;
}

// Formatear fecha
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ========================================
// FUNCIONES DE ACCIONES
// ========================================

// Marcar cotización como aceptada
window.marcarAceptada = async function(codigo) {
  try {
    console.log(`✅ Marcando como aceptada: ${codigo}`);
    
    await db.collection('cotizaciones').doc(codigo).update({
      estado: 'Aceptada',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    mostrarNotificacion('Cotización marcada como aceptada', 'success');
    await cargarCotizaciones();
    
  } catch (error) {
    console.error('❌ Error al marcar como aceptada:', error);
    mostrarNotificacion('Error al actualizar el estado', 'error');
  }
};

// Generar contrato (cambiar estado a contratada)
window.generarContrato = async function(codigo) {
  try {
    console.log(`📄 Generando contrato: ${codigo}`);
    
    await db.collection('cotizaciones').doc(codigo).update({
      estado: 'Contratada',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    mostrarNotificacion('Contrato generado exitosamente', 'success');
    await cargarCotizaciones();
    
  } catch (error) {
    console.error('❌ Error al generar contrato:', error);
    mostrarNotificacion('Error al generar el contrato', 'error');
  }
};

// Ver PDF de la cotización
window.verPDF = function(codigo) {
  try {
    console.log(`👁️ Generando PDF para: ${codigo}`);
    
    const cotizacion = cotizaciones.find(c => (c.codigo || c.id) === codigo);
    if (!cotizacion) {
      mostrarNotificacion('Cotización no encontrada', 'error');
      return;
    }
    
    generarPDF(cotizacion);
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    mostrarNotificacion('Error al generar el PDF', 'error');
  }
};

// Eliminar cotización
window.eliminarCotizacion = function(codigo) {
  mostrarModalConfirmacion(
    'Eliminar Cotización',
    `¿Estás seguro de que quieres eliminar la cotización ${codigo}? Esta acción no se puede deshacer.`,
    'eliminar',
    codigo
  );
};

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Generar PDF desde datos de Firestore (SOLUCIÓN CRÍTICA)
function generarPDF(cotizacion) {
  try {
    console.log('📄 Generando PDF desde datos de Firestore...');
    
    // SOLUCIÓN: Crear un div temporal para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.zIndex = '-1';
    
    // Renderizar la cotización
    tempDiv.innerHTML = renderInvoice(cotizacion);
    document.body.appendChild(tempDiv);
    
    // Configurar opciones de html2pdf
    const opt = {
      margin: 0,
      filename: `${cotizacion.codigo || cotizacion.id}_cotizacion.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar y descargar PDF usando .then() como especificado
    html2pdf().set(opt).from(tempDiv).save()
      .then(() => {
        console.log('✅ PDF generado exitosamente');
        
        // Limpiar: remover el div temporal después de generar el PDF
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      })
      .catch((error) => {
        console.error('❌ Error al generar PDF:', error);
        
        // Limpiar en caso de error también
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        
        throw error;
      });
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    mostrarNotificacion('Error al generar el PDF', 'error');
  }
}

// Modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, accion, codigo) {
  if (!modalTitle || !modalMessage || !modalConfirm) {
    console.error('❌ Elementos del modal no encontrados');
    return;
  }
  
  modalTitle.textContent = titulo;
  modalMessage.textContent = mensaje;
  modalConfirm.textContent = accion === 'eliminar' ? 'Eliminar' : 'Confirmar';
  modalConfirm.className = accion === 'eliminar' ? 'btn btn-danger' : 'btn btn-primary';
  
  cotizacionSeleccionada = { accion, codigo };
  confirmModal.style.display = 'flex';
}

// Cerrar modal
function cerrarModal() {
  if (confirmModal) {
    confirmModal.style.display = 'none';
  }
  cotizacionSeleccionada = null;
}

// Ejecutar acción confirmada
async function ejecutarAccionConfirmada() {
  if (!cotizacionSeleccionada) return;
  
  const { accion, codigo } = cotizacionSeleccionada;
  
  try {
    if (accion === 'eliminar') {
      console.log(`🗑️ Eliminando cotización: ${codigo}`);
      
      await db.collection('cotizaciones').doc(codigo).delete();
      
      mostrarNotificacion('Cotización eliminada exitosamente', 'success');
      await cargarCotizaciones();
    }
    
    cerrarModal();
    
  } catch (error) {
    console.error('❌ Error al ejecutar acción:', error);
    mostrarNotificacion('Error al ejecutar la acción', 'error');
  }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;
  
  // Añadir al DOM
  document.body.appendChild(notificacion);
  
  // Mostrar con animación
  setTimeout(() => {
    notificacion.classList.add('mostrar');
  }, 100);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove('mostrar');
    setTimeout(() => {
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

// Función para cerrar sesión
window.cerrarSesion = async function() {
  try {
    console.log('🚪 Cerrando sesión...');
    
    await firebase.auth().signOut();
    window.location.href = 'login.html';
    
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
}; 