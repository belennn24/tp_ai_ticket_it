import { api } from './client';

// GET /api/categorias -> [{ id, nombre, descripcion }]
export function listarCategorias() {
  return api.get('/categorias');
}
