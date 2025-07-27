// Plantilla para generar el HTML de los contratos
export function renderContract(contratoData) {
  const {
    tituloContrato = 'Contrato de Servicios',
    codigoCotizacion = 'Sin código',
    estadoContrato = 'Pendiente de Firma',
    fechaCreacionContrato,
    atendido = 'No especificado',
    fechaInicio,
    fechaFin,
    cliente = {},
    totalConDescuento,
    total,
    descuento = 0,
    descripcionServicios,
    terminosCondiciones
  } = contratoData;

  const { nombre = 'No especificado', email = 'No especificado', rut = 'No especificado', empresa = 'No especificada' } = cliente;

  // Calcular total
  const totalFinal = totalConDescuento || total || 0;
  const descuentoTexto = descuento > 0 ? `<div class="descuento-aplicado" style="color:#FF4EFF;font-weight:bold;">Descuento aplicado: <b>${descuento}%</b></div>` : '';

  // Formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  return `
  <div class="pdf-header" style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #00B8D9; padding-bottom: 20px;">
    <img src="./assets/logo-blanco.png" alt="Logo SUBE IA TECH" style="height:80px; margin-bottom: 15px;">
    <h1 style="font-size:2.5rem;color:#23263A;font-weight:bold;margin:0;">SUBE IA TECH</h1>
    <h2 style="font-size:1.8rem;color:#23263A;font-weight:600;margin:10px 0;">${tituloContrato}</h2>
    <div class="info-empresa" style="color:#23263A;font-weight:bold;margin:10px 0;">
      <strong>Sube IA Tech Ltda.</strong><br>
      Fco. Mansilla 1007, Castro, Chile<br>
      RUT: 77.994.591-K<br>
      contacto@subeia.tech
    </div>
    <div class="datos-contrato" style="color:#23263A;font-weight:bold;margin-top: 15px;">
      <span style="margin: 0 15px;"><b>Código:</b> <span style="font-family:monospace;color:#00B8D9;font-size:1.1em;">${codigoCotizacion}</span></span>
      <span style="margin: 0 15px;"><b>Estado:</b> <span style="color:#FF4EFF;">${estadoContrato}</span></span>
    </div>
  </div>

  <div class="pdf-body" style="color:#23263A;font-size:14px;line-height:1.6;">
    
    <div class="seccion" style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📋 Información General</h3>
      <div class="info-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
        <div class="info-item" style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Fecha de Creación:</strong><br>
          <span style="color:#64748b;">${formatearFecha(fechaCreacionContrato)}</span>
        </div>
        <div class="info-item" style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Atendido por:</strong><br>
          <span style="color:#64748b;">${atendido}</span>
        </div>
        ${fechaInicio ? `
        <div class="info-item" style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Fecha de Inicio:</strong><br>
          <span style="color:#64748b;">${formatearFecha(fechaInicio)}</span>
        </div>
        ` : ''}
        ${fechaFin ? `
        <div class="info-item" style="background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #00B8D9;">
          <strong>Fecha de Fin:</strong><br>
          <span style="color:#64748b;">${formatearFecha(fechaFin)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="seccion" style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">👤 Información del Cliente</h3>
      <div class="datos-cliente" style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
          <div><strong>Nombre:</strong> ${nombre}</div>
          <div><strong>Email:</strong> ${email}</div>
          <div><strong>RUT:</strong> ${rut}</div>
          <div><strong>Empresa:</strong> ${empresa}</div>
        </div>
      </div>
    </div>

    <div class="seccion" style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">💰 Información Financiera</h3>
      <div class="info-financiera" style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>Valor Total del Contrato:</strong>
            ${descuento > 0 ? `<br><span style="color:#64748b;text-decoration:line-through;">$${(total || 0).toLocaleString()}</span>` : ''}
          </div>
          <div style="text-align:right;">
            <span style="font-size:1.2em;font-weight:bold;color:#00B8D9;">$${totalFinal.toLocaleString()}</span>
            ${descuento > 0 ? `<br><span style="color:#FF4EFF;font-weight:bold;">Con ${descuento}% descuento</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    ${descripcionServicios ? `
    <div class="seccion" style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📝 Descripción de Servicios</h3>
      <div class="descripcion-servicios" style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;white-space:pre-wrap;">
        ${descripcionServicios}
      </div>
    </div>
    ` : ''}

    ${terminosCondiciones ? `
    <div class="seccion" style="margin-bottom: 25px;">
      <h3 style="font-weight:bold;color:#00B8D9;border-bottom: 2px solid #00B8D9;padding-bottom: 8px;margin-bottom: 15px;">📋 Términos y Condiciones</h3>
      <div class="terminos-condiciones" style="background:#f8fafc;padding:15px;border-radius:8px;border:2px solid #e2e8f0;white-space:pre-wrap;">
        ${terminosCondiciones}
      </div>
    </div>
    ` : ''}

  </div>

  <div class="footer" style="margin-top: 40px;text-align: center;border-top: 3px solid #00B8D9;padding-top: 20px;color:#23263A;">
    <div style="font-weight:bold;margin-bottom: 10px;">Sube IA Tech Ltda.</div>
    <div style="font-size:0.9em;color:#64748b;margin-bottom: 15px;">
      contacto@subeia.tech &mdash; Fco. Mansilla 1007, Castro, Chile
    </div>
    <div style="font-size:0.8em;color:#64748b;">
      Documento generado el ${new Date().toLocaleDateString('es-CL')}
    </div>
    <img src="./assets/logo-blanco.png" alt="Logo SUBE IA TECH" style="height:48px;margin-top: 15px;">
  </div>
  `;
} 