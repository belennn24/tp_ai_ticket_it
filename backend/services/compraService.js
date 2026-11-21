import { estadoCompra } from '../models/estadoCompra.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { cambioEstadoCompraRepository as defaultCambioEstadoCompraRepository } from '../repositories/cambioEstadoCompraRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { extraerId } from '../utils/idUtils.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError
} from '../errors/appError.js';

const ACCIONES = { CANCELADA: 'cancelar', UTILIZADA: 'utilizar' };

export class CompraService {
  constructor({
    compraRepository = defaultCompraRepository,
    eventoRepository = defaultEventoRepository,
    cambioEstadoCompraRepository = defaultCambioEstadoCompraRepository,
    usuarioRepository = defaultUsuarioRepository,
    fechaActualProvider = () => new Date()
  } = {}) {
    this.compraRepository = compraRepository;
    this.eventoRepository = eventoRepository;
    this.cambioEstadoCompraRepository = cambioEstadoCompraRepository;
    this.usuarioRepository = usuarioRepository;
    this.fechaActualProvider = fechaActualProvider;
  }

  obtenerFechaActual = () => {
    return new Date(this.fechaActualProvider());
  };

  extraerId = extraerId;

  buscarCompraOError = async (id) => {
    const compraId = this.extraerId(id);
    const compra = await this.compraRepository.findById(compraId);
    if (!compra) throw new NotFoundError('Compra no encontrada.');
    return compra;
  };

  obtenerEvento = async (eventoRef) => {
    if (!eventoRef) return null;
    if (typeof eventoRef.yaOcurrio === 'function') return eventoRef;
    const eventoId = this.extraerId(eventoRef);
    if (eventoId && this.eventoRepository) {
      return await this.eventoRepository.findById(eventoId);
    }
    return null;
  };

  enriquecerDetalleCompra = async (compra) => {
    if (!compra) return compra;
    const ahora = this.obtenerFechaActual();

    if (compra.estado === estadoCompra.CONFIRMADA) {
      const evento = await this.obtenerEvento(compra.evento);
      const fechaEvento = evento?.fecha || compra.evento?.fecha;
      compra.calcularDiasFaltantes(ahora, fechaEvento);
    } else {
      compra.diasFaltantes = null;
    }
    return compra;
  };

  enriquecerColeccion = async (compras = []) => {
    return await Promise.all(compras.map(c => this.enriquecerDetalleCompra(c)));
  };

  validarAcceso = (compra, usuarioActual) => {
    if (!compra.puedeAcceder(usuarioActual)) {
      throw new ForbiddenError('Usuario ajeno a la compra o evento.');
    }
  };

  #guardar = async (compra, cambio) => {
    if (compra.evento?.id && this.eventoRepository?.update) {
      await this.eventoRepository.update(compra.evento.id, compra.evento);
    }
    await this.cambioEstadoCompraRepository.save(cambio);
    return this.compraRepository.update(compra.id, compra);
  };

  getAll = async (filtros = {}) => {
    const compras = await this.compraRepository.findAll(filtros);
    return await this.enriquecerColeccion(compras);
  };

  getById = async (id, { usuarioActual } = {}) => {
    const compra = await this.buscarCompraOError(id);
    this.validarAcceso(compra, usuarioActual);
    return await this.enriquecerDetalleCompra(compra);
  };

  getHistorial = async (id, { usuarioActual } = {}) => {
    const compra = await this.buscarCompraOError(id);
    this.validarAcceso(compra, usuarioActual);
    return await this.cambioEstadoCompraRepository.findByCompraId(id);
  };

  // El service solo coordina: busca las entidades, delega la venta en el dominio
  // (Evento.venderEntradas) y persiste el resultado.
  create = async ({ eventoId, tipoEntradaId, cantidad, compradorId } = {}) => {
    if (!eventoId || !tipoEntradaId || cantidad === undefined || cantidad === null) {
      throw new ValidationError('Faltan campos obligatorios para crear la compra.');
    }
    const cantidadNum = Number(cantidad);
    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      throw new ValidationError('La cantidad de entradas debe ser un número entero positivo.');
    }

    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError('El evento solicitado no existe.');

    const comprador = (compradorId && (await this.usuarioRepository?.findById?.(compradorId))) || compradorId;
    const comprasPrevias = compradorId
      ? await this.compraRepository.findAll({ compradorId, eventoId })
      : [];

    const { compra, cambio } = evento.venderEntradas({
      comprador,
      tipoEntradaId,
      cantidad: cantidadNum,
      comprasPrevias,
      fechaReferencia: this.obtenerFechaActual()
    });

    await this.eventoRepository.update(evento.id, evento);
    const compraGuardada = await this.compraRepository.save(compra);
    await this.cambioEstadoCompraRepository.save(cambio);

    return await this.enriquecerDetalleCompra(compraGuardada);
  };

  cancelar = async (id, { motivo, usuarioActual } = {}) => {
    const compra = await this.buscarCompraOError(id);
    if (!compra.esDeComprador(usuarioActual)) {
      throw new ForbiddenError('La compra no pertenece al comprador autenticado.');
    }
    const cambio = compra.cancelar({
      quien: usuarioActual?.id || usuarioActual,
      motivo,
      fechaReferencia: this.obtenerFechaActual()
    });
    return this.#guardar(compra, cambio);
  };

  utilizar = async (id, { usuarioActual } = {}) => {
    const compra = await this.buscarCompraOError(id);
    if (!compra.esDeOrganizador(usuarioActual)) {
      throw new ForbiddenError('El organizador no es dueño del evento asociado a la compra.');
    }
    const cambio = compra.utilizar({
      quien: usuarioActual?.id || usuarioActual,
      fechaReferencia: this.obtenerFechaActual()
    });
    return this.#guardar(compra, cambio);
  };

  cambiarEstado = async (id, { estado, ...opciones } = {}) => {
    const accion = ACCIONES[estado];
    if (!accion) throw new ValidationError('El estado debe ser CANCELADA o UTILIZADA.');
    return this[accion](id, opciones);
  };
}

export const compraService = new CompraService();
