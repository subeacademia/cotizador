// Configuración centralizada de rutas para la aplicación

const ROUTES_CONFIG = {
  // Rutas principales
  HOME: {
    path: '/',
    title: 'Cotizador',
    file: 'index.html',
    icon: '🏠',
    description: 'Página principal del cotizador',
    requiresAuth: false,
    showInNav: true
  },
  
  LOGIN: {
    path: '/login',
    title: 'Login',
    file: 'login.html',
    icon: '🔐',
    description: 'Página de autenticación',
    requiresAuth: false,
    showInNav: true
  },
  
  ADMIN: {
    path: '/admin',
    title: 'Admin',
    file: 'admin.html',
    icon: '⚙️',
    description: 'Panel de administración',
    requiresAuth: true,
    showInNav: true
  },
  
  CONTRATOS: {
    path: '/contratos',
    title: 'Contratos',
    file: 'contratos.html',
    icon: '📄',
    description: 'Gestión de contratos',
    requiresAuth: true,
    showInNav: true
  },
  
  PREVIEW_CONTRATO: {
    path: '/preview-contrato',
    title: 'Preview Contrato',
    file: 'preview-contrato.html',
    icon: '👁️',
    description: 'Vista previa de contratos',
    requiresAuth: true,
    showInNav: true
  },
  
  ENVIAR_FIRMA: {
    path: '/enviar-firma',
    title: 'Enviar Firma',
    file: 'enviar-firma.html',
    icon: '✍️',
    description: 'Envío de documentos para firma',
    requiresAuth: true,
    showInNav: true
  },
  
  FIRMAR_CONTRATO: {
    path: '/firmar-contrato',
    title: 'Firmar Contrato',
    file: 'firmar-contrato.html',
    icon: '✋',
    description: 'Firma de contratos',
    requiresAuth: true,
    showInNav: true
  },
  
  FIRMAR_CONTRATO_CLIENTE: {
    path: '/firmar-contrato-cliente',
    title: 'Firmar Contrato Cliente',
    file: 'firmar-contrato-cliente.html',
    icon: '👤',
    description: 'Firma por parte del cliente',
    requiresAuth: false,
    showInNav: true
  },
  
  PREVIEW: {
    path: '/preview',
    title: 'Preview',
    file: 'preview.html',
    icon: '👁️',
    description: 'Vista previa general',
    requiresAuth: false,
    showInNav: true
  }
};

// Clase para gestionar la configuración de rutas
class RoutesManager {
  constructor() {
    this.routes = ROUTES_CONFIG;
  }

  // Obtener todas las rutas
  getAllRoutes() {
    return this.routes;
  }

  // Obtener rutas que se muestran en la navegación
  getNavRoutes() {
    return Object.values(this.routes).filter(route => route.showInNav);
  }

  // Obtener rutas que requieren autenticación
  getProtectedRoutes() {
    return Object.values(this.routes).filter(route => route.requiresAuth);
  }

  // Obtener rutas públicas
  getPublicRoutes() {
    return Object.values(this.routes).filter(route => !route.requiresAuth);
  }

  // Obtener una ruta específica por path
  getRouteByPath(path) {
    return Object.values(this.routes).find(route => route.path === path);
  }

  // Verificar si una ruta requiere autenticación
  isRouteProtected(path) {
    const route = this.getRouteByPath(path);
    return route ? route.requiresAuth : false;
  }

  // Obtener rutas para el servidor (formato simple)
  getServerRoutes() {
    const serverRoutes = {};
    Object.values(this.routes).forEach(route => {
      serverRoutes[route.path] = route.file;
    });
    return serverRoutes;
  }

  // Obtener rutas para el cliente (formato con metadatos)
  getClientRoutes() {
    const clientRoutes = {};
    Object.values(this.routes).forEach(route => {
      clientRoutes[route.path] = {
        title: route.title,
        file: route.file
      };
    });
    return clientRoutes;
  }

  // Obtener items de navegación
  getNavItems() {
    return this.getNavRoutes().map(route => ({
      path: route.path,
      label: `${route.icon} ${route.title}`,
      icon: route.icon
    }));
  }

  // Agregar una nueva ruta
  addRoute(key, routeConfig) {
    this.routes[key] = {
      ...routeConfig,
      showInNav: routeConfig.showInNav ?? true,
      requiresAuth: routeConfig.requiresAuth ?? false
    };
  }

  // Remover una ruta
  removeRoute(key) {
    if (this.routes[key]) {
      delete this.routes[key];
    }
  }

  // Validar configuración de rutas
  validateRoutes() {
    const errors = [];
    
    Object.entries(this.routes).forEach(([key, route]) => {
      // Verificar campos requeridos
      if (!route.path) {
        errors.push(`Ruta ${key}: falta el campo 'path'`);
      }
      if (!route.title) {
        errors.push(`Ruta ${key}: falta el campo 'title'`);
      }
      if (!route.file) {
        errors.push(`Ruta ${key}: falta el campo 'file'`);
      }
      
      // Verificar que el archivo existe (simulación)
      // En un entorno real, podrías verificar si el archivo existe
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generar documentación de rutas
  generateRoutesDocumentation() {
    const doc = {
      totalRoutes: Object.keys(this.routes).length,
      publicRoutes: this.getPublicRoutes().length,
      protectedRoutes: this.getProtectedRoutes().length,
      navRoutes: this.getNavRoutes().length,
      routes: {}
    };

    Object.entries(this.routes).forEach(([key, route]) => {
      doc.routes[key] = {
        path: route.path,
        title: route.title,
        file: route.file,
        icon: route.icon,
        description: route.description,
        requiresAuth: route.requiresAuth,
        showInNav: route.showInNav
      };
    });

    return doc;
  }
}

// Instancia global del gestor de rutas
const routesManager = new RoutesManager();

// Funciones de utilidad para exportar
const RoutesUtils = {
  // Obtener la instancia del gestor
  getManager: () => routesManager,
  
  // Funciones de conveniencia
  getAllRoutes: () => routesManager.getAllRoutes(),
  getNavRoutes: () => routesManager.getNavRoutes(),
  getProtectedRoutes: () => routesManager.getProtectedRoutes(),
  getPublicRoutes: () => routesManager.getPublicRoutes(),
  getRouteByPath: (path) => routesManager.getRouteByPath(path),
  isRouteProtected: (path) => routesManager.isRouteProtected(path),
  getServerRoutes: () => routesManager.getServerRoutes(),
  getClientRoutes: () => routesManager.getClientRoutes(),
  getNavItems: () => routesManager.getNavItems(),
  
  // Validación
  validateRoutes: () => routesManager.validateRoutes(),
  
  // Documentación
  generateDocs: () => routesManager.generateRoutesDocumentation(),
  
  // Ejemplos de uso
  examples: {
    // Agregar una nueva ruta
    addNewRoute: () => {
      routesManager.addRoute('NUEVA_PAGINA', {
        path: '/nueva-pagina',
        title: 'Nueva Página',
        file: 'nueva-pagina.html',
        icon: '🆕',
        description: 'Una nueva página de ejemplo',
        requiresAuth: false,
        showInNav: true
      });
    },
    
    // Verificar si una ruta está protegida
    checkIfProtected: (path) => {
      const isProtected = routesManager.isRouteProtected(path);
      console.log(`La ruta ${path} ${isProtected ? 'requiere' : 'no requiere'} autenticación`);
      return isProtected;
    },
    
    // Obtener información de una ruta
    getRouteInfo: (path) => {
      const route = routesManager.getRouteByPath(path);
      if (route) {
        console.log('Información de la ruta:', route);
        return route;
      } else {
        console.log('Ruta no encontrada:', path);
        return null;
      }
    }
  }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ROUTES_CONFIG,
    RoutesManager,
    RoutesUtils
  };
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.RoutesConfig = ROUTES_CONFIG;
  window.RoutesManager = RoutesManager;
  window.RoutesUtils = RoutesUtils;
} 