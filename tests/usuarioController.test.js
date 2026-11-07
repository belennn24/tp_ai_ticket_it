import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UsuarioController } from '../backend/controllers/usuarioController.js';

describe('UsuarioController (Pruebas Unitarias)', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      obtenerFavoritos: jest.fn(),
      agregarFavorito: jest.fn(),
      eliminarFavorito: jest.fn()
    };

    controller = new UsuarioController(mockService);

    req = {
      params: {},
      user: { id: 'comprador-1', role: 'comprador' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('getFavoritos debe consultar favoritos usando req.user.id y responder 200', async () => {
    const favoritosMock = [{ id: 'ev-1', nombre: 'Recital' }];
    mockService.obtenerFavoritos.mockResolvedValue(favoritosMock);

    await controller.getFavoritos(req, res, next);

    expect(mockService.obtenerFavoritos).toHaveBeenCalledWith('comprador-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(favoritosMock);
  });

  it('agregarFavorito debe extraer eventoId de params y req.user.id y responder 200', async () => {
    const respuestaMock = { mensaje: 'Ok' };
    mockService.agregarFavorito.mockResolvedValue(respuestaMock);
    req.params = { eventoId: 'ev-2' };

    await controller.agregarFavorito(req, res, next);

    expect(mockService.agregarFavorito).toHaveBeenCalledWith('comprador-1', 'ev-2');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(respuestaMock);
  });

  it('eliminarFavorito debe extraer eventoId de params y req.user.id y responder 200', async () => {
    const respuestaMock = { mensaje: 'Eliminado' };
    mockService.eliminarFavorito.mockResolvedValue(respuestaMock);
    req.params = { eventoId: 'ev-2' };

    await controller.eliminarFavorito(req, res, next);

    expect(mockService.eliminarFavorito).toHaveBeenCalledWith('comprador-1', 'ev-2');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(respuestaMock);
  });

  it('debe propagar errores a next(error)', async () => {
    const error = new Error('No encontrado');
    mockService.obtenerFavoritos.mockRejectedValue(error);

    await controller.getFavoritos(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
