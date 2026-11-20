import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { favoritoEventoIdParamSchema } from '../validations/favoritoValidation.js';
import { actualizarPerfilSchema } from '../validations/usuarioValidation.js';

const router = Router();

// PATCH /api/usuarios/me - Actualizar nombre/apellido del usuario autenticado
router.patch(
  '/me',
  authMiddleware,
  validate(actualizarPerfilSchema),
  usuarioController.actualizarPerfil
);

// GET /api/usuarios/me/favoritos - Listar eventos favoritos del comprador autenticado
router.get(
  '/me/favoritos',
  authMiddleware,
  requireRole('comprador'),
  usuarioController.getFavoritos
);

// POST /api/usuarios/me/favoritos/:eventoId - Guardar un evento en favoritos
router.post(
  '/me/favoritos/:eventoId',
  authMiddleware,
  requireRole('comprador'),
  validate(favoritoEventoIdParamSchema, 'params'),
  usuarioController.agregarFavorito
);

// DELETE /api/usuarios/me/favoritos/:eventoId - Remover un evento de favoritos
router.delete(
  '/me/favoritos/:eventoId',
  authMiddleware,
  requireRole('comprador'),
  validate(favoritoEventoIdParamSchema, 'params'),
  usuarioController.eliminarFavorito
);

export { router as usuarioRoutes };
export default router;
