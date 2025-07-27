# Cotizador SUBE IA TECH - Sistema Completo

Un sistema completo de cotizaciones con integración de Firebase Firestore y panel de administración.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Generación de cotizaciones** con múltiples servicios y modalidades
- **Integración con Firebase Firestore** para almacenamiento persistente
- **Panel de administración** completo con gestión de cotizaciones
- **Generación de PDFs** profesionales
- **Sistema de estados** (Emitida → Aceptada → Contratada)
- **Interfaz responsive** y moderna

### 📊 Panel de Administración
- **Dashboard con estadísticas** en tiempo real
- **Tabla de cotizaciones** con filtros por estado
- **Acciones CRUD** completas:
  - Marcar como aceptada
  - Generar contrato
  - Ver PDF
  - Eliminar cotización
- **Notificaciones** en tiempo real
- **Modal de confirmación** para acciones críticas

## 🛠️ Configuración

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Firestore Database**
4. Ve a **Project Settings** → **General** → **Your apps**
5. Crea una nueva app web
6. Copia la configuración de Firebase

### 2. Actualizar Configuración

Edita el archivo `js/firebase-config.js` y reemplaza la configuración:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 3. Reglas de Firestore

Configura las reglas de seguridad en Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cotizaciones/{document} {
      allow read, write: if true; // Para desarrollo
      // allow read, write: if request.auth != null; // Para producción
    }
  }
}
```

## 📁 Estructura del Proyecto

```
cotizador/
├── index.html              # Página principal del cotizador
├── admin.html              # Panel de administración
├── css/
│   ├── styles.css          # Estilos del cotizador
│   └── admin.css           # Estilos del panel admin
├── js/
│   ├── script.js           # Lógica principal del cotizador
│   ├── admin.js            # Lógica del panel admin
│   └── firebase-config.js  # Configuración de Firebase
├── templates/
│   ├── invoice-template.js # Plantilla de cotizaciones
│   └── contract-template.js # Plantilla de contratos (futuro)
└── assets/
    └── logo-blanco.png     # Logo de la empresa
```

## 🎯 Uso

### Generar Cotización
1. Abre `index.html` en tu navegador
2. Completa el formulario con los datos del cliente
3. Selecciona los servicios deseados
4. Configura los detalles de cada servicio
5. Haz clic en "Generar PDF" para previsualizar
6. Haz clic en "Confirmar y emitir PDF" para guardar y generar

### Panel de Administración
1. Accede a `admin.html` o haz clic en "Panel de Administración"
2. Visualiza todas las cotizaciones generadas
3. Usa los filtros para encontrar cotizaciones específicas
4. Realiza acciones sobre las cotizaciones:
   - **Aceptar**: Cambia el estado a "Aceptada"
   - **Contrato**: Cambia el estado a "Contratada"
   - **Ver PDF**: Regenera el PDF de la cotización
   - **Eliminar**: Elimina la cotización (con confirmación)

## 🔧 Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y responsive
- **JavaScript ES6+** - Lógica de la aplicación
- **Firebase Firestore** - Base de datos en la nube
- **html2pdf.js** - Generación de PDFs
- **Font Awesome** - Iconografía

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- 📱 Dispositivos móviles
- 💻 Tablets
- 🖥️ Escritorio

## 🔒 Seguridad

### Para Desarrollo
- Las reglas de Firestore están abiertas para facilitar el desarrollo

### Para Producción
- Configura autenticación de Firebase
- Actualiza las reglas de Firestore para restringir acceso
- Considera implementar un sistema de usuarios

## 🚀 Despliegue

### Opción 1: Firebase Hosting (Recomendado)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Opción 2: Servidor Web Local
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx serve .

# Usando PHP
php -S localhost:8000
```

## 🔄 Flujo de Trabajo

1. **Cliente solicita cotización** → Se genera en el cotizador
2. **Cotización se guarda** → Automáticamente en Firestore
3. **Administrador revisa** → En el panel de administración
4. **Cliente acepta** → Se marca como "Aceptada"
5. **Se genera contrato** → Se marca como "Contratada"

## 📈 Próximas Mejoras

- [ ] Sistema de autenticación de usuarios
- [ ] Plantillas de contratos personalizables
- [ ] Notificaciones por email
- [ ] Dashboard con gráficos y métricas
- [ ] Exportación a Excel
- [ ] Integración con sistemas de pago

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: contacto@subeia.tech
- Sitio web: https://subeia.tech

---

**Desarrollado con ❤️ por SUBE IA TECH**
