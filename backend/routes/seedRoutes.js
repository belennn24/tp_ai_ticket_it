import { Router } from 'express';
import { seedDatabase } from '../utils/seed.js';

const router = Router();

/**
 * POST /api/seed
 * Reinicia y vuelve a sembrar la base de datos en memoria con datos representativos.
 */
router.post('/', async (req, res, next) => {
  try {
    const summary = await seedDatabase({ clearExisting: true });
    return res.status(200).json({
      mensaje: 'Base de datos en memoria reinicializada exitosamente con datos de prueba (Seed).',
      resumen: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/seed
 * Consulta o sembrado no destructivo de verificación.
 */
router.get('/', async (req, res, next) => {
  try {
    const summary = await seedDatabase({ clearExisting: false });
    return res.status(200).json({
      mensaje: 'Seed verificado en memoria.',
      resumen: summary
    });
  } catch (error) {
    next(error);
  }
});

export { router as seedRoutes };
export default router;
