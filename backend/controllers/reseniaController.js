import { reseniaService } from '../services/reseniaService.js';

export class ReseniaController {
  constructor(service = reseniaService) {
    this.service = service;
  }

  create = async (req, res, next) => {
    try {
      const { eventoId, puntuacion, detalle } = req.body;
      // Seguridad: el compradorId proviene exclusivamente del usuario autenticado
      const nuevaResenia = await this.service.create({
        eventoId,
        puntuacion,
        detalle,
        compradorId: req.user.id
      });
      res.status(201).json(nuevaResenia);
    } catch (error) {
      next(error);
    }
  };

  getByOrganizadorId = async (req, res, next) => {
    try {
      const { id } = req.params;
      const resultado = await this.service.getByOrganizadorId(id);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };
}

export const reseniaController = new ReseniaController();
