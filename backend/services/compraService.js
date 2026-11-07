import crypto from 'crypto';
import { Compra } from '../models/compra.js';
import { CambioEstadoCompra } from '../models/cambioEstadoCompra.js';
import { Mensaje } from '../models/mensaje.js';
import { estadoCompra } from '../models/estadoCompra.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { cambioEstadoCompraRepository as defaultCambioEstadoCompraRepository } from '../repositories/cambioEstadoCompraRepository.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError
} from '../errors/appError.js';


export class CompraService {
  constructor(
    compraRepoOrOptions = defaultCompraRepository,
    eventoRepo = defaultEventoRepository,
    cambioRepo = defaultCambioEstadoCompraRepository
  ) {
    if (
      compraRepoOrOptions &&
      typeof compraRepoOrOptions === 'object' &&
      ('compraRepository' in compraRepoOrOptions ||
        'eventoRepository' in compraRepoOrOptions ||
        'cambioEstadoCompraRepository' in compraRepoOrOptions ||
        'fechaActualProvider' in compraRepoOrOptions)
    ) {
      this.compraRepository =
        compraRepoOrOptions.compraRepository || defaultCompraRepository;
      this.eventoRepository =
        compraRepoOrOptions.eventoRepository || defaultEventoRepository;
      this.cambioEstadoCompraRepository =
        compraRepoOrOptions.cambioEstadoCompraRepository ||
        defaultCambioEstadoCompraRepository;
      this.fechaActualProvider =
        compraRepoOrOptions.fechaActualProvider || (() => new Date());
    } else {
      this.compraRepository = compraRepoOrOptions || defaultCompraRepository;
      this.eventoRepository = eventoRepo || defaultEventoRepository;
      this.cambioEstadoCompraRepository =
        cambioRepo || defaultCambioEstadoCompraRepository;
      this.fechaActualProvider = () => new Date();
    }
  }

  obtenerFechaActual() {
    return new Date(this.fechaActualProvider());
  }

  extraerId(ref) {
    if (!ref) return '';
    return String(ref.id !== undefined ? ref.id : ref);
  }

  calcularDiasFaltantes(fechaEvento) {
    if (!fechaEvento) return null;
    const fechaEv = new Date(fechaEvento);
    if (isNaN(fechaEv.getTime())) return null;

    const ahora = this.obtenerFechaActual();
    const diffMs = fechaEv.getTime() - ahora.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  async obtenerFechaEvento(eventoRef) {
    if (!eventoRef) return null;
    if (eventoRef.fecha) {
      return new Date(eventoRef.fecha);
    }
    const eventoId = this.extraerId(eventoRef);
    if (eventoId && this.eventoRepository) {
      const evento = await this.eventoRepository.findById(eventoId);
      if (evento && evento.fecha) {
        return new Date(evento.fecha);
      }
    }
    return null;
  }

  async enriquecerConDiasFaltantes(compra) {
    if (!compra) return compra;
    if (compra.estado === estadoCompra.CONFIRMADA) {
      const fecha = await this.obtenerFechaEvento(compra.evento);
      compra.diasFaltantes = this.calcularDiasFaltantes(fecha);
    } else {
      compra.diasFaltantes = null;
    }
    return compra;
  }

  async enriquecerColeccion(compras = []) {
    return Promise.all(compras.map(c => this.enriquecerConDiasFaltantes(c)));
  }

  /**
   * Caso de uso: Adquirir entradas (crear compra)
   */
  async create({
    eventoId,
    tipoEntradaId,
    cantidad,
    compradorId,
    total,
    ...resto
  } = {}) {
    if (!eventoId || !tipoEntradaId || cantidad === undefined || cantidad === null) {
      throw new ValidationError('Faltan campos obligatorios para crear la compra.');
    }

    const cantidadNum = Number(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      throw new ValidationError('La cantidad de entradas debe ser un número entero positivo.');
    }

    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError('El evento solicitado no existe.');
    }

    const tipoEntrada = (evento.tiposEntrada || []).find(
      t => String(t.id) === String(tipoEntradaId)
    );
    if (!tipoEntrada) {
      throw new NotFoundError('El tipo de entrada solicitado no existe en este evento.');
    }

    // Regla de dominio: validar cupo disponible
    if (!tipoEntrada.hayCupoPara(cantidadNum)) {
      throw new ConflictError('No hay cupos suficientes para el tipo de entrada seleccionado.');
    }

    // Decrementar cupo del tipo de entrada
    tipoEntrada.cupo -= cantidadNum;
    if (this.eventoRepository.update) {
      await this.eventoRepository.update(evento.id, evento);
    }

    const totalCalculado =
      total !== undefined ? Number(total) : cantidadNum * (Number(tipoEntrada.precio) || 0);

    const nuevaCompra = new Compra({
      id: resto.id,
      comprador: compradorId,
      evento,
      tipoEntrada,
      cantidad: cantidadNum,
      total: totalCalculado,
      estado: estadoCompra.CONFIRMADA,
      mensajes: []
    });

    const compraGuardada = await this.compraRepository.save(nuevaCompra);

    // Registro de auditoría
    await this.registrarCambioEstado(
      compraGuardada.id,
      estadoCompra.CONFIRMADA,
      compradorId || 'COMPRADOR'
    );

    return this.enriquecerConDiasFaltantes(compraGuardada);
  }

  crearCompra(datos) {
    return this.create(datos);
  }

  /**
   * Caso de uso: Listar compras con filtros
   */
  async getAll(filtros = {}) {
    const compras = await this.compraRepository.findAll(filtros);
    return this.enriquecerColeccion(compras);
  }

  obtenerCompras(filtros) {
    return this.getAll(filtros);
  }

  validarAccesoCompra(compra, usuarioActual) {
    if (!usuarioActual) return;
    const userId = this.extraerId(usuarioActual);
    const compradorId = this.extraerId(compra.comprador);
    const organizadorId = this.extraerId(compra.evento?.organizador);

    if (userId !== compradorId && userId !== organizadorId) {
      throw new ForbiddenError('Usuario ajeno a la compra o evento.');
    }
  }

  validarEsComprador(compra, usuarioActual) {
    if (!usuarioActual) return;
    const rol = usuarioActual.role || usuarioActual.rol;
    if (rol && rol.toLowerCase() !== 'comprador') {
      throw new ForbiddenError('Solo el comprador puede cancelar la compra.');
    }
    if (this.extraerId(usuarioActual) !== this.extraerId(compra.comprador)) {
      throw new ForbiddenError('La compra no pertenece al comprador autenticado.');
    }
  }

  validarEsOrganizadorEvento(compra, usuarioActual) {
    if (!usuarioActual) return;
    const rol = usuarioActual.role || usuarioActual.rol;
    if (rol && rol.toLowerCase() !== 'organizador') {
      throw new ForbiddenError('Solo el organizador puede utilizar la compra.');
    }
    if (this.extraerId(usuarioActual) !== this.extraerId(compra.evento?.organizador)) {
      throw new ForbiddenError('El organizador no es dueño del evento asociado a la compra.');
    }
  }

  /**
   * Método auxiliar para validar que exista una compra o lanzar NotFoundError.
   * @param {string|object} id - ID de la compra o entidad con propiedad id
   * @returns {Promise<Compra>}
   */
  async validarExistenciaCompra(id) {
    const compraId = this.extraerId(id);
    const compra = await this.compraRepository.findById(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }
    return compra;
  }

  validarCompraExistente(id) {
    return this.validarExistenciaCompra(id);
  }

  /**
   * Método auxiliar para registrar un cambio de estado en la auditoría de la compra.
   * @param {string|object} compra - ID de la compra, instancia de compra u objeto de opciones
   * @param {string} [estado] - Nuevo estado de la compra
   * @param {string} [quien] - Identificador o rol de quien realiza el cambio
   * @returns {Promise<CambioEstadoCompra>}
   */
  async registrarCambioEstado(compra, estado, quien) {
    let compraId;
    let nuevoEstado = estado;
    let usuarioQuien = quien;

    if (
      compra &&
      typeof compra === 'object' &&
      !('actualizarEstado' in compra) &&
      ('compraId' in compra || ('compra' in compra && 'quien' in compra))
    ) {
      compraId =
        compra.compraId ||
        (compra.compra?.id !== undefined ? compra.compra.id : compra.compra) ||
        compra.id;
      nuevoEstado = compra.estado !== undefined ? compra.estado : nuevoEstado;
      usuarioQuien = compra.quien !== undefined ? compra.quien : usuarioQuien;
    } else {
      compraId =
        compra && typeof compra === 'object' && compra.id !== undefined
          ? compra.id
          : compra;
    }

    const cambio = new CambioEstadoCompra({
      compra: compraId,
      estado: nuevoEstado,
      quien: usuarioQuien || 'SISTEMA',
      fechaHora: this.obtenerFechaActual()
    });

    return this.cambioEstadoCompraRepository.save(cambio);
  }

  guardarCambioEstado(...args) {
    return this.registrarCambioEstado(...args);
  }

  /**
   * Método auxiliar para verificar que el evento de una compra no haya finalizado o expirado.
   * @param {object|string} eventoRef
   * @param {string} mensajeError
   */
  async validarEventoNoFinalizado(eventoRef, mensajeError = 'El evento ya finalizó.') {
    const fechaEvento = await this.obtenerFechaEvento(eventoRef);
    if (fechaEvento && fechaEvento.getTime() < this.obtenerFechaActual().getTime()) {
      throw new ConflictError(mensajeError);
    }
  }

  /**
   * Método auxiliar para restituir cupos al cancelar una compra.
   * @param {Compra} compra
   */
  async restituirCupo(compra) {
    let cupoRestituido = false;
    const eventoId = this.extraerId(compra.evento);
    if (eventoId && this.eventoRepository) {
      const evento = await this.eventoRepository.findById(eventoId);
      if (evento && evento.tiposEntrada) {
        const tipoEntradaId = this.extraerId(compra.tipoEntrada);
        const tipo = evento.tiposEntrada.find(
          t => this.extraerId(t) === tipoEntradaId
        );
        if (tipo) {
          tipo.cupo = (Number(tipo.cupo) || 0) + compra.cantidad;
          if (compra.tipoEntrada && compra.tipoEntrada !== tipo) {
            compra.tipoEntrada.cupo = tipo.cupo;
          }
          if (this.eventoRepository.update) {
            await this.eventoRepository.update(evento.id, evento);
          }
          cupoRestituido = true;
        }
      }
    }

    if (!cupoRestituido && compra.tipoEntrada) {
      compra.tipoEntrada.cupo = (Number(compra.tipoEntrada.cupo) || 0) + compra.cantidad;
    }
  }

  /**
   * Método auxiliar para actualizar el estado de una compra, persistir el cambio,
   * registrar la auditoría correspondiente y limpiar diasFaltantes.
   * @param {Compra} compra
   * @param {string} nuevoEstado
   * @param {string} quien
   * @returns {Promise<Compra>}
   */
  async actualizarEstadoYAuditar(compra, nuevoEstado, quien) {
    compra.actualizarEstado(nuevoEstado);
    const compraActualizada = await this.compraRepository.update(compra.id, compra);
    await this.registrarCambioEstado(compra.id, nuevoEstado, quien);
    compraActualizada.diasFaltantes = null;
    return compraActualizada;
  }

  /**
   * Caso de uso: Obtener detalle de una compra por ID
   */
  async getById(id, { usuarioActual } = {}) {
    const compra = await this.validarExistenciaCompra(id);
    this.validarAccesoCompra(compra, usuarioActual);
    return this.enriquecerConDiasFaltantes(compra);
  }

  /**
   * Caso de uso: Obtener compras asociadas a un evento
   */
  async getByEventoId(eventoId, { usuarioActual } = {}) {
    const compras = await this.compraRepository.findByEventoId(eventoId);
    if (usuarioActual) {
      compras.forEach(c => this.validarAccesoCompra(c, usuarioActual));
    }
    return this.enriquecerColeccion(compras);
  }

  /**
   * Caso de uso: Obtener cronología / auditoría de estados de una compra
   */
  async getHistorial(id, { usuarioActual } = {}) {
    const compra = await this.validarExistenciaCompra(id);
    this.validarAccesoCompra(compra, usuarioActual);
    return this.cambioEstadoCompraRepository.findByCompraId(id);
  }

  /**
   * Caso de uso: Cancelar una compra y restituir cupo
   */
  async cancelar(id, { motivo, quien, usuarioActual } = {}) {
    const compra = await this.validarExistenciaCompra(id);

    this.validarEsComprador(compra, usuarioActual);

    if (
      compra.estado === estadoCompra.UTILIZADA ||
      compra.estado === estadoCompra.CANCELADA
    ) {
      throw new ConflictError('No se puede cancelar una compra que ya fue utilizada o cancelada.');
    }

    await this.validarEventoNoFinalizado(
      compra.evento,
      'No se puede cancelar una compra de un evento que ya finalizó o expiró.'
    );

    await this.restituirCupo(compra);

    const usuarioResponsable = usuarioActual?.id || quien || compra.comprador;
    return this.actualizarEstadoYAuditar(
      compra,
      estadoCompra.CANCELADA,
      usuarioResponsable
    );
  }

  cancelarCompra(id, opciones) {
    return this.cancelar(id, opciones);
  }

  /**
   * Caso de uso: Marcar una compra como utilizada en el ingreso
   */
  async utilizar(id, { quien, usuarioActual } = {}) {
    const compra = await this.validarExistenciaCompra(id);

    this.validarEsOrganizadorEvento(compra, usuarioActual);

    if (compra.estado !== estadoCompra.CONFIRMADA) {
      throw new ConflictError('Solo se pueden utilizar compras en estado CONFIRMADA.');
    }

    await this.validarEventoNoFinalizado(
      compra.evento,
      'No se puede utilizar una compra de un evento que ya finalizó.'
    );

    const usuarioResponsable = usuarioActual?.id || quien || 'ORGANIZADOR';
    return this.actualizarEstadoYAuditar(
      compra,
      estadoCompra.UTILIZADA,
      usuarioResponsable
    );
  }

  utilizarCompra(id, opciones) {
    return this.utilizar(id, opciones);
  }

  /**
   * Caso de uso: Modificar el estado de una compra (CANCELADA o UTILIZADA)
   */
  async cambiarEstado(id, { estado, motivo, quien, usuarioActual } = {}) {
    if (estado === estadoCompra.CANCELADA) {
      return this.cancelar(id, { motivo, quien, usuarioActual });
    }
    if (estado === estadoCompra.UTILIZADA) {
      return this.utilizar(id, { quien, usuarioActual });
    }
    throw new ValidationError('El estado es obligatorio y debe ser CANCELADA o UTILIZADA.');
  }

  /**
   * Caso de uso: Obtener mensajes de chat de una compra
   */
  async getMensajes(id, { usuarioActual } = {}) {
    const compra = await this.validarExistenciaCompra(id);
    this.validarAccesoCompra(compra, usuarioActual);
    return compra.mensajes || [];
  }

  /**
   * Caso de uso: Enviar / agregar mensaje en el chat de una compra
   */
  async agregarMensaje(id, { mensaje, usuarioId, usuarioActual } = {}) {
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      throw new ValidationError('El mensaje no puede estar vacío.');
    }

    const compra = await this.validarExistenciaCompra(id);

    const emisor = usuarioActual || usuarioId;
    this.validarAccesoCompra(compra, emisor);

    const nuevoMensaje = new Mensaje({
      usuario: usuarioId || usuarioActual?.id || compra.comprador,
      mensaje: mensaje.trim(),
      enviado: this.obtenerFechaActual()
    });

    if (!Array.isArray(compra.mensajes)) {
      compra.mensajes = [];
    }
    compra.mensajes.push(nuevoMensaje);

    await this.compraRepository.update(compra.id, compra);
    return nuevoMensaje;
  }

  enviarMensaje(id, datos) {
    return this.agregarMensaje(id, datos);
  }
}

export const compraService = new CompraService();
