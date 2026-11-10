import { authService as defaultAuthService } from '../services/authService.js';

export class AuthController {
  constructor(authService = defaultAuthService) {
    this.authService = authService;
  }

  registro = async (req, res, next) => {
    try {
      const resultado = await this.authService.registro(req.body || {});
      return res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const resultado = await this.authService.login(req.body || {});
      return res.status(200).json(resultado);
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
