import { InMemoryRepository } from './inMemoryRepository.js';

export class RefreshTokenRepository extends InMemoryRepository {
  async findByToken(token) {
    if (!token) return null;
    return this.findById(token);
  }

  async deleteByToken(token) {
    if (!token) return false;
    return this.delete(token);
  }

  async deleteByUsuarioId(usuarioId) {
    if (!usuarioId) return;
    const uid = String(usuarioId);
    for (const [id, item] of this.items.entries()) {
      if (item.usuarioId === uid) {
        this.items.delete(id);
      }
    }
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
