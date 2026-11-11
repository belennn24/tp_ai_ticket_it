import crypto from 'crypto';
import { extraerId } from '../utils/idUtils.js';

/**
 * Repositorio base en memoria con operaciones CRUD estándar.
 * Estandariza la interfaz de persistencia (Liskov Substitution Principle)
 * y elimina la duplicación de código en todos los repositorios.
 */
export class InMemoryRepository {
  constructor(initialData = []) {
    this.items = new Map();
    if (Array.isArray(initialData)) {
      initialData.forEach(item => this.save(item));
    }
  }

  async save(entity) {
    if (!entity) return null;
    const id = entity.id || entity._id || crypto.randomUUID();
    entity.id = String(id);
    this.items.set(entity.id, entity);
    return entity;
  }

  async findById(id) {
    if (!id) return null;
    const idBuscado = String(extraerId(id));
    return this.items.get(idBuscado) || null;
  }

  async findAll(filtros) {
    const list = Array.from(this.items.values());
    if (typeof filtros === 'function') {
      return list.filter(filtros);
    }
    return list;
  }

  async update(id, entityActualizada) {
    if (!id) return null;
    const idStr = String(extraerId(id));
    if (!this.items.has(idStr)) {
      return null;
    }
    entityActualizada.id = idStr;
    this.items.set(idStr, entityActualizada);
    return entityActualizada;
  }

  async delete(id) {
    if (!id) return false;
    const idStr = String(extraerId(id));
    return this.items.delete(idStr);
  }

  clear() {
    this.items.clear();
  }

  get count() {
    return this.items.size;
  }
}
