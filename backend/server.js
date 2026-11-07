import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor AI Ticket It corriendo en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles en http://localhost:${PORT}/api/`);
});
