import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CompraController } from '../backend/controllers/compraController.js';

describe('CompraController (Pruebas Unitarias)', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getByEventoId: jest.fn(),
      getHistorial: jest.fn(),
      getMensajes: jest.fn(),
      create: jest.fn(),
      cancelar: jest.fn(),
      utilizar: jest.fn(),
      agregarMensaje: jest.fn()
    };

    controller = new CompraController(mockService);

    req = {
      query: {},
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('getAll debe retornar 200 con la lista de compras del servicio', async () => {
    const comprasSimuladas = [{ id: '1' }, { id: '2' }];
    mockService.getAll.mockResolvedValue(comprasSimuladas);
    req.query = { compradorId: 'u1' };

    await controller.getAll(req, res, next);

    expect(mockService.getAll).toHaveBeenCalledWith({
      compradorId: 'u1',
      eventoId: undefined,
      estado: undefined
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(comprasSimuladas);
    expect(next).not.toHaveBeenCalled();
  });

  it('getById debe retornar 200 con la compra encontrada', async () => {
    const compra = { id: 'c-1' };
    mockService.getById.mockResolvedValue(compra);
    req.params = { id: 'c-1' };

    await controller.getById(req, res, next);

    expect(mockService.getById).toHaveBeenCalledWith('c-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(compra);
  });

  it('create debe responder 201 con la compra creada', async () => {
    const nuevaCompra = { id: 'c-new', cantidad: 2 };
    mockService.create.mockResolvedValue(nuevaCompra);
    req.body = { eventoId: 'e-1', tipoEntradaId: 't-1', cantidad: 2, compradorId: 'u-1' };

    await controller.create(req, res, next);

    expect(mockService.create).toHaveBeenCalledWith({
      eventoId: 'e-1',
      tipoEntradaId: 't-1',
      cantidad: 2,
      compradorId: 'u-1'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nuevaCompra);
  });

  it('cancelar debe responder 200 con la compra cancelada', async () => {
    const cancelada = { id: 'c-1', estado: 'CANCELADA' };
    mockService.cancelar.mockResolvedValue(cancelada);
    req.params = { id: 'c-1' };
    req.body = { motivo: 'Problemas' };

    await controller.cancelar(req, res, next);

    expect(mockService.cancelar).toHaveBeenCalledWith('c-1', { motivo: 'Problemas' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(cancelada);
  });

  it('utilizar debe responder 200 con la compra utilizada', async () => {
    const utilizada = { id: 'c-1', estado: 'UTILIZADA' };
    mockService.utilizar.mockResolvedValue(utilizada);
    req.params = { id: 'c-1' };

    await controller.utilizar(req, res, next);

    expect(mockService.utilizar).toHaveBeenCalledWith('c-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(utilizada);
  });

  it('agregarMensaje debe responder 201 con el mensaje creado', async () => {
    const mensaje = { id: 'm-1', mensaje: 'Hola' };
    mockService.agregarMensaje.mockResolvedValue(mensaje);
    req.params = { id: 'c-1' };
    req.body = { mensaje: 'Hola', usuarioId: 'u-1' };

    await controller.agregarMensaje(req, res, next);

    expect(mockService.agregarMensaje).toHaveBeenCalledWith('c-1', {
      mensaje: 'Hola',
      usuarioId: 'u-1'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mensaje);
  });

  it('debe propagar errores a next(error)', async () => {
    const error = new Error('Fallo inesperado');
    mockService.getById.mockRejectedValue(error);
    req.params = { id: 'c-err' };

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
