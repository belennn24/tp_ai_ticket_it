import { Categoria } from '../models/categoria.js';

export class CategoriaRepository {
  constructor(initialData = []) {
    this.categorias = new Map();
    initialData.forEach(c => this.save(c));
  }

  async save(categoria) {
    const id = categoria.id || String(Date.now() + Math.random());
    categoria.id = id;
    this.categorias.set(String(id), categoria);
    return categoria;
  }

  async findById(id) {
    if (!id) return null;
    return this.categorias.get(String(id)) || null;
  }

  async findAll() {
    return Array.from(this.categorias.values());
  }

  clear() {
    this.categorias.clear();
  }
}

export const categoriaRepository = new CategoriaRepository();
