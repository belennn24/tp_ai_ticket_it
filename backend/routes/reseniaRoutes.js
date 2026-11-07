import { Router } from 'express';
import { reseniaController } from '../controllers/reseniaController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  crearReseniaSchema,
  organizadorIdParamSchema
} from '../validations/reseniaValidation.js';

const router = Router();

// POST /api/resenias - Publicar una reseña (solo Comprador autenticado con entrada utilizada previa)
router.post(
  '/',
  authMiddleware,
  requireRole('comprador'),
  validate(crearReseniaSchema, 'body'),
  reseniaController.create
);

// GET /api/resenias/organizadores/:id y /organizadores/:id/resenias (Público)
router.get(
  '/organizadores/:id',
  validate(organizadorIdParamSchema, 'params'),
  reseniaController.getByOrganizadorId
);
router.get(
  '/organizadores/:id/resenias',
  validate(organizadorIdParamSchema, 'params'),
  reseniaController.getByOrganizadorId
);

export { router as reseniaRoutes };
export default router;
