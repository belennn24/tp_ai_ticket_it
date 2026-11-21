import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuario.js';
import { usuarioRepository as defaultUsuarioRepo } from '../repositories/usuarioRepository.js';
import { refreshTokenRepository as defaultRefreshTokenRepo } from '../repositories/refreshTokenRepository.js';
import { getJwtSecret } from '../config/jwtConfig.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../errors/appError.js';

export class AuthService {
  constructor(
    usuarioRepo = defaultUsuarioRepo,
    jwtSecret = getJwtSecret(),
    tokenExpiresIn = '15m',
    refreshTokenRepo = defaultRefreshTokenRepo,
    refreshTokenExpiresIn = '7d'
  ) {
    this.usuarioRepo = usuarioRepo || defaultUsuarioRepo;
    this.jwtSecret = jwtSecret || getJwtSecret();
    this.tokenExpiresIn = tokenExpiresIn;
    this.refreshTokenRepo = refreshTokenRepo || defaultRefreshTokenRepo;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
  }

  generarAccessToken(usuario) {
    const rolNormalizado = String(usuario?.rol || 'comprador').toLowerCase().trim();
    const payload = {
      sub: String(usuario.id),
      id: String(usuario.id),
      email: usuario.email,
      rol: rolNormalizado,
      nombre: usuario.nombre
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiresIn });
  }

  generarRefreshToken(usuario) {
    const payload = {
      sub: String(usuario.id),
      id: String(usuario.id),
      email: usuario.email,
      tipo: 'refresh',
      jti: crypto.randomUUID()
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.refreshTokenExpiresIn });
  }

  formatearUsuario(usuario) {
    return usuario.aPerfilPublico();
  }

  async registrarRefreshToken(token, usuarioId) {
    await this.refreshTokenRepo.save({
      id: token,
      token,
      usuarioId: String(usuarioId),
      createdAt: new Date()
    });
  }

  async registro({ nombre, apellido = '', email, password, contrasenia, rol = 'comprador' }) {
    const passwordIngresado = password || contrasenia;
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      throw new BadRequestError('El nombre del usuario es obligatorio.');
    }
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestError('El email es obligatorio.');
    }
    if (!passwordIngresado || typeof passwordIngresado !== 'string' || passwordIngresado.trim().length === 0) {
      throw new BadRequestError('La contraseña es obligatoria.');
    }

    const emailNormalizado = email.toLowerCase().trim();
    const rolNormalizado = String(rol || 'comprador').toLowerCase().trim();
    if (rolNormalizado === 'admin') {
      throw new BadRequestError('No está permitido el autorregistro con rol de administrador.');
    }
    if (!Usuario.ROLES_REGISTRABLES.includes(rolNormalizado)) {
      throw new BadRequestError('Rol de usuario no permitido para registro.');
    }

    const existente = await this.usuarioRepo.findByEmail(emailNormalizado);
    if (existente) {
      throw new ConflictError('El email ya se encuentra registrado.');
    }

    const passwordHash = await bcryptjs.hash(passwordIngresado, 10);
    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      apellido: (apellido || '').trim(),
      email: emailNormalizado,
      rol: rolNormalizado,
      passwordHash
    });

    const guardado = await this.usuarioRepo.save(nuevoUsuario);
    const token = this.generarAccessToken(guardado);
    const refreshToken = this.generarRefreshToken(guardado);
    await this.registrarRefreshToken(refreshToken, guardado.id);

    return {
      token,
      refreshToken,
      usuario: this.formatearUsuario(guardado)
    };
  }

  async login({ email, password, contrasenia } = {}) {
    const passwordIngresado = password || contrasenia;
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestError('El email es obligatorio.');
    }
    if (!passwordIngresado || typeof passwordIngresado !== 'string' || passwordIngresado.trim().length === 0) {
      throw new BadRequestError('La contraseña es obligatoria.');
    }

    const emailNormalizado = email.toLowerCase().trim();
    const usuario = await this.usuarioRepo.findByEmail(emailNormalizado);

    if (!usuario || !usuario.passwordHash) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    const passwordValido = await bcryptjs.compare(passwordIngresado, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    const token = this.generarAccessToken(usuario);
    const refreshToken = this.generarRefreshToken(usuario);
    await this.registrarRefreshToken(refreshToken, usuario.id);

    return {
      mensaje: 'Autenticación exitosa',
      token,
      refreshToken,
      usuario: this.formatearUsuario(usuario)
    };
  }

  async refresh(refreshToken) {
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
      throw new UnauthorizedError('Token de actualización no proporcionado.');
    }

    const tokenGuardado = await this.refreshTokenRepo.findById(refreshToken);
    if (!tokenGuardado) {
      throw new UnauthorizedError('Token de actualización inválido o revocado.');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, this.jwtSecret, { algorithms: ['HS256'] });
    } catch (err) {
      await this.refreshTokenRepo.delete(refreshToken);
      throw new UnauthorizedError('Token de actualización expirado o inválido.');
    }

    const usuarioId = decoded.id || decoded.sub;
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) {
      await this.refreshTokenRepo.delete(refreshToken);
      throw new UnauthorizedError('Usuario no encontrado.');
    }

    // Rotación: invalidar el token anterior y emitir un nuevo par
    await this.refreshTokenRepo.delete(refreshToken);

    const nuevoAccessToken = this.generarAccessToken(usuario);
    const nuevoRefreshToken = this.generarRefreshToken(usuario);
    await this.registrarRefreshToken(nuevoRefreshToken, usuario.id);

    return {
      token: nuevoAccessToken,
      refreshToken: nuevoRefreshToken,
      usuario: this.formatearUsuario(usuario)
    };
  }

  async logout(refreshToken) {
    if (refreshToken && typeof refreshToken === 'string') {
      await this.refreshTokenRepo.delete(refreshToken);
    }
    return {
      mensaje: 'Sesión cerrada exitosamente'
    };
  }

  async obtenerUsuarioPorId(id) {
    if (!id) {
      throw new BadRequestError('El ID de usuario es obligatorio.');
    }
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado.');
    }
    return {
      usuario: this.formatearUsuario(usuario)
    };
  }
}

export const authService = new AuthService();
