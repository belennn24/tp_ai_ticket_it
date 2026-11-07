import crypto from 'crypto';

export class Usuario {
    constructor({ id, nombre, apellido, favoritos = [] } = {}) {
        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.apellido = apellido;
        this.favoritos = favoritos;
    }
}
