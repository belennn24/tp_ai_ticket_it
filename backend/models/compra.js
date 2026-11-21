import crypto from 'crypto';
import { estadoCompra } from './estadoCompra.js';
import { CambioEstadoCompra } from './cambioEstadoCompra.js';
import { extraerId } from '../utils/idUtils.js';
import { ValidationError, ConflictError } from '../errors/appError.js';

export const TRANSICIONES_COMPRA = Object.freeze({
    [estadoCompra.PENDIENTE]: [estadoCompra.CONFIRMADA, estadoCompra.CANCELADA],
    [estadoCompra.CONFIRMADA]: [estadoCompra.UTILIZADA, estadoCompra.CANCELADA],
    [estadoCompra.CANCELADA]: [estadoCompra.REEMBOLSADA],
    [estadoCompra.UTILIZADA]: [],
    [estadoCompra.REEMBOLSADA]: []
});

export class Compra {
    constructor({
        id,
        comprador = null,
        evento = null,
        tipoEntrada = null,
        cantidad = 1,
        total,
        estado = estadoCompra.PENDIENTE,
        mensajes = [],
        motivo = null
    } = {}) {
        this.validar({ cantidad, estado });

        this.id = id || crypto.randomUUID();
        this.comprador = comprador;
        this.evento = evento;
        this.tipoEntrada = tipoEntrada;
        this.cantidad = Number(cantidad) || 0;
        this.total = total !== undefined ? Number(total) : this.calcularTotal(tipoEntrada, this.cantidad);
        this.estado = estado;
        this.mensajes = Array.isArray(mensajes) ? mensajes : [];
        this.motivo = motivo ? String(motivo).trim() : null;

        // Estados iniciales y trazabilidad
        this.fechaCompra = new Date();
        this.borrada = false;
        this.fechaBaja = null;
        this.fechaModificacion = null;
    }

    validar({ cantidad, estado } = {}) {
        if (cantidad !== undefined && (typeof cantidad !== 'number' || isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad))) {
            throw new ValidationError('La cantidad de entradas debe ser un número entero mayor a 0');
        }
        if (estado !== undefined && !Object.values(estadoCompra).includes(estado)) {
            throw new ValidationError('El estado de la compra es inválido');
        }
    }

    modificar({ tipoEntrada, cantidad } = {}) {
        const nuevoTipoEntrada = tipoEntrada ?? this.tipoEntrada;
        const nuevaCantidad = cantidad !== undefined ? Number(cantidad) : this.cantidad;

        this.validar({ cantidad: nuevaCantidad });
        this.tipoEntrada = nuevoTipoEntrada;
        this.cantidad = nuevaCantidad;
        this.total = this.calcularTotal(nuevoTipoEntrada, nuevaCantidad);
        this.fechaModificacion = new Date();
    }

    calcularTotal(tipoEntrada = this.tipoEntrada, cantidad = this.cantidad) {
        if (!tipoEntrada || !cantidad) return 0.0;
        if (typeof tipoEntrada.calcularSubtotal === 'function') {
            return tipoEntrada.calcularSubtotal(cantidad);
        }
        const precio = Number(tipoEntrada.precio) || 0;
        return Number((precio * cantidad).toFixed(2));
    }

    calcularDiasFaltantes(fechaReferencia = new Date(), fechaEvento = null) {
        if (this.estado !== estadoCompra.CONFIRMADA) {
            this._diasFaltantes = null;
            return null;
        }
        if (typeof this.evento?.diasFaltantes === 'function') {
            this._diasFaltantes = this.evento.diasFaltantes(fechaReferencia);
            return this._diasFaltantes;
        }
        const fechaRaw = fechaEvento || this.evento?.fecha;
        if (!fechaRaw) {
            this._diasFaltantes = null;
            return null;
        }
        const fechaEv = new Date(fechaRaw);
        if (isNaN(fechaEv.getTime())) {
            this._diasFaltantes = null;
            return null;
        }
        const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
        const diffMs = fechaEv.getTime() - ref.getTime();
        this._diasFaltantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return this._diasFaltantes;
    }

    get diasFaltantes() {
        return this._diasFaltantes !== undefined ? this._diasFaltantes : this.calcularDiasFaltantes();
    }

    set diasFaltantes(val) {
        this._diasFaltantes = val;
    }

    puedePasarA(nuevoEstado) {
        return (TRANSICIONES_COMPRA[this.estado] || []).includes(nuevoEstado);
    }

    actualizarEstado(nuevoEstado, quien = null, fechaReferencia = new Date(), motivo = null) {
        if (!this.puedePasarA(nuevoEstado)) {
            throw new ConflictError(`No se puede pasar del estado ${this.estado} al estado ${nuevoEstado}`);
        }
        this.estado = nuevoEstado;
        this.fechaModificacion = new Date();
        this._diasFaltantes = null;
        if (nuevoEstado === estadoCompra.CANCELADA || nuevoEstado === estadoCompra.REEMBOLSADA) {
            this.fechaBaja = new Date();
        }
        if (motivo) {
            this.motivo = String(motivo).trim();
        }
        const cambio = new CambioEstadoCompra({
            compra: this.id,
            compraId: this.id,
            estado: nuevoEstado,
            quien: quien ? (quien.id || quien) : null,
            motivo: this.motivo,
            fechaHora: fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia)
        });
        this.ultimoCambio = cambio;
        return cambio;
    }

    static MAX_POR_PERSONA = 5;

    confirmar(quien = null, fechaReferencia = new Date()) {
        return this.actualizarEstado(estadoCompra.CONFIRMADA, quien, fechaReferencia);
    }

    #cupoRestituido = false;

    cancelar({ quien = null, fechaReferencia = new Date(), motivo = null } = {}) {
        if (typeof this.evento?.yaOcurrio === 'function' && this.evento.yaOcurrio(fechaReferencia)) {
            throw new ConflictError('No se pueden cancelar compras de eventos finalizados.');
        }
        const cambio = this.actualizarEstado(estadoCompra.CANCELADA, quien, fechaReferencia, motivo);
        this.#devolverCupo();
        return cambio;
    }

    utilizar({ quien = null, fechaReferencia = new Date() } = {}) {
        const fecha = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
        if (typeof this.evento?.finalizo === 'function' && this.evento.finalizo(fecha)) {
            throw new ConflictError('No se puede utilizar una compra de un evento que ya finalizó.');
        }
        return this.actualizarEstado(estadoCompra.UTILIZADA, quien, fecha);
    }

    #devolverCupo() {
        if (this.#cupoRestituido) return;
        if (this.evento && typeof this.evento.restituirCupo === 'function') {
            this.evento.restituirCupo(extraerId(this.tipoEntrada), this.cantidad);
        } else if (this.tipoEntrada && typeof this.tipoEntrada.restituirCupo === 'function') {
            this.tipoEntrada.restituirCupo(this.cantidad);
        }
        this.#cupoRestituido = true;
    }

    reembolsar(quien = null, fechaReferencia = new Date(), motivo = null) {
        return this.actualizarEstado(estadoCompra.REEMBOLSADA, quien, fechaReferencia, motivo);
    }

    esDeComprador(usuarioRef) {
        if (!usuarioRef || !this.comprador) return false;
        return extraerId(this.comprador) === extraerId(usuarioRef);
    }

    esDeOrganizador(usuarioRef) {
        if (!usuarioRef || !this.evento) return false;
        if (typeof this.evento.esOrganizadoPor === 'function') {
            return this.evento.esOrganizadoPor(usuarioRef);
        }
        return extraerId(this.evento.organizador) === extraerId(usuarioRef);
    }

    puedeAcceder(usuarioRef) {
        if (!usuarioRef) return false;
        return this.esDeComprador(usuarioRef) || this.esDeOrganizador(usuarioRef);
    }

    agregarMensaje(mensaje) {
        if (!mensaje) {
            throw new ValidationError('El mensaje a agregar es requerido');
        }
        this.mensajes.push(mensaje);
        this.fechaModificacion = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            comprador: this.comprador,
            evento: this.evento,
            tipoEntrada: this.tipoEntrada,
            cantidad: this.cantidad,
            total: this.total,
            estado: this.estado,
            mensajes: this.mensajes,
            fechaCompra: this.fechaCompra,
            fechaModificacion: this.fechaModificacion,
            fechaBaja: this.fechaBaja,
            borrada: this.borrada,
            diasFaltantes: this.diasFaltantes
        };
    }
}
