// ===== FUNCIONES DE UI =====

function mostrarResultado(mensaje, tipo = 'info') {
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.className = `result ${tipo}`;
    resultDiv.innerHTML = `
      <div class="alert alert-${tipo}">
        ${mensaje}
      </div>
    `;
    
    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 5000);
  }
}

function mostrarResultadoLogin(mensaje, tipo = 'info') {
  const resultDiv = document.getElementById('login-result');
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.className = `result ${tipo}`;
    resultDiv.innerHTML = `
      <div class="alert alert-${tipo}">
        ${mensaje}
      </div>
    `;
    
    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 5000);
  }
}

// ===== FUNCIONES DE AUTENTICACIÓN =====

async function manejarLogin(event) {
  event.preventDefault();
  console.log('🔐 Iniciando proceso de login...');

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    mostrarResultadoLogin('❌ Por favor completa todos los campos', 'error');
    return;
  }

  try {
    // Importar dinámicamente las funciones de Firebase Auth
    const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    console.log('🔐 Intentando autenticación con Firebase...');
    const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Login exitoso:', user.email);
    mostrarResultadoLogin('✅ ¡Inicio de sesión exitoso!', 'success');
    
    // Configurar UI para usuario autenticado
    configurarUIUsuarioAutenticado(user);
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    let mensajeError = '❌ Error en el inicio de sesión';
    
    switch (error.code) {
      case 'auth/user-not-found':
        mensajeError = '❌ Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        mensajeError = '❌ Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        mensajeError = '❌ Email inválido';
        break;
      case 'auth/too-many-requests':
        mensajeError = '❌ Demasiados intentos. Intenta más tarde';
        break;
    }
    
    mostrarResultadoLogin(mensajeError, 'error');
  }
}

function configurarUIUsuarioAutenticado(user) {
  console.log('👤 Configurando UI para usuario autenticado:', user.email);
  
  // Ocultar sección de login
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'none';
  }
  
  // Mostrar información del usuario
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.style.display = 'block';
    userInfo.innerHTML = `
      <div class="user-info">
        <p>👤 <strong>Usuario:</strong> ${user.email}</p>
        <button onclick="cerrarSesion()" class="btn-logout">🚪 Cerrar Sesión</button>
        <button onclick="irAlAdmin()" class="btn-admin">⚙️ Panel Admin</button>
      </div>
    `;
  }
  
  // Mostrar formulario del cotizador
  const cotizadorSection = document.getElementById('cotizador-section');
  if (cotizadorSection) {
    cotizadorSection.style.display = 'block';
  }
}

async function cerrarSesion() {
  try {
    console.log('🚪 Cerrando sesión...');
    
    // Importar dinámicamente las funciones de Firebase Auth
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    await signOut(window.auth);
    console.log('✅ Sesión cerrada exitosamente');
    
    configurarUIUsuarioNoAutenticado();
    
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    mostrarResultado('❌ Error al cerrar sesión', 'error');
  }
}

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
  
  // Ocultar formulario del cotizador
  const cotizadorSection = document.getElementById('cotizador-section');
  if (cotizadorSection) {
    cotizadorSection.style.display = 'none';
  }
}

function irAlAdmin() {
          window.router.navigate('/admin');
}

// ===== FUNCIONES DEL COTIZADOR =====

async function generarCodigo() {
  try {
    // Obtener la fecha actual
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    
    // Formato base: SUBEIA-YYYYMMDD-XXXX
    const fechaBase = `${año}${mes}${dia}`;
    
    // Buscar el último código del día en Firestore
    const { collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const cotizacionesRef = collection(window.db, 'cotizaciones');
    const q = query(
      cotizacionesRef,
      where('codigo', '>=', `SUBEIA-${fechaBase}-0000`),
      where('codigo', '<=', `SUBEIA-${fechaBase}-9999`),
      orderBy('codigo', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    let ultimoNumero = 0;
    
    if (!querySnapshot.empty) {
      const ultimoCodigo = querySnapshot.docs[0].data().codigo;
      const match = ultimoCodigo.match(/SUBEIA-\d{8}-(\d{4})/);
      if (match) {
        ultimoNumero = parseInt(match[1]);
      }
    }
    
    // Generar el siguiente número correlativo
    const siguienteNumero = ultimoNumero + 1;
    const numeroFormateado = String(siguienteNumero).padStart(4, '0');
    
    return `SUBEIA-${fechaBase}-${numeroFormateado}`;
  } catch (error) {
    console.error('❌ Error generando código:', error);
    // Fallback: usar timestamp si falla la consulta
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    
    return `SUBEIA-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }
}

function renderizarDetalles() {
  console.log('🔄 Renderizando detalles de servicios...');
  
  const serviciosSeleccionados = document.querySelectorAll('input[name="servicios"]:checked');
  const contenedor = document.getElementById('servicios-detalle');
  
  if (!contenedor) {
    console.error('❌ Contenedor de servicios no encontrado');
    return;
  }
  
  contenedor.innerHTML = '';
  
  serviciosSeleccionados.forEach((checkbox, index) => {
    const servicioDiv = document.createElement('div');
    servicioDiv.className = 'servicio-detalle';
    servicioDiv.innerHTML = `
      <h3>${checkbox.value}</h3>
      <div class="form-group">
        <label for="detalle_${index}">Detalle del servicio *</label>
        <textarea id="detalle_${index}" name="detalle_${index}" required placeholder="Describe el servicio específico..."></textarea>
      </div>
      
      <div class="form-group">
        <label for="modalidad_${index}">Modalidad *</label>
        <select id="modalidad_${index}" name="modalidad_${index}" required>
          <option value="">Selecciona...</option>
          <option value="Presencial">Presencial</option>
          <option value="Online">Online</option>
          <option value="Híbrido">Híbrido</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Tipo de cobro *</label>
        <div class="radio-group">
          <input type="radio" id="por_sesion_${index}" name="tipo_cobro_${index}" value="sesion" required>
          <label for="por_sesion_${index}">Por sesión</label>
          
          <input type="radio" id="por_alumno_${index}" name="tipo_cobro_${index}" value="alumno" required>
          <label for="por_alumno_${index}">Por alumno</label>
          
          <input type="radio" id="total_directo_${index}" name="tipo_cobro_${index}" value="directo" required>
          <label for="total_directo_${index}">Total directo</label>
        </div>
      </div>
      
      <div class="campo-cobro" id="campo_sesion_${index}">
        <div class="form-group">
          <label for="sesiones_${index}">Cantidad de sesiones *</label>
          <input type="number" id="sesiones_${index}" name="sesiones_${index}" min="1" required>
        </div>
        <div class="form-group">
          <label for="valor_sesion_${index}">Valor unitario por sesión *</label>
          <input type="number" id="valor_sesion_${index}" name="valor_sesion_${index}" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Subtotal:</label>
          <span id="subtotal_sesion_${index}">0</span>
        </div>
      </div>
      
      <div class="campo-cobro" id="campo_alumno_${index}">
        <div class="form-group">
          <label for="alumnos_${index}">Cantidad de alumnos *</label>
          <input type="number" id="alumnos_${index}" name="alumnos_${index}" min="1" required>
        </div>
        <div class="form-group">
          <label for="valor_alumno_${index}">Valor unitario por alumno *</label>
          <input type="number" id="valor_alumno_${index}" name="valor_alumno_${index}" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Subtotal:</label>
          <span id="subtotal_alumno_${index}">0</span>
        </div>
      </div>
      
      <div class="campo-cobro" id="campo_directo_${index}">
        <div class="form-group">
          <label for="total_directo_${index}">Total directo *</label>
          <input type="number" id="total_directo_${index}" name="total_directo_${index}" min="0" step="0.01" required>
        </div>
      </div>
    `;
    
    contenedor.appendChild(servicioDiv);
    
    // Configurar event listeners para los nuevos elementos
    addEventListenersToDetails(servicioDiv, index);
  });
  
  console.log(`✅ Renderizados ${serviciosSeleccionados.length} servicios`);
}

function addEventListenersToDetails(servicioDiv, index) {
  // Event listeners para radio buttons de tipo de cobro
  const radioButtons = servicioDiv.querySelectorAll(`input[name="tipo_cobro_${index}"]`);
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      // Ocultar todos los campos de cobro
      const camposCobro = servicioDiv.querySelectorAll('.campo-cobro');
      camposCobro.forEach(campo => {
        campo.classList.remove('active');
        // Remover required de todos los campos ocultos
        const inputs = campo.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.removeAttribute('required'));
      });
      
      // Mostrar el campo correspondiente
      if (radio.value === 'sesion') {
        const campo = servicioDiv.querySelector(`#campo_sesion_${index}`);
        if (campo) {
          campo.classList.add('active');
          // Agregar required a los campos visibles
          const inputs = campo.querySelectorAll('input, select, textarea');
          inputs.forEach(input => input.setAttribute('required', 'required'));
        }
      } else if (radio.value === 'alumno') {
        const campo = servicioDiv.querySelector(`#campo_alumno_${index}`);
        if (campo) {
          campo.classList.add('active');
          // Agregar required a los campos visibles
          const inputs = campo.querySelectorAll('input, select, textarea');
          inputs.forEach(input => input.setAttribute('required', 'required'));
        }
      } else if (radio.value === 'directo') {
        const campo = servicioDiv.querySelector(`#campo_directo_${index}`);
        if (campo) {
          campo.classList.add('active');
          // Agregar required a los campos visibles
          const inputs = campo.querySelectorAll('input, select, textarea');
          inputs.forEach(input => input.setAttribute('required', 'required'));
        }
      }
    });
  });
  
  // Event listeners para cálculos automáticos
  const inputsCalculo = servicioDiv.querySelectorAll('input[type="number"]');
  inputsCalculo.forEach(input => {
    input.addEventListener('input', () => calcularSubtotal(index));
  });
}

function calcularSubtotal(index) {
  // Calcular subtotal por sesión
  const sesiones = document.getElementById(`sesiones_${index}`);
  const valorSesion = document.getElementById(`valor_sesion_${index}`);
  const subtotalSesion = document.getElementById(`subtotal_sesion_${index}`);
  
  if (sesiones && valorSesion && subtotalSesion) {
    const cantidad = parseInt(sesiones.value) || 0;
    const valor = parseFloat(valorSesion.value) || 0;
    const subtotal = cantidad * valor;
    subtotalSesion.textContent = subtotal.toLocaleString('es-CL');
  }
  
  // Calcular subtotal por alumno
  const alumnos = document.getElementById(`alumnos_${index}`);
  const valorAlumno = document.getElementById(`valor_alumno_${index}`);
  const subtotalAlumno = document.getElementById(`subtotal_alumno_${index}`);
  
  if (alumnos && valorAlumno && subtotalAlumno) {
    const cantidad = parseInt(alumnos.value) || 0;
    const valor = parseFloat(valorAlumno.value) || 0;
    const subtotal = cantidad * valor;
    subtotalAlumno.textContent = subtotal.toLocaleString('es-CL');
  }
}

// ===== FUNCIONES DE PDF Y FIRESTORE =====

async function generarPDF(datos) {
  console.log('📄 Generando PDF...');
  
  try {
    // Importar la plantilla dinámicamente
    console.log('📄 Importando plantilla...');
    const { renderInvoice } = await import('../templates/invoice-template.js');
    console.log('✅ Plantilla importada correctamente');
    
    // Preparar datos para la plantilla
    const datosPlantilla = {
      nombre: datos.nombre,
      email: datos.email,
      rut: datos.rut,
      empresa: datos.empresa,
      moneda: 'CLP',
      codigo: datos.codigo,
      fecha: datos.fecha,
      serviciosData: datos.servicios,
      total: datos.total,
      atendedor: datos.atendido,
      notasAdicionales: datos.notas,
      descuento: datos.descuento
    };
    
    console.log('📄 Generando HTML con plantilla...');
    const html = renderInvoice(datosPlantilla);
    console.log('✅ HTML de factura generado');
    
    // Crear elemento temporal con estilos
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .pdf-header { text-align: center; margin-bottom: 30px; }
        .pdf-body { margin: 20px 0; }
        .tabla-servicios { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .tabla-servicios th, .tabla-servicios td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .tabla-servicios th { background-color: #f2f2f2; }
        .total-row { text-align: right; font-size: 1.2em; margin: 10px 0; }
        .gradient { border: none; height: 2px; background: linear-gradient(90deg, #00B8D9, #FF4EFF); }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
      ${html}
    `;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Configuración de html2pdf
    const opt = {
      margin: 1,
      filename: `cotizacion-${datos.codigo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Generar PDF
    html2pdf().from(tempDiv).set(opt).save().then(() => {
      console.log('✅ PDF generado exitosamente');
      document.body.removeChild(tempDiv);
    }).catch(error => {
      console.error('❌ Error al generar PDF:', error);
      document.body.removeChild(tempDiv);
      throw error;
    });
    
  } catch (error) {
    console.error('❌ Error en generarPDF:', error);
    mostrarResultado(`❌ Error al generar PDF: ${error.message}`, 'error');
  }
}

async function guardarEnFirestore(datos) {
  console.log('💾 Guardando en Firestore...');
  
  try {
    // Importar dinámicamente las funciones de Firestore
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const docRef = doc(window.db, 'cotizaciones', datos.codigo);
    await setDoc(docRef, {
      ...datos,
      fechaCreacion: new Date(),
      fechaTimestamp: new Date()
    });
    
    console.log('✅ Datos guardados en Firestore exitosamente');
    
  } catch (error) {
    console.error('❌ Error al guardar en Firestore:', error);
    throw new Error(`Error al guardar en base de datos: ${error.message}`);
  }
}

async function recopilarDatosFormulario() {
  console.log('📝 Iniciando recopilación de datos del formulario...');
  
  try {
    // Datos básicos del cliente
    const datos = {
      codigo: await generarCodigo(),
      fecha: new Date().toLocaleDateString('es-CL'),
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email-cliente').value,
      rut: document.getElementById('rut').value,
      empresa: document.getElementById('empresa').value,
      atendido: document.getElementById('atendedor').value,
      descuento: parseFloat(document.getElementById('descuento').value) || 0,
      notas: document.getElementById('notas').value,
      servicios: []
    };
    
    console.log('📋 Datos básicos:', {
      codigo: datos.codigo,
      nombre: datos.nombre,
      email: datos.email,
      atendido: datos.atendido
    });
    
    // Recopilar servicios seleccionados
    const serviciosSeleccionados = document.querySelectorAll('input[name="servicios"]:checked');
    console.log(`🔍 Servicios seleccionados: ${serviciosSeleccionados.length}`);
    
    serviciosSeleccionados.forEach((checkbox, index) => {
      const servicio = {
        nombre: checkbox.value,
        detalle: document.getElementById(`detalle_${index}`).value,
        modalidad: document.getElementById(`modalidad_${index}`).value,
        tipoCobro: document.querySelector(`input[name="tipo_cobro_${index}"]:checked`).value
      };
      
      // Agregar datos específicos según el tipo de cobro
      if (servicio.tipoCobro === 'sesion') {
        servicio.cantidad = parseInt(document.getElementById(`sesiones_${index}`).value) || 0;
        servicio.valorUnitario = parseFloat(document.getElementById(`valor_sesion_${index}`).value) || 0;
        servicio.subtotal = servicio.cantidad * servicio.valorUnitario;
      } else if (servicio.tipoCobro === 'alumno') {
        servicio.cantidad = parseInt(document.getElementById(`alumnos_${index}`).value) || 0;
        servicio.valorUnitario = parseFloat(document.getElementById(`valor_alumno_${index}`).value) || 0;
        servicio.subtotal = servicio.cantidad * servicio.valorUnitario;
      } else if (servicio.tipoCobro === 'directo') {
        servicio.subtotal = parseFloat(document.getElementById(`total_directo_${index}`).value) || 0;
      }
      
      datos.servicios.push(servicio);
      
      console.log(`📦 Procesando servicio ${index + 1}: ${servicio.nombre}`);
      console.log(` Datos del servicio:`, servicio);
      console.log(`💰 Cálculos del servicio:`, {
        cantidad: servicio.cantidad,
        valorUnitario: servicio.valorUnitario,
        subtotal: servicio.subtotal
      });
    });
    
    // Calcular totales
    const subtotal = datos.servicios.reduce((sum, servicio) => sum + servicio.subtotal, 0);
    const descuento = (subtotal * datos.descuento) / 100;
    const total = subtotal - descuento;
    
    datos.subtotal = subtotal;
    datos.total = total;
    
    console.log(` Totales calculados:`, {
      subtotal: subtotal,
      descuento: datos.descuento,
      total: total
    });
    
    console.log('✅ Datos del formulario recopilados exitosamente:', datos);
    return datos;
    
  } catch (error) {
    console.error('❌ Error al recopilar datos:', error);
    throw new Error(`Error al recopilar datos del formulario: ${error.message}`);
  }
}

// Función principal para guardar y generar cotización
async function guardarYGenerarCotizacion(event) {
  // No necesitamos preventDefault() para eventos click
  console.log('🚀 Iniciando proceso de guardado y generación de PDF...');
  console.log('🔍 Evento recibido:', event ? event.type : 'No event');
  console.log('🔍 Elemento que disparó el evento:', event ? event.target : 'No target');
  console.log('🔍 Evento completo:', event);
  
  // Verificar que la función se está ejecutando
  console.log('✅ Función guardarYGenerarCotizacion ejecutándose correctamente');

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
    const datos = await recopilarDatosFormulario();
    console.log('✅ Datos recopilados:', datos);

    // Guardar en Firestore
    console.log('💾 Guardando en Firestore...');
    await guardarEnFirestore(datos);
    console.log('✅ Datos guardados exitosamente en Firestore');

    mostrarResultado(`✅ Cotización ${datos.codigo} guardada exitosamente!`, 'success');

    // Guardar datos temporalmente para la previsualización
    console.log('💾 Guardando datos para previsualización...');
    sessionStorage.setItem('cotizacion_temp', JSON.stringify(datos));
    
    // Redirigir a la página de previsualización
    console.log('🔄 Redirigiendo a previsualización...');
    setTimeout(() => {
              window.router.navigate(`/preview?id=${datos.codigo}`);
    }, 1500);

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

  // Event listener para el botón de generar PDF - VERSIÓN ROBUSTA
  function configurarBotonPDF() {
    const btnGenerarPDF = document.getElementById('descargar-pdf');
    console.log('🔍 Buscando botón generar PDF...');
    console.log('🔍 Botón encontrado:', btnGenerarPDF);
    console.log('🔍 Todos los botones en la página:', document.querySelectorAll('button'));
    console.log('🔍 Todos los elementos con ID:', document.querySelectorAll('[id]'));
    
    if (btnGenerarPDF) {
      // Remover event listeners existentes para evitar duplicados
      const nuevoBoton = btnGenerarPDF.cloneNode(true);
      btnGenerarPDF.parentNode.replaceChild(nuevoBoton, btnGenerarPDF);
      
      console.log('🔍 Configurando event listener en botón limpio...');
      nuevoBoton.addEventListener('click', (event) => {
        console.log('🎯 CLICK DETECTADO en botón generar PDF!');
        console.log('🎯 Evento:', event);
        event.preventDefault();
        event.stopPropagation();
        guardarYGenerarCotizacion(event);
      });
      
      // También agregar como función global para testing
      window.testBotonPDF = () => {
        console.log('🧪 Test manual del botón PDF');
        guardarYGenerarCotizacion({ type: 'test', target: nuevoBoton });
      };
      
      console.log('✅ Event listener del botón generar PDF configurado');
      console.log('🔍 Botón ID:', nuevoBoton.id);
      console.log('🔍 Botón texto:', nuevoBoton.textContent);
      console.log('🔍 Botón type:', nuevoBoton.type);
      console.log('🔍 Botón disabled:', nuevoBoton.disabled);
      
      return nuevoBoton;
    } else {
      console.error('❌ Botón generar PDF no encontrado');
      console.log('🔍 Elementos con ID que contienen "pdf":', document.querySelectorAll('[id*="pdf"]'));
      return null;
    }
  }
  
  // Configurar botón inmediatamente
  const botonPDF = configurarBotonPDF();
  
  // También configurar después de un pequeño delay por si acaso
  setTimeout(() => {
    if (!botonPDF) {
      console.log('🔄 Reintentando configuración del botón PDF...');
      configurarBotonPDF();
    }
  }, 100);

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