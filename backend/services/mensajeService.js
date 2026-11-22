import { mensajeRepository as defaultMensajeRepository } from '../repositories/mensajeRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { extraerId } from '../utils/idUtils.js';
import {
    NotFoundError,
    ValidationError,
    ForbiddenError
} from '../errors/appError.js';

export class MensajeService {
    constructor({
        mensajeRepository = defaultMensajeRepository,
        compraRepository = defaultCompraRepository,
        usuarioRepository = defaultUsuarioRepository,
        fechaActualProvider = () => new Date()
    } = {}) {
        this.mensajeRepository = mensajeRepository;
        this.compraRepository = compraRepository;
        this.usuarioRepository = usuarioRepository;
        this.fechaActualProvider = typeof fechaActualProvider === 'function' ? fechaActualProvider : (() => new Date());
    }

    obtenerFechaActual = () => new Date(this.fechaActualProvider());

    buscarCompraOError = async (compraId) => {
        if (!compraId) throw new ValidationError('El ID de compra es obligatorio.');
        const compra = await this.compraRepository.findById(compraId);
        if (!compra) throw new NotFoundError('Compra no encontrada.');
        return compra;
    };

    validarParticipante = (compra, usuarioActual) => {
        if (!compra.puedeAcceder(usuarioActual)) {
            throw new ForbiddenError('Usuario ajeno a la compra.');
        }
    };

    obtenerMensajes = async (compraId, { usuarioActual } = {}) => {
        const compra = await this.buscarCompraOError(compraId);
        this.validarParticipante(compra, usuarioActual);

        return [...(compra.mensajes || [])].sort(
            (a, b) => new Date(a.enviado) - new Date(b.enviado)
        );
    };

    enviarMensaje = async (compraId, { texto, usuarioActual, id } = {}) => {
        if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
            throw new ValidationError('El mensaje no puede estar vacío.');
        }

        const compra = await this.buscarCompraOError(compraId);

        const usuarioId = usuarioActual?.id;
        const autor = (usuarioId && (await this.usuarioRepository?.findById?.(usuarioId))) || usuarioId;

        // La compra valida que el autor participe y registra el mensaje.
        const nuevoMensaje = compra.enviarMensaje({
            id,
            autor,
            texto,
            fechaReferencia: this.obtenerFechaActual()
        });

        await this.mensajeRepository.save(nuevoMensaje);
        await this.compraRepository.update(compra.id, compra);

        return nuevoMensaje;
    };
}

export const mensajeService = new MensajeService();
