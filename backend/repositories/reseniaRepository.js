import { InMemoryRepository } from './inMemoryRepository.js';
import { extraerId } from '../utils/idUtils.js';

export class ReseniaRepository extends InMemoryRepository {
  get resenias() {
    return this.items;
  }

  async findByEventoId(eventoId) {
    if (!eventoId) return [];
    const idBuscado = String(extraerId(eventoId));
    const todos = await this.findAll();
    return todos.filter(r => String(extraerId(r.evento)) === idBuscado);
  }

  async findByCompradorYEvento(compradorId, eventoId) {
    const cId = String(extraerId(compradorId));
    const eId = String(extraerId(eventoId));
    const todos = await this.findAll();
    return todos.find(r =>
      String(extraerId(r.comprador)) === cId && String(extraerId(r.evento)) === eId
    ) || null;
  }

  async findByOrganizadorId(organizadorId) {
    if (!organizadorId) return [];
    const idBuscado = String(extraerId(organizadorId));
    const todos = await this.findAll();
    return todos.filter(r => String(extraerId(r.organizador)) === idBuscado);
  }
}

export const reseniaRepository = new ReseniaRepository();
