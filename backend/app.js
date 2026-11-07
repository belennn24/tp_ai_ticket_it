import express from 'express';
import { categoriaRoutes } from './routes/categoriaRoutes.js';
import { eventoRoutes } from './routes/eventoRoutes.js';
import { compraRoutes } from './routes/compraRoutes.js';
import { usuarioRoutes } from './routes/usuarioRoutes.js';
import { reseniaRoutes } from './routes/reseniaRoutes.js';
import { organizadorRoutes } from './routes/organizadorRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ticketit_jwt_secret_key_2026';

const app = express();

app.use(express.json());

// Endpoint de verificación del estado del servicio
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'AI Ticket It API', timestamp: new Date().toISOString() });
});

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
