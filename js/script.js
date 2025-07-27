// Importaciones
import { renderInvoice } from '../templates/invoice-template.js';
import { db } from './firebase-config.js';

// Variables globales
let form, serviciosDetalle, invoice, btnDescargarPDF, btnEmitirPDF;

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
// FUNCIONES DEL FORMULARIO DINÁMICO
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
  console.log('🔄 renderServiciosDetalle ejecutada');
  
  if (!serviciosDetalle) {
    console.error('❌ Elemento serviciosDetalle no encontrado');
    return;
  }
  
  // Limpiar el contenedor
  serviciosDetalle.innerHTML = '';
  
  // Obtener servicios seleccionados
  const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
  const seleccionados = Array.from(checkboxes).map(cb => cb.value);
  
  console.log('📋 Servicios seleccionados:', seleccionados);
  
  // Crear bloques de detalle para cada servicio seleccionado
  seleccionados.forEach(servicio => {
    const s = servicios.find(x => x.nombre === servicio);
    if (!s) {
      console.warn(`⚠️ Servicio no encontrado: ${servicio}`);
      return;
    }
    
    console.log(`🏗️ Creando detalles para: ${s.nombre}`);
    
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
    
    // CRÍTICO: Registrar event listeners para los nuevos elementos
    addEventListenersToDetalles(div, s.id);
    
    // Calcular subtotal inicial
    calcularSubtotal(s.id);
  });
}

// PUNTO CLAVE: Función separada para agregar event listeners a los detalles
function addEventListenersToDetalles(serviceDiv, serviceId) {
  console.log(`🔗 Agregando event listeners para servicio: ${serviceId}`);
  
  // Configurar event listeners para el tipo de cobro
  const radios = serviceDiv.querySelectorAll(`input[name="cobro_tipo_${serviceId}"]`);
  const campoSesion = serviceDiv.querySelector('.campo-sesion');
  const campoAlumno = serviceDiv.querySelector('.campo-alumno');
  const campoDirecto = serviceDiv.querySelector('.campo-directo');
  
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      console.log(`💰 Tipo de cobro cambiado a: ${e.target.value} para ${serviceId}`);
      
      // Ocultar todos los campos
      campoSesion.classList.remove('active');
      campoAlumno.classList.remove('active');
      campoDirecto.classList.remove('active');
      
      // Mostrar el campo correspondiente
      if (e.target.value === 'sesion') campoSesion.classList.add('active');
      if (e.target.value === 'alumno') campoAlumno.classList.add('active');
      if (e.target.value === 'directo') campoDirecto.classList.add('active');
      
      // Recalcular subtotal
      calcularSubtotal(serviceId);
    });
  });
  
  // Configurar event listeners para todos los inputs y selects
  serviceDiv.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', () => {
      console.log(`📝 Input cambiado: ${input.name}`);
      calcularSubtotal(serviceId);
    });
    input.addEventListener('change', () => {
      console.log(`📝 Input cambiado: ${input.name}`);
      calcularSubtotal(serviceId);
    });
  });
}

// Función para calcular el subtotal de un servicio específico
function calcularSubtotal(id) {
  console.log(`🧮 Calculando subtotal para: ${id}`);
  
  const tipo = document.querySelector(`input[name="cobro_tipo_${id}"]:checked`)?.value;
  let subtotal = 0;
  
  if (tipo === 'sesion') {
    const sesiones = Number(document.querySelector(`input[name="sesiones_${id}"]`)?.value || 0);
    const valorSesion = Number(document.querySelector(`input[name="valor_sesion_${id}"]`)?.value || 0);
    subtotal = sesiones * valorSesion;
    console.log(`📊 Sesión: ${sesiones} x ${valorSesion} = ${subtotal}`);
  } else if (tipo === 'alumno') {
    const alumnos = Number(document.querySelector(`input[name="alumnos_${id}"]`)?.value || 0);
    const valorAlumno = Number(document.querySelector(`input[name="valor_alumno_${id}"]`)?.value || 0);
    subtotal = alumnos * valorAlumno;
    console.log(`📊 Alumno: ${alumnos} x ${valorAlumno} = ${subtotal}`);
  } else if (tipo === 'directo') {
    subtotal = Number(document.querySelector(`input[name="total_directo_${id}"]`)?.value || 0);
    console.log(`📊 Directo: ${subtotal}`);
  }
  
  // Actualizar el subtotal en la interfaz
  const subtotalElement = document.getElementById(`subtotal_${id}`);
  if (subtotalElement) {
    subtotalElement.textContent = `Subtotal: ${subtotal.toLocaleString()}`;
    console.log(`✅ Subtotal actualizado para ${id}: ${subtotal.toLocaleString()}`);
  } else {
    console.warn(`⚠️ Elemento subtotal_${id} no encontrado`);
  }
}

// ========================================
// FLUJO DE GUARDAR Y GENERAR PDF
// ========================================

// Función para validar el formulario
function validarFormulario() {
  console.log('🔍 Validando formulario...');
  
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
    if (!elemento || !elemento.value.trim()) {
      alert(`❌ Por favor, completa el campo "${campo.nombre}".`);
      if (elemento) elemento.focus();
      return false;
    }
  }
  
  // Validar que al menos un servicio esté seleccionado
  const serviciosSeleccionados = document.querySelectorAll('input[name="servicios"]:checked');
  if (serviciosSeleccionados.length === 0) {
    alert('❌ Por favor, selecciona al menos un servicio.');
    return false;
  }
  
  // Validar que los detalles de servicios estén completos
  const serviciosDetalle = document.querySelectorAll('.servicio-detalle');
  for (const servicio of serviciosDetalle) {
    const detalle = servicio.querySelector('textarea');
    const modalidad = servicio.querySelector('select');
    const alumnos = servicio.querySelector('input[type="number"]');
    
    if (!detalle || !detalle.value.trim()) {
      alert('❌ Por favor, completa el detalle de todos los servicios seleccionados.');
      if (detalle) detalle.focus();
      return false;
    }
    
    if (!modalidad || !modalidad.value) {
      alert('❌ Por favor, selecciona la modalidad de todos los servicios.');
      if (modalidad) modalidad.focus();
      return false;
    }
    
    if (!alumnos || !alumnos.value || alumnos.value < 1) {
      alert('❌ Por favor, ingresa una cantidad válida de alumnos.');
      if (alumnos) alumnos.focus();
      return false;
    }
  }
  
  console.log('✅ Formulario válido');
  return true;
}

// Función para recopilar todos los datos del formulario
function recopilarDatosFormulario() {
  console.log('📋 Recopilando datos del formulario...');
  
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
    if (!s) return;
    
    const detalle = document.querySelector(`textarea[name="detalle_${s.id}"]`)?.value.trim() || '';
    const modalidad = document.querySelector(`select[name="modalidad_${s.id}"]`)?.value || '';
    const alumnos = Number(document.querySelector(`input[name="alumnos_${s.id}"]`)?.value || 0);
    const tipoCobro = document.querySelector(`input[name="cobro_tipo_${s.id}"]:checked`)?.value || 'sesion';
    
    let valorUnitario = 0;
    let cantidad = 0;
    let totalDirecto = 0;
    let subtotal = 0;
    
    // Calcular según el tipo de cobro
    if (tipoCobro === 'sesion') {
      cantidad = Number(document.querySelector(`input[name="sesiones_${s.id}"]`)?.value || 0);
      valorUnitario = Number(document.querySelector(`input[name="valor_sesion_${s.id}"]`)?.value || 0);
      totalDirecto = cantidad * valorUnitario;
    } else if (tipoCobro === 'alumno') {
      cantidad = alumnos;
      valorUnitario = Number(document.querySelector(`input[name="valor_alumno_${s.id}"]`)?.value || 0);
      totalDirecto = cantidad * valorUnitario;
    } else if (tipoCobro === 'directo') {
      totalDirecto = Number(document.querySelector(`input[name="total_directo_${s.id}"]`)?.value || 0);
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
  const datosCotizacion = {
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
  
  console.log('📊 Datos recopilados:', datosCotizacion);
  return datosCotizacion;
}

// Función para guardar en Firestore
async function guardarEnFirestore(datosCotizacion) {
  console.log('💾 Guardando en Firestore...');
  
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
    
    console.log('✅ Cotización guardada exitosamente en Firestore:', datosCotizacion.codigo);
    return true;
  } catch (error) {
    console.error('❌ Error al guardar en Firestore:', error);
    throw new Error('Error al guardar la cotización en la base de datos. Por favor, inténtalo de nuevo.');
  }
}

// Función para generar PDF (SOLUCIÓN CRÍTICA)
function generarPDF(datosCotizacion) {
  console.log('📄 Generando PDF...');
  
  try {
    // SOLUCIÓN: Crear un div temporal para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.zIndex = '-1';
    
    // Renderizar la cotización en el div temporal
    tempDiv.innerHTML = renderInvoice(datosCotizacion);
    
    // Añadir el div temporal al body
    document.body.appendChild(tempDiv);
    
    console.log('🎨 HTML renderizado en div temporal, generando PDF...');
    
    // Configurar opciones de html2pdf
    const opt = {
      margin: 0,
      filename: `${datosCotizacion.codigo}_cotizacion.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar y descargar PDF usando .then() como especificado
    html2pdf().set(opt).from(tempDiv).save()
      .then(() => {
        console.log('✅ PDF generado y descargado exitosamente');
        
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
        
        throw new Error('Error al generar el PDF. Por favor, inténtalo de nuevo.');
      });
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Por favor, inténtalo de nuevo.');
  }
}

// Función principal para guardar y generar cotización
async function guardarYGenerarCotizacion(event) {
  console.log('🚀 Iniciando proceso de guardar y generar cotización...');
  
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
    alert(`✅ ¡Cotización ${datosCotizacion.codigo} guardada exitosamente!`);
    
    // 5. Generar PDF solo si el guardado fue exitoso
    generarPDF(datosCotizacion);
    
  } catch (error) {
    console.error('❌ Error en guardarYGenerarCotizacion:', error);
    alert(error.message || 'Error inesperado al procesar la cotización. Por favor, inténtalo de nuevo.');
  }
}

// ========================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ========================================

// Función de inicialización
function inicializar() {
  console.log('🚀 Inicializando aplicación...');
  
  // Obtener referencias a elementos del DOM
  form = document.getElementById('quote-form');
  serviciosDetalle = document.getElementById('servicios-detalle');
  invoice = document.getElementById('invoice');
  btnDescargarPDF = document.getElementById('descargar-pdf');
  btnEmitirPDF = document.getElementById('emitir-pdf');
  
  console.log('🔍 Elementos del DOM encontrados:', {
    form: !!form,
    serviciosDetalle: !!serviciosDetalle,
    invoice: !!invoice,
    btnDescargarPDF: !!btnDescargarPDF,
    btnEmitirPDF: !!btnEmitirPDF
  });
  
  // Verificar que los elementos críticos existan
  if (!serviciosDetalle) {
    console.error('❌ Elemento serviciosDetalle no encontrado');
    return;
  }
  
  if (!invoice) {
    console.error('❌ Elemento invoice no encontrado');
    return;
  }
  
  // Configurar event listeners para checkboxes de servicios
  const checkboxes = document.querySelectorAll('input[name="servicios"]');
  console.log(`📋 Encontrados ${checkboxes.length} checkboxes de servicios`);
  
  checkboxes.forEach((checkbox, index) => {
    console.log(`🔗 Configurando checkbox ${index + 1}: ${checkbox.id}`);
    checkbox.addEventListener('change', (e) => {
      console.log(`✅ Checkbox ${checkbox.id} cambiado: ${e.target.checked}`);
      renderServiciosDetalle();
    });
  });
  
  // Configurar event listener para el botón de generar PDF
  if (btnDescargarPDF) {
    console.log('🔗 Configurando botón descargar PDF');
    btnDescargarPDF.addEventListener('click', guardarYGenerarCotizacion);
  } else {
    console.error('❌ Botón descargar PDF no encontrado');
  }
  
  // Configurar event listener para el botón de emitir PDF (si existe)
  if (btnEmitirPDF) {
    console.log('🔗 Configurando botón emitir PDF');
    btnEmitirPDF.addEventListener('click', guardarYGenerarCotizacion);
  }
  
  // Renderizar detalles de servicios iniciales (si hay alguno seleccionado)
  renderServiciosDetalle();
  
  console.log('✅ Inicialización completada');
}

// GARANTIZAR LA EJECUCIÓN SEGURA DEL SCRIPT: Envolver toda la lógica en DOMContentLoaded
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
    console.error('❌ Error al mostrar previsualización:', error);
    alert('Error al previsualizar la cotización. Revisa los datos e inténtalo de nuevo.');
  }
} 