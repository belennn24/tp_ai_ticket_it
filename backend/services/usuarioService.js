import { Usuario } from '../models/usuario.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { extraerId } from '../utils/idUtils.js';
import {
    NotFoundError,
    ValidationError,
    ConflictError
} from '../errors/appError.js';

export class UsuarioService {
    constructor(
        usuarioRepo = defaultUsuarioRepository,
        eventoRepo = defaultEventoRepository
    ) {
        this.usuarioRepository = usuarioRepo || defaultUsuarioRepository;
        this.eventoRepository = eventoRepo || defaultEventoRepository;
    }

    buscarEventoOError = async (eventoId) => {
        const evento = await this.eventoRepository.findById(eventoId);
        if (!evento) throw new NotFoundError('El evento solicitado no existe.');
        return evento;
    };

    buscarUsuarioOError = async (usuarioId) => {
        if (!usuarioId) throw new ValidationError('El ID de usuario es obligatorio.');
        const usuario = await this.usuarioRepository.findById(usuarioId);
        if (!usuario) throw new NotFoundError('Usuario no encontrado.');
        if (!Array.isArray(usuario.favoritos)) {
            usuario.favoritos = [];
        }
        return usuario;
    };

    obtenerFavoritos = async (usuarioId) => {
        const usuario = await this.buscarUsuarioOError(usuarioId);

        const eventosCompletos = [];
        for (const fav of usuario.favoritos) {
            const eventoId = extraerId(fav);
            const evento = await this.eventoRepository.findById(eventoId);
            if (evento) {
                eventosCompletos.push(evento);
            } else if (typeof fav === 'object') {
                eventosCompletos.push(fav);
            }
        }

        return eventosCompletos;
    };

    agregarFavorito = async (usuarioId, eventoId) => {
        if (!usuarioId || !eventoId) {
            throw new ValidationError('El usuarioId y el eventoId son obligatorios.');
        }

        const evento = await this.buscarEventoOError(eventoId);
        const usuario = await this.buscarUsuarioOError(usuarioId);

        if (usuario.tieneFavorito(eventoId)) {
            throw new ConflictError('El evento ya se encuentra en la lista de favoritos.');
        }

        usuario.agregarFavorito(evento);
        await this.usuarioRepository.update(usuario.id, usuario);

        return {
            mensaje: 'Evento agregado a favoritos con éxito.',
            favoritos: usuario.favoritos
        };
    };

    eliminarFavorito = async (usuarioId, eventoId) => {
        if (!usuarioId || !eventoId) {
            throw new ValidationError('El usuarioId y el eventoId son obligatorios.');
        }

        await this.buscarEventoOError(eventoId);
        const usuario = await this.buscarUsuarioOError(usuarioId);

        if (!usuario.tieneFavorito(eventoId)) {
            throw new NotFoundError('El evento no se encontraba en la lista de favoritos.');
        }

        usuario.eliminarFavorito(eventoId);
        await this.usuarioRepository.update(usuario.id, usuario);

        return {
            mensaje: 'Evento removido de favoritos con éxito.',
            favoritos: usuario.favoritos
        };
    };

    actualizarPerfil = async (usuarioId, { nombre, apellido } = {}) => {
        const usuario = await this.buscarUsuarioOError(usuarioId);
        const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : nombre;
        if (!nombreLimpio) {
            throw new ValidationError('El nombre no puede estar vacío.');
        }

        const datos = { nombre: nombreLimpio };
        if (apellido !== undefined) {
            datos.apellido = typeof apellido === 'string' ? apellido.trim() : apellido;
        }

        usuario.modificar(datos);
        await this.usuarioRepository.update(usuario.id, usuario);

        return {
            mensaje: 'Perfil actualizado con éxito.',
            usuario: usuario.aPerfilPublico()
        };
    };
}

export const usuarioService = new UsuarioService();
