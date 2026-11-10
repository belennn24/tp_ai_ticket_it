import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from '../backend/middlewares/authMiddleware.js';
import { UnauthorizedError, ForbiddenError } from '../backend/errors/appError.js';
import { errorHandler } from '../backend/middlewares/errorHandler.js';
import { getJwtSecret } from '../backend/config/jwtConfig.js';

describe('Auth Middlewares (Seguridad y Manejo Centralizado de Errores)', () => {
  const JWT_SECRET = 'test-secret-key';
  const originalEnvSecret = process.env.JWT_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.NODE_ENV = 'production'; // Para verificar formato de error JSON estándar
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalEnvSecret;
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('authMiddleware (JWT)', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        statusCode: null,
        data: null,
        status: jest.fn(function (code) {
          this.statusCode = code;
          return this;
        }),
        json: jest.fn(function (body) {
          this.data = body;
          return this;
        }),
        send: jest.fn(function (body) {
          this.data = body;
          return this;
        })
      };
      next = jest.fn();
    });

    it('debe propagar UnauthorizedError (401) al errorHandler si no se envía header Authorization', () => {
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('No token provided');

      // Validar que el errorHandler central responda con JSON y código 401
      errorHandler(err, req, res, () => {});
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'No token provided'
        })
      );
    });

    it('debe propagar UnauthorizedError (401) al errorHandler si el header no contiene token válido', () => {
      req.headers.authorization = 'Bearer ';

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
    });

    it('debe retornar 401 (UnauthorizedError) y NO 403 si el token es inválido', () => {
      req.headers.authorization = 'Bearer invalid-token-xyz';

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token');

      // Validar que el errorHandler procesa como JSON 401
      errorHandler(err, req, res, () => {});
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'Invalid token'
        })
      );
    });

    it('debe retornar 401 si el token está firmado con otra clave secreta', () => {
      const token = jwt.sign({ id: 'u1', role: 'admin' }, 'different-secret');
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
    });

    it('debe retornar 401 si el token está expirado', () => {
      const token = jwt.sign({ id: 'u1' }, JWT_SECRET, { expiresIn: -1 });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
    });

    it('debe decodificar el token, asignar req.user y llamar a next() sin error si el token es válido', () => {
      const payload = { id: 'u123', email: 'user@example.com', rol: 'Comprador' };
      const token = jwt.sign(payload, JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('u123');
      expect(req.user.email).toBe('user@example.com');
      expect(req.user.rol).toBe('Comprador');
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        user: undefined
      };
      res = {
        statusCode: null,
        data: null,
        status: jest.fn(function (code) {
          this.statusCode = code;
          return this;
        }),
        json: jest.fn(function (body) {
          this.data = body;
          return this;
        })
      };
      next = jest.fn();
    });

    it('debe propagar ForbiddenError (403) al errorHandler si no hay usuario en req.user', () => {
      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Forbidden');

      errorHandler(err, req, res, () => {});
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'Forbidden'
        })
      );
    });

    it('debe propagar ForbiddenError (403) si el rol del usuario no coincide con los roles requeridos', () => {
      req.user = { id: 'u1', rol: 'comprador' };
      const middleware = requireRole('admin', 'organizador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('debe llamar a next() sin error si el rol del usuario coincide con alguno de los roles requeridos', () => {
      req.user = { id: 'u1', rol: 'organizador' };
      const middleware = requireRole('admin', 'organizador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeUndefined();
    });

    it('debe admitir req.user.rol y coincidencia sin distinguir mayúsculas', () => {
      req.user = { id: 'u1', rol: 'Comprador' };
      const middleware = requireRole('comprador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeUndefined();
    });
  });

  describe('JWT Secret y Manejador de Errores 4xx (3.4 y 3.5)', () => {
    it('getJwtSecret debe fallar en producción si no existe process.env.JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';
      expect(() => getJwtSecret()).toThrow('JWT_SECRET no configurado en ambiente de producción.');
    });

    it('getJwtSecret debe devolver default en desarrollo o test si no hay variable de entorno', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'test';
      expect(getJwtSecret()).toBe('ticketit_jwt_secret_key_2026');
    });

    it('errorHandler debe responder 400 y status fail para errores con status/statusCode 400 (ej: JSON mal formado)', () => {
      const syntaxErr = new SyntaxError('Unexpected token in JSON at position 4');
      syntaxErr.status = 400; // formato típico de body-parser
      process.env.NODE_ENV = 'production';

      const res = {
        statusCode: null,
        data: null,
        status: jest.fn(function (code) {
          this.statusCode = code;
          return this;
        }),
        json: jest.fn(function (body) {
          this.data = body;
          return this;
        })
      };

      errorHandler(syntaxErr, {}, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.data).toEqual({
        status: 'fail',
        message: 'Unexpected token in JSON at position 4'
      });
    });
  });
});
