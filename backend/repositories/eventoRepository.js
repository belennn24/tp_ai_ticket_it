export class EventoRepository {
  constructor(initialData = []) {
    this.eventos = new Map();
    initialData.forEach(ev => this.save(ev));
  }

  async save(evento) {
    const id = evento.id || String(Date.now() + Math.random());
    evento.id = id;
    this.eventos.set(String(id), evento);
    return evento;
  }

  async findById(id) {
    if (!id) return null;
    return this.eventos.get(String(id)) || null;
  }

  async findAll() {
    return Array.from(this.eventos.values());
  }

  async update(id, eventoActualizado) {
    if (!id || !this.eventos.has(String(id))) {
      return null;
    }
    eventoActualizado.id = String(id);
    this.eventos.set(String(id), eventoActualizado);
    return eventoActualizado;
  }

  async delete(id) {
    if (!id) return false;
    return this.eventos.delete(String(id));
  }

  clear() {
    this.eventos.clear();
  }
}

export const eventoRepository = new EventoRepository();
