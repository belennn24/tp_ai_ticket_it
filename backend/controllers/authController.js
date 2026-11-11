import { authService as defaultAuthService } from '../services/authService.js';
import {
  getRefreshTokenCookieOptions,
  getClearRefreshTokenCookieOptions,
  REFRESH_COOKIE_NAME
} from '../config/cookieConfig.js';

export class AuthController {
  constructor(authService = defaultAuthService) {
    this.authService = authService;
  }

  registro = async (req, res, next) => {
    try {
      const resultado = await this.authService.registro(req.body || {});
      if (resultado.refreshToken && typeof res.cookie === 'function') {
        res.cookie(REFRESH_COOKIE_NAME, resultado.refreshToken, getRefreshTokenCookieOptions());
      }
      return res.status(201).json({
        token: resultado.token,
        usuario: resultado.usuario
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const resultado = await this.authService.login(req.body || {});
      if (resultado.refreshToken && typeof res.cookie === 'function') {
        res.cookie(REFRESH_COOKIE_NAME, resultado.refreshToken, getRefreshTokenCookieOptions());
      }
      return res.status(200).json({
        mensaje: resultado.mensaje,
        token: resultado.token,
        usuario: resultado.usuario
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const resultado = await this.authService.refresh(refreshToken);
      if (resultado.refreshToken && typeof res.cookie === 'function') {
        res.cookie(REFRESH_COOKIE_NAME, resultado.refreshToken, getRefreshTokenCookieOptions());
      }
      return res.status(200).json({
        token: resultado.token,
        usuario: resultado.usuario
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
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
