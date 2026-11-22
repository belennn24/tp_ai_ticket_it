import { Router } from 'express';
import { categoriaController } from '../controllers/categoriaController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  crearCategoriaSchema,
  categoriaIdParamSchema
} from '../validations/categoriaValidation.js';

const router = Router();

// GET /api/categorias - Listar categorías del catálogo (Público)
router.get('/', categoriaController.getAll);

// GET /api/categorias/:id - Detalle de categoría (Público)
router.get(
  '/:id',
  validate(categoriaIdParamSchema, 'params'),
  categoriaController.getById
);

// POST /api/categorias - Crear categoría (solo Organizador autenticado)
router.post(
  '/',
  authMiddleware,
  requireRole('organizador'),
  validate(crearCategoriaSchema, 'body'),
  categoriaController.create
);

export { router as categoriaRoutes };
export default router;
