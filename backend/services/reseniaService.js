import { Resenia } from '../models/resenia.js';
import { Usuario } from '../models/usuario.js';
import { reseniaRepository as defaultReseniaRepository } from '../repositories/reseniaRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { extraerId } from '../utils/idUtils.js';
import {
    NotFoundError,
    ValidationError,
    ConflictError,
    ForbiddenError
} from '../errors/appError.js';

export class ReseniaService {
    constructor({
        reseniaRepository = defaultReseniaRepository,
        compraRepository = defaultCompraRepository,
        eventoRepository = defaultEventoRepository,
        usuarioRepository = defaultUsuarioRepository
    } = {}) {
        this.reseniaRepository = reseniaRepository;
        this.compraRepository = compraRepository;
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    extraerId = extraerId;

    calcularReputacionPromedio = (resenias = [], valorPorDefecto = 0) => {
        return Usuario.calcularPromedioReputacion(resenias, valorPorDefecto);
    };

    create = async ({
        eventoId,
        puntuacion,
        detalle = '',
        compradorId,
        ...resto
    } = {}) => {
        if (!compradorId) {
            throw new ValidationError('El compradorId es obligatorio para registrar la reseña.');
        }

        const evento = await this.eventoRepository.findById(eventoId);
        if (!evento) throw new NotFoundError('El evento solicitado no existe.');

        const reseniaExistente = await this.reseniaRepository.findByCompradorYEvento(
            compradorId,
            eventoId
        );
        if (reseniaExistente) {
            throw new ConflictError('Ya existe una reseña registrada para este evento por parte del comprador.');
        }

        const comprasDelComprador = await this.compraRepository.findAll({ compradorId, eventoId });
        const comprador = await this.usuarioRepository.findById(compradorId);
        if (!comprador) throw new NotFoundError('Comprador no encontrado.');

        // La regla de elegibilidad (compra UTILIZADA) vive en el dominio.
        const nuevaResenia = Resenia.crear({
            id: resto.id,
            comprador,
            evento,
            comprasDelComprador,
            puntuacion,
            detalle
        });
        const organizadorId = nuevaResenia.organizador;

        const reseniaGuardada = await this.reseniaRepository.save(nuevaResenia);

        if (organizadorId && this.usuarioRepository) {
            const reseniasOrganizador = await this.reseniaRepository.findByOrganizadorId(organizadorId);
            const organizadorUsuario = await this.usuarioRepository.findById(organizadorId);

            if (organizadorUsuario) {
                organizadorUsuario.recalcularReputacion(reseniasOrganizador, Number(puntuacion));
                await this.usuarioRepository.update(organizadorId, organizadorUsuario);
            }
        }

        return reseniaGuardada;
    };

    getByOrganizadorId = async (organizadorId) => {
        if (!organizadorId) {
            throw new ValidationError('El ID de organizador es obligatorio.');
        }

        if (this.usuarioRepository) {
            const existe = await this.usuarioRepository.findById(organizadorId);
            if (!existe) throw new NotFoundError('El organizador solicitado no existe.');
        }

        const resenias = await this.reseniaRepository.findByOrganizadorId(organizadorId);
        const reputacionPromedio = Usuario.calcularPromedioReputacion(resenias, 0);

        return {
            organizadorId,
            reputacionPromedio,
            totalResenias: resenias.length,
            resenias
        };
    };
}

export const reseniaService = new ReseniaService();
