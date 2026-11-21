import crypto from 'crypto';
import { ValidationError } from '../errors/appError.js';
import { extraerId } from '../utils/idUtils.js';

export class Usuario {
    static ROLES = Object.freeze(['comprador', 'organizador', 'admin']);
    // El rol admin no se puede elegir al registrarse.
    static ROLES_REGISTRABLES = Object.freeze(['comprador', 'organizador']);

    constructor({
        id,
        nombre,
        apellido = '',
        email = null,
        rol = 'comprador',
        role,
        favoritos = [],
        reputacion = 0,
        passwordHash = null
    } = {}) {
        const rolNormalizado = String(role || rol || 'comprador').trim().toLowerCase();
        this.validar({ nombre, rol: rolNormalizado });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre ?? '';
        this.apellido = apellido ?? '';
        this.email = email;
        this.rol = rolNormalizado;
        this.favoritos = Array.isArray(favoritos) ? favoritos : [];
        this.reputacion = Number(reputacion) || 0;
        this.passwordHash = passwordHash;

        // Estados iniciales y trazabilidad
        this.borrado = false;
        this.fechaBaja = null;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    get role() {
        return this.rol;
    }

    set role(valor) {
        this.rol = valor ? String(valor).trim().toLowerCase() : valor;
    }

    validar({ nombre, rol } = {}) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre del usuario no puede estar vacío');
        }
        if (rol !== undefined && rol !== null) {
            const r = String(rol).trim().toLowerCase();
            if (!Usuario.ROLES.includes(r)) {
                throw new ValidationError('El rol del usuario es inválido');
            }
        }
    }

    modificar({ nombre, apellido, email, rol, role } = {}) {
        const nuevoNombre = nombre ?? this.nombre;
        const nuevoApellido = apellido ?? this.apellido;
        const nuevoEmail = email ?? this.email;
        const rolIngresado = role ?? rol;
        const nuevoRol = rolIngresado !== undefined ? String(rolIngresado).trim().toLowerCase() : this.rol;

        this.validar({ nombre: nuevoNombre, rol: nuevoRol });
        this.nombre = nuevoNombre;
        this.apellido = nuevoApellido;
        this.email = nuevoEmail;
        this.rol = nuevoRol;
        this.fechaModificacion = new Date();
    }

    esComprador() {
        return String(this.rol).toLowerCase() === 'comprador';
    }

    esOrganizador() {
        return String(this.rol).toLowerCase() === 'organizador';
    }

    static calcularPromedioReputacion(resenias = [], valorPorDefecto = 0) {
        if (!resenias || resenias.length === 0) {
            return Number(valorPorDefecto);
        }
        const suma = resenias.reduce((acc, r) => acc + Number(r.puntuacion), 0);
        return Number((suma / resenias.length).toFixed(2));
    }

    recalcularReputacion(resenias = [], valorPorDefecto = 0) {
        this.reputacion = Usuario.calcularPromedioReputacion(resenias, valorPorDefecto);
        this.fechaModificacion = new Date();
        return this.reputacion;
    }

    agregarFavorito(evento) {
        if (!evento) {
            throw new ValidationError('El evento es requerido para agregarlo a favoritos');
        }
        // Devuelve false si el evento ya estaba en favoritos (no se duplica).
        if (this.tieneFavorito(extraerId(evento))) return false;
        this.favoritos.push(evento);
        this.fechaModificacion = new Date();
        return true;
    }

    eliminarFavorito(eventoId) {
        if (!eventoId) {
            throw new ValidationError('El ID del evento es requerido');
        }
        const idBuscado = String(extraerId(eventoId));
        const indice = this.favoritos.findIndex(
            f => String(extraerId(f)) === idBuscado
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
        const idBuscado = String(extraerId(eventoId));
        return this.favoritos.some(
            f => String(extraerId(f)) === idBuscado
        );
    }

    aPerfilPublico() {
        const rolNormalizado = String(this.rol || 'comprador').toLowerCase().trim();
        return {
            id: String(this.id),
            nombre: this.nombre || '',
            apellido: this.apellido || '',
            email: this.email || null,
            rol: rolNormalizado,
            reputacion: Number(this.reputacion) || 0,
            favoritos: Array.isArray(this.favoritos) ? this.favoritos : []
        };
    }

    toJSON() {
        const { passwordHash, borrado, fechaBaja, ...publicProps } = this;
        return publicProps;
    }
}
