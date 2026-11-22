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

// PATCH /api/compras/:id/estado { estado: 'CANCELADA', motivo? } (comprador)
export function cancelarCompra(id, motivo) {
  return api.patch(`/compras/${id}/estado`, motivo ? { estado: 'CANCELADA', motivo } : { estado: 'CANCELADA' });
}

// PATCH /api/compras/:id/estado { estado: 'CONFIRMADA' } (organizador: pago recibido)
export function confirmarPagoCompra(id) {
  return api.patch(`/compras/${id}/estado`, { estado: 'CONFIRMADA' });
}

// PATCH /api/compras/:id/estado { estado: 'REEMBOLSADA' } (organizador: devolución realizada)
export function registrarReembolsoCompra(id) {
  return api.patch(`/compras/${id}/estado`, { estado: 'REEMBOLSADA' });
}

// PATCH /api/compras/:id/estado { estado: 'UTILIZADA' } (organizador)
export function utilizarCompra(id) {
  return api.patch(`/compras/${id}/estado`, { estado: 'UTILIZADA' });
}
