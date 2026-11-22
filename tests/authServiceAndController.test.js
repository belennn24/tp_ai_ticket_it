import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../backend/services/authService.js';
import { AuthController } from '../backend/controllers/authController.js';
import { Usuario } from '../backend/models/usuario.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../backend/errors/appError.js';

describe('AuthService y AuthController (Arquitectura Limpia)', () => {
  let mockUsuarioRepo;
  let authService;
  let authController;
  const JWT_SECRET = 'test_secret_key_123';

  beforeEach(() => {
    const usuarios = new Map();
    mockUsuarioRepo = {
      save: jest.fn(async (usuario) => {
        usuario.id = usuario.id || `usr-${Date.now()}`;
        usuarios.set(usuario.id, usuario);
        return usuario;
      }),
      findById: jest.fn(async (id) => usuarios.get(String(id)) || null),
      findByEmail: jest.fn(async (email) => {
        const norm = String(email).toLowerCase().trim();
        for (const u of usuarios.values()) {
          if (u.email && u.email.toLowerCase().trim() === norm) return u;
        }
        return null;
      })
    };

    authService = new AuthService(mockUsuarioRepo, JWT_SECRET, '1h');
    authController = new AuthController(authService);
  });

  describe('AuthService - registro', () => {
    it('debe registrar un nuevo usuario con contraseña hasheada y devolver token', async () => {
      const res = await authService.registro({
        nombre: 'Esteban',
        apellido: 'Quito',
        email: 'esteban@ticketit.com',
        password: 'PasswordSeguro123!',
        rol: 'comprador'
      });

      expect(res.token).toBeDefined();
      expect(res.usuario.nombre).toBe('Esteban');
      expect(res.usuario.email).toBe('esteban@ticketit.com');
      expect(res.usuario.rol).toBe('comprador');
      expect(mockUsuarioRepo.save).toHaveBeenCalledTimes(1);

      // Verificar que el token sea válido
      const decoded = jwt.verify(res.token, JWT_SECRET, { algorithms: ['HS256'] });
      expect(decoded.email).toBe('esteban@ticketit.com');
      expect(decoded.rol).toBe('comprador');
    });

    it('debe lanzar BadRequestError si falta el nombre, email o contraseña', async () => {
      await expect(
        authService.registro({ email: 'test@mail.com', password: '123' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        authService.registro({ nombre: 'Juan', password: '123' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        authService.registro({ nombre: 'Juan', email: 'test@mail.com' })
      ).rejects.toThrow(BadRequestError);
    });

    it('debe lanzar ConflictError si el email ya existe', async () => {
      await authService.registro({
        nombre: 'Primero',
        email: 'duplicado@ticketit.com',
        password: 'Password123!'
      });

      await expect(
        authService.registro({
          nombre: 'Segundo',
          email: 'duplicado@ticketit.com',
          password: 'OtraPassword123!'
        })
      ).rejects.toThrow(ConflictError);
    });

    it('debe rechazar el registro con un rol inexistente (admin) con BadRequestError', async () => {
      await expect(
        authService.registro({
          nombre: 'Hacker',
          email: 'admin@ticketit.com',
          password: 'Password123!',
          rol: 'admin'
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('AuthService - login con credenciales reales', () => {
    beforeEach(async () => {
      await authService.registro({
        nombre: 'Mariana',
        apellido: 'Lopez',
        email: 'mariana@ticketit.com',
        password: 'MiPassword123!',
        rol: 'organizador'
      });
    });

    it('debe autenticar con éxito ante credenciales válidas', async () => {
      const loginRes = await authService.login({
        email: 'mariana@ticketit.com',
        password: 'MiPassword123!'
      });

      expect(loginRes.token).toBeDefined();
      expect(loginRes.usuario.email).toBe('mariana@ticketit.com');
      expect(loginRes.usuario.rol).toBe('organizador');

      const payload = jwt.verify(loginRes.token, JWT_SECRET, { algorithms: ['HS256'] });
      expect(payload.email).toBe('mariana@ticketit.com');
    });

    it('debe rechazar con UnauthorizedError si la contraseña no coincide', async () => {
      await expect(
        authService.login({
          email: 'mariana@ticketit.com',
          password: 'PasswordErronea'
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('debe rechazar con UnauthorizedError si el usuario no existe', async () => {
      await expect(
        authService.login({
          email: 'inexistente@ticketit.com',
          password: 'CualquierPassword'
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('AuthService - protección contra suplantación y tokens sin contraseña', () => {
    it('debe rechazar con BadRequestError si falta el email o la contraseña y NO generar tokens sintéticos', async () => {
      await expect(
        authService.login({
          role: 'organizador',
          id: 'usr-organizador-1'
        })
      ).rejects.toThrow(BadRequestError);

      await expect(
        authService.login({ email: 'mariana@ticketit.com' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        authService.login({ password: 'MiPassword123!' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('AuthService - obtenerUsuarioPorId (/me)', () => {
    it('debe retornar el usuario si existe', async () => {
      const reg = await authService.registro({
        nombre: 'Ana',
        email: 'ana@ticketit.com',
        password: 'Pass12345!'
      });

      const res = await authService.obtenerUsuarioPorId(reg.usuario.id);
      expect(res.usuario.nombre).toBe('Ana');
      expect(res.usuario.email).toBe('ana@ticketit.com');
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      await expect(authService.obtenerUsuarioPorId('id-inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('AuthController', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('registro debe responder 201 en caso exitoso', async () => {
      req = {
        body: {
          nombre: 'Pedro',
          email: 'pedro@ticketit.com',
          password: 'Password123!'
        }
      };

      await authController.registro(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('login debe responder 200 en caso exitoso', async () => {
      await authService.registro({
        nombre: 'Pedro',
        email: 'pedro@ticketit.com',
        password: 'Password123!'
      });

      req = {
        body: {
          email: 'pedro@ticketit.com',
          password: 'Password123!'
        }
      };

      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar a next(error) ante una excepción en el servicio', async () => {
      req = { body: {} }; // Faltan campos obligatorios
      await authController.registro(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('me debe responder 200 con el usuario autenticado en req.user', async () => {
      const reg = await authService.registro({
        nombre: 'Pedro',
        email: 'pedro@ticketit.com',
        password: 'Password123!'
      });

      req = { user: { id: reg.usuario.id } };
      await authController.me(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
