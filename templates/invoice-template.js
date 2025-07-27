// Plantilla para generar el HTML de las cotizaciones
export function renderInvoice({nombre, email, rut, empresa, moneda, codigo, fecha, serviciosData, total, atendedor, notasAdicionales, descuento}) {
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
            <td>${s.nombre}</td>
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