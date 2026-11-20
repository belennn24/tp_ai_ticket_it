import { idDe } from '@/utils/formato';

import { api } from './client';

// GET /api/eventos?texto=&categoriaId=&orden= (orden: fecha | precio | reputacion)
export function buscarEventos({ texto, categoriaId, orden } = {}) {
  return api.get('/eventos', { texto, categoriaId, orden });
}

// Eventos publicados por un organizador específico.
export async function listarEventosDeOrganizador(organizadorId) {
  const eventos = await buscarEventos();
  if (!organizadorId) return [];
  return (eventos ?? []).filter((ev) => idDe(ev.organizador) === organizadorId);
}

// GET /api/eventos/:id
export function obtenerEvento(id) {
  return api.get(`/eventos/${id}`);
}

// POST /api/eventos
export function crearEvento(datos) {
  return api.post('/eventos', datos);
}

// GET /api/eventos/:id/compras -> balance de cupos y listado de compras
export function obtenerComprasDeEvento(eventoId) {
  return api.get(`/eventos/${eventoId}/compras`);
}
