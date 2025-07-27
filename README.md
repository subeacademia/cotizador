# 📋 Cotizador SUBE IA - Sistema Completo de Gestión con Firmas Digitales

## 🚀 Características Principales

### ✨ **Gestión de Cotizaciones**
- Creación de cotizaciones profesionales con múltiples servicios
- Sistema de descuentos automático
- Generación de PDFs con diseño profesional
- Estados de cotización: Emitida, Contestada, En Negociación, Aceptada, Rechazada, etc.
- Búsqueda y filtrado avanzado en tiempo real
- Panel de administración completo
- **Sistema de notificaciones en tiempo real** 🆕

### 📄 **Gestión de Contratos Avanzada** 🆕
- **Creación automática de pre-contratos** desde cotizaciones aceptadas
- **Creación directa de contratos** sin cotización previa
- **Sistema completo de estados**: Pendiente de Completar → Pendiente de Firma → Firmado → Finalizado
- **CRUD completo** para contratos (Crear, Leer, Actualizar, Eliminar)
- **Modal de completado** para añadir datos faltantes del contrato
- Modales interactivos para detalles y edición
- Búsqueda y filtrado avanzado

### ✍️ **Sistema de Firmas Digitales Propio** 🆕
- **Página dedicada de firma** (`firmar-contrato.html`)
- **Librería SignaturePad** para captura de firmas
- **Firma digital nativa** sin dependencias externas
- **Almacenamiento de firma en Base64** en Firestore
- **Validación de firma** antes de completar el proceso
- **Interfaz responsive** para dispositivos móviles y táctiles

### 🎨 **Experiencia de Usuario Mejorada**
- Diseño moderno con efectos glassmorphism
- Interfaz responsive para todos los dispositivos
- **Sistema de notificaciones toast** sin efectos molestos
- Navegación intuitiva entre módulos
- **Feedback visual inmediato** para todas las acciones

## 🔧 **Funcionalidades Técnicas**

### **Flujo Automatizado Cotización → Pre-Contrato → Firma**
1. Al cambiar el estado de una cotización a "Aceptada"
2. Se crea automáticamente un **pre-contrato** en la colección `contratos`
3. Se copian todos los datos relevantes de la cotización
4. Se establece el estado inicial como "Pendiente de Completar"
5. Se muestra notificación de éxito
6. El usuario puede completar el contrato con datos adicionales
7. Al completar, se redirige automáticamente a la página de firma
8. El cliente firma digitalmente el contrato
9. Se actualiza el estado a "Firmado" y se guarda la firma

### **Sistema de Notificaciones**
- **Notificaciones toast** en la esquina superior derecha
- **Tipos**: Success (✅) y Error (❌)
- **Auto-remoción** después de 5 segundos
- **Animaciones suaves** de entrada y salida
- **Botón de cierre manual** disponible

### **Gestor de Contratos Completo**
- **Crear Pre-Contrato**: Automático desde cotizaciones aceptadas
- **Completar Contrato**: Modal con formulario para datos adicionales
- **Ver Detalles**: Modal con información completa del contrato
- **Editar Contrato**: Modificación de todos los campos del contrato
- **Cambiar Estado**: Actualización inmediata del estado del contrato
- **Eliminar Contrato**: Eliminación con confirmación
- **Firmar Contrato**: Redirección a página de firma digital

### **Sistema de Estados Mejorado**
- **Cotizaciones**: Emitida → Contestada → En Negociación → Aceptada/Rechazada
- **Contratos**: Pendiente de Completar → Pendiente de Firma → Firmado → Finalizado

## 📁 **Estructura del Proyecto**

```
cotizador/
├── index.html              # Formulario principal de cotizaciones
├── admin.html              # Panel de administración
├── contratos.html          # Gestor de contratos
├── firmar-contrato.html    # Página de firma digital (NUEVO)
├── preview.html            # Previsualización de cotizaciones
├── css/
│   ├── admin.css           # Estilos principales (MEJORADO)
│   ├── login.css           # Estilos de login
│   └── styles.css          # Estilos generales
├── js/
│   ├── admin.js            # Lógica de administración (MEJORADO)
│   ├── contratos.js        # Lógica de contratos (MEJORADO)
│   ├── firmar-contrato.js  # Lógica de firma digital (NUEVO)
│   ├── auth-guard.js       # Protección de rutas
│   ├── script.js           # Lógica principal
│   └── script-new.js       # Lógica adicional
└── templates/
    ├── contract-template.js # Plantilla de contratos
    └── invoice-template.js  # Plantilla de facturas
```

## 🎯 **Mejoras Implementadas**

### **Tarea 1: Reparación y Automatización del Flujo**
✅ **Completada**: Sistema de notificaciones y pre-contratos
- Función `mostrarNotificacion()` implementada
- Función `crearPreContrato()` reemplaza la anterior
- Notificaciones automáticas al cambiar estados
- Creación automática de pre-contratos al aceptar cotizaciones

### **Tarea 2: Gestor de Contratos Completo**
✅ **Completada**: Sistema CRUD completo con completado
- **Modal de completar contrato** con formulario completo
- **Botón "Completar y Firmar"** en contratos pendientes
- **Validación de campos obligatorios**
- **Redirección automática** a página de firma
- **Estados mejorados** con "Pendiente de Completar"

### **Tarea 3: Sistema de Firmas Digitales Propio**
✅ **Completada**: Sistema completo de firma digital
- **Página `firmar-contrato.html`** con interfaz moderna
- **Librería SignaturePad** integrada
- **Captura de firma en Base64**
- **Validación de firma** antes de completar
- **Almacenamiento en Firestore** con metadatos
- **Responsive design** para dispositivos táctiles

## 🔥 **Nuevas Funcionalidades**

### **Sistema de Notificaciones Toast**
- Notificaciones no intrusivas en tiempo real
- Tipos de notificación: Success y Error
- Animaciones suaves y auto-remoción
- Diseño consistente con el tema de la aplicación

### **Flujo de Pre-Contratos**
- Creación automática de pre-contratos desde cotizaciones
- Estado "Pendiente de Completar" para contratos incompletos
- Modal de completado con campos específicos del contrato
- Transición fluida hacia el proceso de firma

### **Página de Firma Digital**
- Interfaz dedicada para firmar contratos
- Canvas responsive para captura de firma
- Validación de firma antes de completar
- Resumen completo del contrato antes de firmar
- Almacenamiento seguro de firma en Base64

### **Modales Interactivos Mejorados**
- Modal de completar contrato con validación
- Modal de detalles con información organizada
- Modal de cambio de estado con notificaciones
- Transiciones suaves entre estados

### **Sistema de Búsqueda Avanzado**
- Búsqueda en tiempo real en contratos
- Filtrado por estado de contrato
- Búsqueda por código, cliente, empresa, email, etc.
- Resultados actualizados instantáneamente

### **Estadísticas en Tiempo Real**
- Total de contratos
- Contratos pendientes de completar
- Contratos pendientes de firma
- Contratos firmados
- Valor total de contratos

## 🚀 **Cómo Usar el Sistema Completo**

### **1. Flujo Automatizado Completo:**
1. Crear cotización en `index.html`
2. Ir a `admin.html` y cambiar estado a "Aceptada"
3. Automáticamente se crea pre-contrato en `contratos.html`
4. Hacer clic en "Completar y Firmar" en el pre-contrato
5. Llenar datos adicionales en el modal
6. Se redirige automáticamente a `firmar-contrato.html`
7. Firmar digitalmente el contrato
8. Contrato queda marcado como "Firmado"

### **2. Gestión de Contratos:**
1. Ir a `contratos.html`
2. Ver pre-contratos creados automáticamente
3. Completar contratos con datos adicionales
4. Firmar contratos digitalmente
5. Gestionar estados y ver detalles

### **3. Sistema de Firmas:**
1. Acceder a `firmar-contrato.html?id=[ID_CONTRATO]`
2. Revisar resumen del contrato
3. Firmar en el canvas digital
4. Confirmar firma y aceptar contrato
5. Redirección automática al panel de contratos

## 🛠️ **Tecnologías Utilizadas**

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **PDF**: jsPDF
- **Firma Digital**: SignaturePad.js
- **Estilos**: CSS Grid, Flexbox, Glassmorphism
- **Iconos**: SVG inline

## 📊 **Base de Datos Mejorada**

### **Colección: cotizaciones**
```javascript
{
  id: "string",
  codigo: "string",
  nombre: "string",
  email: "string",
  rut: "string",
  empresa: "string",
  servicios: "array",
  total: "number",
  totalConDescuento: "number",
  descuento: "number",
  estado: "string",
  fechaTimestamp: "timestamp",
  atendido: "string",
  notas: "string"
}
```

### **Colección: contratos (MEJORADA)**
```javascript
{
  id: "string",
  cotizacionIdOriginal: "string", // ID de cotización original
  codigoCotizacion: "string",
  tituloContrato: "string",
  fechaCreacionContrato: "timestamp",
  estadoContrato: "string", // Pendiente de Completar, Pendiente de Firma, Firmado, Finalizado
  cliente: {
    nombre: "string",
    email: "string",
    rut: "string",
    empresa: "string"
  },
  servicios: "array",
  total: "number",
  totalConDescuento: "number",
  descuento: "number",
  atendido: "string",
  fechaInicio: "date",
  fechaFin: "date",
  partesInvolucradas: "string", // NUEVO
  objetoContrato: "string", // NUEVO
  clausulas: "string", // NUEVO
  descripcionServicios: "string",
  terminosCondiciones: "string",
  esPreContrato: "boolean", // NUEVO
  fechaCompletado: "timestamp", // NUEVO
  firmaClienteBase64: "string", // NUEVO - Firma digital
  fechaFirma: "timestamp", // NUEVO
  firmadoPor: "string", // NUEVO
  esContratoDirecto: "boolean"
}
```

## 🎉 **Estado del Proyecto**

✅ **COMPLETADO**: Todas las tareas implementadas exitosamente
- ✅ Automatización del flujo cotización → pre-contrato → firma
- ✅ Sistema de notificaciones toast
- ✅ Gestor de contratos completo con CRUD
- ✅ Modal de completado de contratos
- ✅ Sistema de firmas digitales propio
- ✅ Página dedicada de firma con SignaturePad
- ✅ Validación y almacenamiento de firmas
- ✅ Mejoras de UX/UI sin efectos molestos
- ✅ Sistema de estados funcional
- ✅ Modales interactivos
- ✅ Búsqueda y filtrado avanzado

## 🔮 **Próximas Mejoras Sugeridas**

1. **Email Automático**: Notificaciones por email al cambiar estados
2. **Firma Múltiple**: Sistema para firmas de múltiples partes
3. **Reportes Avanzados**: Generación de reportes de ventas y contratos
4. **Dashboard Interactivo**: Gráficos y métricas avanzadas
5. **Multi-usuario**: Roles y permisos específicos
6. **Historial de Cambios**: Tracking de modificaciones en contratos
7. **Exportación de Firmas**: Descarga de contratos firmados en PDF

---

**Desarrollado con ❤️ para SUBE IA TECH**

*Sistema completo de gestión empresarial con firmas digitales nativas*
