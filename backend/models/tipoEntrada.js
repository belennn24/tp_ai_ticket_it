import crypto from 'crypto';
import { ValidationError, ConflictError } from '../errors/appError.js';

export class TipoEntrada {
    constructor({ id, nombre, descripcion = '', precio = 0.0, cupo = 0 } = {}) {
        this.validar({ precio, cupo });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = Number(precio);
        this.cupo = Number(cupo);

        // Trazabilidad
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    validar({ precio, cupo }) {
        if (precio !== undefined && (typeof precio !== 'number' || isNaN(precio) || precio < 0)) {
            throw new ValidationError('El precio del tipo de entrada no puede ser negativo');
        }
        if (cupo !== undefined && (typeof cupo !== 'number' || isNaN(cupo) || cupo < 0)) {
            throw new ValidationError('El cupo del tipo de entrada no puede ser negativo');
        }
    }

    hayCupoPara(cantidad) {
        if (typeof cantidad !== 'number' || cantidad <= 0) {
            return false;
        }
        return this.cupo >= cantidad;
    }

    descontarCupo(cantidad) {
        const cant = Number(cantidad);
        if (!this.hayCupoPara(cant)) {
            throw new ConflictError('No hay cupos suficientes para el tipo de entrada seleccionado.');
        }
        this.cupo -= cant;
        this.fechaModificacion = new Date();
    }

    restituirCupo(cantidad) {
        const cant = Number(cantidad);
        if (isNaN(cant) || cant <= 0) {
            throw new ValidationError('La cantidad a restituir debe ser un número positivo mayor a 0');
        }
        this.cupo += cant;
        this.fechaModificacion = new Date();
    }
}
