import crypto from 'crypto';
import { ValidationError, ConflictError } from '../errors/appError.js';

export class TipoEntrada {
    constructor({ id, nombre, descripcion = '', precio = 1.0, cupo = 0, cupoTotal, entradasVendidas = 0 } = {}) {
        this.validar({ nombre, precio, cupo });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = Number(precio);
        this.cupoTotal = cupoTotal !== undefined ? Number(cupoTotal) : Number(cupo);
        this.cupo = Number(cupo);
        this.entradasVendidas = Number(entradasVendidas);

        // Estados iniciales y trazabilidad
        this.borrada = false;
        this.fechaBaja = null;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    validar({ nombre, precio, cupo } = {}) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre del tipo de entrada no puede estar vacío');
        }
        if (precio !== undefined && (typeof precio !== 'number' || isNaN(precio) || precio <= 0)) {
            throw new ValidationError('El precio del tipo de entrada debe ser mayor a 0');
        }
        if (cupo !== undefined && (typeof cupo !== 'number' || isNaN(cupo) || cupo < 0)) {
            throw new ValidationError('El cupo del tipo de entrada no puede ser negativo');
        }
    }

    modificar({ nombre, descripcion, precio, cupo } = {}) {
        const nuevoNombre = nombre ?? this.nombre;
        const nuevaDescripcion = descripcion ?? this.descripcion;
        const nuevoPrecio = precio !== undefined ? Number(precio) : this.precio;
        const nuevoCupo = cupo !== undefined ? Number(cupo) : this.cupo;

        this.validar({ nombre: nuevoNombre, precio: nuevoPrecio, cupo: nuevoCupo });
        this.nombre = nuevoNombre;
        this.descripcion = nuevaDescripcion;
        this.precio = nuevoPrecio;
        this.cupo = nuevoCupo;
        if (this.cupoTotal < nuevoCupo) {
            this.cupoTotal = nuevoCupo;
        }
        this.fechaModificacion = new Date();
    }

    calcularSubtotal(cantidad) {
        const cant = Number(cantidad) || 0;
        return Number(((Number(this.precio) || 0) * cant).toFixed(2));
    }

    hayCupoPara(cantidad) {
        if (typeof cantidad !== 'number' || isNaN(cantidad) || cantidad <= 0) {
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
        this.entradasVendidas += cant;
        this.fechaModificacion = new Date();
    }

    restituirCupo(cantidad) {
        const cant = Number(cantidad);
        if (isNaN(cant) || cant <= 0) {
            throw new ValidationError('La cantidad a restituir debe ser un número positivo mayor a 0');
        }
        this.cupo += cant;
        this.entradasVendidas = Math.max(0, this.entradasVendidas - cant);
        this.fechaModificacion = new Date();
    }

    get cupoDisponible() {
        return this.cupo;
    }
}
