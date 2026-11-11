import { Router } from 'express';
import { reseniaController } from '../controllers/reseniaController.js';
import { validate } from '../middlewares/validate.js';
import { organizadorIdParamSchema } from '../validations/reseniaValidation.js';

const router = Router();

// GET /api/organizadores/:id/resenias - Listado de reseñas y reputación promedio calculada
router.get('/:id/resenias', validate(organizadorIdParamSchema, 'params'), reseniaController.getByOrganizadorId);

export { router as organizadorRoutes };
export default router;
