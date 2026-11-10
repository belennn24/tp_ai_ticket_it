import app from './app.js';
import { seedDatabase } from './utils/seed.js';
import { esEntornoLocal } from './config/entorno.js';

const PORT = process.env.PORT || 3000;
const sembrarAlIniciar = esEntornoLocal() || process.env.SEED_ON_START === 'true';

app.listen(PORT, async () => {
  console.log(`🚀 Servidor AI Ticket It corriendo en http://localhost:${PORT}`);
  if (!sembrarAlIniciar) return;

  try {
    const summary = await seedDatabase({ clearExisting: true });
    console.log('🌱 Seed inicial cargado:', summary);
  } catch (err) {
    console.error('⚠️ Error al inicializar el seed de datos:', err);
  }
});