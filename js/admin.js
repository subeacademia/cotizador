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
  refreshBtn.addEventListener('click', cargarCotizaciones);
  filterEstado.addEventListener('change', filtrarCotizaciones);
  modalCancel.addEventListener('click', cerrarModal);
  modalClose.addEventListener('click', cerrarModal);
  modalConfirm.addEventListener('click', ejecutarAccionConfirmada);
  
  // Cerrar modal al hacer clic fuera
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      cerrarModal();
    }
  });
}

// Cargar cotizaciones desde Firestore
async function cargarCotizaciones() {
  try {
    mostrarLoading(true);
    
    const snapshot = await db.collection('cotizaciones')
      .orderBy('fecha', 'desc')
      .get();
    
    cotizaciones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha?.toDate() || new Date()
    }));
    
    actualizarEstadisticas();
    renderizarTabla();
    mostrarLoading(false);
    
  } catch (error) {
    console.error('Error al cargar cotizaciones:', error);
    alert('Error al cargar las cotizaciones. Por favor, inténtalo de nuevo.');
    mostrarLoading(false);
  }
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
  loadingElement.style.display = mostrar ? 'block' : 'none';
  cotizacionesTbody.style.display = mostrar ? 'none' : 'table-row-group';
}

// Actualizar estadísticas
function actualizarEstadisticas() {
  const total = cotizaciones.length;
  const emitidas = cotizaciones.filter(c => c.estado === 'Emitida').length;
  const aceptadas = cotizaciones.filter(c => c.estado === 'Aceptada').length;
  const contratadas = cotizaciones.filter(c => c.estado === 'Contratada').length;
  
  totalCotizaciones.textContent = total;
  cotizacionesEmitidas.textContent = emitidas;
  cotizacionesAceptadas.textContent = aceptadas;
  cotizacionesContratadas.textContent = contratadas;
}

// Renderizar tabla de cotizaciones
function renderizarTabla() {
  const cotizacionesFiltradas = filtrarCotizaciones();
  
  if (cotizacionesFiltradas.length === 0) {
    noDataElement.style.display = 'block';
    cotizacionesTbody.innerHTML = '';
    return;
  }
  
  noDataElement.style.display = 'none';
  
  cotizacionesTbody.innerHTML = cotizacionesFiltradas.map(cotizacion => {
    const totalConDescuento = calcularTotalConDescuento(cotizacion);
    const fechaFormateada = formatearFecha(cotizacion.fecha);
    
    return `
      <tr>
        <td>
          <strong style="font-family: var(--font-mono); color: var(--color-cyan);">
            ${cotizacion.codigo}
          </strong>
        </td>
        <td>${fechaFormateada}</td>
        <td>${cotizacion.nombre}</td>
        <td>${cotizacion.empresa}</td>
        <td>
          <strong style="font-family: var(--font-mono);">
            ${totalConDescuento.toLocaleString()} ${cotizacion.moneda}
          </strong>
        </td>
        <td>
          <span class="status-badge status-${cotizacion.estado.toLowerCase()}">
            ${cotizacion.estado}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            ${cotizacion.estado === 'Emitida' ? `
              <button class="btn btn-success btn-sm" onclick="marcarAceptada('${cotizacion.id}')">
                <i class="fas fa-check"></i> Aceptar
              </button>
            ` : ''}
            ${cotizacion.estado === 'Aceptada' ? `
              <button class="btn btn-warning btn-sm" onclick="generarContrato('${cotizacion.id}')">
                <i class="fas fa-file-contract"></i> Contrato
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="verPDF('${cotizacion.id}')">
              <i class="fas fa-eye"></i> Ver PDF
            </button>
            <button class="btn btn-danger btn-sm" onclick="eliminarCotizacion('${cotizacion.id}')">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Filtrar cotizaciones
function filtrarCotizaciones() {
  const filtroEstado = filterEstado.value;
  
  if (!filtroEstado) {
    return cotizaciones;
  }
  
  return cotizaciones.filter(cotizacion => cotizacion.estado === filtroEstado);
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
  if (!fecha) return '-';
  
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  return fechaObj.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Funciones de acciones
window.marcarAceptada = async function(codigo) {
  try {
    await db.collection('cotizaciones').doc(codigo).update({
      estado: 'Aceptada',
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    await cargarCotizaciones();
    mostrarNotificacion('Cotización marcada como aceptada', 'success');
    
  } catch (error) {
    console.error('Error al marcar como aceptada:', error);
    alert('Error al actualizar el estado. Por favor, inténtalo de nuevo.');
  }
};

window.generarContrato = async function(codigo) {
  try {
    await db.collection('cotizaciones').doc(codigo).update({
      estado: 'Contratada',
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    await cargarCotizaciones();
    mostrarNotificacion('Contrato generado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error al generar contrato:', error);
    alert('Error al generar el contrato. Por favor, inténtalo de nuevo.');
  }
};

window.verPDF = function(codigo) {
  const cotizacion = cotizaciones.find(c => c.id === codigo);
  if (!cotizacion) {
    alert('Cotización no encontrada');
    return;
  }
  
  generarPDF(cotizacion);
};

window.eliminarCotizacion = function(codigo) {
  const cotizacion = cotizaciones.find(c => c.id === codigo);
  if (!cotizacion) {
    alert('Cotización no encontrada');
    return;
  }
  
  mostrarModalConfirmacion(
    'Eliminar Cotización',
    `¿Estás seguro de que deseas eliminar la cotización ${cotizacion.codigo}? Esta acción no se puede deshacer.`,
    'eliminar',
    codigo
  );
};

// Generar PDF desde datos de Firestore
function generarPDF(cotizacion) {
  try {
    // Crear elemento temporal para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-invoice';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Renderizar la cotización
    tempDiv.innerHTML = renderInvoice(cotizacion);
    
    // Configurar opciones de html2pdf
    const opt = {
      margin: 0,
      filename: `${cotizacion.codigo}_cotizacion.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar PDF
    html2pdf().set(opt).from(tempDiv).save().then(() => {
      document.body.removeChild(tempDiv);
    });
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
  }
}

// Modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, accion, codigo) {
  modalTitle.textContent = titulo;
  modalMessage.textContent = mensaje;
  modalConfirm.textContent = accion === 'eliminar' ? 'Eliminar' : 'Confirmar';
  modalConfirm.className = accion === 'eliminar' ? 'btn btn-danger' : 'btn btn-primary';
  
  cotizacionSeleccionada = { accion, codigo };
  confirmModal.style.display = 'block';
}

function cerrarModal() {
  confirmModal.style.display = 'none';
  cotizacionSeleccionada = null;
}

async function ejecutarAccionConfirmada() {
  if (!cotizacionSeleccionada) return;
  
  const { accion, codigo } = cotizacionSeleccionada;
  
  try {
    if (accion === 'eliminar') {
      await db.collection('cotizaciones').doc(codigo).delete();
      await cargarCotizaciones();
      mostrarNotificacion('Cotización eliminada exitosamente', 'success');
    }
    
    cerrarModal();
    
  } catch (error) {
    console.error('Error al ejecutar acción:', error);
    alert('Error al ejecutar la acción. Por favor, inténtalo de nuevo.');
    cerrarModal();
  }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.innerHTML = `
    <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'info-circle'}"></i>
    <span>${mensaje}</span>
  `;
  
  // Agregar estilos
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? '#28a745' : '#17a2b8'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-body);
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(notificacion);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notificacion.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style); 