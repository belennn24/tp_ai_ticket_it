import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/auth/token o /api/auth/login
// Permite generar un token JWT válido para Comprador, Organizador o Admin
router.post('/token', (req, res) => {
  const { id, email, role, rol, nombre } = req.body || {};
  const userRole = role || rol || 'comprador';
  const defaultId = userRole === 'organizador' 
    ? 'usr-organizador-1' 
    : userRole === 'admin' 
      ? 'usr-admin-1' 
      : 'usr-comprador-1';

  const defaultEmail = `${userRole}@ticketit.com`;
  const defaultNombre = userRole === 'organizador' 
    ? 'Carlos Productor' 
    : userRole === 'admin' 
      ? 'Admin Sistema' 
      : 'Juan Comprador';

  const payload = {
    id: String(id || defaultId),
    email: email || defaultEmail,
    role: userRole,
    rol: userRole,
    nombre: nombre || defaultNombre
  };

  const secret = process.env.JWT_SECRET || 'ticketit_jwt_secret_key_2026';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  return res.status(200).json({
    token,
    user: payload
  });
});

router.post('/login', (req, res) => {
  // Alias de /token para mayor comodidad
  const { id, email, role, rol, nombre } = req.body || {};
  const userRole = role || rol || 'comprador';
  const defaultId = userRole === 'organizador' 
    ? 'usr-organizador-1' 
    : userRole === 'admin' 
      ? 'usr-admin-1' 
      : 'usr-comprador-1';

  const defaultEmail = `${userRole}@ticketit.com`;
  const defaultNombre = userRole === 'organizador' 
    ? 'Carlos Productor' 
    : userRole === 'admin' 
      ? 'Admin Sistema' 
      : 'Juan Comprador';

  const payload = {
    id: String(id || defaultId),
    email: email || defaultEmail,
    role: userRole,
    rol: userRole,
    nombre: nombre || defaultNombre
  };

  const secret = process.env.JWT_SECRET || 'ticketit_jwt_secret_key_2026';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  return res.status(200).json({
    mensaje: 'Autenticación exitosa',
    token,
    user: payload
  });
});

// GET /api/auth/me - Verifica el token y retorna el usuario autenticado
router.get('/me', authMiddleware, (req, res) => {
  return res.status(200).json({
    user: req.user
  });
});

export { router as authRoutes };
export default router;
