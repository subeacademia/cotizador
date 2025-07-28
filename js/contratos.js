// Variables globales
let contratos = [];
let contratoActualEdicion = null; // Para el modo edición

// ===== SISTEMA DE NOTIFICACIONES =====
function mostrarNotificacion(mensaje, tipo = 'success') {
  console.log(`🔔 Notificación [${tipo}]:`, mensaje);
  
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

// Elementos del DOM
const contratosList = document.getElementById('contratos-list');
const totalContratos = document.getElementById('total-contratos');
const contratosPendientes = document.getElementById('contratos-pendientes');
const contratosFirmados = document.getElementById('contratos-firmados');
const valorTotalContratos = document.getElementById('valor-total-contratos');
const filtroEstadoContrato = document.getElementById('filtro-estado-contrato');
const filtroMesContrato = document.getElementById('filtro-mes-contrato');
const filtroAnoContrato = document.getElementById('filtro-ano-contrato');
const aplicarFiltrosContratos = document.getElementById('aplicar-filtros-contratos');

// Variables para el modal de estado
let contratoActualEstado = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando gestión de contratos...');
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    cargarContratos();
    setupEventListeners();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        cargarContratos();
        setupEventListeners();
      }
    }, 100);
  }
});

// Configurar event listeners
function setupEventListeners() {
  if (aplicarFiltrosContratos) {
    aplicarFiltrosContratos.addEventListener('click', filtrarContratos);
  }
  
  // Configurar buscador en tiempo real
  const buscador = document.getElementById('buscador-contratos');
  if (buscador) {
    buscador.addEventListener('input', buscarEnTiempoReal);
    console.log('✅ Buscador de contratos configurado');
  }
}

// Cargar contratos desde Firestore
async function cargarContratos() {
  try {
    console.log('🔄 Cargando contratos...');
    mostrarLoading(true);
    
    // Usar la nueva API de Firestore
    const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const q = query(
      collection(window.db, 'contratos'),
      orderBy('fechaCreacionContrato', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    console.log(`📊 Snapshot obtenido: ${snapshot.size} contratos`);
    
    if (snapshot.empty) {
      console.log('📭 No hay contratos disponibles');
      contratos = [];
      mostrarLoading(false);
      mostrarNoData(true);
      actualizarEstadisticas();
      return;
    }
    
    contratos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacionContrato: doc.data().fechaCreacionContrato?.toDate() || new Date()
    }));
    
    console.log(`✅ ${contratos.length} contratos cargados`);
    
    actualizarEstadisticas();
    renderizarContratos();
    
    // Verificar y actualizar automáticamente el estado de firmas
    await verificarYActualizarEstadoFirmas();
    
    mostrarLoading(false);
    mostrarNoData(false);
    
  } catch (error) {
    console.error('❌ Error al cargar contratos:', error);
    alert('Error al cargar los contratos. Por favor, inténtalo de nuevo.');
    mostrarLoading(false);
    mostrarNoData(true);
  }
}

function mostrarLoading(mostrar) {
  if (contratosList) {
    if (mostrar) {
      contratosList.innerHTML = '<div class="loading">Cargando contratos...</div>';
    }
  }
}

function mostrarNoData(mostrar) {
  if (contratosList && mostrar) {
    contratosList.innerHTML = '<div class="no-data">No hay contratos disponibles</div>';
  }
}

function actualizarEstadisticas() {
  const total = contratos.length;
  const pendientes = contratos.filter(c => c.estadoContrato === 'Pendiente de Firma').length;
  const firmados = contratos.filter(c => c.estadoContrato === 'Firmado').length;
  const valorTotal = contratos.reduce((sum, c) => sum + (c.totalConDescuento || 0), 0);
  
  if (totalContratos) totalContratos.textContent = total;
  if (contratosPendientes) contratosPendientes.textContent = pendientes;
  if (contratosFirmados) contratosFirmados.textContent = firmados;
  if (valorTotalContratos) valorTotalContratos.textContent = `$${valorTotal.toLocaleString()}`;
}

function renderizarContratos() {
  if (!contratosList) return;
  
  console.log('🎨 Renderizando contratos...');
  console.log('📊 Total de contratos:', contratos.length);
  
  if (contratos.length === 0) {
    contratosList.innerHTML = '<div class="no-data">No hay contratos disponibles</div>';
    return;
  }
  
  const html = contratos.map(contrato => {
    return `
    <div class="cotizacion-card">
      <div class="cotizacion-header">
        <h3>${contrato.tituloContrato || contrato.codigoCotizacion || 'Sin título'}</h3>
        <div class="header-meta">
          <span class="fecha">${formatearFecha(contrato.fechaCreacionContrato)}</span>
          <span class="estado ${contrato.estadoContrato?.toLowerCase().replace(/\s+/g, '-')}">${contrato.estadoContrato || 'Pendiente'}</span>
        </div>
      </div>
      <div class="cotizacion-body">
        <div class="cliente-info">
          <p><strong>👤</strong> ${contrato.cliente?.nombre || 'No especificado'}</p>
          <p><strong>🏢</strong> ${contrato.cliente?.empresa || 'No especificada'}</p>
          <p><strong>📧</strong> ${contrato.cliente?.email || 'No especificado'}</p>
          <p><strong>🆔</strong> ${contrato.cliente?.rut || 'No especificado'}</p>
        </div>
        <div class="total-info">
          <strong>💰 Total:</strong> $${(contrato.totalConDescuento || contrato.total || 0).toLocaleString()}
          ${contrato.descuento > 0 ? `<br><small>Descuento: ${contrato.descuento}%</small>` : ''}
        </div>
        <div class="contrato-meta">
          <p><strong>👨‍💼</strong> ${contrato.atendido || 'No especificado'}</p>
          <p><strong>📋</strong> ${contrato.cotizacionIdOriginal || 'Contrato directo'}</p>
          ${contrato.estadoContrato === 'Firmado' ? `
            <p><strong>✅</strong> Firmado ${formatearFecha(contrato.fechaFirmaFinal)}</p>
          ` : ''}
        </div>
      </div>
      <div class="cotizacion-actions">
        <button class="btn btn-action" onclick="verDetallesContrato('${contrato.id}')" title="Ver Detalles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
        <button class="btn btn-action" onclick="editarContrato('${contrato.id}')" title="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="btn btn-action" onclick="generarPDFContrato('${contrato.id}')" title="Ver PDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </button>
        <button class="btn btn-action btn-danger" onclick="eliminarContrato('${contrato.id}')" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
        ${contrato.estadoContrato === 'Pendiente de Completar' ? `
        <button class="btn btn-action btn-success" onclick="mostrarModalCompletarContrato('${contrato.id}')" title="Completar y Firmar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </button>
        ` : ''}
        ${contrato.estadoContrato === 'Pendiente de Firma' ? `
        <button class="btn btn-action btn-success" onclick="console.log('🔘 Botón Firmar como Representante clickeado'); firmarComoRepresentante('${contrato.id}')" title="Firmar como Representante">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        <button class="btn btn-action btn-primary" onclick="enviarFirmaContrato('${contrato.id}')" title="Enviar Firma al Cliente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
        ` : ''}
      </div>
    </div>
  `;
  }).join('');
  
  contratosList.innerHTML = html;
}

function filtrarContratos() {
  const filtroEstadoValor = filtroEstadoContrato?.value || 'todos';
  const filtroMesValor = filtroMesContrato?.value || 'todos';
  const filtroAnoValor = filtroAnoContrato?.value || 'todos';
  
  let contratosFiltrados = [...contratos];
  
  // Filtrar por estado
  if (filtroEstadoValor !== 'todos') {
    contratosFiltrados = contratosFiltrados.filter(c => c.estadoContrato === filtroEstadoValor);
  }
  
  // Filtrar por mes
  if (filtroMesValor !== 'todos') {
    contratosFiltrados = contratosFiltrados.filter(c => {
      if (!c.fechaCreacionContrato) return false;
      const fecha = c.fechaCreacionContrato.toDate ? c.fechaCreacionContrato.toDate() : new Date(c.fechaCreacionContrato);
      return fecha.getMonth() + 1 === parseInt(filtroMesValor);
    });
  }
  
  // Filtrar por año
  if (filtroAnoValor !== 'todos') {
    contratosFiltrados = contratosFiltrados.filter(c => {
      if (!c.fechaCreacionContrato) return false;
      const fecha = c.fechaCreacionContrato.toDate ? c.fechaCreacionContrato.toDate() : new Date(c.fechaCreacionContrato);
      return fecha.getFullYear() === parseInt(filtroAnoValor);
    });
  }
  
  // Renderizar contratos filtrados
  renderizarContratosFiltrados(contratosFiltrados);
}

// Función de búsqueda en tiempo real
function buscarEnTiempoReal(event) {
  const termino = event.target.value.toLowerCase().trim();
  console.log('🔍 Buscando contratos:', termino);
  
  if (contratos.length === 0) {
    console.log('⚠️ No hay contratos cargados para buscar');
    return;
  }
  
  if (termino === '') {
    // Si no hay término de búsqueda, aplicar solo filtros
    filtrarContratos();
    return;
  }
  
  // Obtener contratos filtrados por estado, mes y año
  let contratosFiltrados = [...contratos];
  
  const filtroEstadoValor = filtroEstadoContrato?.value || 'todos';
  const filtroMesValor = filtroMesContrato?.value || 'todos';
  const filtroAnoValor = filtroAnoContrato?.value || 'todos';
  
  // Aplicar filtros de estado
  if (filtroEstadoValor !== 'todos') {
    contratosFiltrados = contratosFiltrados.filter(c => c.estadoContrato === filtroEstadoValor);
  }
  
  // Aplicar filtros de mes
  if (filtroMesValor !== 'todos') {
    contratosFiltrados = contratosFiltrados.filter(c => {
      if (!c.fechaCreacionContrato) return false;
      const fecha = c.fechaCreacionContrato.toDate ? c.fechaCreacionContrato.toDate() : new Date(c.fechaCreacionContrato);
      return fecha.getMonth() + 1 === parseInt(filtroMesValor);
    });
  }
  
  // Aplicar filtros de año
  if (filtroAnoValor !== 'todos') {
    contratosFiltrados = contratosFiltrados.filter(c => {
      if (!c.fechaCreacionContrato) return false;
      const fecha = c.fechaCreacionContrato.toDate ? c.fechaCreacionContrato.toDate() : new Date(c.fechaCreacionContrato);
      return fecha.getFullYear() === parseInt(filtroAnoValor);
    });
  }
  
  // Aplicar búsqueda en tiempo real
  const contratosBuscados = contratosFiltrados.filter(contrato => {
    const busquedaEspecifica = (
      contrato.codigoCotizacion?.toLowerCase().includes(termino) ||
      contrato.cliente?.nombre?.toLowerCase().includes(termino) ||
      contrato.cliente?.empresa?.toLowerCase().includes(termino) ||
      contrato.cliente?.email?.toLowerCase().includes(termino) ||
      contrato.cliente?.rut?.toLowerCase().includes(termino) ||
      contrato.atendido?.toLowerCase().includes(termino) ||
      contrato.estadoContrato?.toLowerCase().includes(termino) ||
      (contrato.fechaCreacionContrato ? new Date(contrato.fechaCreacionContrato).toLocaleDateString('es-CL').toLowerCase() : '').includes(termino) ||
      contrato.total?.toString().includes(termino) ||
      contrato.totalConDescuento?.toString().includes(termino)
    );
    
    return busquedaEspecifica;
  });
  
  console.log(`🔍 Búsqueda completada: ${contratosBuscados.length} resultados`);
  renderizarContratosFiltrados(contratosBuscados);
}

// Función para renderizar contratos filtrados
function renderizarContratosFiltrados(contratosFiltrados) {
  if (contratosList) {
    if (contratosFiltrados.length === 0) {
      contratosList.innerHTML = '<div class="no-data">No hay contratos que coincidan con los filtros</div>';
    } else {
      const html = contratosFiltrados.map(contrato => `
        <div class="cotizacion-card">
          <div class="cotizacion-header">
            <h3>${contrato.tituloContrato || contrato.codigoCotizacion || 'Sin título'}</h3>
            <span class="fecha">${formatearFecha(contrato.fechaCreacionContrato)}</span>
            <select class="estado-select" onchange="cambiarEstadoContratoDirecto('${contrato.id}', this.value)">
              <option value="Pendiente de Completar" ${contrato.estadoContrato === 'Pendiente de Completar' ? 'selected' : ''}>Pendiente de Completar</option>
              <option value="Pendiente de Firma" ${contrato.estadoContrato === 'Pendiente de Firma' ? 'selected' : ''}>Pendiente de Firma</option>
              <option value="Enviado" ${contrato.estadoContrato === 'Enviado' ? 'selected' : ''}>Enviado</option>
              <option value="Firmado" ${contrato.estadoContrato === 'Firmado' ? 'selected' : ''}>Firmado</option>
              <option value="Finalizado" ${contrato.estadoContrato === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
            </select>
          </div>
          <div class="cotizacion-body">
            <div class="cliente-info">
              <p><strong>👤 Cliente:</strong> ${contrato.cliente?.nombre || 'No especificado'}</p>
              <p><strong>🏢 Empresa:</strong> ${contrato.cliente?.empresa || 'No especificada'}</p>
              <p><strong>📧 Email:</strong> ${contrato.cliente?.email || 'No especificado'}</p>
              <p><strong>🆔 RUT:</strong> ${contrato.cliente?.rut || 'No especificado'}</p>
            </div>
            <p><strong>👨‍💼 Atendido por:</strong> ${contrato.atendido || 'No especificado'}</p>
            <div class="total-info">
              <strong>💰 Total:</strong> $${(contrato.totalConDescuento || contrato.total || 0).toLocaleString()}
              ${contrato.descuento > 0 ? `<br><small>Descuento: ${contrato.descuento}%</small>` : ''}
            </div>
            <div class="contrato-info">
              <p><strong>📋 Cotización Original:</strong> ${contrato.cotizacionIdOriginal || 'Contrato directo'}</p>
              <p><strong>📅 Fecha de Creación:</strong> ${formatearFecha(contrato.fechaCreacionContrato)}</p>
              ${contrato.estadoContrato === 'Firmado' ? `
                <p><strong>✅ Firmado por:</strong></p>
                <p><strong>👤 Representante:</strong> ${contrato.representanteLegal || 'No especificado'}</p>
                <p><strong>👤 Cliente:</strong> ${contrato.cliente?.nombre || 'No especificado'}</p>
                <p><strong>📅 Fecha de Firma:</strong> ${formatearFecha(contrato.fechaFirmaFinal)}</p>
              ` : ''}
            </div>
          </div>
          <div class="cotizacion-actions">
            <button class="btn btn-action" onclick="verDetallesContrato('${contrato.id}')" title="Ver Detalles">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </button>
            <button class="btn btn-action" onclick="editarContrato('${contrato.id}')" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="btn btn-action" onclick="generarPDFContrato('${contrato.id}')" title="Ver PDF">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </button>
                    <button class="btn btn-action btn-danger" onclick="eliminarContrato('${contrato.id}')" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
        ${contrato.estadoContrato === 'Pendiente de Completar' ? `
        <button class="btn btn-action btn-success" onclick="mostrarModalCompletarContrato('${contrato.id}')" title="Completar y Firmar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </button>
        ` : ''}
        ${contrato.estadoContrato === 'Pendiente de Firma' ? `
        <button class="btn btn-action btn-success" onclick="console.log('🔘 Botón Firmar como Representante clickeado (filtrado)'); firmarComoRepresentante('${contrato.id}')" title="Firmar como Representante">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        <button class="btn btn-action btn-primary" onclick="enviarFirmaContrato('${contrato.id}')" title="Enviar Firma al Cliente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
        ` : ''}
          </div>
        </div>
      `).join('');
      
      contratosList.innerHTML = html;
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

// ===== MENÚ DE ACCIONES INTEGRADO PARA CONTRATOS =====
let currentDropdownMenuContrato = null;

function toggleDropdownContrato(contratoId) {
  console.log('🔄 Toggle dropdown para contrato:', contratoId);
  
  // Si ya hay un menú abierto, cerrarlo
  if (currentDropdownMenuContrato) {
    currentDropdownMenuContrato.remove();
    currentDropdownMenuContrato = null;
    return;
  }
  
  // Obtener el botón que se hizo clic
  const button = document.querySelector(`[onclick="toggleDropdownContrato('${contratoId}')"]`);
  if (!button) {
    console.error('❌ Botón no encontrado');
    return;
  }
  
  // Obtener la tarjeta de contrato (contenedor padre)
  const contratoCard = button.closest('.cotizacion-card');
  if (!contratoCard) {
    console.error('❌ Tarjeta de contrato no encontrada');
    return;
  }
  
  // Obtener los datos del contrato
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    console.error('❌ Contrato no encontrado');
    return;
  }
  
  // Crear el menú integrado
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'acciones-dropdown-menu-integrado';
  dropdownMenu.id = `dropdown-menu-contrato-${contratoId}`;
  
  // Crear el contenido del menú con event listeners directos
  dropdownMenu.innerHTML = `
    <a href="#" data-action="detalles" data-id="${contratoId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Ver Detalles
    </a>
    <a href="#" data-action="estado" data-id="${contratoId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
      Cambiar Estado
    </a>
    <a href="#" data-action="pdf" data-id="${contratoId}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
      Ver PDF
    </a>
    <a href="#" data-action="eliminar" data-id="${contratoId}" class="danger">
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
    
    console.log('🖱️ Clic en acción de contrato:', action, 'para ID:', id);
    
    switch(action) {
      case 'detalles':
        verDetallesContrato(id);
        break;
      case 'estado':
        cambiarEstadoContrato(id);
        break;
      case 'pdf':
        generarPDFContrato(id);
        break;
      case 'eliminar':
        eliminarContrato(id);
        break;
    }
    
    // Pequeño retraso para asegurar que el clic se registre
    setTimeout(() => {
      closeDropdownContrato();
    }, 50);
  });
  
  // Agregar el menú dentro de la tarjeta de contrato
  contratoCard.appendChild(dropdownMenu);
  currentDropdownMenuContrato = dropdownMenu;
  
  console.log('✅ Menú integrado de contrato creado y mostrado');
}

function closeDropdownContrato() {
  if (currentDropdownMenuContrato) {
    currentDropdownMenuContrato.remove();
    currentDropdownMenuContrato = null;
    console.log('❌ Menú integrado de contrato cerrado');
  }
}

// Cerrar dropdown al hacer clic fuera (temporalmente comentado)
/*
document.addEventListener('click', function(event) {
  const isDropdownButton = event.target.closest('.btn-dropdown');
  const isDropdownMenu = event.target.closest('.acciones-dropdown-menu-integrado');
  
  if (!isDropdownButton && !isDropdownMenu) {
    closeDropdownContrato();
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
    closeDropdownContrato();
  }
});

// Funciones para cambiar estado del contrato
async function cambiarEstadoContratoDirecto(contratoId, nuevoEstado) {
  console.log('🔄 Cambiando estado directo del contrato:', contratoId, 'a:', nuevoEstado);
  
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar en Firestore
    const docRef = doc(window.db, 'contratos', contratoId);
    await updateDoc(docRef, {
      estadoContrato: nuevoEstado
    });
    
    // Actualizar el array local
    const contrato = contratos.find(c => c.id === contratoId);
    if (contrato) {
      contrato.estadoContrato = nuevoEstado;
    }
    
    // Actualizar la interfaz
    actualizarEstadisticas();
    renderizarContratos();
    
    console.log('✅ Estado del contrato actualizado correctamente a:', nuevoEstado);
    
  } catch (error) {
    console.error('❌ Error al actualizar estado del contrato:', error);
    alert('Error al actualizar el estado del contrato: ' + error.message);
  }
}

function cambiarEstadoContrato(contratoId) {
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    alert('Contrato no encontrado');
    return;
  }
  
  contratoActualEstado = contratoId;
  document.getElementById('modal-contrato-codigo').textContent = contrato.codigoCotizacion;
  
  // Llenar el select con el estado actual
  const selectEstado = document.getElementById('nuevo-estado-contrato');
  selectEstado.value = contrato.estadoContrato || 'Pendiente de Firma';
  
  // Mostrar modal
  document.getElementById('modal-estado-contrato').style.display = 'block';
}

async function confirmarCambioEstadoContrato() {
  if (!contratoActualEstado) return;
  
  const nuevoEstado = document.getElementById('nuevo-estado-contrato').value;
  
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const docRef = doc(window.db, 'contratos', contratoActualEstado);
    await updateDoc(docRef, {
      estadoContrato: nuevoEstado
    });
    
    // Actualizar el array local
    const contrato = contratos.find(c => c.id === contratoActualEstado);
    if (contrato) {
      contrato.estadoContrato = nuevoEstado;
    }
    
    // Actualizar la interfaz
    actualizarEstadisticas();
    renderizarContratos();
    
    cerrarModalEstadoContrato();
    alert('Estado del contrato actualizado correctamente');
    
  } catch (error) {
    console.error('Error al actualizar estado del contrato:', error);
    alert('Error al actualizar el estado del contrato');
  }
}

function cerrarModalEstadoContrato() {
  document.getElementById('modal-estado-contrato').style.display = 'none';
  contratoActualEstado = null;
}

// ===== FUNCIONES PARA MODAL DE CREAR/EDITAR CONTRATO =====
function mostrarModalCrearContrato(contratoId = null) {
  console.log('📝 Mostrando modal para crear/editar contrato:', contratoId);
  
  const modal = document.getElementById('modal-crear-contrato');
  const titulo = document.getElementById('modal-contrato-titulo');
  
  // Limpiar formulario
  limpiarFormularioContrato();
  
  if (contratoId) {
    // Modo edición
    contratoActualEdicion = contratoId;
    titulo.textContent = 'Editar Contrato';
    
    const contrato = contratos.find(c => c.id === contratoId);
    if (contrato) {
      llenarFormularioContrato(contrato);
    }
  } else {
    // Modo creación
    contratoActualEdicion = null;
    titulo.textContent = 'Crear Contrato Directo';
    
    // Establecer fecha actual como fecha de inicio por defecto
    const fechaInicio = document.getElementById('fecha-inicio-directo');
    if (fechaInicio) {
      fechaInicio.value = new Date().toISOString().split('T')[0];
    }
  }
  
  modal.style.display = 'block';
}

function cerrarModalCrearContrato() {
  const modal = document.getElementById('modal-crear-contrato');
  modal.style.display = 'none';
  contratoActualEdicion = null;
  limpiarFormularioContrato();
}

function limpiarFormularioContrato() {
  const campos = [
    'titulo-contrato-directo',
    'fecha-inicio-directo',
    'fecha-fin-directo',
    'valor-total-directo',
    'nombre-cliente-directo',
    'email-cliente-directo',
    'rut-cliente-directo',
    'empresa-cliente-directo',
    'servicios-contrato-directo',
    'terminos-contrato-directo'
  ];
  
  campos.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.value = '';
    }
  });
}

function llenarFormularioContrato(contrato) {
  document.getElementById('titulo-contrato-directo').value = contrato.tituloContrato || '';
  document.getElementById('fecha-inicio-directo').value = contrato.fechaInicio ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : '';
  document.getElementById('fecha-fin-directo').value = contrato.fechaFin ? new Date(contrato.fechaFin).toISOString().split('T')[0] : '';
  document.getElementById('valor-total-directo').value = contrato.totalConDescuento || contrato.total || '';
  document.getElementById('nombre-cliente-directo').value = contrato.cliente?.nombre || '';
  document.getElementById('email-cliente-directo').value = contrato.cliente?.email || '';
  document.getElementById('rut-cliente-directo').value = contrato.cliente?.rut || '';
  document.getElementById('empresa-cliente-directo').value = contrato.cliente?.empresa || '';
  document.getElementById('servicios-contrato-directo').value = contrato.descripcionServicios || '';
  document.getElementById('terminos-contrato-directo').value = contrato.terminosCondiciones || '';
}

async function guardarContratoDirecto() {
  console.log('💾 Guardando contrato directo...');
  
  // Validar campos obligatorios
  const titulo = document.getElementById('titulo-contrato-directo').value.trim();
  const nombreCliente = document.getElementById('nombre-cliente-directo').value.trim();
  const emailCliente = document.getElementById('email-cliente-directo').value.trim();
  const valorTotal = document.getElementById('valor-total-directo').value;
  
  if (!titulo || !nombreCliente || !emailCliente || !valorTotal) {
    alert('Por favor, complete todos los campos obligatorios: Título, Nombre del Cliente, Email y Valor Total.');
    return;
  }
  
  try {
    // Importar Firebase dinámicamente
    const { doc, setDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const contrato = {
      tituloContrato: titulo,
      fechaInicio: document.getElementById('fecha-inicio-directo').value || null,
      fechaFin: document.getElementById('fecha-fin-directo').value || null,
      totalConDescuento: parseFloat(valorTotal) || 0,
      cliente: {
        nombre: nombreCliente,
        email: emailCliente,
        rut: document.getElementById('rut-cliente-directo').value.trim(),
        empresa: document.getElementById('empresa-cliente-directo').value.trim()
      },
      descripcionServicios: document.getElementById('servicios-contrato-directo').value.trim(),
      terminosCondiciones: document.getElementById('terminos-contrato-directo').value.trim(),
      fechaCreacionContrato: new Date(),
      estadoContrato: 'Pendiente de Firma',
      atendido: 'Usuario Actual', // Se puede mejorar para obtener el usuario real
      codigoCotizacion: `CON-${Date.now()}`, // Generar código único
      esContratoDirecto: true // Marcar como contrato creado directamente
    };
    
    let docRef;
    
    if (contratoActualEdicion) {
      // Modo edición
      docRef = doc(window.db, 'contratos', contratoActualEdicion);
      await updateDoc(docRef, contrato);
      console.log('✅ Contrato actualizado correctamente');
    } else {
      // Modo creación
      const contratoId = `contrato-${Date.now()}`;
      docRef = doc(window.db, 'contratos', contratoId);
      await setDoc(docRef, contrato);
      console.log('✅ Contrato creado correctamente');
    }
    
    // Cerrar modal y recargar datos
    cerrarModalCrearContrato();
    await cargarContratos();
    
    alert(contratoActualEdicion ? 'Contrato actualizado correctamente' : 'Contrato creado correctamente');
    
  } catch (error) {
    console.error('❌ Error al guardar contrato:', error);
    alert('Error al guardar el contrato: ' + error.message);
  }
}

// ===== FUNCIONES PARA MODAL DE DETALLES =====
function verDetallesContrato(contratoId) {
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    alert('Contrato no encontrado');
    return;
  }
  
  const modal = document.getElementById('modal-detalles-contrato');
  const contenido = document.getElementById('detalles-contrato-content');
  
  // Generar contenido HTML para los detalles
  const detallesHTML = `
    <div class="detalles-contrato">
      <div class="detalle-seccion">
        <h4>📋 Información General</h4>
        <p><strong>Título:</strong> ${contrato.tituloContrato || 'Sin título'}</p>
        <p><strong>Código:</strong> ${contrato.codigoCotizacion || 'Sin código'}</p>
        <p><strong>Estado:</strong> <span class="estado-badge estado-${contrato.estadoContrato ? contrato.estadoContrato.toLowerCase().replace(/\s+/g, '-') : 'pendiente-de-firma'}">${contrato.estadoContrato || 'Pendiente de Firma'}</span></p>
        <p><strong>Fecha de Creación:</strong> ${formatearFecha(contrato.fechaCreacionContrato)}</p>
        ${contrato.fechaInicio ? `<p><strong>Fecha de Inicio:</strong> ${formatearFecha(contrato.fechaInicio)}</p>` : ''}
        ${contrato.fechaFin ? `<p><strong>Fecha de Fin:</strong> ${formatearFecha(contrato.fechaFin)}</p>` : ''}
      </div>
      
      <div class="detalle-seccion">
        <h4>👤 Información del Cliente</h4>
        <p><strong>Nombre:</strong> ${contrato.cliente?.nombre || 'No especificado'}</p>
        <p><strong>Email:</strong> ${contrato.cliente?.email || 'No especificado'}</p>
        <p><strong>RUT:</strong> ${contrato.cliente?.rut || 'No especificado'}</p>
        <p><strong>Empresa:</strong> ${contrato.cliente?.empresa || 'No especificada'}</p>
      </div>
      
      <div class="detalle-seccion">
        <h4>💰 Información Financiera</h4>
        <p><strong>Valor Total:</strong> $${(contrato.totalConDescuento || contrato.total || 0).toLocaleString()}</p>
        ${contrato.descuento > 0 ? `<p><strong>Descuento:</strong> ${contrato.descuento}%</p>` : ''}
        <p><strong>Atendido por:</strong> ${contrato.atendido || 'No especificado'}</p>
      </div>
      
      ${contrato.descripcionServicios ? `
      <div class="detalle-seccion">
        <h4>🔧 Servicios</h4>
        <p>${contrato.descripcionServicios}</p>
      </div>
      ` : ''}
      
      ${contrato.terminosCondiciones ? `
      <div class="detalle-seccion">
        <h4>📜 Términos y Condiciones</h4>
        <p>${contrato.terminosCondiciones}</p>
      </div>
      ` : ''}
      
      ${contrato.cotizacionIdOriginal ? `
      <div class="detalle-seccion">
        <h4>📄 Cotización Original</h4>
        <p><strong>ID de Cotización:</strong> ${contrato.cotizacionIdOriginal}</p>
      </div>
      ` : ''}
      
      ${contrato.notas ? `
      <div class="detalle-seccion">
        <h4>📝 Notas Adicionales</h4>
        <p>${contrato.notas}</p>
      </div>
      ` : ''}
    </div>
  `;
  
  contenido.innerHTML = detallesHTML;
  modal.style.display = 'block';
  
  // Guardar el ID del contrato para la edición
  modal.setAttribute('data-contrato-id', contratoId);
}

function cerrarModalDetallesContrato() {
  const modal = document.getElementById('modal-detalles-contrato');
  modal.style.display = 'none';
  modal.removeAttribute('data-contrato-id');
}

function editarContratoDesdeDetalles() {
  const modal = document.getElementById('modal-detalles-contrato');
  const contratoId = modal.getAttribute('data-contrato-id');
  
  if (contratoId) {
    cerrarModalDetallesContrato();
    mostrarModalCrearContrato(contratoId);
  }
}

function editarContrato(contratoId) {
  mostrarModalCrearContrato(contratoId);
}

// ===== FUNCIONES PARA MODAL DE COMPLETAR CONTRATO =====
function mostrarModalCompletarContrato(contratoId) {
  console.log('📝 Mostrando modal para completar contrato:', contratoId);
  
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    mostrarNotificacion('Contrato no encontrado', 'error');
    return;
  }
  
  // Llenar el formulario con los datos existentes
  document.getElementById('partes-involucradas').value = `${contrato.cliente?.nombre || ''} - ${contrato.cliente?.empresa || ''}`;
  document.getElementById('objeto-contrato').value = contrato.objetoContrato || contrato.descripcionServicios || '';
  document.getElementById('clausulas-contrato').value = contrato.clausulas || contrato.terminosCondiciones || '';
  document.getElementById('fecha-inicio-completar').value = contrato.fechaInicio ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : '';
  document.getElementById('fecha-fin-completar').value = contrato.fechaFin ? new Date(contrato.fechaFin).toISOString().split('T')[0] : '';
  
  // Guardar el ID del contrato para el guardado
  document.getElementById('modal-completar-contrato').setAttribute('data-contrato-id', contratoId);
  
  // Mostrar modal
  document.getElementById('modal-completar-contrato').style.display = 'block';
}

function cerrarModalCompletarContrato() {
  document.getElementById('modal-completar-contrato').style.display = 'none';
  document.getElementById('modal-completar-contrato').removeAttribute('data-contrato-id');
}

async function guardarContratoCompletado() {
  const contratoId = document.getElementById('modal-completar-contrato').getAttribute('data-contrato-id');
  if (!contratoId) {
    mostrarNotificacion('Error: ID de contrato no encontrado', 'error');
    return;
  }
  
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const datosActualizados = {
      partesInvolucradas: document.getElementById('partes-involucradas').value.trim(),
      objetoContrato: document.getElementById('objeto-contrato').value.trim(),
      clausulas: document.getElementById('clausulas-contrato').value.trim(),
      fechaInicio: document.getElementById('fecha-inicio-completar').value || null,
      fechaFin: document.getElementById('fecha-fin-completar').value || null,
      estadoContrato: 'Pendiente de Firma',
      fechaCompletado: new Date(),
      esPreContrato: false
    };
    
    // Validar campos obligatorios
    if (!datosActualizados.partesInvolucradas || !datosActualizados.objetoContrato || !datosActualizados.clausulas) {
      mostrarNotificacion('Por favor, complete todos los campos obligatorios', 'error');
      return;
    }
    
    // Actualizar en Firestore
    const docRef = doc(window.db, 'contratos', contratoId);
    await updateDoc(docRef, datosActualizados);
    
    // Actualizar el array local
    const contrato = contratos.find(c => c.id === contratoId);
    if (contrato) {
      Object.assign(contrato, datosActualizados);
    }
    
    // Cerrar modal y recargar datos
    cerrarModalCompletarContrato();
    await cargarContratos();
    
    // Mostrar notificación y redirigir a firma
    mostrarNotificacion('Contrato completado. Redirigiendo a firma...', 'success');
    setTimeout(() => {
      window.location.href = `firmar-contrato.html?id=${contratoId}`;
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error al completar contrato:', error);
    mostrarNotificacion('Error al completar el contrato: ' + error.message, 'error');
  }
}

// Función para generar PDF del contrato
function generarPDFContrato(contratoId) {
  console.log('📄 Generando PDF del contrato:', contratoId);
  
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    mostrarNotificacion('Contrato no encontrado', 'error');
    return;
  }
  
  // Siempre mostrar el contrato, no la cotización
  const contratoData = encodeURIComponent(JSON.stringify(contrato));
  window.location.href = `preview-contrato.html?data=${contratoData}&pdf=true`;
}

// Función para enviar firma del contrato
function enviarFirmaContrato(contratoId) {
  console.log('📤 Enviando firma del contrato:', contratoId);
  
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    mostrarNotificacion('Contrato no encontrado', 'error');
    return;
  }
  
  // Redirigir a la página de envío de firma
  window.location.href = `enviar-firma.html?id=${contratoId}`;
}

// Función para eliminar contrato
async function eliminarContrato(contratoId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este contrato? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    console.log('🗑️ Eliminando contrato:', contratoId);
    
    // Importar Firebase dinámicamente
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Eliminar de Firestore
    const contratoRef = doc(window.db, 'contratos', contratoId);
    await deleteDoc(contratoRef);
    
    console.log('✅ Contrato eliminado exitosamente');
    mostrarNotificacion('Contrato eliminado exitosamente', 'success');
    
    // Recargar contratos
    cargarContratos();
    
  } catch (error) {
    console.error('❌ Error al eliminar contrato:', error);
    mostrarNotificacion('Error al eliminar contrato: ' + error.message, 'error');
  }
}

// ===== NUEVA FUNCIÓN PARA FIRMAR COMO REPRESENTANTE =====
function firmarComoRepresentante(contratoId) {
  console.log('✍️ Función firmarComoRepresentante ejecutada');
  console.log('✍️ ID del contrato:', contratoId);
  console.log('✍️ Redirigiendo a firma como representante para contrato:', contratoId);
  
  // Verificar que el contrato existe
  const contrato = contratos.find(c => c.id === contratoId);
  if (!contrato) {
    console.error('❌ Contrato no encontrado:', contratoId);
    mostrarNotificacion('Error: Contrato no encontrado', 'error');
    return;
  }
  
  console.log('✅ Contrato encontrado:', contrato.tituloContrato);
  console.log('✅ URL de redirección:', `firmar-contrato.html?id=${contratoId}`);
  
  // Redirigir a la página de firma con el ID del contrato
  window.location.href = `firmar-contrato.html?id=${contratoId}`;
}

// Hacer funciones disponibles globalmente
window.toggleDropdownContrato = toggleDropdownContrato;
window.cambiarEstadoContrato = cambiarEstadoContrato;
window.cambiarEstadoContratoDirecto = cambiarEstadoContratoDirecto;
window.confirmarCambioEstadoContrato = confirmarCambioEstadoContrato;
window.cerrarModalEstadoContrato = cerrarModalEstadoContrato;
window.verDetallesContrato = verDetallesContrato;
window.generarPDFContrato = generarPDFContrato;
window.eliminarContrato = eliminarContrato; 
window.mostrarModalCrearContrato = mostrarModalCrearContrato;
window.cerrarModalCrearContrato = cerrarModalCrearContrato;
window.guardarContratoDirecto = guardarContratoDirecto;
window.editarContrato = editarContrato;
window.cerrarModalDetallesContrato = cerrarModalDetallesContrato;
window.editarContratoDesdeDetalles = editarContratoDesdeDetalles;
window.mostrarModalCompletarContrato = mostrarModalCompletarContrato;
window.cerrarModalCompletarContrato = cerrarModalCompletarContrato;
window.guardarContratoCompletado = guardarContratoCompletado;
window.enviarFirmaContrato = enviarFirmaContrato;
window.firmarComoRepresentante = firmarComoRepresentante; 

// ===== VERIFICAR Y ACTUALIZAR ESTADO AUTOMÁTICO DE FIRMAS =====
async function verificarYActualizarEstadoFirmas() {
  console.log('🔍 Verificando estado automático de firmas...');
  
  try {
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    let contratosActualizados = 0;
    
    // Revisar cada contrato en el array local
    for (const contrato of contratos) {
      // Solo verificar contratos que estén en "Pendiente de Firma"
      if (contrato.estadoContrato === 'Pendiente de Firma') {
        const tieneFirmaRepresentante = !!contrato.firmaRepresentanteBase64;
        const tieneFirmaCliente = !!contrato.firmaClienteBase64;
        
        // Si tiene ambas firmas, actualizar automáticamente el estado
        if (tieneFirmaRepresentante && tieneFirmaCliente) {
          console.log(`✅ Contrato ${contrato.codigoCotizacion} tiene ambas firmas - actualizando a Firmado`);
          
          // Actualizar en Firestore
          const contratoRef = doc(window.db, 'contratos', contrato.id);
          await updateDoc(contratoRef, {
            estadoContrato: 'Firmado',
            fechaFirmaFinal: new Date(),
            contratoValido: true,
            esPreContrato: false,
            fechaCompletado: new Date(),
            ambasFirmasCompletadas: true
          });
          
          // Actualizar el array local
          contrato.estadoContrato = 'Firmado';
          contrato.fechaFirmaFinal = new Date();
          contrato.contratoValido = true;
          contrato.esPreContrato = false;
          contrato.fechaCompletado = new Date();
          contrato.ambasFirmasCompletadas = true;
          
          contratosActualizados++;
        }
      }
    }
    
    if (contratosActualizados > 0) {
      console.log(`✅ ${contratosActualizados} contratos actualizados automáticamente a Firmado`);
      // Actualizar la interfaz
      actualizarEstadisticas();
      renderizarContratos();
      mostrarNotificacion(`${contratosActualizados} contratos actualizados automáticamente a Firmado`, 'success');
    } else {
      console.log('ℹ️ No se encontraron contratos que requieran actualización automática');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estado automático de firmas:', error);
  }
} 

// ===== FUNCIÓN MANUAL PARA CORREGIR ESTADOS DE CONTRATOS =====
async function corregirEstadosContratosManual() {
  console.log('🔧 Iniciando corrección manual de estados de contratos...');
  
  try {
    // Importar Firebase dinámicamente
    const { collection, query, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Obtener todos los contratos
    const contratosQuery = query(collection(window.db, 'contratos'));
    const contratosSnapshot = await getDocs(contratosQuery);
    
    let contratosActualizados = 0;
    let contratosRevisados = 0;
    
    console.log(`📊 Revisando ${contratosSnapshot.size} contratos...`);
    
    // Revisar cada contrato
    for (const docSnapshot of contratosSnapshot.docs) {
      const contrato = docSnapshot.data();
      contratosRevisados++;
      
      // Verificar si tiene ambas firmas pero está en estado incorrecto
      const tieneFirmaRepresentante = !!contrato.firmaRepresentanteBase64;
      const tieneFirmaCliente = !!contrato.firmaClienteBase64;
      const estadoActual = contrato.estadoContrato;
      
      if (tieneFirmaRepresentante && tieneFirmaCliente) {
        // Si tiene ambas firmas pero no está marcado como Firmado
        if (estadoActual !== 'Firmado' && estadoActual !== 'Finalizado') {
          console.log(`🔄 Corrigiendo contrato ${contrato.codigoCotizacion || docSnapshot.id}: ${estadoActual} → Firmado`);
          
          // Actualizar en Firestore
          const contratoRef = doc(window.db, 'contratos', docSnapshot.id);
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
      } else if (tieneFirmaRepresentante || tieneFirmaCliente) {
        // Si tiene solo una firma, asegurar que esté en estado correcto
        if (estadoActual !== 'Pendiente de Firma' && estadoActual !== 'Enviado') {
          console.log(`🔄 Corrigiendo contrato ${contrato.codigoCotizacion || docSnapshot.id}: ${estadoActual} → Pendiente de Firma`);
          
          const contratoRef = doc(window.db, 'contratos', docSnapshot.id);
          await updateDoc(contratoRef, {
            estadoContrato: 'Pendiente de Firma'
          });
          
          contratosActualizados++;
        }
      }
    }
    
    console.log(`✅ Corrección completada:`);
    console.log(`   - Contratos revisados: ${contratosRevisados}`);
    console.log(`   - Contratos actualizados: ${contratosActualizados}`);
    
    if (contratosActualizados > 0) {
      mostrarNotificacion(`✅ ${contratosActualizados} contratos corregidos automáticamente`, 'success');
      
      // Recargar contratos si estamos en la página de contratos
      if (typeof cargarContratos === 'function') {
        await cargarContratos();
      }
    } else {
      mostrarNotificacion('ℹ️ No se encontraron contratos que requieran corrección', 'info');
    }
    
  } catch (error) {
    console.error('❌ Error al corregir estados de contratos:', error);
    mostrarNotificacion('Error al corregir estados de contratos: ' + error.message, 'error');
  }
}

// Hacer la función disponible globalmente
window.corregirEstadosContratosManual = corregirEstadosContratosManual; 