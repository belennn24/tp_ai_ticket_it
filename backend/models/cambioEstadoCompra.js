import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';
import { estadoCompra } from './estadoCompra.js';

export class CambioEstadoCompra {
    constructor({ id, compra = null, estado = null, quien = null, fechaHora = new Date() } = {}) {
        this.validar({ estado });

        this.id = id || crypto.randomUUID();
        this.compra = compra;
        this.estado = estado;
        this.quien = quien;
        this.fechaHora = new Date(fechaHora);
    }

    validar({ estado }) {
        if (estado && !Object.values(estadoCompra).includes(estado)) {
            throw new ValidationError('Estado de compra inválido');
        }
    }
}
