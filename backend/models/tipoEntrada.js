import crypto from 'crypto';

export class TipoEntrada {
    constructor({ id, nombre, descripcion = '', precio = 0.0, cupo = 0 } = {}) {
        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.cupo = cupo;
    }

    hayCupoPara(cantidad) {
        if (typeof cantidad !== 'number' || cantidad <= 0) {
            return false;
        }
        return this.cupo >= cantidad;
    }
}
