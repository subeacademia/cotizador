// Variables globales
const form = document.getElementById('quote-form');
const serviciosDetalle = document.getElementById('servicios-detalle');
const invoice = document.getElementById('invoice');
const servicios = [
  { id: 'charlas', nombre: 'Charlas', desc: 'Presentaciones orales' },
  { id: 'capacitaciones', nombre: 'Capacitaciones', desc: 'Talleres prácticos' },
  { id: 'certificaciones', nombre: 'Certificaciones', desc: 'Programas con diploma' },
  { id: 'consultorias', nombre: 'Consultorías', desc: 'Diagnóstico y plan de acción' },
  { id: 'mentorias', nombre: 'Mentorías', desc: 'Acompañamiento a largo plazo' },
  { id: 'asesorias', nombre: 'Asesorías de IA', desc: 'Soporte en proyectos de IA' }
];

// Cargar código único desde localStorage o inicializar
function getNextCodigo() {
  let last = localStorage.getItem('subeia_codigo');
  if (!last) last = 0;
  last = parseInt(last) + 1;
  localStorage.setItem('subeia_codigo', last);
  return `SUBEIA-${String(last).padStart(6, '0')}`;
}

// Inicializar detalles de servicios al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  renderServiciosDetalle();
});

// Asegurar que los eventos de los checkboxes de servicios se mantengan activos tras cambios dinámicos
function rebindServiciosCheckboxes() {
  document.querySelectorAll('input[name="servicios"]').forEach(cb => {
    cb.removeEventListener('change', renderServiciosDetalle);
    cb.addEventListener('change', renderServiciosDetalle);
  });
}
rebindServiciosCheckboxes();

// Renderizar campos de detalle para cada servicio seleccionado
function renderServiciosDetalle() {
  const seleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(cb => cb.value);
  serviciosDetalle.innerHTML = '';
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
    // Mostrar/ocultar campos según tipo de cobro
    const radios = div.querySelectorAll(`input[name="cobro_tipo_${s.id}"]`);
    const campoSesion = div.querySelector('.campo-sesion');
    const campoAlumno = div.querySelector('.campo-alumno');
    const campoDirecto = div.querySelector('.campo-directo');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        campoSesion.classList.remove('active');
        campoAlumno.classList.remove('active');
        campoDirecto.classList.remove('active');
        if (radio.value === 'sesion') campoSesion.classList.add('active');
        if (radio.value === 'alumno') campoAlumno.classList.add('active');
        if (radio.value === 'directo') campoDirecto.classList.add('active');
        calcularSubtotal(s.id);
      });
    });
    // Listeners para calcular subtotal
    div.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => calcularSubtotal(s.id));
      input.addEventListener('change', () => calcularSubtotal(s.id));
    });
  });
  rebindServiciosCheckboxes();
}

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
  document.getElementById(`subtotal_${id}`).textContent = `Subtotal: ${subtotal.toLocaleString()}`;
}

// Eliminar el submit del formulario y asociar la generación del PDF solo al botón #descargar-pdf
const btnDescargar = document.getElementById('descargar-pdf');
const btnEmitir = document.getElementById('emitir-pdf');

if (btnDescargar) {
  btnDescargar.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof html2pdf === 'undefined') {
      alert('Error: html2pdf.js no está cargado. Por favor, revisa la conexión a internet o recarga la página.');
      console.error('html2pdf.js no está disponible');
      return;
    }
    // Renderizar previsualización
    mostrarPrevisualizacion();
  });
}

if (btnEmitir) {
  btnEmitir.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof html2pdf === 'undefined') {
      alert('Error: html2pdf.js no está cargado. Por favor, revisa la conexión a internet o recarga la página.');
      console.error('html2pdf.js no está disponible');
      return;
    }
    emitirPDF();
  });
}

function mostrarPrevisualizacion() {
  try {
    const nombre = form.nombre.value;
    const email = form.email.value;
    const rut = form.rut.value;
    const empresa = form.empresa.value;
    const moneda = form.moneda.value;
    // No generar nuevo código ni fecha aún
    const codigo = 'PREVIEW';
    const fecha = new Date().toLocaleDateString('es-CL');
    const atendedor = document.getElementById('atendedor')?.value || '';
    if (!atendedor) {
      alert('Debes seleccionar quién atiende la cotización.');
      return;
    }
    const seleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(cb => cb.value);
    let serviciosData = [];
    let total = 0;
    seleccionados.forEach(servicio => {
      const s = servicios.find(x => x.nombre === servicio);
      const detalle = form[`detalle_${s.id}`]?.value || '';
      const modalidad = form[`modalidad_${s.id}`]?.value || '';
      const alumnos = Number(form[`alumnos_${s.id}`]?.value || 0);
      const tipoCobro = document.querySelector(`input[name='cobro_tipo_${s.id}']:checked`)?.value;
      let valorUnitario = 0;
      let cantidad = 0;
      let totalDirecto = 0;
      if (tipoCobro === 'sesion') {
        cantidad = Number(form[`sesiones_${s.id}`]?.value || 0);
        valorUnitario = Number(form[`valor_sesion_${s.id}`]?.value || 0);
        totalDirecto = cantidad * valorUnitario;
      } else if (tipoCobro === 'alumno') {
        cantidad = alumnos;
        valorUnitario = Number(form[`valor_alumno_${s.id}`]?.value || 0);
        totalDirecto = cantidad * valorUnitario;
      } else if (tipoCobro === 'directo') {
        totalDirecto = Number(form[`total_directo_${s.id}`]?.value || 0);
      }
      let subtotal = 0;
      if (totalDirecto > 0) {
        subtotal = totalDirecto;
      } else {
        subtotal = cantidad * (valorUnitario > 0 ? valorUnitario : 0);
      }
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
    const notasAdicionales = document.getElementById('notas_adicionales')?.value || '';
    const descuento = parseFloat(document.getElementById('descuento')?.value || '0');
    invoice.innerHTML = renderInvoice({
      nombre, email, rut, empresa, moneda, codigo, fecha, serviciosData, total, atendedor, notasAdicionales, descuento
    });
    // Encapsular #invoice en .a4-sheet para previsualización
    const previewArea = document.querySelector('#pdf-preview');
    if (previewArea && !document.getElementById('a4-sheet-preview')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'a4-sheet';
      wrapper.id = 'a4-sheet-preview';
      invoice.parentNode.insertBefore(wrapper, invoice);
      wrapper.appendChild(invoice);
    }
    invoice.style.display = 'block';
    if (btnEmitir) btnEmitir.style.display = 'block';
    window.scrollTo({ top: document.getElementById('pdf-preview').offsetTop - 40, behavior: 'smooth' });
  } catch (err) {
    invoice.style.display = 'none';
    if (btnEmitir) btnEmitir.style.display = 'none';
    alert('Error al previsualizar la cotización. Revisa los datos e inténtalo de nuevo.');
    console.error('Error en mostrarPrevisualizacion:', err);
  }
}

function emitirPDF() {
  try {
    const nombre = form.nombre.value;
    const email = form.email.value;
    const rut = form.rut.value;
    const empresa = form.empresa.value;
    const moneda = form.moneda.value;
    const codigo = getNextCodigo();
    const fecha = new Date().toLocaleDateString('es-CL');
    const atendedor = document.getElementById('atendedor')?.value || '';
    if (!atendedor) {
      alert('Debes seleccionar quién atiende la cotización.');
      return;
    }
    const seleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(cb => cb.value);
    let serviciosData = [];
    let total = 0;
    seleccionados.forEach(servicio => {
      const s = servicios.find(x => x.nombre === servicio);
      const detalle = form[`detalle_${s.id}`]?.value || '';
      const modalidad = form[`modalidad_${s.id}`]?.value || '';
      const alumnos = Number(form[`alumnos_${s.id}`]?.value || 0);
      const tipoCobro = document.querySelector(`input[name='cobro_tipo_${s.id}']:checked`)?.value;
      let valorUnitario = 0;
      let cantidad = 0;
      let totalDirecto = 0;
      if (tipoCobro === 'sesion') {
        cantidad = Number(form[`sesiones_${s.id}`]?.value || 0);
        valorUnitario = Number(form[`valor_sesion_${s.id}`]?.value || 0);
        totalDirecto = cantidad * valorUnitario;
      } else if (tipoCobro === 'alumno') {
        cantidad = alumnos;
        valorUnitario = Number(form[`valor_alumno_${s.id}`]?.value || 0);
        totalDirecto = cantidad * valorUnitario;
      } else if (tipoCobro === 'directo') {
        totalDirecto = Number(form[`total_directo_${s.id}`]?.value || 0);
      }
      let subtotal = 0;
      if (totalDirecto > 0) {
        subtotal = totalDirecto;
      } else {
        subtotal = cantidad * (valorUnitario > 0 ? valorUnitario : 0);
      }
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
    const notasAdicionales = document.getElementById('notas_adicionales')?.value || '';
    const descuento = parseFloat(document.getElementById('descuento')?.value || '0');
    invoice.innerHTML = renderInvoice({
      nombre, email, rut, empresa, moneda, codigo, fecha, serviciosData, total, atendedor, notasAdicionales, descuento
    });
    invoice.style.display = 'block';
    if (btnEmitir) btnEmitir.style.display = 'none';
    // Abrir nueva pestaña con el contenido de la cotización y estilos embebidos
    const printWindow = window.open('', '_blank');
    const styles = `
      <style>
        body { background: #0D0F19; color: #fff; font-family: 'Roboto', Arial, sans-serif; margin: 0; }
        #invoice { background: #0D0F19; color: #fff; width: 210mm; height: 297mm; margin: 0 auto; padding: 2.2rem 2.2rem 2rem 2.2rem; box-sizing: border-box; font-size: 0.98rem; }
        .pdf-header h2 { font-family: 'Poppins', Arial, sans-serif; font-size: 2rem; background: linear-gradient(90deg, #00FFF0, #FF4EFF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.7rem; margin-top: 0.2rem; }
        .tabla-servicios { width: 100%; font-size: 0.97em; margin-bottom: 0.5rem; border-collapse: collapse; page-break-inside: avoid; table-layout: fixed; word-break: break-word; }
        th, td { word-break: break-word; white-space: pre-line; overflow-wrap: break-word; padding: 0.3em 0.5em; max-width: 120px; }
        th { background: #181B2A; color: #00FFF0; font-family: 'Roboto Mono', monospace; font-size: 1em; border-bottom: 2px solid #00FFF0; }
        td { background: #10121A; color: #fff; }
        .total-row { font-family: 'Roboto Mono', monospace; font-size: 1.08em; color: #00FFF0; font-weight: bold; margin-top: 0.7em; }
        hr.gradient { border: none; height: 2px; background: linear-gradient(90deg, #00FFF0, #FF4EFF); margin: 1.2rem 0; opacity: 0.7; }
        .notas-adicionales { background: #181B2A; color: #FF4EFF; border-left: 4px solid #00FFF0; padding: 0.7em 1em; margin-top: 1.2em; font-size: 0.98em; }
        .footer { margin-top: auto; text-align: center; font-size: 0.97em; color: #aaa; padding-top: 1.2em; border-top: 1px solid #23263A; }
        .footer img { height: 28px; margin-top: 0.5em; }
        .descuento-aplicado { background: #181B2A; color: #FF4EFF; border-left: 4px solid #00FFF0; padding: 0.7em 1em; margin-top: 1.2em; font-size: 0.98em; }
        @media print { body, html { background: #fff !important; } #invoice { background: #0D0F19; color: #fff; width: 210mm; height: 297mm; box-sizing: border-box; padding: 2.2rem 2.2rem 2rem 2.2rem; font-size: 0.98rem; border-radius: 0; overflow: hidden; } }
      </style>
    `;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Cotización PDF</title>${styles}</head><body>${invoice.outerHTML}<script>window.onload = function() { window.print(); }<\/script></body></html>`);
    printWindow.document.close();
  } catch (err) {
    alert('Error inesperado al generar el PDF. Revisa los datos e inténtalo de nuevo.');
    console.error('Error general en emitirPDF:', err);
  }
}

function renderInvoice({nombre, email, rut, empresa, moneda, codigo, fecha, serviciosData, total, atendedor, notasAdicionales, descuento}) {
  let totalConDescuento = total;
  let descuentoTexto = '';
  if (descuento && !isNaN(descuento) && descuento > 0) {
    totalConDescuento = Math.round(total * (1 - descuento / 100));
    descuentoTexto = `<div class="descuento-aplicado" style="color:#FF4EFF;font-weight:bold;">Descuento aplicado: <b>${descuento}%</b></div>`;
  }
  return `
  <div class="pdf-header">
    <img src="assets/logo-blanco.png" alt="Logo SUBE IA TECH" style="height:80px;">
    <h2 style="font-size:2.2rem;color:#23263A;font-weight:bold;">Cotización de Servicios</h2>
    <div class="info-empresa" style="color:#23263A;font-weight:bold;">
      <strong>Sube IA Tech Ltda.</strong><br>
      Fco. Mansilla 1007, Castro, Chile<br>
      RUT: 77.994.591-K<br>
      contacto@subeia.tech
    </div>
    <hr class="gradient">
    <div class="datos-cotizacion" style="color:#23263A;font-weight:bold;">
      <span><b>Fecha:</b> ${fecha}</span>
      <span><b>Código:</b> <span style="font-family:var(--font-mono);color:#00B8D9;">${codigo}</span></span>
    </div>
  </div>
  <div class="pdf-body" style="color:#23263A;">
    <h3 style="font-weight:bold;">Datos del cliente</h3>
    <div class="datos-cliente" style="color:#23263A;">
      <b>Nombre:</b> ${nombre}<br>
      <b>Email:</b> ${email}<br>
      <b>RUT:</b> ${rut}<br>
      <b>Empresa:</b> ${empresa}
    </div>
    <div class="moneda-cotizacion" style="color:#23263A;">
      <b>Moneda de cotización:</b> ${moneda}
    </div>
    <h3 style="font-weight:bold;">Servicios cotizados</h3>
    <table class="tabla-servicios" style="color:#23263A;font-weight:bold;">
      <thead>
        <tr>
          <th>Categoría</th>
          <th>Detalle</th>
          <th>Modalidad</th>
          <th>Cant. x Valor</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${serviciosData.map(s => {
          let cantidadValor = '-';
          let tipoCobroTexto = '';
          if (s.tipoCobro === 'sesion') {
            cantidadValor = `${s.cantidad} x ${s.valorUnitario}`;
            tipoCobroTexto = '<div style="font-size:0.85em;color:#888;">Por sesión</div>';
          } else if (s.tipoCobro === 'alumno') {
            cantidadValor = `${s.cantidad} x ${s.valorUnitario}`;
            tipoCobroTexto = '<div style="font-size:0.85em;color:#888;">Por alumno</div>';
          } else if (s.tipoCobro === 'directo') {
            cantidadValor = '-';
            tipoCobroTexto = '<div style="font-size:0.85em;color:#888;">Total directo</div>';
          }
          return `<tr>
            <td>${s.categoria}</td>
            <td>${s.detalle}</td>
            <td>${s.modalidad || '-'}</td>
            <td>${cantidadValor}${tipoCobroTexto}</td>
            <td style="text-align:right;">${s.subtotal.toLocaleString()}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <hr class="gradient">
    <div class="total-row" style="color:#00B8D9;font-weight:bold;">Total: ${total.toLocaleString()} ${moneda}</div>
    ${descuentoTexto}
    ${descuento && !isNaN(descuento) && descuento > 0 ? `<div class="total-row" style="color:#00B8D9;font-weight:bold;">Total con descuento: <b>${totalConDescuento.toLocaleString()} ${moneda}</b></div>` : ''}
    <div class="validez" style="color:#23263A;">Válido 15 días</div>
    <div class="atendido-por" style="color:#23263A;"><b>Atendido por:</b> ${atendedor}</div>
    <div class="condiciones" style="color:#23263A;"><small>Condiciones de pago: 50% al aceptar, 50% contra entrega. Consultas: contacto@subeia.tech</small></div>
    ${notasAdicionales ? `<div class="notas-adicionales" style="color:#FF4EFF;"><b>Notas adicionales:</b><br>${notasAdicionales.replace(/\n/g,'<br>')}</div>` : ''}
  </div>
  <div class="footer" style="color:#23263A;">
    <div style="font-weight:bold;">Sube IA Tech Ltda. &mdash; contacto@subeia.tech &mdash; Fco. Mansilla 1007, Castro, Chile</div>
    <img src="assets/logo-blanco.png" alt="Logo SUBE IA TECH" style="height:48px;">
  </div>
  `;
}

// SVGs de ejemplo
function svgAI() {
  return `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="22" stroke="#00FFF0" stroke-width="2" fill="#181B2A"/><path d="M16 24c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8z" stroke="#FF4EFF" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="#00FFF0"/></svg>`;
}
function svgIconoCategoria(cat) {
  // Puedes personalizar SVGs por categoría
  return `<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="#23263A" stroke="#00FFF0"/><text x="9" y="13" text-anchor="middle" font-size="10" fill="#FF4EFF">${cat[0]}</text></svg>`;
}
function svgTotal() {
  return `<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="14" rx="3" fill="#23263A" stroke="#00FFF0"/><circle cx="9" cy="9" r="3" fill="#FF4EFF"/></svg>`;
} 