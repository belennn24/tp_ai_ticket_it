import { Router } from 'express';
import { compraController } from '../controllers/compraController.js';
import { validate } from '../middlewares/validate.js';
import {
    crearCompraSchema,
    cancelarCompraSchema,
    agregarMensajeSchema,
    utilizarCompraSchema
} from '../validations/compraValidation.js';

const router = Router();

// GET /api/compras - Listar compras (soporta filtros por query: compradorId, eventoId, estado)
router.get('/', compraController.getAll);

// GET /api/compras/:id - Obtener detalle de una compra
router.get('/:id', compraController.getById);

// GET /api/compras/:id/historial - Historial de cambios de estado (CambioEstadoCompra)
router.get('/:id/historial', compraController.getHistorial);

// GET /api/compras/:id/mensajes - Leer chat / mensajes de la compra
router.get('/:id/mensajes', compraController.getMensajes);

// POST /api/compras - Adquirir entradas (descuenta cupo y crea compra)
router.post('/', validate(crearCompraSchema), compraController.create);

// PATCH /api/compras/:id/cancelar - Cancelar compra y restituir cupo
router.patch('/:id/cancelar', validate(cancelarCompraSchema), compraController.cancelar);

// PATCH /api/compras/:id/utilizar - Marcar entrada utilizada en el acceso
router.patch('/:id/utilizar', validate(utilizarCompraSchema), compraController.utilizar);

// POST /api/compras/:id/mensajes - Enviar mensaje en el chat de la compra
router.post('/:id/mensajes', validate(agregarMensajeSchema), compraController.agregarMensaje);

export { router as compraRoutes };
export default router;
