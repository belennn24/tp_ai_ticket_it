import crypto from 'crypto';

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
        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.fecha = new Date(fecha);
        this.tiposEntrada = tiposEntrada;
        this.multimedia = multimedia;
        this.organizador = organizador;
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
}
