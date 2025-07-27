// Importaciones
import { renderInvoice } from '../templates/invoice-template.js';
import { db } from './firebase-config.js';

// Variables globales
const form = document.getElementById('quote-form');
const serviciosDetalle = document.getElementById('servicios-detalle');
const invoice = document.getElementById('invoice');
const btnDescargarPDF = document.getElementById('descargar-pdf');
const btnEmitirPDF = document.getElementById('emitir-pdf');

// Configuración de servicios disponibles
const servicios = [
  { id: 'charlas', nombre: 'Charlas', desc: 'Presentaciones orales' },
  { id: 'capacitaciones', nombre: 'Capacitaciones', desc: 'Talleres prácticos' },
  { id: 'certificaciones', nombre: 'Certificaciones', desc: 'Programas con diploma' },
  { id: 'consultorias', nombre: 'Consultorías', desc: 'Diagnóstico y plan de acción' },
  { id: 'mentorias', nombre: 'Mentorías', desc: 'Acompañamiento a largo plazo' },
  { id: 'asesorias', nombre: 'Asesorías de IA', desc: 'Soporte en proyectos de IA' }
];

// ========================================
// TAREA 1: LÓGICA DEL FORMULARIO DINÁMICO
// ========================================

// Función para generar código único de cotización
function getNextCodigo() {
  let last = localStorage.getItem('subeia_codigo');
  if (!last) last = 0;
  last = parseInt(last) + 1;
  localStorage.setItem('subeia_codigo', last);
  return `SUBEIA-${String(last).padStart(6, '0')}`;
}

// Función para renderizar los detalles de servicios seleccionados
function renderServiciosDetalle() {
  // Limpiar el contenedor
  serviciosDetalle.innerHTML = '';
  
  // Obtener servicios seleccionados
  const seleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(cb => cb.value);
  
  // Crear bloques de detalle para cada servicio seleccionado
  seleccionados.forEach(servicio => {
    const s = servicios.find(x => x.nombre === servicio);
    const div = document.createElement('div');
    div.className = 'servicio-detalle';
    div.innerHTML = `
      <h3>${s.nombre} <span style="font-size:0.9em;color:#00FFF0;">${s.desc}</span></h3>
      <label>Detalle:<textarea name="detalle_${s.id}" required></textarea></label>
      <label>Modalidad:
        <select name="modalidad_${s.id}" required>
          <option value="Presencial">Presencial</option>
          <option value="Online">Online</option>
          <option value="Semipresencial">Semipresencial</option>
        </select>
      </label>
      <label>Cantidad de alumnos:<input type="number" name="alumnos_${s.id}" min="1" value="1" required></label>
      <div class="servicio-cobro-tipo">
        <label><input type="radio" name="cobro_tipo_${s.id}" value="sesion" checked> Por sesión</label>
        <label><input type="radio" name="cobro_tipo_${s.id}" value="alumno"> Por alumno</label>
        <label><input type="radio" name="cobro_tipo_${s.id}" value="directo"> Total directo</label>
      </div>
      <div class="servicio-campo-cobro campo-sesion active">
        <label>Cantidad de sesiones:<input type="number" name="sesiones_${s.id}" min="1" value="1" required></label>
        <label>Valor unitario por sesión:<input type="number" name="valor_sesion_${s.id}" min="0" step="0.01" required></label>
      </div>
      <div class="servicio-campo-cobro campo-alumno">
        <label>Valor unitario por alumno:<input type="number" name="valor_alumno_${s.id}" min="0" step="0.01" required></label>
      </div>
      <div class="servicio-campo-cobro campo-directo">
        <label>Total directo:<input type="number" name="total_directo_${s.id}" min="0" step="0.01" required></label>
      </div>
      <div class="subtotal" id="subtotal_${s.id}">Subtotal: 0</div>
    `;
    
    serviciosDetalle.appendChild(div);
    
    // Configurar event listeners para el tipo de cobro
    const radios = div.querySelectorAll(`input[name="cobro_tipo_${s.id}"]`);
    const campoSesion = div.querySelector('.campo-sesion');
    const campoAlumno = div.querySelector('.campo-alumno');
    const campoDirecto = div.querySelector('.campo-directo');
    
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Ocultar todos los campos
        campoSesion.classList.remove('active');
        campoAlumno.classList.remove('active');
        campoDirecto.classList.remove('active');
        
        // Mostrar el campo correspondiente
        if (radio.value === 'sesion') campoSesion.classList.add('active');
        if (radio.value === 'alumno') campoAlumno.classList.add('active');
        if (radio.value === 'directo') campoDirecto.classList.add('active');
        
        // Recalcular subtotal
        calcularSubtotal(s.id);
      });
    });
    
    // Configurar event listeners para todos los inputs y selects
    div.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => calcularSubtotal(s.id));
      input.addEventListener('change', () => calcularSubtotal(s.id));
    });
  });
}

// Función para calcular el subtotal de un servicio específico
function calcularSubtotal(id) {
  const tipo = document.querySelector(`input[name='cobro_tipo_${id}']:checked`)?.value;
  let subtotal = 0;
  
  if (tipo === 'sesion') {
    const sesiones = Number(document.querySelector(`[name='sesiones_${id}']`)?.value || 0);
    const valorSesion = Number(document.querySelector(`[name='valor_sesion_${id}']`)?.value || 0);
    subtotal = sesiones * valorSesion;
  } else if (tipo === 'alumno') {
    const alumnos = Number(document.querySelector(`[name='alumnos_${id}']`)?.value || 0);
    const valorAlumno = Number(document.querySelector(`[name='valor_alumno_${id}']`)?.value || 0);
    subtotal = alumnos * valorAlumno;
  } else if (tipo === 'directo') {
    subtotal = Number(document.querySelector(`[name='total_directo_${id}']`)?.value || 0);
  }
  
  // Actualizar el subtotal en la interfaz
  const subtotalElement = document.getElementById(`subtotal_${id}`);
  if (subtotalElement) {
    subtotalElement.textContent = `Subtotal: ${subtotal.toLocaleString()}`;
  }
}

// ========================================
// TAREA 2: FLUJO DE "GUARDAR Y GENERAR PDF"
// ========================================

// Función para validar el formulario
function validarFormulario() {
  const camposRequeridos = [
    { id: 'nombre', nombre: 'Nombre completo' },
    { id: 'email', nombre: 'Email' },
    { id: 'rut', nombre: 'RUT' },
    { id: 'empresa', nombre: 'Empresa' },
    { id: 'moneda', nombre: 'Moneda' },
    { id: 'atendedor', nombre: 'Atendido por' }
  ];
  
  for (const campo of camposRequeridos) {
    const elemento = document.getElementById(campo.id);
    if (!elemento.value.trim()) {
      alert(`Por favor, completa el campo "${campo.nombre}".`);
      elemento.focus();
      return false;
    }
  }
  
  // Validar que al menos un servicio esté seleccionado
  const serviciosSeleccionados = document.querySelectorAll('input[name="servicios"]:checked');
  if (serviciosSeleccionados.length === 0) {
    alert('Por favor, selecciona al menos un servicio.');
    return false;
  }
  
  // Validar que los detalles de servicios estén completos
  const serviciosDetalle = document.querySelectorAll('.servicio-detalle');
  for (const servicio of serviciosDetalle) {
    const detalle = servicio.querySelector('textarea');
    const modalidad = servicio.querySelector('select');
    const alumnos = servicio.querySelector('input[type="number"]');
    
    if (!detalle.value.trim()) {
      alert('Por favor, completa el detalle de todos los servicios seleccionados.');
      detalle.focus();
      return false;
    }
    
    if (!modalidad.value) {
      alert('Por favor, selecciona la modalidad de todos los servicios.');
      modalidad.focus();
      return false;
    }
    
    if (!alumnos.value || alumnos.value < 1) {
      alert('Por favor, ingresa una cantidad válida de alumnos.');
      alumnos.focus();
      return false;
    }
  }
  
  return true;
}

// Función para recopilar todos los datos del formulario
function recopilarDatosFormulario() {
  // Datos básicos del cliente
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const rut = document.getElementById('rut').value.trim();
  const empresa = document.getElementById('empresa').value.trim();
  const moneda = document.getElementById('moneda').value;
  const atendedor = document.getElementById('atendedor').value;
  const notasAdicionales = document.getElementById('notas_adicionales').value.trim();
  const descuento = parseFloat(document.getElementById('descuento').value || '0');
  
  // Generar código único y fecha
  const codigo = getNextCodigo();
  const fecha = new Date();
  
  // Recopilar datos de servicios
  const serviciosSeleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(cb => cb.value);
  const serviciosData = [];
  let total = 0;
  
  serviciosSeleccionados.forEach(servicio => {
    const s = servicios.find(x => x.nombre === servicio);
    const detalle = document.querySelector(`[name="detalle_${s.id}"]`).value.trim();
    const modalidad = document.querySelector(`[name="modalidad_${s.id}"]`).value;
    const alumnos = Number(document.querySelector(`[name="alumnos_${s.id}"]`).value);
    const tipoCobro = document.querySelector(`input[name="cobro_tipo_${s.id}"]:checked`).value;
    
    let valorUnitario = 0;
    let cantidad = 0;
    let totalDirecto = 0;
    let subtotal = 0;
    
    // Calcular según el tipo de cobro
    if (tipoCobro === 'sesion') {
      cantidad = Number(document.querySelector(`[name="sesiones_${s.id}"]`).value);
      valorUnitario = Number(document.querySelector(`[name="valor_sesion_${s.id}"]`).value);
      totalDirecto = cantidad * valorUnitario;
    } else if (tipoCobro === 'alumno') {
      cantidad = alumnos;
      valorUnitario = Number(document.querySelector(`[name="valor_alumno_${s.id}"]`).value);
      totalDirecto = cantidad * valorUnitario;
    } else if (tipoCobro === 'directo') {
      totalDirecto = Number(document.querySelector(`[name="total_directo_${s.id}"]`).value);
    }
    
    subtotal = totalDirecto;
    total += subtotal;
    
    serviciosData.push({
      categoria: s.nombre,
      detalle,
      modalidad,
      alumnos,
      tipoCobro,
      cantidad,
      valorUnitario: valorUnitario > 0 ? valorUnitario : '-',
      totalDirecto: totalDirecto > 0 ? totalDirecto : '-',
      subtotal
    });
  });
  
  // Estructura de datos completa
  return {
    // Datos de primer nivel
    codigo,
    fecha: fecha.toLocaleDateString('es-CL'), // Para la plantilla
    fechaTimestamp: fecha, // Para Firestore
    estado: 'Emitida',
    
    // Datos del cliente
    nombre,
    email,
    rut,
    empresa,
    moneda,
    atendedor,
    
    // Datos de servicios y totales
    serviciosData,
    total,
    descuento,
    notasAdicionales
  };
}

// Función para guardar en Firestore
async function guardarEnFirestore(datosCotizacion) {
  try {
    const cotizacionData = {
      ...datosCotizacion,
      fecha: datosCotizacion.fechaTimestamp, // Usar timestamp para Firestore
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Remover campo fechaTimestamp ya que no lo necesitamos en Firestore
    delete cotizacionData.fechaTimestamp;
    
    // Guardar en Firestore usando el código como ID del documento
    await db.collection('cotizaciones').doc(datosCotizacion.codigo).set(cotizacionData);
    
    console.log('Cotización guardada exitosamente en Firestore:', datosCotizacion.codigo);
    return true;
  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    throw new Error('Error al guardar la cotización en la base de datos. Por favor, inténtalo de nuevo.');
  }
}

// Función para generar PDF
function generarPDF(datosCotizacion) {
  try {
    // Renderizar la cotización en el elemento invoice
    invoice.innerHTML = renderInvoice(datosCotizacion);
    invoice.style.display = 'block';
    
    // Configurar opciones de html2pdf
    const opt = {
      margin: 0,
      filename: `${datosCotizacion.codigo}_cotizacion.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar y descargar PDF
    html2pdf().set(opt).from(invoice).save();
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Por favor, inténtalo de nuevo.');
  }
}

// Función principal para guardar y generar cotización
async function guardarYGenerarCotizacion(event) {
  // Prevenir comportamiento por defecto
  event.preventDefault();
  
  try {
    // 1. Validar formulario
    if (!validarFormulario()) {
      return;
    }
    
    // 2. Recopilar datos del formulario
    const datosCotizacion = recopilarDatosFormulario();
    
    // 3. Guardar en Firestore
    await guardarEnFirestore(datosCotizacion);
    
    // 4. Mostrar mensaje de éxito
    alert(`¡Cotización ${datosCotizacion.codigo} guardada exitosamente!`);
    
    // 5. Generar PDF solo si el guardado fue exitoso
    generarPDF(datosCotizacion);
    
  } catch (error) {
    console.error('Error en guardarYGenerarCotizacion:', error);
    alert(error.message || 'Error inesperado al procesar la cotización. Por favor, inténtalo de nuevo.');
  }
}

// ========================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ========================================

// Función de inicialización
function inicializar() {
  // Configurar event listeners para checkboxes de servicios
  document.querySelectorAll('input[name="servicios"]').forEach(checkbox => {
    checkbox.addEventListener('change', renderServiciosDetalle);
  });
  
  // Configurar event listener para el botón de generar PDF
  if (btnDescargarPDF) {
    btnDescargarPDF.addEventListener('click', guardarYGenerarCotizacion);
  }
  
  // Configurar event listener para el botón de emitir PDF (si existe)
  if (btnEmitirPDF) {
    btnEmitirPDF.addEventListener('click', guardarYGenerarCotizacion);
  }
  
  // Renderizar detalles de servicios iniciales (si hay alguno seleccionado)
  renderServiciosDetalle();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Función para mostrar previsualización (opcional)
function mostrarPrevisualizacion() {
  try {
    if (!validarFormulario()) {
      return;
    }
    
    const datosCotizacion = recopilarDatosFormulario();
    invoice.innerHTML = renderInvoice(datosCotizacion);
    invoice.style.display = 'block';
    
    if (btnEmitirPDF) {
      btnEmitirPDF.style.display = 'block';
    }
    
    // Scroll hacia la previsualización
    window.scrollTo({ 
      top: document.getElementById('pdf-preview').offsetTop - 40, 
      behavior: 'smooth' 
    });
    
  } catch (error) {
    console.error('Error al mostrar previsualización:', error);
    alert('Error al previsualizar la cotización. Revisa los datos e inténtalo de nuevo.');
  }
} 