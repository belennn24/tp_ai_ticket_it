import { InMemoryRepository } from './inMemoryRepository.js';

export class EventoRepository extends InMemoryRepository {
  get eventos() {
    return this.items;
  }
}

export const eventoRepository = new EventoRepository();
