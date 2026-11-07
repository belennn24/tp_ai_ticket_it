export class ReseniaRepository {
  constructor(initialData = []) {
    this.resenias = new Map();
    initialData.forEach(r => this.save(r));
  }

  async save(resenia) {
    const id = resenia.id || String(Date.now() + Math.random());
    resenia.id = id;
    this.resenias.set(String(id), resenia);
    return resenia;
  }

  async findById(id) {
    if (!id) return null;
    return this.resenias.get(String(id)) || null;
  }

  async findAll() {
    return Array.from(this.resenias.values());
  }

  async findByEventoId(eventoId) {
    if (!eventoId) return [];
    return Array.from(this.resenias.values()).filter(r => {
      const eId = r.evento?.id !== undefined ? r.evento.id : r.evento;
      return String(eId) === String(eventoId);
    });
  }

  async findByCompradorYEvento(compradorId, eventoId) {
    return (
      Array.from(this.resenias.values()).find(r => {
        const cId = r.comprador?.id !== undefined ? r.comprador.id : r.comprador;
        const eId = r.evento?.id !== undefined ? r.evento.id : r.evento;
        return String(cId) === String(compradorId) && String(eId) === String(eventoId);
      }) || null
    );
  }

  async findByOrganizadorId(organizadorId) {
    if (!organizadorId) return [];
    return Array.from(this.resenias.values()).filter(r => {
      const orgId = r.organizador?.id !== undefined ? r.organizador.id : r.organizador;
      return String(orgId) === String(organizadorId);
    });
  }

  clear() {
    this.resenias.clear();
  }
}

export const reseniaRepository = new ReseniaRepository();
