import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Categoria {
    constructor({ id, nombre, descripcion = '' } = {}) {
        this.validar({ nombre });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;

        // Trazabilidad
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    validar({ nombre }) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre de la categoría no puede estar vacío');
        }
    }
}
