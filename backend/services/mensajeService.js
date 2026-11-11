import { Mensaje } from '../models/mensaje.js';
import { mensajeRepository as defaultMensajeRepository } from '../repositories/mensajeRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { extraerId } from '../utils/idUtils.js';
import {
    NotFoundError,
    ValidationError,
    ForbiddenError
} from '../errors/appError.js';

export class MensajeService {
    constructor(
        mensajeRepoOrOptions = defaultMensajeRepository,
        compraRepo = defaultCompraRepository,
        fechaActualProvider = () => new Date()
    ) {
        if (
            mensajeRepoOrOptions &&
            typeof mensajeRepoOrOptions === 'object' &&
            ('mensajeRepository' in mensajeRepoOrOptions ||
             'compraRepository' in mensajeRepoOrOptions ||
             'fechaActualProvider' in mensajeRepoOrOptions)
        ) {
            this.mensajeRepository = mensajeRepoOrOptions.mensajeRepository || defaultMensajeRepository;
            this.compraRepository = mensajeRepoOrOptions.compraRepository || defaultCompraRepository;
            this.fechaActualProvider = typeof mensajeRepoOrOptions.fechaActualProvider === 'function'
                ? mensajeRepoOrOptions.fechaActualProvider
                : (() => new Date());
        } else {
            this.mensajeRepository = mensajeRepoOrOptions || defaultMensajeRepository;
            this.compraRepository = compraRepo || defaultCompraRepository;
            this.fechaActualProvider = typeof fechaActualProvider === 'function' ? fechaActualProvider : (() => new Date());
        }
    }

    obtenerFechaActual = () => new Date(this.fechaActualProvider());

    buscarCompraOError = async (compraId) => {
        if (!compraId) throw new ValidationError('El ID de compra es obligatorio.');
        const compra = await this.compraRepository.findById(compraId);
        if (!compra) throw new NotFoundError('Compra no encontrada.');
        return compra;
    };

    validarParticipante = (compra, usuarioActual) => {
        if (!usuarioActual) return;
        if (!compra.puedeAcceder(usuarioActual)) {
            throw new ForbiddenError('Usuario ajeno a la compra.');
        }
    };

    obtenerMensajes = async (compraId, { usuarioActual } = {}) => {
        const compra = await this.buscarCompraOError(compraId);
        this.validarParticipante(compra, usuarioActual);

        const mensajesRepo = await this.mensajeRepository.findByCompraId(compraId);
        if (mensajesRepo.length > 0) {
            return mensajesRepo;
        }

        return (compra.mensajes || []).sort(
            (a, b) => new Date(a.enviado) - new Date(b.enviado)
        );
    };

    enviarMensaje = async (compraId, { texto, usuarioActual, id } = {}) => {
        if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
            throw new ValidationError('El mensaje no puede estar vacío.');
        }

        const compra = await this.buscarCompraOError(compraId);
        this.validarParticipante(compra, usuarioActual);

        const nuevoMensaje = new Mensaje({
            id,
            usuario: usuarioActual?.id || 'ANONIMO',
            mensaje: texto.trim(),
            enviado: this.obtenerFechaActual()
        });
        nuevoMensaje.compra = compraId;

        await this.mensajeRepository.save(nuevoMensaje);

        if (typeof compra.agregarMensaje === 'function') {
            compra.agregarMensaje(nuevoMensaje);
        } else {
            if (!Array.isArray(compra.mensajes)) {
                compra.mensajes = [];
            }
            compra.mensajes.push(nuevoMensaje);
        }
        await this.compraRepository.update(compra.id, compra);

        return nuevoMensaje;
    };
}

export const mensajeService = new MensajeService();
