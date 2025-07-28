const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuración de rutas principales
const routes = {
  '/': 'index.html',
  '/login': 'login.html',
  '/admin': 'admin.html',
  '/contratos': 'contratos.html',
  '/preview-contrato': 'preview-contrato.html',
  '/enviar-firma': 'enviar-firma.html',
  '/firmar-contrato': 'firmar-contrato.html',
  '/firmar-contrato-cliente': 'firmar-contrato-cliente.html',
  '/preview': 'preview.html'
};

// Middleware para manejar rutas SPA (Single Page Application)
app.get('*', (req, res) => {
  const route = req.path;
  
  // Si la ruta existe en nuestro mapeo, servir el archivo correspondiente
  if (routes[route]) {
    res.sendFile(path.join(__dirname, routes[route]));
  } else {
    // Para rutas no encontradas, redirigir al index (comportamiento SPA)
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// API Routes (si necesitas endpoints adicionales)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Rutas disponibles:`);
  Object.keys(routes).forEach(route => {
    console.log(`   ${route} -> ${routes[route]}`);
  });
  console.log(`\n✨ Sistema de ruteo Angular-like activo!`);
}); 