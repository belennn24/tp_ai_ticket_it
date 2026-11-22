import { authService as defaultAuthService } from '../services/authService.js';
import {
  getRefreshTokenCookieOptions,
  getClearRefreshTokenCookieOptions,
  REFRESH_COOKIE_NAME
} from '../config/cookieConfig.js';

// La app móvil se identifica con el encabezado `X-Cliente: movil`. En una app nativa no
// hay un navegador del que proteger el token con una cookie HttpOnly, y las cookies no se
// manejan igual que en la web: por eso a ese cliente el refresh token se le entrega en el
// cuerpo de la respuesta y lo devuelve en el cuerpo. Los clientes web siguen usando la cookie.
const esClienteMovil = (req) => String(req.headers?.['x-cliente'] ?? '').trim().toLowerCase() === 'movil';

const leerRefreshToken = (req) => (esClienteMovil(req)
  ? req.body?.refreshToken
  : req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken);

export class AuthController {
  constructor(authService = defaultAuthService) {
    this.authService = authService;
  }

  // Responde con la sesión iniciada o renovada: access token y usuario siempre; el refresh
  // token va en la cookie HttpOnly (web) o en el cuerpo (app móvil).
  #responderSesion = (req, res, status, resultado, extra = {}) => {
    const cuerpo = { ...extra, token: resultado.token, usuario: resultado.usuario };
    if (esClienteMovil(req)) {
      cuerpo.refreshToken = resultado.refreshToken;
    } else if (resultado.refreshToken && typeof res.cookie === 'function') {
      res.cookie(REFRESH_COOKIE_NAME, resultado.refreshToken, getRefreshTokenCookieOptions());
    }
    return res.status(status).json(cuerpo);
  };

  registro = async (req, res, next) => {
    try {
      const resultado = await this.authService.registro(req.body || {});
      return this.#responderSesion(req, res, 201, resultado);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const resultado = await this.authService.login(req.body || {});
      return this.#responderSesion(req, res, 200, resultado, { mensaje: resultado.mensaje });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const resultado = await this.authService.refresh(leerRefreshToken(req));
      return this.#responderSesion(req, res, 200, resultado);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = leerRefreshToken(req);
      await this.authService.logout(refreshToken);
      if (typeof res.clearCookie === 'function') {
        res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshTokenCookieOptions());
      }
      return res.status(200).json({
        mensaje: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req, res, next) => {
    try {
      const id = req.user?.id || req.user?.sub;
      const resultado = await this.authService.obtenerUsuarioPorId(id);
      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
