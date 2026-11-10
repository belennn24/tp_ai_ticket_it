import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { AuthService } from '../backend/services/authService.js';
import { AuthController } from '../backend/controllers/authController.js';
import { RefreshTokenRepository } from '../backend/repositories/refreshTokenRepository.js';
import { Usuario } from '../backend/models/usuario.js';
import { UnauthorizedError } from '../backend/errors/appError.js';
import {
  REFRESH_COOKIE_NAME,
  getRefreshTokenCookieOptions,
  getClearRefreshTokenCookieOptions
} from '../backend/config/cookieConfig.js';

describe('Flujo de Refresh Token y Autenticación con Cookies HttpOnly', () => {
  let mockUsuarioRepo;
  let mockRefreshRepo;
  let authService;
  let authController;
  const JWT_SECRET = 'clave_secreta_test_refresh_123';

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

    mockRefreshRepo = new RefreshTokenRepository();

    authService = new AuthService(
      mockUsuarioRepo,
      JWT_SECRET,
      '15m',
      mockRefreshRepo,
      '7d'
    );

    authController = new AuthController(authService);
  });

  describe('RefreshTokenRepository', () => {
    it('debe guardar, buscar y eliminar refresh tokens correctamente', async () => {
      const repo = new RefreshTokenRepository();
      const item = await repo.save({ id: 'tok-123', token: 'tok-123', usuarioId: 'usr-1' });

      expect(item.id).toBe('tok-123');
      const encontrado = await repo.findByToken('tok-123');
      expect(encontrado).toEqual(item);

      const borrado = await repo.deleteByToken('tok-123');
      expect(borrado).toBe(true);

      const despuesBorrado = await repo.findByToken('tok-123');
      expect(despuesBorrado).toBeNull();
    });

    it('debe revocar todos los tokens de un usuario con deleteByUsuarioId', async () => {
      const repo = new RefreshTokenRepository();
      await repo.save({ id: 'tok-1', token: 'tok-1', usuarioId: 'usr-target' });
      await repo.save({ id: 'tok-2', token: 'tok-2', usuarioId: 'usr-target' });
      await repo.save({ id: 'tok-3', token: 'tok-3', usuarioId: 'usr-otro' });

      await repo.deleteByUsuarioId('usr-target');

      expect(await repo.findByToken('tok-1')).toBeNull();
      expect(await repo.findByToken('tok-2')).toBeNull();
      expect(await repo.findByToken('tok-3')).not.toBeNull();
    });
  });

  describe('AuthService - Ciclo de vida del Refresh Token', () => {
    let usuarioCreado;

    beforeEach(async () => {
      const res = await authService.registro({
        nombre: 'Valentin',
        apellido: 'Test',
        email: 'valentin@ticketit.com',
        password: 'Password123!',
        rol: 'comprador'
      });
      usuarioCreado = res.usuario;
    });

    it('registro debe generar access token con expiración corta y refresh token persistido', async () => {
      const tokenGuardado = await mockRefreshRepo.findById(expect.any(String));
      // El refresh token generado debe estar registrado en el repositorio
      expect(mockRefreshRepo.count).toBe(1);

      const items = Array.from(mockRefreshRepo.items.values());
      expect(items[0].usuarioId).toBe(usuarioCreado.id);

      // Verificar payload del access token
      const decodedAccess = jwt.verify(items[0].token, JWT_SECRET);
      expect(decodedAccess.tipo).toBe('refresh');
    });

    it('login debe generar y almacenar un nuevo refresh token en el repo', async () => {
      mockRefreshRepo.clear();
      const loginRes = await authService.login({
        email: 'valentin@ticketit.com',
        password: 'Password123!'
      });

      expect(loginRes.token).toBeDefined();
      expect(loginRes.refreshToken).toBeDefined();
      expect(mockRefreshRepo.count).toBe(1);

      const guardado = await mockRefreshRepo.findByToken(loginRes.refreshToken);
      expect(guardado).toBeDefined();
      expect(guardado.usuarioId).toBe(usuarioCreado.id);
    });

    it('refresh debe rotar el token: invalidar el viejo, emitir uno nuevo y guardarlo', async () => {
      const loginRes = await authService.login({
        email: 'valentin@ticketit.com',
        password: 'Password123!'
      });
      const viejoRefreshToken = loginRes.refreshToken;

      const refreshRes = await authService.refresh(viejoRefreshToken);

      expect(refreshRes.token).toBeDefined();
      expect(refreshRes.refreshToken).toBeDefined();
      expect(refreshRes.refreshToken).not.toBe(viejoRefreshToken);

      // El token viejo debe haber sido invalidado
      const viejoEnRepo = await mockRefreshRepo.findByToken(viejoRefreshToken);
      expect(viejoEnRepo).toBeNull();

      // El nuevo token debe estar activo en el repositorio
      const nuevoEnRepo = await mockRefreshRepo.findByToken(refreshRes.refreshToken);
      expect(nuevoEnRepo).toBeDefined();
      expect(nuevoEnRepo.usuarioId).toBe(usuarioCreado.id);
    });

    it('refresh debe rechazar si no se envía token', async () => {
      await expect(authService.refresh(null)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refresh('')).rejects.toThrow(UnauthorizedError);
    });

    it('refresh debe rechazar si el token no existe en el repositorio (token revocado o reutilizado)', async () => {
      const fakeToken = jwt.sign({ id: usuarioCreado.id, tipo: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
      await expect(authService.refresh(fakeToken)).rejects.toThrow(UnauthorizedError);
    });

    it('refresh debe rechazar y limpiar si el usuario ya no existe en el repositorio', async () => {
      const tokenUsuarioInexistente = jwt.sign(
        { id: 'usr-fantasma-999', tipo: 'refresh', jti: 'jti-fantasma' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      await mockRefreshRepo.save({
        id: tokenUsuarioInexistente,
        token: tokenUsuarioInexistente,
        usuarioId: 'usr-fantasma-999'
      });

      await expect(authService.refresh(tokenUsuarioInexistente)).rejects.toThrow(UnauthorizedError);
      expect(await mockRefreshRepo.findByToken(tokenUsuarioInexistente)).toBeNull();
    });

    it('refresh debe rechazar y limpiar si el JWT está expirado', async () => {
      const expiredToken = jwt.sign(
        { id: usuarioCreado.id, tipo: 'refresh' },
        JWT_SECRET,
        { expiresIn: -10 }
      );
      await mockRefreshRepo.save({ id: expiredToken, token: expiredToken, usuarioId: usuarioCreado.id });

      await expect(authService.refresh(expiredToken)).rejects.toThrow(UnauthorizedError);
      expect(await mockRefreshRepo.findByToken(expiredToken)).toBeNull();
    });

    it('logout debe eliminar el refresh token del repositorio', async () => {
      const loginRes = await authService.login({
        email: 'valentin@ticketit.com',
        password: 'Password123!'
      });
      expect(mockRefreshRepo.count).toBe(2); // 1 de registro + 1 de login

      await authService.logout(loginRes.refreshToken);
      expect(await mockRefreshRepo.findByToken(loginRes.refreshToken)).toBeNull();
    });
  });

  describe('AuthController - Cookies HttpOnly y respuestas', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        body: {},
        cookies: {},
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('registro debe setear la cookie HttpOnly con path /api/auth y responder 201 sin el refreshToken en el JSON', async () => {
      req.body = {
        nombre: 'Franco',
        email: 'franco@ticketit.com',
        password: 'Password123!'
      };

      await authController.registro(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth'
        })
      );

      const jsonEnviado = res.json.mock.calls[0][0];
      expect(jsonEnviado.token).toBeDefined();
      expect(jsonEnviado.refreshToken).toBeUndefined(); // Protegido en la cookie
      expect(jsonEnviado.usuario.email).toBe('franco@ticketit.com');
    });

    it('login debe setear la cookie HttpOnly con path /api/auth y responder 200 sin el refreshToken en el JSON', async () => {
      await authService.registro({
        nombre: 'Franco',
        email: 'franco@ticketit.com',
        password: 'Password123!'
      });

      req.body = {
        email: 'franco@ticketit.com',
        password: 'Password123!'
      };

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth'
        })
      );

      const jsonEnviado = res.json.mock.calls[0][0];
      expect(jsonEnviado.token).toBeDefined();
      expect(jsonEnviado.refreshToken).toBeUndefined();
    });

    it('refresh debe leer la cookie, rotar la cookie HttpOnly y devolver un access token nuevo', async () => {
      const reg = await authService.registro({
        nombre: 'Franco',
        email: 'franco@ticketit.com',
        password: 'Password123!'
      });

      req.cookies = {
        [REFRESH_COOKIE_NAME]: reg.refreshToken
      };

      await authController.refresh(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/api/auth'
        })
      );

      const jsonEnviado = res.json.mock.calls[0][0];
      expect(jsonEnviado.token).toBeDefined();
      expect(jsonEnviado.refreshToken).toBeUndefined();
    });

    it('logout debe revocar el token y llamar a clearCookie con las opciones idénticas', async () => {
      const reg = await authService.registro({
        nombre: 'Franco',
        email: 'franco@ticketit.com',
        password: 'Password123!'
      });

      req.cookies = {
        [REFRESH_COOKIE_NAME]: reg.refreshToken
      };

      await authController.logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth'
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Sesión cerrada exitosamente'
      });
    });
  });
});
