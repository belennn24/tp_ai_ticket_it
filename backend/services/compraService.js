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
  ConflictError
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

  generarId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
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
    const eventoId = eventoRef.id !== undefined ? eventoRef.id : eventoRef;
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
      id: resto.id || this.generarId(),
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
    const cambioEstado = new CambioEstadoCompra({
      id: this.generarId(),
      compra: compraGuardada.id,
      estado: estadoCompra.CONFIRMADA,
      quien: compradorId || 'COMPRADOR',
      fechaHora: this.obtenerFechaActual()
    });
    await this.cambioEstadoCompraRepository.save(cambioEstado);

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
    return Promise.all(compras.map(c => this.enriquecerConDiasFaltantes(c)));
  }

  obtenerCompras(filtros) {
    return this.getAll(filtros);
  }

  /**
   * Caso de uso: Obtener detalle de una compra por ID
   */
  async getById(id) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }
    return this.enriquecerConDiasFaltantes(compra);
  }

  /**
   * Caso de uso: Obtener compras asociadas a un evento
   */
  async getByEventoId(eventoId) {
    const compras = await this.compraRepository.findByEventoId(eventoId);
    return Promise.all(compras.map(c => this.enriquecerConDiasFaltantes(c)));
  }

  /**
   * Caso de uso: Obtener cronología / auditoría de estados de una compra
   */
  async getHistorial(id) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }
    return this.cambioEstadoCompraRepository.findByCompraId(id);
  }

  /**
   * Caso de uso: Cancelar una compra y restituir cupo
   */
  async cancelar(id, { motivo, quien, usuarioActual } = {}) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }

    if (
      compra.estado === estadoCompra.UTILIZADA ||
      compra.estado === estadoCompra.CANCELADA
    ) {
      throw new ConflictError('No se puede cancelar una compra que ya fue utilizada o cancelada.');
    }

    const fechaEvento = await this.obtenerFechaEvento(compra.evento);
    if (fechaEvento && fechaEvento.getTime() < this.obtenerFechaActual().getTime()) {
      throw new ConflictError('No se puede cancelar una compra de un evento que ya finalizó o expiró.');
    }

    // Restituir cupo
    let cupoRestituido = false;
    const eventoId = compra.evento?.id !== undefined ? compra.evento.id : compra.evento;
    if (eventoId && this.eventoRepository) {
      const evento = await this.eventoRepository.findById(eventoId);
      if (evento && evento.tiposEntrada) {
        const tipoEntradaId = compra.tipoEntrada?.id !== undefined ? compra.tipoEntrada.id : compra.tipoEntrada;
        const tipo = evento.tiposEntrada.find(
          t => String(t.id) === String(tipoEntradaId)
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

    compra.actualizarEstado(estadoCompra.CANCELADA);
    const compraActualizada = await this.compraRepository.update(compra.id, compra);

    const cambio = new CambioEstadoCompra({
      id: this.generarId(),
      compra: compra.id,
      estado: estadoCompra.CANCELADA,
      quien: quien || usuarioActual || compra.comprador || 'COMPRADOR',
      fechaHora: this.obtenerFechaActual()
    });
    await this.cambioEstadoCompraRepository.save(cambio);

    compraActualizada.diasFaltantes = null;
    return compraActualizada;
  }

  cancelarCompra(id, opciones) {
    return this.cancelar(id, opciones);
  }

  /**
   * Caso de uso: Marcar una compra como utilizada en el ingreso
   */
  async utilizar(id, { quien, usuarioActual } = {}) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }

    if (compra.estado !== estadoCompra.CONFIRMADA) {
      throw new ConflictError('Solo se pueden utilizar compras en estado CONFIRMADA.');
    }

    const fechaEvento = await this.obtenerFechaEvento(compra.evento);
    if (fechaEvento && fechaEvento.getTime() < this.obtenerFechaActual().getTime()) {
      throw new ConflictError('No se puede utilizar una compra de un evento que ya finalizó.');
    }

    compra.actualizarEstado(estadoCompra.UTILIZADA);
    const compraActualizada = await this.compraRepository.update(compra.id, compra);

    const cambio = new CambioEstadoCompra({
      id: this.generarId(),
      compra: compra.id,
      estado: estadoCompra.UTILIZADA,
      quien: quien || usuarioActual || 'ORGANIZADOR',
      fechaHora: this.obtenerFechaActual()
    });
    await this.cambioEstadoCompraRepository.save(cambio);

    compraActualizada.diasFaltantes = null;
    return compraActualizada;
  }

  utilizarCompra(id, opciones) {
    return this.utilizar(id, opciones);
  }

  /**
   * Caso de uso: Obtener mensajes de chat de una compra
   */
  async getMensajes(id) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }
    return compra.mensajes || [];
  }

  /**
   * Caso de uso: Enviar / agregar mensaje en el chat de una compra
   */
  async agregarMensaje(id, { mensaje, usuarioId } = {}) {
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      throw new ValidationError('El mensaje no puede estar vacío.');
    }

    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada.');
    }

    const nuevoMensaje = new Mensaje({
      id: this.generarId(),
      usuario: usuarioId || compra.comprador,
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
