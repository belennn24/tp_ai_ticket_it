export class CambioEstadoCompraRepository {
  constructor(initialData = []) {
    this.cambios = [];
    initialData.forEach(item => this.save(item));
  }

  async save(cambioEstado) {
    const id = cambioEstado.id || String(Date.now() + Math.random());
    cambioEstado.id = id;
    this.cambios.push(cambioEstado);
    return cambioEstado;
  }

  async findByCompraId(compraId) {
    if (!compraId) return [];
    return this.cambios
      .filter(c => {
        const cId = c.compra?.id !== undefined ? c.compra.id : c.compra;
        return String(cId) === String(compraId);
      })
      .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }

  async findAll() {
    return [...this.cambios];
  }

  clear() {
    this.cambios = [];
  }
}

export const cambioEstadoCompraRepository = new CambioEstadoCompraRepository();
