import { InMemoryRepository } from './inMemoryRepository.js';
import { extraerId } from '../utils/idUtils.js';

export class CambioEstadoCompraRepository extends InMemoryRepository {
  get cambios() {
    return Array.from(this.items.values());
  }

  async findByCompraId(compraId) {
    if (!compraId) return [];
    const idBuscado = String(extraerId(compraId));
    const todos = await this.findAll();
    return todos
      .filter(c => {
        const cId = String(extraerId(c.compra) || c.compraId || '');
        return cId === idBuscado;
      })
      .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }
}

export const cambioEstadoCompraRepository = new CambioEstadoCompraRepository();
