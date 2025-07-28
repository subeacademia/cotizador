# Sistema de Ruteo Angular-like para Cotizador

## 🚀 Descripción

Este sistema implementa un ruteo similar a Angular para tu aplicación de cotización, permitiendo navegación fluida entre páginas sin recargas completas del navegador.

## 📋 Características

- ✅ **Ruteo del lado del servidor** con Node.js/Express
- ✅ **Ruteo del lado del cliente** con JavaScript vanilla
- ✅ **Navegación SPA** (Single Page Application)
- ✅ **Barra de navegación** responsive y moderna
- ✅ **Indicador de carga** durante transiciones
- ✅ **Soporte para botones atrás/adelante** del navegador
- ✅ **Diseño responsive** para móviles y desktop

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar el servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

### 3. Acceder a la aplicación

Abre tu navegador y ve a: `http://localhost:3000`

## 📁 Estructura de Archivos

```
cotizador/
├── server.js              # Servidor principal con Express
├── package.json           # Dependencias y scripts
├── js/
│   ├── router.js          # Sistema de ruteo del cliente
│   └── navigation.js      # Componente de navegación
├── index.html             # Página principal
├── login.html             # Página de login
├── admin.html             # Panel de administración
├── contratos.html         # Gestión de contratos
└── ... (otras páginas)
```

## 🗺️ Rutas Disponibles

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | index.html | Página principal del cotizador |
| `/login` | login.html | Página de autenticación |
| `/admin` | admin.html | Panel de administración |
| `/contratos` | contratos.html | Gestión de contratos |
| `/preview-contrato` | preview-contrato.html | Vista previa de contratos |
| `/enviar-firma` | enviar-firma.html | Envío de documentos para firma |
| `/firmar-contrato` | firmar-contrato.html | Firma de contratos |
| `/firmar-contrato-cliente` | firmar-contrato-cliente.html | Firma por parte del cliente |
| `/preview` | preview.html | Vista previa general |

## 🔧 Uso del Sistema de Ruteo

### Navegación Programática

```javascript
// Navegar a una ruta específica
window.router.navigate('/admin');

// O usar el método abreviado
window.router.goTo('/contratos');

// Navegación del navegador
window.router.goBack();
window.router.goForward();
```

### Escuchar Cambios de Ruta

```javascript
// Escuchar cuando cambia la ruta
document.addEventListener('routeChange', (e) => {
  console.log('Nueva ruta:', e.detail.path);
  console.log('Información de la ruta:', e.detail.route);
});
```

### Obtener Información de Rutas

```javascript
// Obtener ruta actual
const currentRoute = window.router.getCurrentRoute();

// Obtener todas las rutas disponibles
const allRoutes = window.router.getRoutes();
```

## 🎨 Personalización

### Agregar Nuevas Rutas

1. **En el servidor** (`server.js`):
```javascript
const routes = {
  '/': 'index.html',
  '/nueva-pagina': 'nueva-pagina.html',  // ← Agregar aquí
  // ... otras rutas
};
```

2. **En el cliente** (`js/router.js`):
```javascript
this.routes = {
  '/': { title: 'Cotizador', file: 'index.html' },
  '/nueva-pagina': { title: 'Nueva Página', file: 'nueva-pagina.html' },  // ← Agregar aquí
  // ... otras rutas
};
```

3. **En la navegación** (`js/navigation.js`):
```javascript
this.navItems = [
  { path: '/', label: '🏠 Inicio', icon: 'home' },
  { path: '/nueva-pagina', label: '🆕 Nueva Página', icon: 'new' },  // ← Agregar aquí
  // ... otros items
];
```

### Personalizar Estilos de Navegación

Los estilos están en `js/navigation.js` en el método `addStyles()`. Puedes modificar:

- Colores del gradiente
- Tamaños y espaciados
- Animaciones y transiciones
- Diseño responsive

## 🔍 API Endpoints

### Health Check
```
GET /api/health
```
Respuesta:
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente"
}
```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Error: "Port already in use"
Cambia el puerto en `server.js`:
```javascript
const PORT = process.env.PORT || 3001;  // Cambiar 3000 por 3001
```

### Las rutas no funcionan
1. Verifica que el servidor esté corriendo
2. Asegúrate de que los archivos HTML existan
3. Revisa la consola del navegador para errores

### La navegación no aparece
1. Verifica que `js/router.js` y `js/navigation.js` estén incluidos en el HTML
2. Revisa que no haya errores de JavaScript en la consola

## 📱 Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Móviles (iOS Safari, Chrome Mobile)

## 🚀 Próximas Mejoras

- [ ] Lazy loading de páginas
- [ ] Animaciones de transición personalizables
- [ ] Sistema de guards para protección de rutas
- [ ] Cache de páginas visitadas
- [ ] Modo offline con Service Workers

## 📞 Soporte

Si tienes problemas o preguntas sobre el sistema de ruteo, revisa:

1. La consola del navegador para errores
2. Los logs del servidor en la terminal
3. Que todas las dependencias estén instaladas correctamente

---

**Desarrollado por SUBE IA** 🚀 