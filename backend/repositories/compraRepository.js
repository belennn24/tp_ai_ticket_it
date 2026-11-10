import { InMemoryRepository } from './inMemoryRepository.js';
import { extraerId } from '../utils/idUtils.js';

export class CompraRepository extends InMemoryRepository {
  get compras() {
    return this.items;
  }

  async findAll(filtros = {}) {
    let result = await super.findAll();

    if (typeof filtros === 'function') {
      return result.filter(filtros);
    }

    if (filtros.compradorId || filtros.comprador) {
      const compId = String(extraerId(filtros.compradorId || filtros.comprador));
      result = result.filter(c => String(extraerId(c.comprador)) === compId);
    }

    if (filtros.eventoId || filtros.evento) {
      const evId = String(extraerId(filtros.eventoId || filtros.evento));
      result = result.filter(c => String(extraerId(c.evento)) === evId);
    }

    if (filtros.estado) {
      result = result.filter(c => c.estado === filtros.estado);
    }

    return result;
  }

  async findByCompradorId(compradorId) {
    if (!compradorId) return [];
    return this.findAll({ compradorId });
  }

  async findByEventoId(eventoId) {
    if (!eventoId) return [];
    return this.findAll({ eventoId });
  }

  async findByCompradorYEvento(compradorId, eventoId) {
    if (!compradorId || !eventoId) return null;
    const res = await this.findAll({ compradorId, eventoId });
    return res[0] || null;
  }
}

export const compraRepository = new CompraRepository();
