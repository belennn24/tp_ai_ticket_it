import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuario.js';
import { usuarioRepository as defaultUsuarioRepo } from '../repositories/usuarioRepository.js';
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
    tokenExpiresIn = '7d'
  ) {
    this.usuarioRepo = usuarioRepo || defaultUsuarioRepo;
    this.jwtSecret = jwtSecret || getJwtSecret();
    this.tokenExpiresIn = tokenExpiresIn;
  }

  generarToken(usuario) {
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

  formatearUsuario(usuario) {
    const rolNormalizado = String(usuario?.rol || 'comprador').toLowerCase().trim();
    return {
      id: String(usuario.id),
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || null,
      rol: rolNormalizado,
      reputacion: Number(usuario.reputacion) || 0,
      favoritos: Array.isArray(usuario.favoritos) ? usuario.favoritos : []
    };
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
    if (!['comprador', 'organizador'].includes(rolNormalizado)) {
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
    const token = this.generarToken(guardado);

    return {
      token,
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

    const token = this.generarToken(usuario);
    return {
      mensaje: 'Autenticación exitosa',
      token,
      usuario: this.formatearUsuario(usuario)
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
