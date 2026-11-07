import crypto from 'crypto';

export class Categoria {
    constructor({ id, nombre, descripcion = '' } = {}) {
        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}
