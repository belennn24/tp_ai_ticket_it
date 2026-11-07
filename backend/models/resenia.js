import crypto from 'crypto';

export class Resenia {
    constructor({ id, comprador = null, evento = null, detalle = '', puntuacion = 0.0 } = {}) {
        this.id = id || crypto.randomUUID();
        this.comprador = comprador;
        this.evento = evento;
        this.detalle = detalle;
        this.puntuacion = puntuacion;
    }
}
