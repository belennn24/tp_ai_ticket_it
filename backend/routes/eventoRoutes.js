import { Router } from 'express';
import { eventoController } from '../controllers/eventoController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  buscarEventosQuerySchema,
  eventoIdParamSchema,
  crearEventoSchema
} from '../validations/eventoValidation.js';

const router = Router();

// GET /api/eventos - Listar y filtrar eventos del catálogo (Público)
router.get('/', validate(buscarEventosQuerySchema, 'query'), eventoController.getAll);

// GET /api/eventos/:id - Obtener detalle completo de un evento (Público)
router.get('/:id', validate(eventoIdParamSchema, 'params'), eventoController.getById);

// POST /api/eventos - Publicar un nuevo evento con tipos de entrada (solo Organizador autenticado)
router.post(
  '/',
  authMiddleware,
  requireRole('organizador'),
  validate(crearEventoSchema, 'body'),
  eventoController.create
);

// GET /api/eventos/:id/compras - Compras del evento y balance de cupos (solo Organizador dueño)
router.get(
  '/:id/compras',
  authMiddleware,
  requireRole('organizador'),
  validate(eventoIdParamSchema, 'params'),
  eventoController.getCompras
);

export { router as eventoRoutes };
export default router;
