import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Categoria {
    constructor({ id, nombre, descripcion = '' } = {}) {
        this.validar({ nombre });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;

        // Estados iniciales y trazabilidad
        this.borrada = false;
        this.fechaBaja = null;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    validar({ nombre } = {}) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre de la categoría no puede estar vacío');
        }
    }

    modificar({ nombre, descripcion } = {}) {
        const nuevoNombre = nombre ?? this.nombre;
        const nuevaDescripcion = descripcion ?? this.descripcion;
        this.validar({ nombre: nuevoNombre });
        this.nombre = nuevoNombre;
        this.descripcion = nuevaDescripcion;
        this.fechaModificacion = new Date();
    }
}
