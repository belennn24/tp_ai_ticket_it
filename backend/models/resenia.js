import crypto from 'crypto';
import { ValidationError, ConflictError } from '../errors/appError.js';
import { extraerId } from '../utils/idUtils.js';

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

    // Alta de una reseña: solo puede calificar quien tiene al menos una compra
    // utilizada del evento. El organizador calificado se toma del propio evento.
    static crear({ id, comprador, evento, comprasDelComprador = [], puntuacion, detalle = '' } = {}) {
        if (!comprasDelComprador.some(c => c.puedeSerCalificada())) {
            throw new ConflictError(
                'No se puede calificar un evento sin poseer al menos una compra en estado UTILIZADA.'
            );
        }
        return new Resenia({
            id,
            comprador,
            evento,
            organizador: extraerId(evento?.organizador) || null,
            detalle,
            puntuacion: Number(puntuacion)
        });
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
