import { InMemoryRepository } from './inMemoryRepository.js';

export class UsuarioRepository extends InMemoryRepository {
  get usuarios() {
    return this.items;
  }

  async findByEmail(email) {
    if (!email) return null;
    const emailNorm = String(email).toLowerCase().trim();
    for (const usuario of this.items.values()) {
      if (usuario.email && String(usuario.email).toLowerCase().trim() === emailNorm) {
        return usuario;
      }
    }
    return null;
  }
}

export const usuarioRepository = new UsuarioRepository();
