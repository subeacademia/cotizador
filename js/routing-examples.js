// Ejemplos de uso del Sistema de Ruteo Angular-like

// ========================================
// 1. NAVEGACIÓN PROGRAMÁTICA
// ========================================

// Navegar a una página específica
function irAAdmin() {
  window.router.navigate('/admin');
}

function irAContratos() {
  window.router.goTo('/contratos'); // Método abreviado
}

// Navegación del navegador
function volverAtras() {
  window.router.goBack();
}

function irAdelante() {
  window.router.goForward();
}

// ========================================
// 2. ESCUCHAR CAMBIOS DE RUTA
// ========================================

// Escuchar cuando cambia la ruta
document.addEventListener('routeChange', (e) => {
  console.log('🔄 Ruta cambiada a:', e.detail.path);
  console.log('📄 Archivo cargado:', e.detail.route.file);
  console.log('📝 Título:', e.detail.route.title);
  
  // Ejecutar código específico según la ruta
  switch(e.detail.path) {
    case '/admin':
      console.log('🔧 Entrando al panel de administración');
      // Aquí puedes inicializar componentes específicos del admin
      break;
      
    case '/contratos':
      console.log('📄 Entrando a gestión de contratos');
      // Aquí puedes cargar datos de contratos
      break;
      
    case '/login':
      console.log('🔐 Entrando al login');
      // Aquí puedes verificar si ya está autenticado
      break;
  }
});

// ========================================
// 3. OBTENER INFORMACIÓN DE RUTAS
// ========================================

// Obtener ruta actual
function obtenerRutaActual() {
  const rutaActual = window.router.getCurrentRoute();
  console.log('📍 Ruta actual:', rutaActual);
  return rutaActual;
}

// Obtener todas las rutas disponibles
function obtenerTodasLasRutas() {
  const rutas = window.router.getRoutes();
  console.log('🗺️ Todas las rutas:', rutas);
  return rutas;
}

// Verificar si estamos en una ruta específica
function estamosEnRuta(ruta) {
  const rutaActual = window.router.getCurrentRoute();
  return rutaActual === ruta;
}

// ========================================
// 4. EJEMPLOS DE USO EN BOTONES
// ========================================

// Ejemplo: Botón que navega al admin
function crearBotonAdmin() {
  const boton = document.createElement('button');
  boton.textContent = '⚙️ Ir al Admin';
  boton.onclick = () => window.router.navigate('/admin');
  return boton;
}

// Ejemplo: Botón que navega a contratos
function crearBotonContratos() {
  const boton = document.createElement('button');
  boton.textContent = '📄 Ver Contratos';
  boton.onclick = () => window.router.goTo('/contratos');
  return boton;
}

// ========================================
// 5. EJEMPLOS DE USO EN FORMULARIOS
// ========================================

// Ejemplo: Redirigir después de login exitoso
function loginExitoso() {
  // Simular login exitoso
  console.log('✅ Login exitoso');
  
  // Redirigir al admin después de 1 segundo
  setTimeout(() => {
    window.router.navigate('/admin');
  }, 1000);
}

// Ejemplo: Redirigir después de crear contrato
function contratoCreado() {
  console.log('📄 Contrato creado exitosamente');
  
  // Redirigir a la vista previa del contrato
  window.router.navigate('/preview-contrato');
}

// ========================================
// 6. EJEMPLOS DE USO CON PARÁMETROS
// ========================================

// Navegar con parámetros en la URL
function navegarConParametros(ruta, parametros) {
  const url = new URL(ruta, window.location.origin);
  
  // Agregar parámetros
  Object.keys(parametros).forEach(key => {
    url.searchParams.set(key, parametros[key]);
  });
  
  // Navegar a la URL completa
  window.router.navigate(url.pathname + url.search);
}

// Ejemplo de uso:
// navegarConParametros('/contratos', { id: '123', accion: 'editar' });

// ========================================
// 7. EJEMPLOS DE USO CON GUARDS
// ========================================

// Verificar autenticación antes de navegar
function navegarConAutenticacion(ruta) {
  // Verificar si está autenticado (ejemplo)
  const estaAutenticado = localStorage.getItem('usuario');
  
  if (estaAutenticado) {
    window.router.navigate(ruta);
  } else {
    console.log('❌ Debes estar autenticado para acceder a:', ruta);
    window.router.navigate('/login');
  }
}

// Ejemplo de uso:
// navegarConAutenticacion('/admin');

// ========================================
// 8. EJEMPLOS DE USO CON LOADING
// ========================================

// Mostrar loading personalizado
function navegarConLoading(ruta, mensaje = 'Cargando...') {
  // Crear loading personalizado
  const loading = document.createElement('div');
  loading.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-size: 18px;
    ">
      <div>
        <div style="margin-bottom: 10px;">${mensaje}</div>
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #00B8D9;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(loading);
  
  // Navegar después de un delay (simular carga)
  setTimeout(() => {
    window.router.navigate(ruta);
    loading.remove();
  }, 1000);
}

// ========================================
// 9. FUNCIONES DE UTILIDAD
// ========================================

// Función para agregar botones de navegación a cualquier página
function agregarBotonesNavegacion() {
  const contenedor = document.createElement('div');
  contenedor.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
  `;
  
  const rutas = [
    { path: '/', label: '🏠 Inicio' },
    { path: '/admin', label: '⚙️ Admin' },
    { path: '/contratos', label: '📄 Contratos' },
    { path: '/login', label: '🔐 Login' }
  ];
  
  rutas.forEach(ruta => {
    const boton = document.createElement('button');
    boton.textContent = ruta.label;
    boton.style.cssText = `
      padding: 10px 15px;
      background: linear-gradient(135deg, #00B8D9, #FF4EFF);
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    `;
    boton.onclick = () => window.router.navigate(ruta.path);
    contenedor.appendChild(boton);
  });
  
  document.body.appendChild(contenedor);
}

// Función para mostrar información de la ruta actual
function mostrarInfoRuta() {
  const rutaActual = window.router.getCurrentRoute();
  const rutas = window.router.getRoutes();
  const infoRuta = rutas[rutaActual];
  
  console.log('📍 Información de la ruta actual:');
  console.log('   Ruta:', rutaActual);
  console.log('   Título:', infoRuta?.title);
  console.log('   Archivo:', infoRuta?.file);
}

// ========================================
// 10. INICIALIZACIÓN AUTOMÁTICA
// ========================================

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Sistema de ruteo inicializado');
  
  // Mostrar información inicial
  mostrarInfoRuta();
  
  // Agregar botones de navegación (opcional)
  // agregarBotonesNavegacion();
  
  // Ejemplo: Escuchar clicks en enlaces con clase específica
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link-custom')) {
      e.preventDefault();
      const ruta = e.target.getAttribute('data-route');
      if (ruta) {
        window.router.navigate(ruta);
      }
    }
  });
});

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    irAAdmin,
    irAContratos,
    volverAtras,
    irAdelante,
    obtenerRutaActual,
    obtenerTodasLasRutas,
    estamosEnRuta,
    navegarConParametros,
    navegarConAutenticacion,
    navegarConLoading,
    agregarBotonesNavegacion,
    mostrarInfoRuta
  };
} 