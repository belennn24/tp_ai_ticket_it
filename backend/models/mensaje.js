import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Mensaje {
    constructor({ id, usuario = null, mensaje = '', enviado = new Date() } = {}) {
        this.validar({ mensaje });

        this.id = id || crypto.randomUUID();
        this.usuario = usuario;
        this.mensaje = mensaje;
        this.enviado = new Date(enviado);

        this.fechaCreacion = new Date();
    }

    validar({ mensaje }) {
        if (mensaje !== undefined && typeof mensaje === 'string' && mensaje.trim().length === 0) {
            throw new ValidationError('El contenido del mensaje no puede estar vacío');
        }
    }
}
