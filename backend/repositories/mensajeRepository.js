import { InMemoryRepository } from './inMemoryRepository.js';
import { extraerId } from '../utils/idUtils.js';

export class MensajeRepository extends InMemoryRepository {
  get mensajes() {
    return Array.from(this.items.values());
  }

  async findByCompraId(compraId) {
    if (!compraId) return [];
    const idBuscado = String(extraerId(compraId));
    const todos = await this.findAll();
    return todos
      .filter(m => String(extraerId(m.compra)) === idBuscado)
      .sort((a, b) => new Date(a.enviado || a.fechaHora) - new Date(b.enviado || b.fechaHora));
  }
}

export const mensajeRepository = new MensajeRepository();
