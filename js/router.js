// Sistema de Ruteo Angular-like para el lado del cliente
if (typeof window.Router === 'undefined') {
  class Router {
  constructor() {
    this.routes = {
      '/': { title: 'Cotizador', file: 'index.html' },
      '/login': { title: 'Login', file: 'login.html' },
      '/admin': { title: 'Admin', file: 'admin.html' },
      '/contratos': { title: 'Contratos', file: 'contratos.html' },
      '/preview-contrato': { title: 'Preview Contrato', file: 'preview-contrato.html' },
      '/enviar-firma': { title: 'Enviar Firma', file: 'enviar-firma.html' },
      '/firmar-contrato': { title: 'Firmar Contrato', file: 'firmar-contrato.html' },
      '/firmar-contrato-cliente': { title: 'Firmar Contrato Cliente', file: 'firmar-contrato-cliente.html' },
      '/preview': { title: 'Preview', file: 'preview.html' }
    };
    
    this.currentRoute = '/';
    this.init();
  }

  init() {
    // Interceptar clicks en enlaces
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href.includes(window.location.origin)) {
        e.preventDefault();
        const path = new URL(e.target.href).pathname;
        this.navigate(path);
      }
    });

    // Manejar navegación del navegador (back/forward)
    window.addEventListener('popstate', (e) => {
      this.loadRoute(window.location.pathname);
    });

    // Cargar ruta inicial solo si no estamos en login
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      this.loadRoute(currentPath);
    }
  }

  async navigate(path) {
    if (this.routes[path]) {
      // Actualizar URL sin recargar
      window.history.pushState({}, '', path);
      await this.loadRoute(path);
    } else {
      console.warn(`Ruta no encontrada: ${path}`);
      this.navigate('/');
    }
  }

  async loadRoute(path) {
    try {
      const route = this.routes[path] || this.routes['/'];
      this.currentRoute = path;

      // Mostrar loading
      this.showLoading();

      // Cargar contenido
      const response = await fetch(route.file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();

      // Extraer solo el contenido del body
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const bodyContent = doc.body.innerHTML;

      // Actualizar contenido
      document.body.innerHTML = bodyContent;

      // Actualizar título
      document.title = `Cotizador - ${route.title}`;

      // Ejecutar scripts del contenido cargado
      this.executeScripts(doc);

      // Ocultar loading
      this.hideLoading();

      // Disparar evento de ruta cambiada
      this.dispatchRouteChangeEvent(path);

    } catch (error) {
      console.error('Error cargando ruta:', error);
      this.hideLoading();
      
      // Si hay error, redirigir a la página principal
      if (path !== '/') {
        console.log('Redirigiendo a página principal debido a error...');
        window.location.href = '/';
      }
    }
  }

  executeScripts(doc) {
    // Ejecutar scripts inline
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        // Script externo
        const newScript = document.createElement('script');
        newScript.src = script.src;
        document.head.appendChild(newScript);
      } else {
        // Script inline
        eval(script.innerHTML);
      }
    });
  }

  showLoading() {
    // Crear overlay de loading si no existe
    if (!document.getElementById('router-loading')) {
      const loading = document.createElement('div');
      loading.id = 'router-loading';
      loading.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        ">
          <div style="
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #00B8D9;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loading);
    }
  }

  hideLoading() {
    const loading = document.getElementById('router-loading');
    if (loading) {
      loading.remove();
    }
  }

  dispatchRouteChangeEvent(path) {
    const event = new CustomEvent('routeChange', {
      detail: { path, route: this.routes[path] }
    });
    document.dispatchEvent(event);
  }

  // Métodos de utilidad
  getCurrentRoute() {
    return this.currentRoute;
  }

  getRoutes() {
    return this.routes;
  }

  // Navegación programática
  goTo(path) {
    this.navigate(path);
  }

  goBack() {
    window.history.back();
  }

  goForward() {
    window.history.forward();
  }
}

}

// Inicializar router cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (!window.router) {
    window.router = new Router();
  }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
} 