import crypto from 'crypto';
import { estadoCompra } from './estadoCompra.js';
import { ValidationError, ConflictError } from '../errors/appError.js';

export class Compra {
    constructor({
        id,
        comprador = null,
        evento = null,
        tipoEntrada = null,
        cantidad = 0,
        total,
        estado = estadoCompra.PENDIENTE,
        mensajes = []
    } = {}) {
        this.validar({ cantidad });

        this.id = id || crypto.randomUUID();
        this.comprador = comprador;
        this.evento = evento;
        this.tipoEntrada = tipoEntrada;
        this.cantidad = Number(cantidad) || 0;
        this.total = total !== undefined ? Number(total) : this.calcularTotal(tipoEntrada, this.cantidad);
        this.estado = estado;
        this.mensajes = Array.isArray(mensajes) ? mensajes : [];
        this.fechaCompra = new Date();
        this.fechaModificacion = null;
        this.fechaBaja = null;
        this.borrada = false;
    }

    validar({ cantidad }) {
        if (cantidad !== undefined && (typeof cantidad !== 'number' || isNaN(cantidad) || cantidad < 0)) {
            throw new ValidationError('La cantidad de entradas no puede ser negativa');
        }
    }

    calcularTotal(tipoEntrada, cantidad) {
        if (!tipoEntrada || !cantidad) return 0.0;
        const precio = Number(tipoEntrada.precio) || 0;
        return Number((precio * cantidad).toFixed(2));
    }

    actualizarEstado(nuevoEstado) {
        this.estado = nuevoEstado;
        this.fechaModificacion = new Date();
        if (nuevoEstado === estadoCompra.CANCELADA || nuevoEstado === estadoCompra.REEMBOLSADA) {
            this.fechaBaja = new Date();
        }
    }

    confirmar() {
        if (this.estado === estadoCompra.CANCELADA) {
            throw new ConflictError('No se puede confirmar una compra que ha sido cancelada');
        }
        this.actualizarEstado(estadoCompra.CONFIRMADA);
    }

    cancelar() {
        if (this.estado === estadoCompra.UTILIZADA) {
            throw new ConflictError('No se puede cancelar una entrada que ya ha sido utilizada');
        }
        if (this.estado === estadoCompra.CANCELADA) {
            throw new ConflictError('La compra ya se encuentra cancelada');
        }
        this.actualizarEstado(estadoCompra.CANCELADA);
    }

    utilizar() {
        if (this.estado !== estadoCompra.CONFIRMADA) {
            throw new ConflictError(`Solo se pueden utilizar compras confirmadas (estado actual: ${this.estado})`);
        }
        this.actualizarEstado(estadoCompra.UTILIZADA);
    }

    agregarMensaje(mensaje) {
        if (!mensaje) {
            throw new ValidationError('El mensaje a agregar es requerido');
        }
        this.mensajes.push(mensaje);
        this.fechaModificacion = new Date();
    }
}
