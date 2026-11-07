import { usuarioService } from '../services/usuarioService.js';

export class UsuarioController {
  constructor(service = usuarioService) {
    this.service = service;
  }

  getFavoritos = async (req, res, next) => {
    try {
      // Seguridad: se extrae exclusivamente del comprador autenticado
      const favoritos = await this.service.obtenerFavoritos(req.user.id);
      res.status(200).json(favoritos);
    } catch (error) {
      next(error);
    }
  };

  agregarFavorito = async (req, res, next) => {
    try {
      const { eventoId } = req.params;
      const resultado = await this.service.agregarFavorito(req.user.id, eventoId);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  eliminarFavorito = async (req, res, next) => {
    try {
      const { eventoId } = req.params;
      const resultado = await this.service.eliminarFavorito(req.user.id, eventoId);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };
}

export const usuarioController = new UsuarioController();
