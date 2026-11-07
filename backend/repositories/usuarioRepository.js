import { Usuario } from '../models/usuario.js';

export class UsuarioRepository {
  constructor(initialData = []) {
    this.usuarios = new Map();
    initialData.forEach(u => this.save(u));
  }

  async save(usuario) {
    const id = usuario.id || String(Date.now() + Math.random());
    usuario.id = id;
    this.usuarios.set(String(id), usuario);
    return usuario;
  }

  async findById(id) {
    if (!id) return null;
    return this.usuarios.get(String(id)) || null;
  }

  async findAll() {
    return Array.from(this.usuarios.values());
  }

  async update(id, usuarioActualizado) {
    if (!id || !this.usuarios.has(String(id))) return null;
    usuarioActualizado.id = String(id);
    this.usuarios.set(String(id), usuarioActualizado);
    return usuarioActualizado;
  }

  clear() {
    this.usuarios.clear();
  }
}

export const usuarioRepository = new UsuarioRepository();
