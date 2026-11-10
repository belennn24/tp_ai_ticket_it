import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Resenia {
    constructor({ id, comprador = null, evento = null, organizador = null, detalle = '', puntuacion = 5.0 } = {}) {
        this.validar({ puntuacion });

        this.id = id || crypto.randomUUID();
        this.comprador = comprador;
        this.evento = evento;
        this.organizador = organizador;
        this.detalle = detalle;
        this.puntuacion = Number(puntuacion);

        // Estados iniciales y trazabilidad
        this.borrada = false;
        this.fechaBaja = null;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    validar({ puntuacion } = {}) {
        if (puntuacion !== undefined) {
            const num = Number(puntuacion);
            if (isNaN(num) || num < 1 || num > 5) {
                throw new ValidationError('La puntuación de la reseña debe estar entre 1 y 5');
            }
        }
    }

    modificar({ detalle, puntuacion } = {}) {
        const nuevaPuntuacion = puntuacion !== undefined ? Number(puntuacion) : this.puntuacion;
        const nuevoDetalle = detalle ?? this.detalle;

        this.validar({ puntuacion: nuevaPuntuacion });
        this.puntuacion = nuevaPuntuacion;
        this.detalle = nuevoDetalle;
        this.fechaModificacion = new Date();
    }
}
