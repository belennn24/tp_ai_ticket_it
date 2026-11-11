import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EventoController } from '../backend/controllers/eventoController.js';

describe('EventoController (Pruebas Unitarias)', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      getCompras: jest.fn()
    };

    controller = new EventoController(mockService);

    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'org-1', role: 'organizador' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('getAll debe extraer query y retornar 200 con la lista de eventos', async () => {
    const eventosMock = [{ id: 'ev-1', nombre: 'Concierto' }];
    mockService.getAll.mockResolvedValue(eventosMock);
    req.query = { texto: 'rock', precioMin: 100, precioMax: 500 };

    await controller.getAll(req, res, next);

    expect(mockService.getAll).toHaveBeenCalledWith({
      texto: 'rock',
      categoriaId: undefined,
      precioMin: 100,
      precioMax: 500,
      orden: undefined
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(eventosMock);
    expect(next).not.toHaveBeenCalled();
  });

  it('getById debe extraer id de params y retornar 200 con el evento', async () => {
    const eventoMock = { id: 'ev-1', nombre: 'Teatro' };
    mockService.getById.mockResolvedValue(eventoMock);
    req.params = { id: 'ev-1' };

    await controller.getById(req, res, next);

    expect(mockService.getById).toHaveBeenCalledWith('ev-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(eventoMock);
  });

  it('create debe tomar organizadorId exclusivamente de req.user y responder 201', async () => {
    const nuevoEvento = { id: 'ev-nuevo', nombre: 'Festival' };
    mockService.create.mockResolvedValue(nuevoEvento);
    req.body = {
      nombre: 'Festival',
      categoriaId: 'cat-1',
      descripcion: 'Aire libre',
      fecha: '2026-12-01',
      tiposEntrada: []
    };

    await controller.create(req, res, next);

    expect(mockService.create).toHaveBeenCalledWith({
      nombre: 'Festival',
      descripcion: 'Aire libre',
      categoriaId: 'cat-1',
      fecha: '2026-12-01',
      tiposEntrada: [],
      multimedia: undefined,
      organizadorId: 'org-1'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nuevoEvento);
  });

  it('getCompras debe extraer id y organizador autenticado y responder 200 con compras y balance', async () => {
    const balanceComprasMock = {
      eventoId: 'ev-1',
      balanceCupos: [],
      compras: []
    };
    mockService.getCompras.mockResolvedValue(balanceComprasMock);
    req.params = { id: 'ev-1' };

    await controller.getCompras(req, res, next);

    expect(mockService.getCompras).toHaveBeenCalledWith('ev-1', {
      organizadorId: 'org-1',
      usuarioActual: req.user
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(balanceComprasMock);
  });

  it('debe propagar excepciones capturadas hacia next(error)', async () => {
    const error = new Error('Error en el servicio');
    mockService.getById.mockRejectedValue(error);
    req.params = { id: 'ev-fallo' };

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
