import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Resenia {
    constructor({ id, comprador = null, evento = null, detalle = '', puntuacion = 0.0 } = {}) {
        this.validar({ puntuacion });

        this.id = id || crypto.randomUUID();
        this.comprador = comprador;
        this.evento = evento;
        this.detalle = detalle;
        this.puntuacion = Number(puntuacion);

        this.fechaCreacion = new Date();
    }

    validar({ puntuacion }) {
        if (puntuacion !== undefined) {
            const num = Number(puntuacion);
            if (isNaN(num) || num < 0 || num > 5) {
                throw new ValidationError('La puntuación de la reseña debe estar entre 0 y 5');
            }
        }
    }
}
