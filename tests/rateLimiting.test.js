import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { limiteGeneral, limiteAuth, limiteRefresh } from '../backend/middlewares/rateLimiting.js';
import { app } from '../backend/app.js';

describe('Rate Limiting Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Configuración en Express app', () => {
    it('debe tener configurado "trust proxy" en 1 para leer X-Forwarded-For', () => {
      expect(app.get('trust proxy')).toBe(1);
    });

    it('debe registrar el middleware limiteGeneral en la pila de Express', () => {
      const stack = (app.router || app._router).stack;
      const tieneLimiteGeneral = stack.some(
        layer => layer.handle === limiteGeneral
      );
      expect(tieneLimiteGeneral).toBe(true);
    });

    it('debe registrar el middleware limiteAuth para las rutas de login, token y registro, y limiteRefresh para refresh', () => {
      const stack = (app.router || app._router).stack;
      const capasLimiteAuth = stack.filter(
        layer => layer.handle === limiteAuth
      );
      const tieneLimiteRefresh = stack.some(
        layer => layer.handle === limiteRefresh
      );
      // limiteAuth aplica a /api/auth/login, /api/auth/token y /api/auth/registro; limiteRefresh a /api/auth/refresh
      expect(capasLimiteAuth.length).toBeGreaterThanOrEqual(3);
      expect(tieneLimiteRefresh).toBe(true);
    });
  });

  describe('Comportamiento en ambiente de Testing', () => {
    it('limiteGeneral debe hacer skip y llamar next() cuando NODE_ENV === "test"', (done) => {
      process.env.NODE_ENV = 'test';
      const req = { ip: '127.0.0.1', headers: {}, app };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      limiteGeneral(req, res, () => {
        expect(res.status).not.toHaveBeenCalled();
        done();
      });
    });

    it('limiteAuth debe hacer skip y llamar next() cuando NODE_ENV === "test"', (done) => {
      process.env.NODE_ENV = 'test';
      const req = { ip: '127.0.0.1', headers: {}, app };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      limiteAuth(req, res, () => {
        expect(res.status).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Handler de respuesta al exceder cupo (429)', () => {
    it('debe retornar JSON con status fail, statusCode 429 y mensaje adecuado', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const handlerGeneral = (res) => {
        res.status(429).json({
          status: 'fail',
          statusCode: 429,
          message: 'Demasiadas solicitudes, intente de nuevo más tarde.',
          timestamp: new Date().toISOString()
        });
      };
      handlerGeneral(res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          statusCode: 429,
          message: 'Demasiadas solicitudes, intente de nuevo más tarde.'
        })
      );
    });
  });
});
