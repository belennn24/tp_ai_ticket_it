import { Usuario } from '../models/usuario.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError
} from '../errors/appError.js';

/**
 * Service de Usuarios / Favoritos.
 * Responsabilidad: Orquestar la administración de eventos favoritos de los usuarios,
 * verificando existencia de eventos y evitando duplicados.
 */
export class UsuarioService {
  constructor(
    usuarioRepo = defaultUsuarioRepository,
    eventoRepo = defaultEventoRepository
  ) {
    this.usuarioRepository = usuarioRepo || defaultUsuarioRepository;
    this.eventoRepository = eventoRepo || defaultEventoRepository;
  }

  async obtenerOUCrearUsuario(usuarioId) {
    let usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      usuario = new Usuario({
        id: String(usuarioId),
        nombre: 'Usuario',
        apellido: '',
        favoritos: []
      });
      await this.usuarioRepository.save(usuario);
    }
    if (!Array.isArray(usuario.favoritos)) {
      usuario.favoritos = [];
    }
    return usuario;
  }

  /**
   * Caso de uso: Listar eventos favoritos del usuario
   */
  async obtenerFavoritos(usuarioId) {
    if (!usuarioId) {
      throw new ValidationError('El ID de usuario es obligatorio.');
    }
    const usuario = await this.obtenerOUCrearUsuario(usuarioId);

    // Resolver objetos completos de eventos si están guardados como IDs
    const eventosCompletos = [];
    for (const fav of usuario.favoritos) {
      const eventoId = fav?.id !== undefined ? fav.id : fav;
      const evento = await this.eventoRepository.findById(eventoId);
      if (evento) {
        eventosCompletos.push(evento);
      } else if (typeof fav === 'object') {
        eventosCompletos.push(fav);
      }
    }

    return eventosCompletos;
  }

  /**
   * Caso de uso: Agregar un evento a favoritos
   */
  async agregarFavorito(usuarioId, eventoId) {
    if (!usuarioId || !eventoId) {
      throw new ValidationError('El usuarioId y el eventoId son obligatorios.');
    }

    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError('El evento solicitado no existe.');
    }

    const usuario = await this.obtenerOUCrearUsuario(usuarioId);

    if (usuario.tieneFavorito(eventoId)) {
      throw new ConflictError('El evento ya se encuentra en la lista de favoritos.');
    }

    usuario.agregarFavorito(evento);
    await this.usuarioRepository.update(usuario.id, usuario);

    return {
      mensaje: 'Evento agregado a favoritos con éxito.',
      favoritos: usuario.favoritos
    };
  }

  /**
   * Caso de uso: Eliminar un evento de favoritos
   */
  async eliminarFavorito(usuarioId, eventoId) {
    if (!usuarioId || !eventoId) {
      throw new ValidationError('El usuarioId y el eventoId son obligatorios.');
    }

    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError('El evento solicitado no existe.');
    }

    const usuario = await this.obtenerOUCrearUsuario(usuarioId);

    if (!usuario.tieneFavorito(eventoId)) {
      throw new NotFoundError('El evento no se encontraba en la lista de favoritos.');
    }

    usuario.eliminarFavorito(eventoId);
    await this.usuarioRepository.update(usuario.id, usuario);

    return {
      mensaje: 'Evento removido de favoritos con éxito.',
      favoritos: usuario.favoritos
    };
  }
}

export const usuarioService = new UsuarioService();
