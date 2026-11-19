import { api } from './client';

// GET /api/organizadores/:id/resenias -> { reputacionPromedio, totalResenias, resenias }
export function obtenerReseniasDeOrganizador(organizadorId) {
  return api.get(`/organizadores/${organizadorId}/resenias`);
}

// POST /api/resenias (requiere una compra UTILIZADA del evento; una reseña por evento)
export function crearResenia({ eventoId, puntuacion, detalle }) {
  return api.post('/resenias', { eventoId, puntuacion, detalle });
}
