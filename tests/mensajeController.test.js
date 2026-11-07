import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MensajeController } from '../backend/controllers/mensajeController.js';

describe('MensajeController (Pruebas Unitarias)', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      obtenerMensajes: jest.fn(),
      enviarMensaje: jest.fn()
    };

    controller = new MensajeController(mockService);

    req = {
      params: { id: 'compra-1' },
      body: {},
      user: { id: 'u-1', role: 'comprador' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('getMensajes debe responder 200 con la lista de mensajes usando req.user', async () => {
    const mensajesMock = [{ id: 'm-1', mensaje: 'Hola' }];
    mockService.obtenerMensajes.mockResolvedValue(mensajesMock);

    await controller.getMensajes(req, res, next);

    expect(mockService.obtenerMensajes).toHaveBeenCalledWith('compra-1', {
      usuarioActual: req.user
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mensajesMock);
  });

  it('enviarMensaje debe responder 201 con el mensaje creado usando req.user', async () => {
    const nuevoMensajeMock = { id: 'm-2', mensaje: 'Entendido' };
    mockService.enviarMensaje.mockResolvedValue(nuevoMensajeMock);
    req.body = { mensaje: 'Entendido' };

    await controller.enviarMensaje(req, res, next);

    expect(mockService.enviarMensaje).toHaveBeenCalledWith('compra-1', {
      texto: 'Entendido',
      usuarioActual: req.user
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nuevoMensajeMock);
  });

  it('debe propagar errores a next(error)', async () => {
    const error = new Error('No autorizado');
    mockService.enviarMensaje.mockRejectedValue(error);

    await controller.enviarMensaje(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
