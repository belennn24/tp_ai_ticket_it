import { categoriaService } from '../services/categoriaService.js';

export class CategoriaController {
  constructor(service = categoriaService) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const categorias = await this.service.getAll();
      res.status(200).json(categorias);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const categoria = await this.service.getById(id);
      res.status(200).json(categoria);
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { nombre, descripcion } = req.body;
      const nuevaCategoria = await this.service.create({ nombre, descripcion });
      res.status(201).json(nuevaCategoria);
    } catch (error) {
      next(error);
    }
  };
}

export const categoriaController = new CategoriaController();
