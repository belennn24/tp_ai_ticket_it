import { api } from './client';

// GET /api/usuarios/me/favoritos -> lista de eventos favoritos del comprador
export function listarFavoritos() {
  return api.get('/usuarios/me/favoritos');
}

// POST /api/usuarios/me/favoritos/:eventoId -> guardar evento en favoritos
export function agregarFavorito(eventoId) {
  return api.post(`/usuarios/me/favoritos/${eventoId}`);
}

// DELETE /api/usuarios/me/favoritos/:eventoId -> quitar evento de favoritos
export function eliminarFavorito(eventoId) {
  return api.delete(`/usuarios/me/favoritos/${eventoId}`);
}
