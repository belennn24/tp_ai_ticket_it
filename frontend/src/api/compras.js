import { api } from './client';

// GET /api/compras -> compras del comprador autenticado
export function listarMisCompras() {
  return api.get('/compras');
}

// GET /api/compras/:id
export function obtenerCompra(id) {
  return api.get(`/compras/${id}`);
}

// GET /api/compras/:id/historial -> [{ estado, quien, motivo, fechaHora }]
export function obtenerHistorial(id) {
  return api.get(`/compras/${id}/historial`);
}

// POST /api/compras
export function crearCompra({ eventoId, tipoEntradaId, cantidad }) {
  return api.post('/compras', { eventoId, tipoEntradaId, cantidad });
}

// PATCH /api/compras/:id/cancelar
export function cancelarCompra(id, motivo) {
  return api.patch(`/compras/${id}/cancelar`, motivo ? { motivo } : {});
}

// PATCH /api/compras/:id/utilizar
export function utilizarCompra(id) {
  return api.patch(`/compras/${id}/utilizar`);
}
