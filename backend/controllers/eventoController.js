import { eventoService } from '../services/eventoService.js';

export class EventoController {
  constructor(service = eventoService) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const { texto, categoriaId, precioMin, precioMax, orden } = req.query;
      const eventos = await this.service.getAll({
        texto,
        categoriaId,
        precioMin,
        precioMax,
        orden
      });
      res.status(200).json(eventos);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const evento = await this.service.getById(id);
      res.status(200).json(evento);
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { nombre, descripcion, categoriaId, fecha, tiposEntrada, multimedia } = req.body;
      // Seguridad: organizadorId proviene exclusivamente del usuario autenticado
      const nuevoEvento = await this.service.create({
        nombre,
        descripcion,
        categoriaId,
        fecha,
        tiposEntrada,
        multimedia,
        organizadorId: req.user.id
      });
      res.status(201).json(nuevoEvento);
    } catch (error) {
      next(error);
    }
  };

  getCompras = async (req, res, next) => {
    try {
      const { id } = req.params;
      // Seguridad: se pasa el organizador autenticado
      const resultado = await this.service.getCompras(id, {
        organizadorId: req.user.id,
        usuarioActual: req.user
      });
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };
}

export const eventoController = new EventoController();
