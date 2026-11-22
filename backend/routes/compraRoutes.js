import { Router } from 'express';
import { compraController } from '../controllers/compraController.js';
import { mensajeController } from '../controllers/mensajeController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  crearCompraSchema,
  agregarMensajeSchema,
  cambiarEstadoCompraSchema
} from '../validations/compraValidation.js';

const router = Router();

// GET /api/compras - Listar compras del comprador autenticado
router.get(
  '/',
  authMiddleware,
  requireRole('comprador'),
  compraController.getAll
);

// GET /api/compras/:id - Detalle de una compra (comprador dueño u organizador del evento)
router.get(
  '/:id',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  compraController.getById
);

// GET /api/compras/:id/historial - Historial de estados (comprador u organizador)
router.get(
  '/:id/historial',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  compraController.getHistorial
);

// GET /api/compras/:id/mensajes - Leer chat de la orden (comprador u organizador)
router.get(
  '/:id/mensajes',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  mensajeController.getMensajes
);

// POST /api/compras - Adquirir entradas (descuenta cupo y crea compra)
router.post(
  '/',
  authMiddleware,
  requireRole('comprador'),
  validate(crearCompraSchema),
  compraController.create
);

// PATCH /api/compras/:id/estado - Cambiar estado de compra
// (CANCELADA por el comprador; CONFIRMADA, UTILIZADA y REEMBOLSADA por el organizador del evento)
router.patch(
  '/:id/estado',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  validate(cambiarEstadoCompraSchema),
  compraController.cambiarEstado
);

// POST /api/compras/:id/mensajes - Enviar mensaje en el chat (comprador u organizador)
router.post(
  '/:id/mensajes',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  validate(agregarMensajeSchema),
  mensajeController.enviarMensaje
);

export { router as compraRoutes };
export default router;
