import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Mensaje {
    constructor({ id, usuario = null, mensaje = '', enviado = new Date(), fechaHora, compra = null } = {}) {
        this.validar({ mensaje });

        this.id = id || crypto.randomUUID();
        this.usuario = usuario;
        this.compra = compra;
        this.mensaje = mensaje;
        this.fechaHora = new Date(fechaHora || enviado);

        // Estados iniciales y trazabilidad
        this.borrado = false;
        this.fechaBaja = null;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    get enviado() {
        return this.fechaHora;
    }

    set enviado(val) {
        this.fechaHora = new Date(val);
    }

    validar({ mensaje } = {}) {
        if (mensaje !== undefined && typeof mensaje === 'string' && mensaje.trim().length === 0) {
            throw new ValidationError('El contenido del mensaje no puede estar vacío');
        }
    }

    modificar({ mensaje } = {}) {
        const nuevoMensaje = mensaje ?? this.mensaje;
        this.validar({ mensaje: nuevoMensaje });
        this.mensaje = nuevoMensaje;
        this.fechaModificacion = new Date();
    }
}
