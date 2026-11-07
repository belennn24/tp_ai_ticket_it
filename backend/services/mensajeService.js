import { Mensaje } from '../models/mensaje.js';
import { mensajeRepository as defaultMensajeRepository } from '../repositories/mensajeRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError
} from '../errors/appError.js';

/**
 * Service de Mensajes (Chat de Compras).
 * Responsabilidad: Orquestar el canal bidireccional entre comprador y organizador,
 * verificando pertenencia estricta a la orden de compra.
 */
export class MensajeService {
  constructor(
    mensajeRepo = defaultMensajeRepository,
    compraRepo = defaultCompraRepository
  ) {
    this.mensajeRepository = mensajeRepo || defaultMensajeRepository;
    this.compraRepository = compraRepo || defaultCompraRepository;
  }

  validarParticipante(compra, usuarioActual) {
    if (!usuarioActual) return;
    const userId = String(usuarioActual.id || usuarioActual);
    const compradorId = String(
      compra.comprador?.id !== undefined ? compra.comprador.id : compra.comprador
    );
    const organizadorId = String(
      compra.evento?.organizador?.id !== undefined
        ? compra.evento.organizador.id
        : compra.evento?.organizador || ''
    );

    if (userId !== compradorId && userId !== organizadorId) {
      throw new ForbiddenError('Usuario ajeno a la compra.');
    }
  }

  /**
   * Caso de uso: Listar mensajes del chat ordenados cronológicamente
   */
  async obtenerMensajes(compraId, { usuarioActual } = {}) {
    if (!compraId) {
      throw new ValidationError('El ID de compra es obligatorio.');
    }

    const compra = await this.compraRepository.findById(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }

    this.validarParticipante(compra, usuarioActual);

    // Obtener del repositorio de mensajes y combinar con compra.mensajes
    const mensajesRepo = await this.mensajeRepository.findByCompraId(compraId);
    if (mensajesRepo.length > 0) {
      return mensajesRepo;
    }

    return (compra.mensajes || []).sort(
      (a, b) => new Date(a.enviado) - new Date(b.enviado)
    );
  }

  /**
   * Caso de uso: Enviar un mensaje en el chat de la compra
   */
  async enviarMensaje(compraId, { texto, usuarioActual, id } = {}) {
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
      throw new ValidationError('El mensaje no puede estar vacío.');
    }

    const compra = await this.compraRepository.findById(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }

    this.validarParticipante(compra, usuarioActual);

    const nuevoMensaje = new Mensaje({
      id,
      usuario: usuarioActual?.id || 'ANONIMO',
      mensaje: texto.trim(),
      enviado: new Date()
    });
    nuevoMensaje.compra = compraId;

    await this.mensajeRepository.save(nuevoMensaje);

    if (!Array.isArray(compra.mensajes)) {
      compra.mensajes = [];
    }
    compra.mensajes.push(nuevoMensaje);
    await this.compraRepository.update(compra.id, compra);

    return nuevoMensaje;
  }
}

export const mensajeService = new MensajeService();
