import crypto from 'crypto';

export class CambioEstadoCompra {
    constructor({ id, compra = null, estado = null, quien = null, fechaHora = new Date() } = {}) {
        this.id = id || crypto.randomUUID();
        this.compra = compra;
        this.estado = estado;
        this.quien = quien;
        this.fechaHora = new Date(fechaHora);
    }
}
