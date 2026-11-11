import { InMemoryRepository } from './inMemoryRepository.js';

export class CategoriaRepository extends InMemoryRepository {
  get categorias() {
    return this.items;
  }
}

export const categoriaRepository = new CategoriaRepository();
