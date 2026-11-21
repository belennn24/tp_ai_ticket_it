import { api } from './client';

// POST /api/auth/login -> { mensaje, token, usuario }
export function iniciarSesion(email, password) {
  return api.post('/auth/login', { email, password });
}

// GET /api/auth/me -> { usuario }
export async function obtenerUsuarioActual() {
  const respuesta = await api.get('/auth/me');
  return respuesta.usuario;
}

// POST /api/auth/logout
export function cerrarSesion() {
  return api.post('/auth/logout');
}

// PATCH /api/usuarios/me -> { mensaje, usuario }
export async function actualizarPerfil({ nombre, apellido }) {
  const respuesta = await api.patch('/usuarios/me', { nombre, apellido });
  return respuesta.usuario;
}
