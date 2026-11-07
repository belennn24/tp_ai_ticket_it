import app from './app.js';
import { seedDatabase } from './utils/seed.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor AI Ticket It corriendo en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles en http://localhost:${PORT}/api/`);

  try {
    const summary = await seedDatabase({ clearExisting: true });
    console.log(`🌱 Base de datos en memoria inicializada con datos de prueba (Seed):`, summary);
  } catch (err) {
    console.error('⚠️ Error al inicializar el seed de datos:', err);
  }
});
