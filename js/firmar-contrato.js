// Variables globales
let contratoActual = null;
let signaturePadRepresentante = null;
let signaturePadCliente = null;
let firmaRepresentanteGuardada = false;
let firmaClienteGuardada = false;
let esPanelAdmin = true; // Flag para identificar si estamos en el panel de administración

// Elementos del DOM
let loadingFirma, errorFirma, contenidoFirma, resumenContrato, firmaRepresentanteCanvas, firmaClienteCanvas, nombreCliente, empresaCliente, btnFinalizar;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando sistema de firma digital para representante...');
  
  // Determinar si estamos en el panel de administración
  esPanelAdmin = window.location.href.includes('/firmar-contrato');
  console.log('🏢 Panel de administración:', esPanelAdmin);
  
  // Esperar a que Firebase esté disponible
  if (window.db) {
    inicializarFirma();
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    const checkFirebase = setInterval(() => {
      if (window.db) {
        clearInterval(checkFirebase);
        inicializarFirma();
      }
    }, 100);
  }
});

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

// ===== INICIALIZACIÓN DEL SISTEMA DE FIRMA =====
async function inicializarFirma() {
  try {
    // Inicializar elementos del DOM
    loadingFirma = document.getElementById('loading-firma');
    errorFirma = document.getElementById('error-firma');
    contenidoFirma = document.getElementById('contenido-firma');
    resumenContrato = document.getElementById('resumen-contrato');
    firmaRepresentanteCanvas = document.getElementById('firma-representante');
    firmaClienteCanvas = document.getElementById('firma-cliente');
    nombreCliente = document.getElementById('nombre-cliente');
    empresaCliente = document.getElementById('empresa-cliente');
    btnFinalizar = document.getElementById('btn-finalizar');
    
    console.log('🔍 Elementos del DOM inicializados, btnFinalizar:', !!btnFinalizar);
    
    // Obtener ID del contrato desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');
    
    if (!contratoId) {
      mostrarError('No se proporcionó ID de contrato');
      return;
    }
    
    console.log('📋 Cargando contrato:', contratoId);
    
    // Cargar datos del contrato
    await cargarContrato(contratoId);
    
    // Configurar interfaz según el contexto (admin vs cliente)
    configurarInterfazSegunContexto();
    
    // Inicializar SignaturePads
    inicializarSignaturePads();
    
    // Verificar firmas existentes y actualizar estado
    verificarFirmasExistentes();
    
    // Mostrar contenido
    mostrarContenido();
    
  } catch (error) {
    console.error('❌ Error al inicializar firma:', error);
    mostrarError('Error al inicializar el sistema de firma: ' + error.message);
  }
}

// ===== CONFIGURAR INTERFAZ SEGÚN CONTEXTO =====
function configurarInterfazSegunContexto() {
  if (esPanelAdmin) {
    console.log('🏢 Configurando interfaz para panel de administración');
    
    // Ocultar completamente la sección de firma del cliente
    const clienteSeccion = document.getElementById('seccion-firma-cliente');
    if (clienteSeccion) {
      clienteSeccion.style.display = 'none';
    }
    
    // Actualizar título y descripción
    const tituloFirma = document.querySelector('.firma-pad-container h3');
    if (tituloFirma) {
      tituloFirma.textContent = '✍️ Firma Digital - Representante Legal';
    }
    
    const descripcionFirma = document.querySelector('.firma-info');
    if (descripcionFirma) {
      descripcionFirma.textContent = 'Este contrato requiere la firma del representante legal para ser válido';
    }
    
    // Actualizar botón finalizar
    if (btnFinalizar) {
      btnFinalizar.textContent = 'Guardar Firma Representante';
      btnFinalizar.onclick = guardarFirmaRepresentante;
    }
  } else {
    console.log('👤 Configurando interfaz para cliente');
    // La interfaz del cliente se mantiene como está
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
    
    console.log('✅ Contrato cargado:', contratoActual);
    
    // Renderizar resumen del contrato
    renderizarResumenContrato();
    
    // Actualizar información del cliente
    actualizarInfoCliente();
    
  } catch (error) {
    console.error('❌ Error al cargar contrato:', error);
    throw error;
  }
}

// ===== VERIFICAR FIRMAS EXISTENTES =====
function verificarFirmasExistentes() {
  console.log('🔍 Verificando firmas existentes...');
  
  // Verificar firma del representante
  if (contratoActual.firmaRepresentanteBase64) {
    console.log('✅ Firma del representante encontrada');
    firmaRepresentanteGuardada = true;
    console.log('📝 Variable firmaRepresentanteGuardada establecida a:', firmaRepresentanteGuardada);
    
    // Mostrar firma existente en el canvas
    if (signaturePadRepresentante) {
      const img = new Image();
      img.onload = function() {
        const ctx = firmaRepresentanteCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, firmaRepresentanteCanvas.width, firmaRepresentanteCanvas.height);
        signaturePadRepresentante.fromDataURL(contratoActual.firmaRepresentanteBase64);
      };
      img.src = contratoActual.firmaRepresentanteBase64;
    }
    
    // Deshabilitar área de firma del representante
    const representanteSeccion = document.querySelector('.firma-seccion:first-of-type');
    if (representanteSeccion) {
      representanteSeccion.style.opacity = '0.6';
      representanteSeccion.style.pointerEvents = 'none';
    }
  } else {
    console.log('❌ Firma del representante no encontrada');
    firmaRepresentanteGuardada = false;
  }
  
  // Solo verificar firma del cliente si NO estamos en el panel de administración
  if (!esPanelAdmin) {
    if (contratoActual.firmaClienteBase64) {
      console.log('✅ Firma del cliente encontrada');
      firmaClienteGuardada = true;
      
      // Mostrar firma existente en el canvas
      if (signaturePadCliente) {
        const img = new Image();
        img.onload = function() {
          const ctx = firmaClienteCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0, firmaClienteCanvas.width, firmaClienteCanvas.height);
          signaturePadCliente.fromDataURL(contratoActual.firmaClienteBase64);
        };
        img.src = contratoActual.firmaClienteBase64;
      }
      
      // Ocultar área de firma del cliente si ya está firmado
      const clienteSeccion = document.getElementById('seccion-firma-cliente');
      if (clienteSeccion) {
        clienteSeccion.style.display = 'none';
      }
    } else {
      console.log('❌ Firma del cliente no encontrada');
      firmaClienteGuardada = false;
    }
  }
  
  // Actualizar estado de firmas
  actualizarEstadoFirmas();
  
  // Verificar si el contrato ya está completamente firmado (solo en admin)
  if (esPanelAdmin && firmaRepresentanteGuardada) {
    console.log('🎯 Firma del representante completada - mostrando opciones de finalización');
    mostrarOpcionesFinalizacion();
  } else if (!esPanelAdmin && firmaRepresentanteGuardada && firmaClienteGuardada) {
    console.log('🎯 Contrato completamente firmado - habilitando finalización');
    mostrarContratoCompletamenteFirmado();
  }
}

// ===== MOSTRAR OPCIONES DE FINALIZACIÓN (ADMIN) =====
function mostrarOpcionesFinalizacion() {
  const firmaPadContainer = document.querySelector('.firma-pad-container');
  
  // Crear mensaje de confirmación
  const mensajeConfirmacion = document.createElement('div');
  mensajeConfirmacion.className = 'firma-representante-completada';
  mensajeConfirmacion.innerHTML = `
    <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 2px solid #10b981; margin: 20px 0;">
      <h3 style="color: #10b981; margin-bottom: 10px;">✅ Firma del Representante Completada</h3>
      <p style="color: #10b981; margin-bottom: 15px;">La firma del representante legal ha sido guardada exitosamente.</p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="generarLinkCliente()" class="btn btn-primary" style="background: #3b82f6; border: none; padding: 12px 24px; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;">
          🔗 Generar Link para Cliente
        </button>
        <button onclick="enviarEmailCliente()" class="btn btn-success" style="background: #10b981; border: none; padding: 12px 24px; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;">
          📧 Enviar Email al Cliente
        </button>
        <button onclick="window.router.navigate('/contratos')" class="btn btn-secondary" style="background: #6b7280; border: none; padding: 12px 24px; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;">
          📋 Volver a Contratos
        </button>
      </div>
    </div>
  `;
  
  // Insertar mensaje al inicio del contenedor
  firmaPadContainer.insertBefore(mensajeConfirmacion, firmaPadContainer.firstChild);
}

// ===== MOSTRAR CONTRATO COMPLETAMENTE FIRMADO =====
function mostrarContratoCompletamenteFirmado() {
  const firmaPadContainer = document.querySelector('.firma-pad-container');
  
  // Crear mensaje de confirmación
  const mensajeConfirmacion = document.createElement('div');
  mensajeConfirmacion.className = 'contrato-completamente-firmado';
  mensajeConfirmacion.innerHTML = `
    <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 2px solid #10b981; margin: 20px 0;">
      <h3 style="color: #10b981; margin-bottom: 10px;">🎉 ¡Contrato Completamente Firmado!</h3>
      <p style="color: #10b981; margin-bottom: 15px;">Ambas firmas han sido completadas. El contrato está listo para ser finalizado.</p>
      <button onclick="finalizarContrato()" class="btn btn-success" style="background: #10b981; border: none; padding: 12px 24px; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;">
        ✅ Finalizar Contrato
      </button>
    </div>
  `;
  
  // Insertar mensaje al inicio del contenedor
  firmaPadContainer.insertBefore(mensajeConfirmacion, firmaPadContainer.firstChild);
}

// ===== RENDERIZAR RESUMEN DEL CONTRATO =====
function renderizarResumenContrato() {
  if (!contratoActual) return;
  
  // Determinar el estado correcto del contrato
  const tieneFirmaRepresentante = !!contratoActual.firmaRepresentanteBase64;
  const tieneFirmaCliente = !!contratoActual.firmaClienteBase64;
  const estadoReal = (tieneFirmaRepresentante && tieneFirmaCliente) ? 'Firmado' : 'Pendiente de Firma';
  
  const resumenHTML = `
    <div class="detalle-seccion">
      <h4>📋 Información General</h4>
      <p><strong>Título:</strong> ${contratoActual.tituloContrato || 'Sin título'}</p>
      <p><strong>Código:</strong> ${contratoActual.codigoCotizacion || 'Sin código'}</p>
      <p><strong>Estado:</strong> <span class="estado-badge estado-${estadoReal.toLowerCase().replace(/\s+/g, '-')}">${estadoReal}</span></p>
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

// ===== ACTUALIZAR INFORMACIÓN DEL CLIENTE =====
function actualizarInfoCliente() {
  if (contratoActual && contratoActual.cliente) {
    nombreCliente.textContent = contratoActual.cliente.nombre || 'No especificado';
    empresaCliente.textContent = contratoActual.cliente.empresa || 'No especificada';
  }
}

// ===== INICIALIZAR SIGNATURE PADS =====
function inicializarSignaturePads() {
  try {
    // Verificar que SignaturePad esté disponible
    if (typeof SignaturePad === 'undefined') {
      throw new Error('SignaturePad no está disponible');
    }
    
    // Inicializar SignaturePad para representante
    signaturePadRepresentante = new SignaturePad(firmaRepresentanteCanvas, {
      backgroundColor: 'rgb(250, 250, 250)',
      penColor: 'rgb(0, 0, 0)',
      penWidth: 2
    });
    
    // Solo inicializar SignaturePad para cliente si NO estamos en el panel de administración
    if (!esPanelAdmin && firmaClienteCanvas) {
      signaturePadCliente = new SignaturePad(firmaClienteCanvas, {
        backgroundColor: 'rgb(250, 250, 250)',
        penColor: 'rgb(0, 0, 0)',
        penWidth: 2
      });
    }
    
    console.log('✅ SignaturePads inicializados correctamente');
    
    // Hacer disponibles globalmente para debugging
    window.signaturePadRepresentante = signaturePadRepresentante;
    if (signaturePadCliente) {
      window.signaturePadCliente = signaturePadCliente;
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar SignaturePads:', error);
    mostrarError('Error al inicializar los pads de firma: ' + error.message);
  }
}

// ===== FUNCIONES DE FIRMA DEL REPRESENTANTE =====
function limpiarFirmaRepresentante() {
  if (signaturePadRepresentante) {
    signaturePadRepresentante.clear();
    console.log('🧹 Firma del representante limpiada');
  }
}

async function guardarFirmaRepresentante() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!signaturePadRepresentante) {
    mostrarNotificacion('Error: Pad de firma del representante no inicializado', 'error');
    return;
  }
  
  // Verificar si se seleccionó un representante legal
  const representanteSelect = document.getElementById('representante-legal');
  const representanteSeleccionado = representanteSelect.value;
  
  if (!representanteSeleccionado) {
    mostrarNotificacion('Por favor, selecciona un representante legal', 'error');
    return;
  }
  
  // Verificar si el pad de firma está vacío
  if (signaturePadRepresentante.isEmpty()) {
    mostrarNotificacion('Por favor, firma en el área del representante antes de continuar', 'error');
    return;
  }
  
  try {
    console.log('✍️ Guardando firma del representante...');
    
    // Obtener la firma como imagen Base64
    const firmaBase64 = signaturePadRepresentante.toDataURL('image/png');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      firmaRepresentanteBase64: firmaBase64,
      representanteLegal: representanteSeleccionado,
      fechaFirmaRepresentante: new Date()
    });
    
    // Actualizar estado local
    firmaRepresentanteGuardada = true;
    actualizarEstadoFirmas();
    
    console.log('✅ Firma del representante guardada exitosamente');
    mostrarNotificacion('Firma del representante guardada exitosamente', 'success');
    
    // Redirigir al listado de contratos después de 2 segundos
    setTimeout(() => {
      window.router.navigate('/contratos');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error al guardar firma del representante:', error);
    mostrarNotificacion('Error al guardar la firma del representante: ' + error.message, 'error');
  }
}

// ===== FUNCIONES DE FIRMA DEL CLIENTE (solo para cliente) =====
function limpiarFirmaCliente() {
  if (signaturePadCliente) {
    signaturePadCliente.clear();
    console.log('🧹 Firma del cliente limpiada');
  }
}

async function guardarFirmaCliente() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (!signaturePadCliente) {
    mostrarNotificacion('Error: Pad de firma del cliente no inicializado', 'error');
    return;
  }
  
  // Verificar si el pad de firma está vacío
  if (signaturePadCliente.isEmpty()) {
    mostrarNotificacion('Por favor, firma en el área del cliente antes de continuar', 'error');
    return;
  }
  
  try {
    console.log('✍️ Guardando firma del cliente...');
    
    // Obtener la firma como imagen Base64
    const firmaBase64 = signaturePadCliente.toDataURL('image/png');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    await updateDoc(contratoRef, {
      firmaClienteBase64: firmaBase64,
      fechaFirmaCliente: new Date()
    });
    
    // Actualizar estado local
    firmaClienteGuardada = true;
    actualizarEstadoFirmas();
    
    console.log('✅ Firma del cliente guardada exitosamente');
    mostrarNotificacion('Firma del cliente guardada exitosamente', 'success');
    
    // Verificar si ahora el contrato está completamente firmado
    if (firmaRepresentanteGuardada && firmaClienteGuardada) {
      console.log('🎯 Contrato completamente firmado después de agregar firma del cliente');
      mostrarContratoCompletamenteFirmado();
    }
    
  } catch (error) {
    console.error('❌ Error al guardar firma del cliente:', error);
    mostrarNotificacion('Error al guardar la firma del cliente: ' + error.message, 'error');
  }
}

// ===== FUNCIONES PARA ADMIN (GENERAR LINK Y ENVIAR EMAIL) =====
function generarLinkCliente() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  // Redirigir a la página de enviar firma
  window.router.navigate(`/enviar-firma?id=${contratoActual.id}`);
}

async function enviarEmailCliente() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  try {
    console.log('📧 Enviando email al cliente...');
    
    // Redirigir a la página de enviar firma con EmailJS
    window.router.navigate(`/enviar-firma?id=${contratoActual.id}`);
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    mostrarNotificacion('Error al enviar email: ' + error.message, 'error');
  }
}

// ===== ACTUALIZAR ESTADO DE FIRMAS =====
function actualizarEstadoFirmas() {
  console.log('🔄 Actualizando estado de firmas...');
  console.log('📊 Estado actual - firmaRepresentanteGuardada:', firmaRepresentanteGuardada, 'firmaClienteGuardada:', firmaClienteGuardada);
  
  const statusRepresentante = document.getElementById('status-representante');
  const textoStatusRepresentante = document.getElementById('texto-status-representante');
  const statusCliente = document.getElementById('status-cliente');
  const textoStatusCliente = document.getElementById('texto-status-cliente');
  
  // Actualizar estado del representante
  if (firmaRepresentanteGuardada) {
    statusRepresentante.textContent = '✅';
    statusRepresentante.className = 'status-icon completado';
    textoStatusRepresentante.textContent = 'Completada';
  } else {
    statusRepresentante.textContent = '⏳';
    statusRepresentante.className = 'status-icon pendiente';
    textoStatusRepresentante.textContent = 'Pendiente';
  }
  
  // Solo actualizar estado del cliente si NO estamos en el panel de administración
  if (!esPanelAdmin && statusCliente && textoStatusCliente) {
    if (firmaClienteGuardada) {
      statusCliente.textContent = '✅';
      statusCliente.className = 'status-icon completado';
      textoStatusCliente.textContent = 'Completada';
    } else {
      statusCliente.textContent = '⏳';
      statusCliente.className = 'status-icon pendiente';
      textoStatusCliente.textContent = 'Pendiente';
    }
  }
  
  // Habilitar/deshabilitar botón finalizar según el contexto
  if (esPanelAdmin) {
    console.log('🏢 Actualizando botón para admin, firmaRepresentanteGuardada:', firmaRepresentanteGuardada);
    console.log('🔍 Botón finalizar encontrado:', !!btnFinalizar);
    
    // En admin, solo habilitar si la firma del representante está completa
    if (firmaRepresentanteGuardada) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Finalizar Firma';
      btnFinalizar.onclick = () => window.router.navigate('/contratos');
      btnFinalizar.style.background = 'linear-gradient(135deg, #00B8D9 0%, #FF4EFF 100%)';
      btnFinalizar.style.color = 'white';
      console.log('✅ Botón actualizado a: Finalizar Firma');
    } else {
      btnFinalizar.disabled = true;
      btnFinalizar.textContent = 'Guardar Firma Representante';
      btnFinalizar.onclick = guardarFirmaRepresentante;
      btnFinalizar.style.background = 'rgba(255, 255, 255, 0.1)';
      btnFinalizar.style.color = 'var(--color-text-secondary)';
      console.log('⏳ Botón actualizado a: Guardar Firma Representante');
    }
  } else {
    // En cliente, habilitar solo si ambas firmas están completas
    if (firmaRepresentanteGuardada && firmaClienteGuardada) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Finalizar Contrato (Ambas firmas completadas)';
      btnFinalizar.style.background = 'linear-gradient(135deg, #00B8D9 0%, #FF4EFF 100%)';
      btnFinalizar.style.color = 'white';
    } else {
      btnFinalizar.disabled = true;
      btnFinalizar.textContent = 'Finalizar Contrato (Requiere ambas firmas)';
      btnFinalizar.style.background = 'rgba(255, 255, 255, 0.1)';
      btnFinalizar.style.color = 'var(--color-text-secondary)';
    }
  }
}

// ===== FINALIZAR CONTRATO =====
async function finalizarContrato() {
  if (!contratoActual) {
    mostrarNotificacion('Error: No hay contrato cargado', 'error');
    return;
  }
  
  if (esPanelAdmin) {
    // En admin, solo verificar firma del representante
    if (!firmaRepresentanteGuardada) {
      mostrarNotificacion('Error: Se requiere la firma del representante para continuar', 'error');
      return;
    }
  } else {
    // En cliente, verificar ambas firmas
    if (!firmaRepresentanteGuardada || !firmaClienteGuardada) {
      mostrarNotificacion('Error: Se requieren ambas firmas para finalizar el contrato', 'error');
      return;
    }
  }
  
  try {
    console.log('🎯 Finalizando contrato...');
    
    // Importar Firebase dinámicamente
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Actualizar el contrato en Firestore
    const contratoRef = doc(window.db, 'contratos', contratoActual.id);
    const datosFinales = {
      estadoContrato: 'Firmado',
      fechaFirmaFinal: new Date(),
      contratoValido: true,
      esPreContrato: false,
      fechaCompletado: new Date()
    };
    
    await updateDoc(contratoRef, datosFinales);
    
    console.log('✅ Contrato finalizado exitosamente');
    console.log('📋 Estado actualizado a: Firmado');
    console.log('💰 Contrato válido - valor sumado al dashboard');
    
    // Mostrar notificación de éxito
    mostrarNotificacion('¡Contrato finalizado exitosamente!', 'success');
    
    // Redirigir de vuelta al panel de contratos después de 2 segundos
    setTimeout(() => {
      window.router.navigate('/contratos');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error al finalizar contrato:', error);
    mostrarNotificacion('Error al finalizar el contrato: ' + error.message, 'error');
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function mostrarError(mensaje) {
  loadingFirma.style.display = 'none';
  errorFirma.style.display = 'block';
  errorFirma.textContent = mensaje;
}

function mostrarContenido() {
  loadingFirma.style.display = 'none';
  errorFirma.style.display = 'none';
  contenidoFirma.style.display = 'block';
}

// ===== RESPONSIVE DESIGN =====
window.addEventListener('resize', () => {
  if (signaturePadRepresentante && signaturePadRepresentante.resizeCanvas) {
    signaturePadRepresentante.resizeCanvas();
  }
  if (signaturePadCliente && signaturePadCliente.resizeCanvas) {
    signaturePadCliente.resizeCanvas();
  }
});

// ===== HACER FUNCIONES DISPONIBLES GLOBALMENTE =====
window.limpiarFirmaRepresentante = limpiarFirmaRepresentante;
window.guardarFirmaRepresentante = guardarFirmaRepresentante;
window.limpiarFirmaCliente = limpiarFirmaCliente;
window.guardarFirmaCliente = guardarFirmaCliente;
window.finalizarContrato = finalizarContrato;
window.generarLinkCliente = generarLinkCliente;
window.enviarEmailCliente = enviarEmailCliente;
window.mostrarNotificacion = mostrarNotificacion; 