// Configuración de Firebase
import { renderInvoice } from '../templates/invoice-template.js';

// Variables globales
let codigoActual = 1;

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
    
    // Verificar que Firebase esté disponible
    if (!window.auth) {
      throw new Error('Firebase no está disponible');
    }
    
    // Usar la nueva API de Firebase
    const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
    
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
          errorMessage = `Error de autenticación: ${error.code}`;
      }
    } else {
      errorMessage = error.message || 'Error desconocido';
    }
    
    mostrarResultadoLogin(`❌ Error: ${errorMessage}`, 'error');
    
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
  
  // Mostrar información del usuario
  const userEmailElement = document.getElementById('user-email');
  if (userEmailElement) {
    userEmailElement.textContent = `Usuario: ${user.email}`;
  }
  
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement) {
    userInfoElement.style.display = 'block';
  }
  
  // Ocultar login y mostrar cotizador
  const loginSection = document.getElementById('login-section');
  const cotizadorSection = document.getElementById('cotizador-section');
  
  if (loginSection) {
    loginSection.style.display = 'none';
    console.log('✅ Sección de login ocultada');
  }
  
  if (cotizadorSection) {
    cotizadorSection.style.display = 'block';
    console.log('✅ Sección del cotizador mostrada');
  }
}

// Función para cerrar sesión
async function cerrarSesion() {
  console.log('🚪 Cerrando sesión...');
  
  try {
    if (!window.auth) {
      throw new Error('Firebase no está disponible');
    }
    
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    await signOut(window.auth);
    
    console.log('✅ Sesión cerrada exitosamente');
    
    // Configurar UI para usuario no autenticado
    configurarUIUsuarioNoAutenticado();
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
}

// Función para configurar UI cuando el usuario no está autenticado
function configurarUIUsuarioNoAutenticado() {
  console.log('👤 Configurando UI para usuario no autenticado');
  
  // Ocultar información del usuario
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement) {
    userInfoElement.style.display = 'none';
  }
  
  // Mostrar login y ocultar cotizador
  const loginSection = document.getElementById('login-section');
  const cotizadorSection = document.getElementById('cotizador-section');
  
  if (loginSection) {
    loginSection.style.display = 'block';
    console.log('✅ Sección de login mostrada');
  }
  
  if (cotizadorSection) {
    cotizadorSection.style.display = 'none';
    console.log('✅ Sección del cotizador ocultada');
  }
  
  // Limpiar formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.reset();
  }
  
  // Limpiar mensajes
  const loginResult = document.getElementById('login-result');
  if (loginResult) {
    loginResult.style.display = 'none';
  }
}

// Función para ir al admin
function irAlAdmin() {
  window.location.href = 'admin.html';
}

// ===== FUNCIONES DEL COTIZADOR =====

// Función para generar código único
function generarCodigo() {
  const codigo = `SUBEIA-${String(codigoActual).padStart(6, '0')}`;
  codigoActual++;
  return codigo;
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
    
    // Agregar event listeners
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
  
  if (!subtotalDiv) return;
  
  let subtotal = 0;
  
  if (tipo === 'sesion') {
    const sesiones = Number(document.querySelector(`input[name="sesiones_${index}"]`)?.value || 0);
    const valorSesion = Number(document.querySelector(`input[name="valor_sesion_${index}"]`)?.value || 0);
    subtotal = sesiones * valorSesion;
  } else if (tipo === 'alumno') {
    const alumnos = Number(document.querySelector(`input[name="alumnos_${index}"]`)?.value || 0);
    const valorAlumno = Number(document.querySelector(`input[name="valor_alumno_${index}"]`)?.value || 0);
    subtotal = alumnos * valorAlumno;
  } else if (tipo === 'directo') {
    subtotal = Number(document.querySelector(`input[name="total_directo_${index}"]`)?.value || 0);
  }
  
  subtotalDiv.textContent = `Subtotal: ${subtotal.toLocaleString()}`;
}

// Función para generar PDF
function generarPDF(datos) {
  console.log('📄 Generando PDF...');
  mostrarResultado('📄 Generando PDF...', 'info');

  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está disponible');
    mostrarResultado('Error: La librería de generación de PDF no está cargada.', 'error');
    return;
  }

  if (typeof renderInvoice !== 'function') {
    console.error('❌ renderInvoice no está disponible');
    mostrarResultado('Error: La función de renderizado no está disponible.', 'error');
    return;
  }

  try {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.zIndex = '-1';

    tempDiv.innerHTML = renderInvoice({
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

    document.body.appendChild(tempDiv);

    const opt = {
      margin: 0,
      filename: `${datos.codigo}_cotizacion.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save()
      .then(() => {
        console.log('✅ PDF generado exitosamente');
        mostrarResultado(`✅ PDF generado: ${datos.codigo}_cotizacion.pdf`, 'success');

        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      })
      .catch((error) => {
        console.error('❌ Error al generar PDF:', error);
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        mostrarResultado('Error al generar el PDF. Por favor, inténtalo de nuevo.', 'error');
      });

  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    mostrarResultado('Error al generar el PDF. Por favor, inténtalo de nuevo.', 'error');
  }
}

// Función para guardar en Firestore
async function guardarEnFirestore(datos) {
  try {
    console.log('💾 Guardando en Firestore...');
    
    const cotizacionData = {
      ...datos,
      fecha: new Date(),
      createdAt: new Date(),
      creadoPor: window.auth.currentUser ? window.auth.currentUser.email : 'usuario_anonimo'
    };
    
    // Usar la nueva API de Firestore
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    await setDoc(doc(window.db, 'cotizaciones', datos.codigo), cotizacionData);
    
    console.log('✅ Datos guardados en Firestore exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error guardando en Firestore:', error);
    throw error;
  }
}

// Función para recopilar datos del formulario
function recopilarDatosFormulario() {
  console.log('📝 Iniciando recopilación de datos del formulario...');
  
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email-cliente').value.trim();
  const rut = document.getElementById('rut').value.trim();
  const empresa = document.getElementById('empresa').value.trim();
  const moneda = document.getElementById('moneda').value;
  const descuento = parseFloat(document.getElementById('descuento').value || '0');
  const atendido = document.getElementById('atendedor').value;
  const notas = document.getElementById('notas').value.trim();

  console.log('📋 Datos básicos:', { nombre, email, rut, empresa, moneda, descuento, atendido });

  // Validar campos requeridos
  if (!nombre || !email || !rut || !empresa || !atendido) {
    throw new Error('Por favor, completa todos los campos requeridos.');
  }

  // Recopilar servicios
  const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
  console.log(`🔍 Servicios seleccionados: ${checkboxes.length}`);
  
  if (checkboxes.length === 0) {
    throw new Error('Por favor, selecciona al menos un servicio.');
  }

  const servicios = [];
  let total = 0;

  checkboxes.forEach((checkbox, index) => {
    console.log(`📦 Procesando servicio ${index + 1}: ${checkbox.value}`);
    
    const detalle = document.querySelector(`textarea[name="detalle_${index}"]`)?.value.trim();
    const modalidad = document.querySelector(`select[name="modalidad_${index}"]`)?.value;
    const alumnos = Number(document.querySelector(`input[name="alumnos_${index}"]`)?.value || 0);
    const tipoCobro = document.querySelector(`input[name="cobro_tipo_${index}"]:checked`)?.value;

    console.log(`📊 Datos del servicio:`, { detalle, modalidad, alumnos, tipoCobro });

    if (!detalle || !modalidad || alumnos <= 0 || !tipoCobro) {
      throw new Error(`Por favor, completa todos los datos del servicio: ${checkbox.value}`);
    }

    let cantidad = 0;
    let valorUnitario = 0;
    let subtotal = 0;
    let tipoCobroTexto = '';
    let cantidadValor = '';

    if (tipoCobro === 'sesion') {
      cantidad = Number(document.querySelector(`input[name="sesiones_${index}"]`)?.value || 0);
      valorUnitario = Number(document.querySelector(`input[name="valor_sesion_${index}"]`)?.value || 0);
      subtotal = cantidad * valorUnitario;
      tipoCobroTexto = 'Por sesión';
      cantidadValor = `${cantidad} x ${valorUnitario.toLocaleString()}`;
    } else if (tipoCobro === 'alumno') {
      cantidad = alumnos;
      valorUnitario = Number(document.querySelector(`input[name="valor_alumno_${index}"]`)?.value || 0);
      subtotal = cantidad * valorUnitario;
      tipoCobroTexto = 'Por alumno';
      cantidadValor = `${cantidad} x ${valorUnitario.toLocaleString()}`;
    } else if (tipoCobro === 'directo') {
      subtotal = Number(document.querySelector(`input[name="total_directo_${index}"]`)?.value || 0);
      tipoCobroTexto = 'Total directo';
    }

    console.log(`💰 Cálculos del servicio:`, { cantidad, valorUnitario, subtotal, tipoCobroTexto });

    if (subtotal <= 0) {
      throw new Error(`Por favor, ingresa un valor válido para el servicio: ${checkbox.value}`);
    }

    servicios.push({
      nombre: checkbox.value,
      detalle,
      modalidad,
      alumnos,
      tipoCobro,
      tipoCobroTexto,
      cantidad,
      valorUnitario,
      cantidadValor,
      subtotal
    });

    total += subtotal;
  });

  // Calcular descuento
  const descuentoValor = total * (descuento / 100);
  const totalConDescuento = total - descuentoValor;

  console.log(`💵 Totales calculados:`, { total, descuento, descuentoValor, totalConDescuento });

  // Crear objeto de datos
  const datosCotizacion = {
    codigo: generarCodigo(),
    nombre,
    email,
    rut,
    empresa,
    moneda,
    atendido,
    servicios,
    total,
    descuento,
    descuentoValor,
    totalConDescuento,
    notas,
    fecha: new Date().toLocaleDateString('es-CL'),
    fechaTimestamp: new Date()
  };

  console.log('✅ Datos del formulario recopilados exitosamente:', datosCotizacion);
  return datosCotizacion;
}

// Función principal para guardar y generar cotización
async function guardarYGenerarCotizacion(event) {
  // No necesitamos preventDefault() para eventos click
  console.log('🚀 Iniciando proceso de guardado y generación de PDF...');
  console.log('🔍 Evento recibido:', event.type);
  console.log('🔍 Elemento que disparó el evento:', event.target);

  // Verificar que el usuario esté autenticado
  if (!window.auth.currentUser) {
    mostrarResultado('❌ Debes iniciar sesión para generar cotizaciones', 'error');
    return;
  }

  const btn = document.getElementById('descargar-pdf');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';
  }

  try {
    // SOLUCIÓN AGRESIVA: Remover required de TODOS los campos temporalmente
    console.log('🧹 Removiendo required de TODOS los campos temporalmente...');
    const todosLosCamposRequired = document.querySelectorAll('input[required], select[required], textarea[required]');
    console.log(`🔍 Encontrados ${todosLosCamposRequired.length} campos con required`);
    
    todosLosCamposRequired.forEach(campo => {
      console.log(`🚫 Removiendo required de: ${campo.name}`);
      campo.removeAttribute('required');
      campo.setAttribute('data-temp-required', 'true');
    });

    // Verificar que no hay campos required antes de procesar
    const camposRequiredRestantes = document.querySelectorAll('[required]');
    if (camposRequiredRestantes.length > 0) {
      console.log(`⚠️ Aún quedan ${camposRequiredRestantes.length} campos con required, forzando eliminación...`);
      camposRequiredRestantes.forEach(campo => {
        campo.removeAttribute('required');
        campo.setAttribute('data-temp-required', 'true');
      });
    }

    // Recopilar datos del formulario
    console.log('📝 Recopilando datos del formulario...');
    const datos = recopilarDatosFormulario();
    console.log('✅ Datos recopilados:', datos);

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
    
    // Restaurar required a campos que lo tenían temporalmente
    console.log('🔄 Restaurando validación de campos...');
    const camposTemporales = document.querySelectorAll('[data-temp-required]');
    camposTemporales.forEach(campo => {
      campo.setAttribute('required', 'required');
      campo.removeAttribute('data-temp-required');
    });
    console.log(`✅ Restaurados ${camposTemporales.length} campos con required`);
  }
}

// Función para restaurar validación de campos


// Función para debug de campos
function debugCampos() {
  console.log('🔍 DEBUG: Estado de campos de cobro');
  const camposCobro = document.querySelectorAll('.campo-cobro');
  camposCobro.forEach((campo, index) => {
    const esActivo = campo.classList.contains('active');
    const camposRequired = campo.querySelectorAll('[required]');
    console.log(`Campo ${index}: activo=${esActivo}, required=${camposRequired.length}`);
    camposRequired.forEach(campo => {
      console.log(`  - ${campo.name}: ${campo.value}`);
    });
  });
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando aplicación...');

  // Verificar estado de autenticación al cargar
  if (window.auth) {
    console.log('✅ Firebase auth disponible');
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        configurarUIUsuarioAutenticado(user);
      } else {
        console.log('❌ Usuario no autenticado');
        configurarUIUsuarioNoAutenticado();
      }
    });
  } else {
    console.log('⚠️ Firebase aún no está cargado, esperando...');
    // Esperar a que Firebase se cargue
    const checkFirebase = setInterval(() => {
      if (window.auth) {
        clearInterval(checkFirebase);
        console.log('✅ Firebase auth cargado, configurando listener...');
        window.auth.onAuthStateChanged((user) => {
          if (user) {
            console.log('✅ Usuario autenticado:', user.email);
            configurarUIUsuarioAutenticado(user);
          } else {
            console.log('❌ Usuario no autenticado');
            configurarUIUsuarioNoAutenticado();
          }
        });
      }
    }, 100);
  }

  // Event listener para el formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', manejarLogin);
    console.log('✅ Event listener del formulario de login configurado');
  } else {
    console.error('❌ Formulario de login no encontrado');
  }

  // Event listeners para checkboxes de servicios
  const checkboxes = document.querySelectorAll('input[name="servicios"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', renderizarDetalles);
  });

  // Event listener para el botón de generar PDF
  const btnGenerarPDF = document.getElementById('descargar-pdf');
  console.log('🔍 Buscando botón generar PDF...');
  console.log('🔍 Botón encontrado:', btnGenerarPDF);
  
  if (btnGenerarPDF) {
    btnGenerarPDF.addEventListener('click', guardarYGenerarCotizacion);
    console.log('✅ Event listener del botón generar PDF configurado');
    console.log('🔍 Botón ID:', btnGenerarPDF.id);
    console.log('🔍 Botón texto:', btnGenerarPDF.textContent);
  } else {
    console.error('❌ Botón generar PDF no encontrado');
    console.log('🔍 Elementos con ID que contienen "pdf":', document.querySelectorAll('[id*="pdf"]'));
  }

  // Hacer disponibles las funciones globalmente
  window.cerrarSesion = cerrarSesion;
  window.irAlAdmin = irAlAdmin;
  window.guardarYGenerarCotizacion = guardarYGenerarCotizacion;
  
  // Test manual - puedes ejecutar esto en la consola: window.testPDF()
  window.testPDF = () => {
    console.log('🧪 Test manual de PDF iniciado');
    guardarYGenerarCotizacion({ type: 'test', target: document.getElementById('descargar-pdf') });
  };

  console.log('✅ Aplicación inicializada correctamente');
}); 