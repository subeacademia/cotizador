// Componente de Navegación para el sistema de ruteo
if (typeof window.Navigation === 'undefined') {
  class Navigation {
  constructor() {
    this.navItems = [
      { path: '/', label: '🏠 Inicio', icon: 'home' },
      { path: '/login', label: '🔐 Login', icon: 'login' },
      { path: '/admin', label: '⚙️ Admin', icon: 'admin' },
      { path: '/contratos', label: '📄 Contratos', icon: 'contracts' },
      { path: '/preview-contrato', label: '👁️ Preview', icon: 'preview' },
      { path: '/enviar-firma', label: '✍️ Enviar Firma', icon: 'send' },
      { path: '/firmar-contrato', label: '✋ Firmar', icon: 'sign' },
      { path: '/firmar-contrato-cliente', label: '👤 Firmar Cliente', icon: 'client' }
    ];
    
    this.init();
  }

  init() {
    // Escuchar cambios de ruta
    document.addEventListener('routeChange', (e) => {
      this.updateActiveNav(e.detail.path);
    });

    // Crear navegación si no existe y no estamos en login
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      this.createNavigation();
    }
  }

  createNavigation() {
    // Verificar si ya existe navegación
    if (document.getElementById('main-navigation')) {
      return;
    }

    const nav = document.createElement('nav');
    nav.id = 'main-navigation';
    nav.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <img src="assets/logo-blanco.png" alt="SUBE IA" class="nav-logo">
          <span class="nav-title">Cotizador</span>
        </div>
        <ul class="nav-menu">
          ${this.navItems.map(item => `
            <li class="nav-item">
              <a href="${item.path}" class="nav-link" data-path="${item.path}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
        <div class="nav-toggle" id="nav-toggle">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    // Insertar al inicio del body
    document.body.insertBefore(nav, document.body.firstChild);

    // Agregar estilos
    this.addStyles();

    // Configurar toggle para móviles
    this.setupMobileToggle();
  }

  addStyles() {
    const styles = `
      <style>
        #main-navigation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          padding: 0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-weight: bold;
          font-size: 1.2em;
        }

        .nav-logo {
          height: 40px;
          width: auto;
        }

        .nav-menu {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 5px;
        }

        .nav-item {
          margin: 0;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          padding: 15px 20px;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .nav-link:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }

        .nav-link.active {
          background: rgba(255,255,255,0.2);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .nav-icon {
          font-size: 1.2em;
        }

        .nav-toggle {
          display: none;
          flex-direction: column;
          cursor: pointer;
          gap: 4px;
        }

        .nav-toggle span {
          width: 25px;
          height: 3px;
          background: white;
          border-radius: 2px;
          transition: 0.3s;
        }

        /* Ajustar contenido principal */
        body {
          padding-top: 80px !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-menu {
            position: fixed;
            top: 80px;
            left: -100%;
            width: 100%;
            height: calc(100vh - 80px);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            flex-direction: column;
            transition: 0.3s;
            padding: 20px;
          }

          .nav-menu.active {
            left: 0;
          }

          .nav-toggle {
            display: flex;
          }

          .nav-link {
            padding: 20px;
            font-size: 1.1em;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  setupMobileToggle() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.classList.toggle('active');
      });

      // Cerrar menú al hacer click en un enlace
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.remove('active');
          toggle.classList.remove('active');
        });
      });
    }
  }

  updateActiveNav(path) {
    // Remover clase active de todos los enlaces
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Agregar clase active al enlace actual
    const activeLink = document.querySelector(`[data-path="${path}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  // Métodos de utilidad
  show() {
    const nav = document.getElementById('main-navigation');
    if (nav) nav.style.display = 'block';
  }

  hide() {
    const nav = document.getElementById('main-navigation');
    if (nav) nav.style.display = 'none';
  }

  toggle() {
    const nav = document.getElementById('main-navigation');
    if (nav) {
      nav.style.display = nav.style.display === 'none' ? 'block' : 'none';
    }
  }
}

}

// Inicializar navegación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (!window.navigation) {
    window.navigation = new Navigation();
  }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
} 