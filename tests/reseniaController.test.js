import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ReseniaController } from '../backend/controllers/reseniaController.js';

describe('ReseniaController (Pruebas Unitarias)', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      create: jest.fn(),
      getByOrganizadorId: jest.fn()
    };

    controller = new ReseniaController(mockService);

    req = {
      params: {},
      body: {},
      user: { id: 'user-1', role: 'comprador' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('create debe tomar compradorId exclusivamente de req.user y responder 201', async () => {
    const reseniaMock = { id: 'res-1', puntuacion: 5 };
    mockService.create.mockResolvedValue(reseniaMock);

    req.body = { eventoId: 'ev-1', puntuacion: 5, detalle: 'Muy bueno', compradorId: 'hacker' };

    await controller.create(req, res, next);

    expect(mockService.create).toHaveBeenCalledWith({
      eventoId: 'ev-1',
      puntuacion: 5,
      detalle: 'Muy bueno',
      compradorId: 'user-1'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(reseniaMock);
    expect(next).not.toHaveBeenCalled();
  });

  it('getByOrganizadorId debe extraer id y responder 200 con reseñas y promedio', async () => {
    const respuestaMock = {
      organizadorId: 'org-1',
      reputacionPromedio: 4.5,
      resenias: []
    };
    mockService.getByOrganizadorId.mockResolvedValue(respuestaMock);
    req.params = { id: 'org-1' };

    await controller.getByOrganizadorId(req, res, next);

    expect(mockService.getByOrganizadorId).toHaveBeenCalledWith('org-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(respuestaMock);
  });

  it('debe propagar errores del servicio a next(error)', async () => {
    const error = new Error('Conflicto');
    mockService.create.mockRejectedValue(error);

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
