import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Evento {
    constructor({
        id,
        nombre,
        descripcion = '',
        categoria = null,
        fecha = new Date(),
        tiposEntrada = [],
        multimedia = [],
        organizador = null
    } = {}) {
        this.validar({ nombre, fecha });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.fecha = new Date(fecha);
        this.tiposEntrada = Array.isArray(tiposEntrada) ? tiposEntrada : [];
        this.multimedia = Array.isArray(multimedia) ? multimedia : [];
        this.organizador = organizador;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
        this.activo = true;
    }

    validar({ nombre, fecha }) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre del evento no puede estar vacío');
        }
        if (fecha !== undefined && !(fecha instanceof Date) && isNaN(Date.parse(fecha))) {
            throw new ValidationError('La fecha del evento es inválida');
        }
    }

    tuPrecioEstaEntre(min, max) {
        if (!this.tiposEntrada || this.tiposEntrada.length === 0) {
            return false;
        }

        return this.tiposEntrada.some((tipo) => {
            const precio = tipo.precio;
            return precio >= min && precio <= max;
        });
    }

    yaOcurrio(fechaReferencia = new Date()) {
        const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
        return this.fecha.getTime() < ref.getTime();
    }

    buscarTipoEntrada(tipoEntradaId) {
        if (!tipoEntradaId || !this.tiposEntrada) return null;
        const idBuscado = String(tipoEntradaId?.id !== undefined ? tipoEntradaId.id : tipoEntradaId);
        return this.tiposEntrada.find(t => String(t.id) === idBuscado) || null;
    }

    agregarTipoEntrada(tipoEntrada) {
        if (!tipoEntrada) {
            throw new ValidationError('El tipo de entrada es requerido');
        }
        this.tiposEntrada.push(tipoEntrada);
        this.fechaModificacion = new Date();
    }
}
