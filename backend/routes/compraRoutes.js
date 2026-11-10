import { Router } from 'express';
import { compraController } from '../controllers/compraController.js';
import { mensajeController } from '../controllers/mensajeController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  crearCompraSchema,
  cancelarCompraSchema,
  agregarMensajeSchema,
  utilizarCompraSchema,
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

// PATCH /api/compras/:id/estado - Cambiar estado de compra (CANCELADA por comprador / UTILIZADA por organizador)
router.patch(
  '/:id/estado',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  validate(cambiarEstadoCompraSchema),
  compraController.cambiarEstado
);

// PATCH /api/compras/:id - Modificar estado de compra (estándar REST)
router.patch(
  '/:id',
  authMiddleware,
  requireRole('comprador', 'organizador'),
  validate(cambiarEstadoCompraSchema),
  compraController.cambiarEstado
);

// PATCH /api/compras/:id/cancelar - Cancelar compra y restituir cupo (solo comprador dueño)
router.patch(
  '/:id/cancelar',
  authMiddleware,
  requireRole('comprador'),
  validate(cancelarCompraSchema),
  compraController.cancelar
);

// PATCH /api/compras/:id/utilizar - Marcar entrada utilizada en acceso (solo organizador dueño)
router.patch(
  '/:id/utilizar',
  authMiddleware,
  requireRole('organizador'),
  validate(utilizarCompraSchema),
  compraController.utilizar
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
