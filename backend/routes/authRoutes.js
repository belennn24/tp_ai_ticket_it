import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { registroSchema, loginSchema } from '../validations/authValidation.js';

const router = Router();

// POST /api/auth/registro - Registro de nuevos usuarios con contraseña segura
router.post('/registro', validate(registroSchema), authController.registro);

// POST /api/auth/login - Autenticación con email/password o emisión de token
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/token - Alias compatible para integración con Postman y tests
router.post('/token', validate(loginSchema), authController.login);

// POST /api/auth/refresh - Renueva el access token rotando el refresh token HttpOnly
router.post('/refresh', authController.refresh);

// POST /api/auth/logout - Invalida el refresh token y limpia la cookie HttpOnly
router.post('/logout', authController.logout);

// GET /api/auth/me - Verifica el token Bearer y retorna el perfil del usuario autenticado
router.get('/me', authMiddleware, authController.me);

export { router as authRoutes };
export default router;
