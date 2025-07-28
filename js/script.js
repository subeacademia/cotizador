// Script principal del cotizador
import { auth, db } from './firebase-config.js';
import { renderInvoice } from '../templates/invoice-template.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Variables globales
let codigoActual = 1;
let modoEdicion = false;
let cotizacionEditando = null;

// ===== FUNCIONES DE AUTENTICACIÓN =====

// Función para mostrar resultado
function mostrarResultado(mensaje, tipo = 'info') {
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerHTML = mensaje;
    resultDiv.className = `result ${tipo}`;
    resultDiv.style.display = 'block';
  }
}

// Función para mostrar resultado de login
function mostrarResultadoLogin(mensaje, tipo = 'info') {
  const resultDiv = document.getElementById('login-result');
  if (resultDiv) {
    resultDiv.innerHTML = mensaje;
    resultDiv.className = `result ${tipo}`;
    resultDiv.style.display = 'block';
  }
}

// Función para manejar el login
async function manejarLogin(event) {
  event.preventDefault();
  
  console.log('🔐 Procesando login...');
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // Validar campos
  if (!email || !password) {
    mostrarResultadoLogin('Por favor, completa todos los campos.', 'error');
    return;
  }
  
  mostrarResultadoLogin('Iniciando sesión...', 'info');
  
  // Mostrar estado de carga
  const loginButton = event.target.querySelector('button[type="submit"]');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.innerHTML = 'Iniciando Sesión...';
  }
  
  try {
    console.log('🔥 Intentando autenticación con Firebase...');
    
    // Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Autenticación exitosa:', userCredential.user.email);
    
    mostrarResultadoLogin('✅ Login exitoso!', 'success');
    
    // Configurar UI para usuario autenticado
    setTimeout(() => {
      configurarUIUsuarioAutenticado(userCredential.user);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error de autenticación:', error);
    
    let errorMessage = 'Credenciales incorrectas.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credenciales inválidas.';
          break;
        default:
          errorMessage = `Error de autenticación: ${error.message}`;
      }
    }
    
    mostrarResultadoLogin(errorMessage, 'error');
    
    // Restaurar botón
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.innerHTML = 'Iniciar Sesión';
    }
  }
}

// Función para configurar UI cuando el usuario está autenticado
function configurarUIUsuarioAutenticado(user) {
  console.log('👤 Configurando UI para usuario autenticado:', user.email);
  
  // Ocultar sección de login
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'none';
  }
  
  // Mostrar información del usuario
  const userInfo = document.getElementById('user-info');
  const userEmail = document.getElementById('user-email');
  if (userInfo && userEmail) {
    userEmail.textContent = user.email;
    userInfo.style.display = 'block';
  }
  
  // Mostrar sección del cotizador
  const cotizadorSection = document.getElementById('cotizador-section');
  if (cotizadorSection) {
    cotizadorSection.style.display = 'block';
  }
  
  console.log('✅ UI configurada para usuario autenticado');
}

// Función para cerrar sesión
async function cerrarSesion() {
  console.log('🚪 Cerrando sesión...');
  
  try {
    await signOut(auth);
    console.log('✅ Sesión cerrada exitosamente');
    configurarUIUsuarioNoAutenticado();
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
}

// Función para configurar UI cuando el usuario no está autenticado
function configurarUIUsuarioNoAutenticado() {
  console.log('👤 Configurando UI para usuario no autenticado');
  
  // Mostrar sección de login
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'block';
  }
  
  // Ocultar información del usuario
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.style.display = 'none';
  }
  
  // Ocultar sección del cotizador
  const cotizadorSection = document.getElementById('cotizador-section');
  if (cotizadorSection) {
    cotizadorSection.style.display = 'none';
  }
  
  console.log('✅ UI configurada para usuario no autenticado');
}

// Función para ir al panel de administración
function irAlAdmin() {
  if (window.router) {
    window.router.navigate('/admin');
  } else {
    window.location.href = '/admin';
  }
}

// ===== FUNCIONES DEL COTIZADOR =====

// Función para generar código único
function generarCodigo() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  
  return `COT-${año}${mes}${dia}-${hora}${minuto}-${String(codigoActual).padStart(3, '0')}`;
}

// Función para renderizar detalles de servicios
function renderizarDetalles() {
  const detalleDiv = document.getElementById('servicios-detalle');
  if (!detalleDiv) return;
  
  detalleDiv.innerHTML = '';
  
  const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
  
  checkboxes.forEach((checkbox, index) => {
    const servicioDiv = document.createElement('div');
    servicioDiv.className = 'servicio-detalle';
    servicioDiv.innerHTML = `
      <h3>${checkbox.value}</h3>
      <div class="form-group">
        <label>Detalle del servicio *</label>
        <textarea name="detalle_${index}" required placeholder="Describe el servicio..."></textarea>
      </div>
      <div class="form-group">
        <label>Modalidad *</label>
        <select name="modalidad_${index}" required>
          <option value="">Selecciona...</option>
          <option value="Presencial">Presencial</option>
          <option value="Online">Online</option>
          <option value="Semipresencial">Semipresencial</option>
        </select>
      </div>
      <div class="form-group">
        <label>Cantidad de alumnos *</label>
        <input type="number" name="alumnos_${index}" min="1" value="1" required>
      </div>
      <div class="form-group">
        <label>Tipo de cobro *</label>
        <div class="radio-group">
          <input type="radio" name="cobro_tipo_${index}" value="sesion" checked>
          <label>Por sesión</label>
          <input type="radio" name="cobro_tipo_${index}" value="alumno">
          <label>Por alumno</label>
          <input type="radio" name="cobro_tipo_${index}" value="directo">
          <label>Total directo</label>
        </div>
      </div>
      <div class="campo-cobro campo-sesion active" id="campo_sesion_${index}">
        <div class="form-group">
          <label>Cantidad de sesiones *</label>
          <input type="number" name="sesiones_${index}" min="1" value="1" required>
        </div>
        <div class="form-group">
          <label>Valor unitario por sesión *</label>
          <input type="number" name="valor_sesion_${index}" min="0" step="0.01" required>
        </div>
      </div>
      <div class="campo-cobro campo-alumno" id="campo_alumno_${index}">
        <div class="form-group">
          <label>Valor unitario por alumno *</label>
          <input type="number" name="valor_alumno_${index}" min="0" step="0.01" required>
        </div>
      </div>
      <div class="campo-cobro campo-directo" id="campo_directo_${index}">
        <div class="form-group">
          <label>Total directo *</label>
          <input type="number" name="total_directo_${index}" min="0" step="0.01" required>
        </div>
      </div>
      <div class="subtotal" id="subtotal_${index}">Subtotal: 0</div>
    `;
    
    detalleDiv.appendChild(servicioDiv);
    
    // Agregar event listeners a los nuevos elementos
    addEventListenersToDetails(servicioDiv, index);
    
    // Calcular subtotal inicial
    calcularSubtotal(index);
  });
}

// Función auxiliar para agregar event listeners a los detalles
function addEventListenersToDetails(servicioDiv, index) {
  // Event listeners para el tipo de cobro
  const radios = servicioDiv.querySelectorAll(`input[name="cobro_tipo_${index}"]`);
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Ocultar todos los campos y remover required
      servicioDiv.querySelectorAll('.campo-cobro').forEach(campo => {
        campo.classList.remove('active');
        // Remover required de campos ocultos
        const inputs = campo.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
          input.removeAttribute('required');
          input.setAttribute('data-was-required', 'true');
        });
      });
      
      // Mostrar el campo correspondiente y agregar required
      let campoActivo;
      if (e.target.value === 'sesion') {
        campoActivo = servicioDiv.querySelector(`#campo_sesion_${index}`);
      } else if (e.target.value === 'alumno') {
        campoActivo = servicioDiv.querySelector(`#campo_alumno_${index}`);
      } else if (e.target.value === 'directo') {
        campoActivo = servicioDiv.querySelector(`#campo_directo_${index}`);
      }
      
      if (campoActivo) {
        campoActivo.classList.add('active');
        // Agregar required a campos visibles
        const inputs = campoActivo.querySelectorAll('input[data-was-required], select[data-was-required], textarea[data-was-required]');
        inputs.forEach(input => {
          input.setAttribute('required', 'required');
        });
      }
      
      calcularSubtotal(index);
    });
  });
  
  // Event listeners para inputs
  servicioDiv.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', () => calcularSubtotal(index));
    input.addEventListener('change', () => calcularSubtotal(index));
  });
}

// Función para calcular subtotal
function calcularSubtotal(index) {
  const tipo = document.querySelector(`input[name="cobro_tipo_${index}"]:checked`)?.value;
  const subtotalDiv = document.getElementById(`subtotal_${index}`);
  
  if (!subtotalDiv || !tipo) return;
  
  let subtotal = 0;
  const alumnos = parseInt(document.querySelector(`input[name="alumnos_${index}"]`)?.value || 0);
  
  if (tipo === 'sesion') {
    const sesiones = parseInt(document.querySelector(`input[name="sesiones_${index}"]`)?.value || 0);
    const valorSesion = parseFloat(document.querySelector(`input[name="valor_sesion_${index}"]`)?.value || 0);
    subtotal = sesiones * valorSesion;
  } else if (tipo === 'alumno') {
    const valorAlumno = parseFloat(document.querySelector(`input[name="valor_alumno_${index}"]`)?.value || 0);
    subtotal = alumnos * valorAlumno;
  } else if (tipo === 'directo') {
    subtotal = parseFloat(document.querySelector(`input[name="total_directo_${index}"]`)?.value || 0);
  }
  
  subtotalDiv.textContent = `Subtotal: $${subtotal.toLocaleString('es-CL')}`;
}

// Función para generar PDF
function generarPDF(datos) {
  console.log('📄 Generando PDF...');
  
  try {
    // Crear div temporal
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    
    // Generar HTML de la factura directamente con los datos
    const htmlContent = renderInvoice({
      nombre: datos.nombre,
      email: datos.email,
      rut: datos.rut,
      empresa: datos.empresa,
      moneda: datos.moneda,
      codigo: datos.codigo,
      fecha: datos.fecha,
      serviciosData: datos.servicios,
      total: datos.total,
      atendedor: datos.atendido,
      notasAdicionales: datos.notas,
      descuento: datos.descuento
    });
    
    tempDiv.innerHTML = htmlContent;
    
    // Agregar al body
    document.body.appendChild(tempDiv);
    
    // Generar PDF
    html2pdf().from(tempDiv).save(`cotizacion-${datos.codigo}.pdf`)
      .then(() => {
        console.log('✅ PDF generado exitosamente');
        // Eliminar div temporal
        document.body.removeChild(tempDiv);
      })
      .catch((error) => {
        console.error('❌ Error al generar PDF:', error);
        // Eliminar div temporal en caso de error
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        mostrarResultado('Error al generar PDF. Por favor, inténtalo de nuevo.', 'error');
      });
      
  } catch (error) {
    console.error('❌ Error en generarPDF:', error);
    mostrarResultado('Error al generar PDF. Por favor, inténtalo de nuevo.', 'error');
  }
}

// Función para previsualizar cotización
async function previsualizarCotizacion(event) {
  console.log('👁️ Iniciando previsualización...');
  
  // Verificar que el usuario esté autenticado
  if (!auth.currentUser) {
    mostrarResultado('❌ Debes iniciar sesión para previsualizar cotizaciones', 'error');
    return;
  }
  
  const btn = document.getElementById('preview-pdf');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';
  }
  
  try {
    // Recopilar datos del formulario
    console.log('📝 Recopilando datos del formulario...');
    const datos = recopilarDatosFormulario();
    
    if (!datos) {
      console.log('❌ Recopilación de datos falló, deteniendo proceso');
      return;
    }
    
    // Guardar en Firestore temporalmente
    console.log('💾 Guardando en Firestore...');
    await guardarEnFirestore(datos);
    console.log('✅ Datos guardados exitosamente en Firestore');
    
    mostrarResultado(`✅ Cotización ${datos.codigo} guardada exitosamente!`, 'success');
    
    // Redirigir a la página de previsualización
    console.log('👁️ Redirigiendo a previsualización...');
    setTimeout(() => {
      if (window.router) {
        window.router.navigate(`/preview?id=${datos.codigo}`);
      } else {
        window.location.href = `/preview?id=${datos.codigo}`;
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    mostrarResultado(`❌ Error: ${error.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '👁️ Previsualizar';
    }
  }
}

// Función para enviar cotización al cliente
async function enviarCotizacionCliente(event) {
  console.log('📧 Iniciando envío de cotización...');
  
  // Verificar que el usuario esté autenticado
  if (!auth.currentUser) {
    mostrarResultado('❌ Debes iniciar sesión para enviar cotizaciones', 'error');
    return;
  }
  
  const btn = document.getElementById('enviar-cotizacion');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';
  }
  
  try {
    // Recopilar datos del formulario
    console.log('📝 Recopilando datos del formulario...');
    const datos = recopilarDatosFormulario();
    
    if (!datos) {
      console.log('❌ Recopilación de datos falló, deteniendo proceso');
      return;
    }
    
    // Guardar en Firestore
    console.log('💾 Guardando en Firestore...');
    await guardarEnFirestore(datos);
    console.log('✅ Datos guardados exitosamente en Firestore');
    
    mostrarResultado(`✅ Cotización ${datos.codigo} guardada exitosamente!`, 'success');
    
    // Generar PDF y enviar
    console.log('📄 Generando PDF para envío...');
    setTimeout(() => {
      generarPDF(datos);
      mostrarResultado('📧 PDF generado. Revisa tu carpeta de descargas.', 'success');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    mostrarResultado(`❌ Error: ${error.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📧 Enviar al Cliente';
    }
  }
}

// Función para guardar en Firestore
async function guardarEnFirestore(datos) {
  console.log('💾 Guardando en Firestore...');
  
  try {
    const codigo = datos.codigo;
    
    // Limpiar datos para evitar valores undefined
    const datosLimpios = {};
    Object.keys(datos).forEach(key => {
      if (datos[key] !== undefined) {
        datosLimpios[key] = datos[key];
      } else {
        datosLimpios[key] = '';
      }
    });
    
    console.log('🧹 Datos limpios para Firestore:', datosLimpios);
    await setDoc(doc(db, 'cotizaciones', codigo), datosLimpios);
    console.log('✅ Datos guardados exitosamente en Firestore');
  } catch (error) {
    console.error('❌ Error al guardar en Firestore:', error);
    throw new Error(`Error al guardar en la base de datos: ${error.message}`);
  }
}

// Función para recopilar datos del formulario
function recopilarDatosFormulario() {
  console.log('📝 Recopilando datos del formulario...');
  
  try {
    // Datos básicos del cliente
    const nombre = document.getElementById('nombre')?.value?.trim();
    const emailCliente = document.getElementById('email-cliente')?.value?.trim();
    const rut = document.getElementById('rut')?.value?.trim();
    const empresa = document.getElementById('empresa')?.value?.trim();
    const telefono = document.getElementById('telefono')?.value?.trim() || '';
    const direccion = document.getElementById('direccion')?.value?.trim() || '';
    const comuna = document.getElementById('comuna')?.value?.trim() || '';
    const ciudad = document.getElementById('ciudad')?.value?.trim() || '';
    const region = document.getElementById('region')?.value?.trim() || '';
    
    // Validar campos obligatorios
    if (!nombre || !emailCliente || !rut) {
      throw new Error('Por favor, completa todos los campos obligatorios.');
    }
    
    // Datos de servicios
    const serviciosSeleccionados = [];
    const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
    
    checkboxes.forEach((checkbox, index) => {
      const detalle = document.querySelector(`textarea[name="detalle_${index}"]`)?.value?.trim();
      const modalidad = document.querySelector(`select[name="modalidad_${index}"]`)?.value;
      const alumnos = parseInt(document.querySelector(`input[name="alumnos_${index}"]`)?.value || 0);
      const tipoCobro = document.querySelector(`input[name="cobro_tipo_${index}"]:checked`)?.value;
      
      if (!detalle || !modalidad || !alumnos || !tipoCobro) {
        throw new Error(`Por favor, completa todos los campos del servicio: ${checkbox.value}`);
      }
      
      let subtotal = 0;
      let detallesCobro = {};
      
      if (tipoCobro === 'sesion') {
        const sesiones = parseInt(document.querySelector(`input[name="sesiones_${index}"]`)?.value || 0);
        const valorSesion = parseFloat(document.querySelector(`input[name="valor_sesion_${index}"]`)?.value || 0);
        subtotal = sesiones * valorSesion;
        detallesCobro = { sesiones, valorSesion };
      } else if (tipoCobro === 'alumno') {
        const valorAlumno = parseFloat(document.querySelector(`input[name="valor_alumno_${index}"]`)?.value || 0);
        subtotal = alumnos * valorAlumno;
        detallesCobro = { valorAlumno };
      } else if (tipoCobro === 'directo') {
        subtotal = parseFloat(document.querySelector(`input[name="total_directo_${index}"]`)?.value || 0);
        detallesCobro = { totalDirecto: subtotal };
      }
      
      serviciosSeleccionados.push({
        nombre: checkbox.value,
        detalle,
        modalidad,
        alumnos,
        tipoCobro,
        subtotal,
        detallesCobro
      });
    });
    
    if (serviciosSeleccionados.length === 0) {
      throw new Error('Por favor, selecciona al menos un servicio.');
    }
    
    // Calcular totales
    const subtotal = serviciosSeleccionados.reduce((sum, servicio) => sum + servicio.subtotal, 0);
    const descuento = parseFloat(document.getElementById('descuento')?.value || 0);
    const descuentoValor = (subtotal * descuento) / 100;
    const totalConDescuento = subtotal - descuentoValor;
    
         // Datos adicionales
     const notas = document.getElementById('notas')?.value?.trim() || '';
     const atendido = document.getElementById('atendedor')?.value || 'No especificado';
    
    // Generar código único
    const codigo = generarCodigo();
    codigoActual++;
    
    // Obtener moneda
    const moneda = document.getElementById('moneda')?.value || 'CLP';
    
    // Asegurar que ningún campo sea undefined
    const datosCotizacion = {
      codigo: codigo || '',
      nombre: nombre || '',
      email: emailCliente || '',
      rut: rut || '',
      empresa: empresa || '',
      telefono: telefono || '',
      direccion: direccion || '',
      comuna: comuna || '',
      ciudad: ciudad || '',
      region: region || '',
      moneda: moneda || 'CLP',
      servicios: serviciosSeleccionados || [],
      atendido: atendido || 'No especificado',
      subtotal: subtotal || 0,
      descuento: descuento || 0,
      descuentoValor: descuentoValor || 0,
      totalConDescuento: totalConDescuento || 0,
      total: totalConDescuento || 0,
      notas: notas || '',
      fecha: new Date().toLocaleDateString('es-CL'),
      fechaTimestamp: new Date()
    };
    
    console.log('✅ Datos del formulario recopilados exitosamente:', datosCotizacion);
    console.log('🔍 Verificando campo telefono:', datosCotizacion.telefono, 'tipo:', typeof datosCotizacion.telefono);
    return datosCotizacion;
    
  } catch (error) {
    console.error('❌ Error al recopilar datos:', error);
    mostrarResultado(error.message, 'error');
    return null;
  }
}

// Función principal para guardar y generar cotización
async function guardarYGenerarCotizacion(event) {
  console.log('🚀 Iniciando proceso de guardado y generación de PDF...');
  
  // Verificar que el usuario esté autenticado
  if (!auth.currentUser) {
    mostrarResultado('❌ Debes iniciar sesión para generar cotizaciones', 'error');
    return;
  }
  
  const btn = document.getElementById('descargar-pdf');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';
  }
  
  try {
    // Recopilar datos del formulario
    console.log('📝 Recopilando datos del formulario...');
    const datos = recopilarDatosFormulario();
    
    if (!datos) {
      console.log('❌ Recopilación de datos falló, deteniendo proceso');
      return;
    }
    
    // Guardar en Firestore
    console.log('💾 Guardando en Firestore...');
    await guardarEnFirestore(datos);
    console.log('✅ Datos guardados exitosamente en Firestore');
    
    mostrarResultado(`✅ Cotización ${datos.codigo} guardada exitosamente!`, 'success');
    
    // Generar PDF
    console.log('📄 Generando PDF...');
    setTimeout(() => {
      generarPDF(datos);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    mostrarResultado(`❌ Error: ${error.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📄 Generar PDF';
    }
  }
}

// ===== INICIALIZACIÓN =====

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM cargado, inicializando cotizador...');
  
  // Detectar modo de edición
  const esModoEdicion = detectarModoEdicion();
  
  // Configurar autenticación
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Usuario autenticado:', user.email);
      configurarUIUsuarioAutenticado(user);
    } else {
      console.log('❌ Usuario no autenticado');
      configurarUIUsuarioNoAutenticado();
    }
  });
  
  // Configurar formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', manejarLogin);
    console.log('✅ Formulario de login configurado');
  }
  
  // Configurar checkboxes de servicios
  const checkboxes = document.querySelectorAll('input[name="servicios"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', renderizarDetalles);
  });
  console.log('✅ Checkboxes de servicios configurados');
  
  // Configurar botones
  const btnGenerarPDF = document.getElementById('descargar-pdf');
  const btnPreviewPDF = document.getElementById('preview-pdf');
  const btnEnviarCotizacion = document.getElementById('enviar-cotizacion');
  
  if (btnGenerarPDF) {
    btnGenerarPDF.addEventListener('click', guardarYGenerarCotizacion);
    console.log('✅ Botón de generar PDF configurado');
  }
  
  if (btnPreviewPDF) {
    btnPreviewPDF.addEventListener('click', previsualizarCotizacion);
    console.log('✅ Botón de previsualizar configurado');
  }
  
  if (btnEnviarCotizacion) {
    btnEnviarCotizacion.addEventListener('click', enviarCotizacionCliente);
    console.log('✅ Botón de enviar cotización configurado');
  }
  
  // Configurar campo de descuento
  const campoDescuento = document.getElementById('descuento');
  if (campoDescuento) {
    campoDescuento.addEventListener('input', () => {
      // Recalcular todos los subtotales
      const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
      checkboxes.forEach((_, index) => {
        calcularSubtotal(index);
      });
    });
    console.log('✅ Campo de descuento configurado');
  }
  
  console.log('✅ Cotizador inicializado correctamente');
});

// Hacer funciones disponibles globalmente
window.cerrarSesion = cerrarSesion;
window.irAlAdmin = irAlAdmin;
window.guardarYGenerarCotizacion = guardarYGenerarCotizacion;

// ===== FUNCIONES DE EDICIÓN =====

// Función para detectar modo de edición desde URL
function detectarModoEdicion() {
  const urlParams = new URLSearchParams(window.location.search);
  const modo = urlParams.get('modo');
  
  if (modo === 'editar') {
    console.log('✏️ Modo de edición detectado');
    modoEdicion = true;
    cargarDatosEdicion();
    return true;
  }
  
  return false;
}

// Función para cargar datos de edición
function cargarDatosEdicion() {
  const urlParams = new URLSearchParams(window.location.search);
  
  try {
    // Cargar datos básicos
    const id = urlParams.get('id');
    const codigo = urlParams.get('codigo');
    const nombre = urlParams.get('nombre');
    const empresa = urlParams.get('empresa');
    const email = urlParams.get('email');
    const rut = urlParams.get('rut');
    const atendido = urlParams.get('atendido');
    const total = parseFloat(urlParams.get('total')) || 0;
    const descuento = parseFloat(urlParams.get('descuento')) || 0;
    const notas = urlParams.get('notas');
    const estado = urlParams.get('estado');
    
    // Cargar servicios
    let servicios = [];
    try {
      servicios = JSON.parse(urlParams.get('servicios') || '[]');
    } catch (e) {
      console.warn('⚠️ Error al parsear servicios:', e);
    }
    
    // Guardar datos para edición
    cotizacionEditando = {
      id,
      codigo,
      nombre,
      empresa,
      email,
      rut,
      atendido,
      servicios,
      total,
      descuento,
      notas,
      estado
    };
    
    console.log('📝 Datos de edición cargados:', cotizacionEditando);
    
    // Llenar formulario
    llenarFormularioEdicion();
    
    // Cambiar título y botón
    cambiarUIEdicion();
    
  } catch (error) {
    console.error('❌ Error al cargar datos de edición:', error);
    mostrarResultado('Error al cargar datos para edición', 'error');
  }
}

// Función para llenar el formulario con datos de edición
function llenarFormularioEdicion() {
  if (!cotizacionEditando) return;
  
  // Llenar campos básicos
  const campos = {
    'nombre': cotizacionEditando.nombre,
    'empresa': cotizacionEditando.empresa,
    'email': cotizacionEditando.email,
    'rut': cotizacionEditando.rut,
    'atendido': cotizacionEditando.atendido,
    'descuento': cotizacionEditando.descuento,
    'notas': cotizacionEditando.notas
  };
  
  Object.entries(campos).forEach(([id, valor]) => {
    const campo = document.getElementById(id);
    if (campo && valor) {
      campo.value = valor;
    }
  });
  
  // Llenar servicios
  if (cotizacionEditando.servicios && cotizacionEditando.servicios.length > 0) {
    cotizacionEditando.servicios.forEach(servicio => {
      const checkbox = document.querySelector(`input[name="servicios"][value="${servicio.nombre}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
    
    // Renderizar detalles de servicios
    renderizarDetalles();
    
    // Llenar detalles de servicios
    setTimeout(() => {
      llenarDetallesServicios();
    }, 100);
  }
}

// Función para llenar detalles de servicios
function llenarDetallesServicios() {
  if (!cotizacionEditando.servicios) return;
  
  cotizacionEditando.servicios.forEach((servicio, index) => {
    const servicioDiv = document.querySelector(`[data-servicio="${servicio.nombre}"]`);
    if (servicioDiv) {
      const detalleInput = servicioDiv.querySelector('textarea');
      const precioInput = servicioDiv.querySelector('input[type="number"]');
      
      if (detalleInput) detalleInput.value = servicio.detalle || '';
      if (precioInput) precioInput.value = servicio.precio || 0;
      
      // Recalcular subtotal
      calcularSubtotal(index);
    }
  });
}

// Función para cambiar UI para edición
function cambiarUIEdicion() {
  // Cambiar título
  const titulo = document.querySelector('.header h1');
  if (titulo) {
    titulo.textContent = '✏️ Editar Cotización';
  }
  
  // Cambiar botón principal
  const btnPrincipal = document.getElementById('descargar-pdf');
  if (btnPrincipal) {
    btnPrincipal.textContent = '💾 Actualizar Cotización';
    btnPrincipal.onclick = actualizarCotizacion;
  }
  
  // Agregar botón de cancelar
  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'btn';
  btnCancelar.style.background = 'linear-gradient(135deg, #6b7280, #9ca3af)';
  btnCancelar.style.marginTop = '10px';
  btnCancelar.textContent = '❌ Cancelar Edición';
  btnCancelar.onclick = cancelarEdicion;
  
  const contenedorBotones = btnPrincipal?.parentElement;
  if (contenedorBotones) {
    contenedorBotones.appendChild(btnCancelar);
  }
}

// Función para actualizar cotización
async function actualizarCotizacion(event) {
  event.preventDefault();
  
  if (!cotizacionEditando) {
    mostrarResultado('No hay cotización para actualizar', 'error');
    return;
  }
  
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Actualizando...';
  
  try {
    console.log('✏️ Actualizando cotización:', cotizacionEditando.id);
    
    // Recopilar datos actualizados
    const datosActualizados = recopilarDatosFormulario();
    if (!datosActualizados) {
      throw new Error('Error al recopilar datos del formulario');
    }
    
    // Mantener ID original
    datosActualizados.id = cotizacionEditando.id;
    datosActualizados.codigo = cotizacionEditando.codigo;
    
    // Actualizar en Firestore
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const cotizacionRef = doc(db, 'cotizaciones', cotizacionEditando.id);
    
    await updateDoc(cotizacionRef, datosActualizados);
    
    console.log('✅ Cotización actualizada exitosamente');
    mostrarResultado(`✅ Cotización ${datosActualizados.codigo} actualizada exitosamente!`, 'success');
    
    // Generar PDF actualizado
    setTimeout(() => {
      generarPDF(datosActualizados);
    }, 1000);
    
    // Redirigir al admin después de un tiempo
    setTimeout(() => {
      if (window.router) {
        window.router.navigate('/admin');
      } else {
        window.location.href = '/admin';
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error al actualizar cotización:', error);
    mostrarResultado(`❌ Error: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Actualizar Cotización';
  }
}

// Función para cancelar edición
function cancelarEdicion() {
  if (confirm('¿Estás seguro de que quieres cancelar la edición? Los cambios no se guardarán.')) {
    if (window.router) {
      window.router.navigate('/admin');
    } else {
      window.location.href = '/admin';
    }
  }
} 