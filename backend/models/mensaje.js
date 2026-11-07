import crypto from 'crypto';

export class Mensaje {
    constructor({ id, usuario = null, mensaje = '', enviado = new Date() } = {}) {
        this.id = id || crypto.randomUUID();
        this.usuario = usuario;
        this.mensaje = mensaje;
        this.enviado = new Date(enviado);
    }
}
