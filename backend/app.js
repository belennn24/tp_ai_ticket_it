import express from 'express';
import { categoriaRoutes } from './routes/categoriaRoutes.js';
import { eventoRoutes } from './routes/eventoRoutes.js';
import { compraRoutes } from './routes/compraRoutes.js';
import { usuarioRoutes } from './routes/usuarioRoutes.js';
import { reseniaRoutes } from './routes/reseniaRoutes.js';
import { organizadorRoutes } from './routes/organizadorRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { seedRoutes } from './routes/seedRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { limiteGeneral, limiteAuth } from './middlewares/rateLimiting.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ticketit_jwt_secret_key_2026';

const app = express();

// Confianza en el reverse proxy (para leer X-Forwarded-For correctamente)
app.set('trust proxy', 1);

app.use(express.json());

// Endpoint de verificación del estado del servicio (exento de rate limiting)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'AI Ticket It API', timestamp: new Date().toISOString() });
});

// Control de tasa (Rate Limiting)
app.use('/api', limiteGeneral);
app.use('/api/auth/login', limiteAuth);

// Rutas de desarrollo para reiniciar y verificar el Seed
app.use('/api/seed', seedRoutes);

// Rutas de autenticación y tokens
app.use('/api/auth', authRoutes);

// Rutas del catálogo de categorías
app.use('/api/categorias', categoriaRoutes);

// Rutas de eventos y cupos
app.use('/api/eventos', eventoRoutes);

// Rutas de compras y ciclo de vida de entradas
app.use('/api/compras', compraRoutes);

// Rutas de usuarios y eventos favoritos
app.use('/api/usuarios', usuarioRoutes);

// Rutas de reseñas
app.use('/api/resenias', reseniaRoutes);

// Rutas públicas de organizadores (reputación y reseñas)
app.use('/api/organizadores', organizadorRoutes);

// Manejo centralizado de errores
app.use(errorHandler);

export default app;
export { app };
