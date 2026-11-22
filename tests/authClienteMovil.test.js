import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../backend/services/authService.js';
import { AuthController } from '../backend/controllers/authController.js';
import { RefreshTokenRepository } from '../backend/repositories/refreshTokenRepository.js';
import { UsuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { UnauthorizedError } from '../backend/errors/appError.js';
import { REFRESH_COOKIE_NAME } from '../backend/config/cookieConfig.js';

// La app móvil se identifica con `X-Cliente: movil` y recibe/envía el refresh token en el cuerpo.
describe('Refresh token para la app móvil (X-Cliente: movil)', () => {
  let refreshRepo;
  let controller;

  const crearRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  });
  const reqMovil = (body = {}, extra = {}) => ({ body, cookies: {}, headers: { 'x-cliente': 'movil' }, ...extra });
  const ejecutar = async (accion, req) => {
    const res = crearRes();
    const next = jest.fn();
    await controller[accion](req, res, next);
    return { res, next, cuerpo: res.json.mock.calls[0]?.[0] };
  };

  beforeEach(async () => {
    refreshRepo = new RefreshTokenRepository();
    const service = new AuthService(new UsuarioRepository(), 'secreto-test-movil', '15m', refreshRepo, '7d');
    controller = new AuthController(service);
    await service.registro({ nombre: 'Juan', email: 'juan@ticketit.com', password: '1234' });
  });

  const loginMovil = () => ejecutar('login', reqMovil({ email: 'juan@ticketit.com', password: '1234' }));

  it('login devuelve el refresh token en el cuerpo y no setea la cookie', async () => {
    const { res, cuerpo } = await loginMovil();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(cuerpo.token).toEqual(expect.any(String));
    expect(cuerpo.refreshToken).toEqual(expect.any(String));
    expect(cuerpo.usuario.email).toBe('juan@ticketit.com');
    expect(res.cookie).not.toHaveBeenCalled();
    expect(await refreshRepo.findByToken(cuerpo.refreshToken)).not.toBeNull();
  });

  it('refresh con el token en el cuerpo rota el par y devuelve el nuevo refresh token', async () => {
    const { cuerpo: sesion } = await loginMovil();

    const { res, cuerpo } = await ejecutar('refresh', reqMovil({ refreshToken: sesion.refreshToken }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(cuerpo.token).toEqual(expect.any(String));
    expect(cuerpo.refreshToken).not.toBe(sesion.refreshToken);
    expect(res.cookie).not.toHaveBeenCalled();
    // El refresh token anterior queda revocado (rotación).
    expect(await refreshRepo.findByToken(sesion.refreshToken)).toBeNull();
  });

  it('un refresh token ya usado no sirve para renovar de nuevo', async () => {
    const { cuerpo: sesion } = await loginMovil();
    await ejecutar('refresh', reqMovil({ refreshToken: sesion.refreshToken }));

    const { next } = await ejecutar('refresh', reqMovil({ refreshToken: sesion.refreshToken }));
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('para la app móvil se usa el token del cuerpo aunque llegue una cookie', async () => {
    const { cuerpo: sesion } = await loginMovil();

    const { next } = await ejecutar('refresh', reqMovil({}, { cookies: { [REFRESH_COOKIE_NAME]: sesion.refreshToken } }));
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('logout revoca el refresh token enviado en el cuerpo', async () => {
    const { cuerpo: sesion } = await loginMovil();

    const { res } = await ejecutar('logout', reqMovil({ refreshToken: sesion.refreshToken }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(await refreshRepo.findByToken(sesion.refreshToken)).toBeNull();
  });

  it('sin el encabezado, el comportamiento web no cambia: cookie y sin refresh token en el cuerpo', async () => {
    const { res, cuerpo } = await ejecutar('login', { body: { email: 'juan@ticketit.com', password: '1234' }, cookies: {}, headers: {} });

    expect(cuerpo.refreshToken).toBeUndefined();
    expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, expect.any(String), expect.objectContaining({ httpOnly: true }));
  });
});
