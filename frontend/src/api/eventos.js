import { api } from './client';

// GET /api/eventos?texto=&categoriaId=&orden= (orden: fecha | precio | reputacion)
export function buscarEventos({ texto, categoriaId, orden } = {}) {
  return api.get('/eventos', { texto, categoriaId, orden });
}

// GET /api/eventos/:id
export function obtenerEvento(id) {
  return api.get(`/eventos/${id}`);
}
