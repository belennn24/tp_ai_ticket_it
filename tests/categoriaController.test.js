import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CategoriaController } from '../backend/controllers/categoriaController.js';

describe('CategoriaController (Pruebas Unitarias)', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn()
    };

    controller = new CategoriaController(mockService);

    req = {
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('getAll debe responder 200 con la lista de categorías', async () => {
    const categoriasMock = [{ id: '1', nombre: 'Música' }];
    mockService.getAll.mockResolvedValue(categoriasMock);

    await controller.getAll(req, res, next);

    expect(mockService.getAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(categoriasMock);
    expect(next).not.toHaveBeenCalled();
  });

  it('getById debe responder 200 con la categoría encontrada', async () => {
    const categoriaMock = { id: '1', nombre: 'Música' };
    mockService.getById.mockResolvedValue(categoriaMock);
    req.params = { id: '1' };

    await controller.getById(req, res, next);

    expect(mockService.getById).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(categoriaMock);
  });

  it('create debe responder 201 con la categoría creada', async () => {
    const nuevaCategoriaMock = { id: '2', nombre: 'Cine' };
    mockService.create.mockResolvedValue(nuevaCategoriaMock);
    req.body = { nombre: 'Cine', descripcion: 'Películas' };

    await controller.create(req, res, next);

    expect(mockService.create).toHaveBeenCalledWith({
      nombre: 'Cine',
      descripcion: 'Películas'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nuevaCategoriaMock);
  });

  it('debe propagar errores a next(error)', async () => {
    const error = new Error('Fallo');
    mockService.getAll.mockRejectedValue(error);

    await controller.getAll(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
