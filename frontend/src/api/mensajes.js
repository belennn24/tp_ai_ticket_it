import { api } from './client';

// La conversación se lee de la compra: GET /api/compras/:id -> compra.mensajes
// (ver obtenerCompra en ./compras).

// POST /api/compras/:id/mensajes
export function enviarMensaje(compraId, mensaje) {
  return api.post(`/compras/${compraId}/mensajes`, { mensaje });
}
