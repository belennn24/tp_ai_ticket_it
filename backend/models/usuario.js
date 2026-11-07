export class Usuario {
    constructor({ id, nombre, apellido, favoritos = [] } = {}) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.favoritos = favoritos;
    }
}
