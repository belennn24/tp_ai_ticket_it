import { compraService } from '../services/compraService.js';

export class CompraController {
  constructor(service = compraService) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const { eventoId, estado } = req.query;
      // Seguridad: el compradorId se obtiene exclusivamente del usuario autenticado
      const compras = await this.service.getAll({
        compradorId: req.user.id,
        eventoId,
        estado
      });
      res.status(200).json(compras);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const compra = await this.service.getById(id, {
        usuarioActual: req.user
      });
      res.status(200).json(compra);
    } catch (error) {
      next(error);
    }
  };

  getHistorial = async (req, res, next) => {
    try {
      const { id } = req.params;
      const historial = await this.service.getHistorial(id, {
        usuarioActual: req.user
      });
      res.status(200).json(historial);
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { eventoId, tipoEntradaId, cantidad } = req.body;
      // Seguridad: compradorId proviene exclusivamente del token verificado
      const nuevaCompra = await this.service.create({
        eventoId,
        tipoEntradaId,
        cantidad,
        compradorId: req.user.id
      });
      res.status(201).json(nuevaCompra);
    } catch (error) {
      next(error);
    }
  };

  cambiarEstado = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { estado, motivo } = req.body;
      const compraActualizada = await this.service.cambiarEstado(id, {
        estado,
        motivo,
        usuarioActual: req.user
      });
      res.status(200).json(compraActualizada);
    } catch (error) {
      next(error);
    }
  };

  cancelar = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body || {};
      const compraCancelada = await this.service.cancelar(id, {
        motivo,
        usuarioActual: req.user
      });
      res.status(200).json(compraCancelada);
    } catch (error) {
      next(error);
    }
  };

  utilizar = async (req, res, next) => {
    try {
      const { id } = req.params;
      const compraUtilizada = await this.service.utilizar(id, {
        usuarioActual: req.user
      });
      res.status(200).json(compraUtilizada);
    } catch (error) {
      next(error);
    }
  };
}

export const compraController = new CompraController();
