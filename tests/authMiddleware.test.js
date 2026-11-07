import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authMiddleware, basicAuth, requireRole } from '../backend/middlewares/authMiddleware.js';

describe('Auth Middlewares', () => {
  const JWT_SECRET = 'test-secret-key';
  const originalEnvSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalEnvSecret;
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
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('debe retornar 401 "No token provided" si no se envía header Authorization', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('No token provided');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 401 "No token provided" si el header Authorization no contiene token', () => {
      req.headers.authorization = 'Bearer ';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('No token provided');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Invalid token" si el token es inválido', () => {
      req.headers.authorization = 'Bearer invalid-token-xyz';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid token');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Invalid token" si el token está firmado con otra clave secreta', () => {
      const token = jwt.sign({ id: 'u1', role: 'admin' }, 'different-secret');
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid token');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Invalid token" si el token está expirado', () => {
      const token = jwt.sign({ id: 'u1' }, JWT_SECRET, { expiresIn: -1 });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid token');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe decodificar el token, asignar req.user y llamar a next() si el token es válido', () => {
      const payload = { id: 'u123', email: 'user@example.com', rol: 'Comprador' };
      const token = jwt.sign(payload, JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('u123');
      expect(req.user.email).toBe('user@example.com');
      expect(req.user.rol).toBe('Comprador');
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
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
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('debe retornar 403 "Forbidden" si no hay usuario en req.user', () => {
      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Forbidden');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Forbidden" si el rol del usuario no coincide con los roles requeridos', () => {
      req.user = { id: 'u1', role: 'comprador' };
      const middleware = requireRole('admin', 'organizador');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Forbidden');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar a next() si el rol del usuario coincide con alguno de los roles requeridos', () => {
      req.user = { id: 'u1', role: 'organizador' };
      const middleware = requireRole('admin', 'organizador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('debe admitir req.user.rol y coincidencia sin distinguir mayúsculas', () => {
      req.user = { id: 'u1', rol: 'Comprador' };
      const middleware = requireRole('comprador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('basicAuth', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('debe retornar 401 "Auth required" si falta el header Authorization', () => {
      basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Auth required');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 401 "Auth required" si el header no empieza con "Basic "', () => {
      req.headers.authorization = 'Bearer token123';

      basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Auth required');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar a next() si las credenciales son válidas (admin:1234)', () => {
      const credentials = Buffer.from('admin:1234').toString('base64');
      req.headers.authorization = `Basic ${credentials}`;

      basicAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Invalid credentials" si el usuario o contraseña no coinciden', () => {
      const credentials = Buffer.from('admin:wrongpass').toString('base64');
      req.headers.authorization = `Basic ${credentials}`;

      basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid credentials');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Invalid credentials" si el usuario no es admin', () => {
      const credentials = Buffer.from('user:1234').toString('base64');
      req.headers.authorization = `Basic ${credentials}`;

      basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid credentials');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 403 "Invalid credentials" si la cadena base64 es inválida', () => {
      req.headers.authorization = 'Basic ???notbase64???';

      basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid credentials');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
