import { Compra } from '../models/compra.js';
import { CambioEstadoCompra } from '../models/cambioEstadoCompra.js';
import { Mensaje } from '../models/mensaje.js';
import { estadoCompra } from '../models/estadoCompra.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { cambioEstadoCompraRepository as defaultCambioEstadoCompraRepository } from '../repositories/cambioEstadoCompraRepository.js';
import { mensajeRepository as defaultMensajeRepository } from '../repositories/mensajeRepository.js';
import { MensajeService, mensajeService as defaultMensajeService } from './mensajeService.js';
import { extraerId } from '../utils/idUtils.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError
} from '../errors/appError.js';

export class CompraService {
  constructor({
    compraRepository = defaultCompraRepository,
    eventoRepository = defaultEventoRepository,
    cambioEstadoCompraRepository = defaultCambioEstadoCompraRepository,
    mensajeService = null,
    fechaActualProvider = () => new Date()
  } = {}) {
    this.compraRepository = compraRepository;
    this.eventoRepository = eventoRepository;
    this.cambioEstadoCompraRepository = cambioEstadoCompraRepository;
    this.fechaActualProvider = fechaActualProvider;
    this.mensajeService = mensajeService || (
      compraRepository === defaultCompraRepository
        ? defaultMensajeService
        : new MensajeService({ compraRepository, fechaActualProvider })
    );
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

validarExistenciaCompra = async (id) => {
  return await this.buscarCompraOError(id);
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

registrarCambioEstado = async (compraOId, estado, quien, motivo = null) => {
  let cambio;
  if (compraOId instanceof CambioEstadoCompra) {
    cambio = compraOId;
  } else {
    const compraId = this.extraerId(compraOId);
    const compra = this.compraRepository?.findById ? await this.compraRepository.findById(compraId) : null;
    if (compra?.ultimoCambio?.estado === estado) {
      cambio = compra.ultimoCambio;
      if (quien && !cambio.quien) cambio.quien = quien;
      if (motivo && !cambio.motivo) cambio.motivo = motivo;
    } else {
      cambio = new CambioEstadoCompra({
        compra: compraId,
        compraId,
        estado,
        quien: quien || 'SISTEMA',
        motivo: motivo || null,
        fechaHora: this.obtenerFechaActual()
      });
    }
  }
  return await this.cambioEstadoCompraRepository.save(cambio);
};

validarEventoNoFinalizado = async (eventoRef, mensajeError = 'El evento ya finalizó.') => {
  const evento = await this.obtenerEvento(eventoRef);
  if (evento && evento.yaOcurrio(this.obtenerFechaActual())) {
    throw new ConflictError(mensajeError);
  }
};

restituirCupo = async (compra) => {
  if (!compra) return;
  if (typeof compra.restituirCupoAlEvento === 'function') {
    compra.restituirCupoAlEvento();
  }
  const evento = await this.obtenerEvento(compra.evento);
  const tipoEntradaId = this.extraerId(compra.tipoEntrada);

  if (evento) {
    if (!compra._cupoRestituido && typeof evento.restituirCupo === 'function') {
      evento.restituirCupo(tipoEntradaId, compra.cantidad);
      compra._cupoRestituido = true;
    }
    if (this.eventoRepository?.update) {
      await this.eventoRepository.update(evento.id, evento);
    }
  }
};

auditarYGuardar = async (compra, cambioOEstado, quien = null, motivo = null) => {
  const compraActualizada = await this.compraRepository.update(compra.id, compra);
  if (cambioOEstado instanceof CambioEstadoCompra) {
    if (cambioOEstado.motivo) {
      await this.registrarCambioEstado(compra.id, cambioOEstado.estado, cambioOEstado.quien, cambioOEstado.motivo);
    } else {
      await this.registrarCambioEstado(compra.id, cambioOEstado.estado, cambioOEstado.quien);
    }
  } else if (cambioOEstado) {
    if (motivo) {
      await this.registrarCambioEstado(compra.id, cambioOEstado, quien, motivo);
    } else {
      await this.registrarCambioEstado(compra.id, cambioOEstado, quien);
    }
  }
  return compraActualizada;
};

actualizarEstadoYAuditar = async (compra, nuevoEstado, quien) => {
  compra.cambiarEstado(nuevoEstado, { fechaReferencia: this.obtenerFechaActual(), quien });
  return await this.auditarYGuardar(compra, nuevoEstado, quien);
};

validarAcceso = (compra, usuarioActual) => {
  if (!compra.puedeAcceder(usuarioActual)) {
    throw new ForbiddenError('Usuario ajeno a la compra o evento.');
  }
};

validarPermisoCancelacion = (compra, usuarioActual) => {
  if (!usuarioActual || !compra.esDeComprador(usuarioActual)) {
    throw new ForbiddenError('La compra no pertenece al comprador autenticado.');
  }
};

validarPermisoUtilizacion = (compra, usuarioActual) => {
  if (!usuarioActual) return;
  if (!compra.esDeOrganizador(usuarioActual)) {
    throw new ForbiddenError('El organizador no es dueño del evento asociado a la compra.');
  }
};

getAll = async (filtros = {}) => {
  const compras = await this.compraRepository.findAll(filtros);
  return await this.enriquecerColeccion(compras);
};

getById = async (id, { usuarioActual } = {}) => {
  const compra = await this.validarExistenciaCompra(id);
  if (usuarioActual) {
    this.validarAcceso(compra, usuarioActual);
  }
  return await this.enriquecerDetalleCompra(compra);
};

getByEventoId = async (eventoId, { usuarioActual } = {}) => {
  const compras = await this.compraRepository.findByEventoId(eventoId);
  if (usuarioActual) {
    compras.forEach(c => this.validarAcceso(c, usuarioActual));
  }
  return await this.enriquecerColeccion(compras);
};

getHistorial = async (id, { usuarioActual } = {}) => {
  const compra = await this.validarExistenciaCompra(id);
  if (usuarioActual) {
    this.validarAcceso(compra, usuarioActual);
  }
  return await this.cambioEstadoCompraRepository.findByCompraId(id);
};

create = async ({
  eventoId,
  tipoEntradaId,
  cantidad,
  compradorId,
  total,
  ...resto
} = {}) => {
  if (!eventoId || !tipoEntradaId || cantidad === undefined || cantidad === null) {
    throw new ValidationError('Faltan campos obligatorios para crear la compra.');
  }

  const cantidadNum = Number(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    throw new ValidationError('La cantidad de entradas debe ser un número entero positivo.');
  }

  const evento = await this.eventoRepository.findById(eventoId);
  if (!evento) throw new NotFoundError('El evento solicitado no existe.');
  if (evento.yaOcurrio(this.obtenerFechaActual())) {
    throw new ConflictError('No se pueden comprar entradas para un evento que ya ocurrió.');
  }
  const tipoEntrada = evento.obtenerTipoEntrada(tipoEntradaId);
  const nuevaCompra = new Compra({
    id: resto.id,
    comprador: compradorId,
    evento,
    tipoEntrada,
    cantidad: cantidadNum,
    ...(total !== undefined ? { total: Number(total) } : {}),
    mensajes: []
  });
  evento.descontarCupo(tipoEntradaId, cantidadNum);
  if (this.eventoRepository?.update) {
    await this.eventoRepository.update(evento.id, evento);
  }

  nuevaCompra.confirmar(compradorId || 'COMPRADOR');

  const compraGuardada = await this.compraRepository.save(nuevaCompra);

  await this.registrarCambioEstado(
    compraGuardada.id,
    estadoCompra.CONFIRMADA,
    compradorId || 'COMPRADOR'
  );

  return await this.enriquecerDetalleCompra(compraGuardada);
};

cancelar = async (id, { motivo, quien, usuarioActual } = {}) => {
  const compra = await this.validarExistenciaCompra(id);
  if (usuarioActual) {
    this.validarPermisoCancelacion(compra, usuarioActual);
  }

  if (typeof compra.evento?.yaOcurrio !== 'function') {
    const ev = await this.obtenerEvento(compra.evento);
    if (ev) compra.evento = ev;
  }

  const usuarioResponsable = usuarioActual?.id || quien || compra.comprador;
  const cambio = compra.cancelar({ quien: usuarioResponsable, motivo, fechaReferencia: this.obtenerFechaActual() });
  if (compra.evento?.id && this.eventoRepository?.update) {
    await this.eventoRepository.update(compra.evento.id, compra.evento);
  }
  return await this.auditarYGuardar(compra, cambio);
};

utilizar = async (id, { quien, usuarioActual } = {}) => {
  const compra = await this.validarExistenciaCompra(id);
  if (usuarioActual) {
    this.validarPermisoUtilizacion(compra, usuarioActual);
  }

  if (typeof compra.evento?.yaOcurrio !== 'function') {
    const ev = await this.obtenerEvento(compra.evento);
    if (ev) compra.evento = ev;
  }

  const usuarioResponsable = usuarioActual?.id || quien || 'ORGANIZADOR';
  const cambio = compra.utilizar({ quien: usuarioResponsable, fechaReferencia: this.obtenerFechaActual() });

  return await this.auditarYGuardar(compra, cambio);
};

cambiarEstado = async (id, { estado, motivo, quien, usuarioActual } = {}) => {
  if (estado === estadoCompra.CANCELADA) {
    return await this.cancelar(id, { motivo, quien, usuarioActual });
  }
  if (estado === estadoCompra.UTILIZADA) {
    return await this.utilizar(id, { quien, usuarioActual });
  }
  throw new ValidationError('El estado es obligatorio y debe ser CANCELADA o UTILIZADA.');
};

getMensajes = async (id, { usuarioActual } = {}) => {
  await this.validarExistenciaCompra(id);
  return await this.mensajeService.obtenerMensajes(id, { usuarioActual });
};

agregarMensaje = async (id, { mensaje, texto, usuarioId, usuarioActual } = {}) => {
  await this.validarExistenciaCompra(id);
  const emisor = usuarioActual || (usuarioId ? { id: usuarioId } : null);
  return await this.mensajeService.enviarMensaje(id, {
    texto: mensaje || texto,
    usuarioActual: emisor
  });
};
}

export const compraService = new CompraService();
