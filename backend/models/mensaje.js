export class Mensaje {
    constructor({ id, usuario = null, mensaje = '', enviado = new Date() } = {}) {
        this.id = id;
        this.usuario = usuario;
        this.mensaje = mensaje;
        this.enviado = new Date(enviado);
    }
}
