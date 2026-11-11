import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';
import { estadoCompra } from './estadoCompra.js';
import { extraerId } from '../utils/idUtils.js';

export class CambioEstadoCompra {
    constructor({ id, compra = null, compraId = null, estado = null, quien = null, motivo = null, fechaHora = new Date() } = {}) {
        this.validar({ estado });

        this.id = id || crypto.randomUUID();
        this.compra = compra || compraId;
        this.compraId = compraId || extraerId(compra);
        this.estado = estado;
        this.quien = quien;
        this.motivo = motivo ? String(motivo).trim() : null;
        this.fechaHora = new Date(fechaHora);
    }

    validar({ estado }) {
        if (estado && !Object.values(estadoCompra).includes(estado)) {
            throw new ValidationError('Estado de compra inválido');
        }
    }
}
