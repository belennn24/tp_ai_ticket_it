export class CompraRepository {
  constructor(initialData = []) {
    this.compras = new Map();
    initialData.forEach(compra => this.save(compra));
  }

  async save(compra) {
    const id = compra.id || compra._id || String(Date.now() + Math.random());
    compra.id = id;
    this.compras.set(String(id), compra);
    return compra;
  }

  async findById(id) {
    if (!id) return null;
    return this.compras.get(String(id)) || null;
  }

  async findByCompradorId(compradorId) {
    if (!compradorId) return [];
    return Array.from(this.compras.values()).filter(c => {
      const compId = c.comprador?.id !== undefined ? c.comprador.id : c.comprador;
      return String(compId) === String(compradorId);
    });
  }

  async findByEventoId(eventoId) {
    if (!eventoId) return [];
    return Array.from(this.compras.values()).filter(c => {
      const evId = c.evento?.id !== undefined ? c.evento.id : c.evento;
      return String(evId) === String(eventoId);
    });
  }

  async findByCompradorYEvento(compradorId, eventoId) {
    return Array.from(this.compras.values()).find(c => {
      const compId = c.comprador?.id !== undefined ? c.comprador.id : c.comprador;
      const evId = c.evento?.id !== undefined ? c.evento.id : c.evento;
      return String(compId) === String(compradorId) && String(evId) === String(eventoId);
    }) || null;
  }

  async findAll(filtros = {}) {
    let result = Array.from(this.compras.values());

    if (filtros.compradorId || filtros.comprador) {
      const compId = filtros.compradorId || filtros.comprador;
      result = result.filter(c => {
        const cId = c.comprador?.id !== undefined ? c.comprador.id : c.comprador;
        return String(cId) === String(compId);
      });
    }

    if (filtros.eventoId || filtros.evento) {
      const evId = filtros.eventoId || filtros.evento;
      result = result.filter(c => {
        const eId = c.evento?.id !== undefined ? c.evento.id : c.evento;
        return String(eId) === String(evId);
      });
    }

    if (filtros.estado) {
      result = result.filter(c => c.estado === filtros.estado);
    }

    return result;
  }

  async update(id, compraActualizada) {
    if (!id || !this.compras.has(String(id))) {
      return null;
    }
    compraActualizada.id = String(id);
    this.compras.set(String(id), compraActualizada);
    return compraActualizada;
  }

  async delete(id) {
    if (!id) return false;
    return this.compras.delete(String(id));
  }

  clear() {
    this.compras.clear();
  }
}

export const compraRepository = new CompraRepository();
