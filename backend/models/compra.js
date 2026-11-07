import crypto from 'crypto';
import { estadoCompra } from './estadoCompra.js';

export class Compra {
    constructor({
        id,
        comprador = null,
        evento = null,
        tipoEntrada = null,
        cantidad = 0,
        total = 0.0,
        estado = estadoCompra.PENDIENTE,
        mensajes = []
    } = {}) {
        this.id = id || crypto.randomUUID();
        this.comprador = comprador;
        this.evento = evento;
        this.tipoEntrada = tipoEntrada;
        this.cantidad = cantidad;
        this.total = total;
        this.estado = estado;
        this.mensajes = mensajes;
    }

    actualizarEstado(nuevoEstado) {
        this.estado = nuevoEstado;
    }
}
