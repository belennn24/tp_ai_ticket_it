import crypto from 'crypto';
import { Resenia } from '../models/resenia.js';
import { estadoCompra } from '../models/estadoCompra.js';
import { reseniaRepository as defaultReseniaRepository } from '../repositories/reseniaRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError
} from '../errors/appError.js';

/**
 * Service de Reseñas.
 * Responsabilidad: Orquestar la creación de reseñas verificando compras previas utilizadas,
 * control de duplicados y cálculo de reputación promedio de los organizadores.
 */
export class ReseniaService {
  constructor(
    reseniaRepoOrOptions = defaultReseniaRepository,
    compraRepo = defaultCompraRepository,
    eventoRepo = defaultEventoRepository,
    usuarioRepo = defaultUsuarioRepository
  ) {
    if (
      reseniaRepoOrOptions &&
      typeof reseniaRepoOrOptions === 'object' &&
      ('reseniaRepository' in reseniaRepoOrOptions ||
        'compraRepository' in reseniaRepoOrOptions ||
        'eventoRepository' in reseniaRepoOrOptions ||
        'usuarioRepository' in reseniaRepoOrOptions)
    ) {
      this.reseniaRepository =
        reseniaRepoOrOptions.reseniaRepository || defaultReseniaRepository;
      this.compraRepository =
        reseniaRepoOrOptions.compraRepository || defaultCompraRepository;
      this.eventoRepository =
        reseniaRepoOrOptions.eventoRepository || defaultEventoRepository;
      this.usuarioRepository =
        reseniaRepoOrOptions.usuarioRepository || defaultUsuarioRepository;
    } else {
      this.reseniaRepository = reseniaRepoOrOptions || defaultReseniaRepository;
      this.compraRepository = compraRepo || defaultCompraRepository;
      this.eventoRepository = eventoRepo || defaultEventoRepository;
      this.usuarioRepository = usuarioRepo || defaultUsuarioRepository;
    }
  }

  generarId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  }

  extraerId(ref) {
    if (!ref) return '';
    return String(ref.id !== undefined ? ref.id : ref);
  }

  validarRolComprador(
    userRole,
    mensajeError = 'Solo los compradores pueden publicar reseñas.'
  ) {
    if (userRole && userRole.toLowerCase() !== 'comprador') {
      throw new ForbiddenError(mensajeError);
    }
  }

  calcularReputacionPromedio(resenias = [], valorPorDefecto = 0) {
    if (!resenias || resenias.length === 0) {
      return Number(valorPorDefecto);
    }
    const suma = resenias.reduce((acc, r) => acc + Number(r.puntuacion), 0);
    return Number((suma / resenias.length).toFixed(2));
  }

  _calcularPromedioReputacion(resenias, valorPorDefecto = 0) {
    return this.calcularReputacionPromedio(resenias, valorPorDefecto);
  }

  /**
   * Caso de uso: Publicar una nueva reseña
   */
  async create({
    eventoId,
    puntuacion,
    detalle = '',
    compradorId,
    userRole,
    ...resto
  } = {}) {
    // 1. Verificación de rol (solo compradores)
    this.validarRolComprador(userRole);

    if (!compradorId) {
      throw new ValidationError('El compradorId es obligatorio para registrar la reseña.');
    }

    // 2. Verificar que el evento exista
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError('El evento solicitado no existe.');
    }

    // 3. Regla de negocio: Verificar si ya existe una reseña del comprador para este evento
    const reseniaExistente = await this.reseniaRepository.findByCompradorYEvento(
      compradorId,
      eventoId
    );
    if (reseniaExistente) {
      throw new ConflictError('Ya existe una reseña registrada para este evento por parte del comprador.');
    }

    // 4. Regla de negocio: Debe existir al menos una compra en estado UTILIZADA
    const comprasUsuario = await this.compraRepository.findAll({
      compradorId,
      eventoId
    });

    const tieneCompraUtilizada = comprasUsuario.some(
      c => c.estado === estadoCompra.UTILIZADA
    );

    if (!tieneCompraUtilizada) {
      throw new ConflictError(
        'No se puede calificar un evento sin poseer al menos una compra en estado UTILIZADA.'
      );
    }

    // 5. Identificar al organizador del evento
    const organizadorId = this.extraerId(evento.organizador);

    // 6. Instanciar y guardar la reseña
    const nuevaResenia = new Resenia({
      id: resto.id || this.generarId(),
      comprador: compradorId,
      evento,
      detalle,
      puntuacion: Number(puntuacion)
    });
    nuevaResenia.organizador = organizadorId;

    const reseniaGuardada = await this.reseniaRepository.save(nuevaResenia);

    // 7. Actualizar la reputación del organizador si el repositorio lo contiene
    if (organizadorId && this.usuarioRepository) {
      const reseniasOrganizador = await this.reseniaRepository.findByOrganizadorId(organizadorId);
      const promedio = this.calcularReputacionPromedio(
        reseniasOrganizador,
        Number(puntuacion)
      );

      const organizadorUsuario = await this.usuarioRepository.findById(organizadorId);
      if (organizadorUsuario) {
        organizadorUsuario.reputacion = promedio;
        await this.usuarioRepository.update(organizadorId, organizadorUsuario);
      }
      reseniaGuardada.reputacionOrganizadorActualizada = promedio;
    }

    return reseniaGuardada;
  }

  crearResenia(datos) {
    return this.create(datos);
  }

  /**
   * Caso de uso: Obtener opiniones y reputación promedio de un organizador
   */
  async getByOrganizadorId(organizadorId) {
    if (!organizadorId) {
      throw new ValidationError('El ID de organizador es obligatorio.');
    }

    // Si el repositorio de usuarios tiene registros cargados, validar existencia
    if (this.usuarioRepository) {
      const usuarios = await this.usuarioRepository.findAll();
      if (usuarios.length > 0) {
        const existe = await this.usuarioRepository.findById(organizadorId);
        if (!existe) {
          throw new NotFoundError('El organizador solicitado no existe.');
        }
      }
    }

    const resenias = await this.reseniaRepository.findByOrganizadorId(organizadorId);

    const reputacionPromedio = this.calcularReputacionPromedio(resenias, 0);

    return {
      organizadorId,
      reputacionPromedio,
      totalResenias: resenias.length,
      resenias
    };
  }

  obtenerReseniasPorOrganizador(organizadorId) {
    return this.getByOrganizadorId(organizadorId);
  }
}

export const reseniaService = new ReseniaService();
