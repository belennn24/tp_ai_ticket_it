import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';

export class Usuario {
    constructor({
        id,
        nombre,
        apellido = '',
        email = null,
        rol = 'comprador',
        favoritos = [],
        reputacion = 0
    } = {}) {
        this.validar({ nombre });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre ?? '';
        this.apellido = apellido ?? '';
        this.email = email;
        this.rol = rol;
        this.favoritos = Array.isArray(favoritos) ? favoritos : [];
        this.reputacion = reputacion;

        // Trazabilidad y auditoría
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
        this.borrado = false;
    }

    validar({ nombre }) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre del usuario no puede estar vacío');
        }
    }

    agregarFavorito(evento) {
        if (!evento) {
            throw new ValidationError('El evento es requerido para agregarlo a favoritos');
        }
        const eventoId = String(evento?.id !== undefined ? evento.id : evento);
        if (!this.tieneFavorito(eventoId)) {
            this.favoritos.push(evento);
            this.fechaModificacion = new Date();
        }
    }

    eliminarFavorito(eventoId) {
        if (!eventoId) {
            throw new ValidationError('El ID del evento es requerido');
        }
        const idBuscado = String(eventoId?.id !== undefined ? eventoId.id : eventoId);
        const indice = this.favoritos.findIndex(
            f => String(f?.id !== undefined ? f.id : f) === idBuscado
        );
        if (indice !== -1) {
            this.favoritos.splice(indice, 1);
            this.fechaModificacion = new Date();
            return true;
        }
        return false;
    }

    tieneFavorito(eventoId) {
        if (!eventoId) return false;
        const idBuscado = String(eventoId?.id !== undefined ? eventoId.id : eventoId);
        return this.favoritos.some(
            f => String(f?.id !== undefined ? f.id : f) === idBuscado
        );
    }
}
