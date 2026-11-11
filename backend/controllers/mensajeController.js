import { mensajeService } from '../services/mensajeService.js';

export class MensajeController {
  constructor(service = mensajeService) {
    this.service = service;
  }

  getMensajes = async (req, res, next) => {
    try {
      const { id } = req.params;
      const mensajes = await this.service.obtenerMensajes(id, {
        usuarioActual: req.user
      });
      res.status(200).json(mensajes);
    } catch (error) {
      next(error);
    }
  };

  enviarMensaje = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { mensaje } = req.body;
      const nuevoMensaje = await this.service.enviarMensaje(id, {
        texto: mensaje,
        usuarioActual: req.user
      });
      res.status(201).json(nuevoMensaje);
    } catch (error) {
      next(error);
    }
  };
}

export const mensajeController = new MensajeController();
