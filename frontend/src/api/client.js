// Cliente HTTP único de la app. Conoce la URL base del backend, agrega el
// token Bearer y traduce los errores a un formato común (ApiError).

const URL_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const TIEMPO_MAXIMO_MS = 10000;

let tokenActual = null;
let alPerderSesion = null;

export class ApiError extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ApiError';
    // Código HTTP de la respuesta, o 0 si no hubo respuesta del servidor.
    this.estado = estado;
  }
}

export function definirToken(token) {
  tokenActual = token;
}

// Registra qué hacer cuando el backend rechaza el token (401).
export function definirAlPerderSesion(callback) {
  alPerderSesion = callback;
}

function armarUrl(ruta, parametros) {
  const consulta = Object.entries(parametros ?? {})
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`)
    .join('&');
  return `${URL_BASE}${ruta}${consulta ? `?${consulta}` : ''}`;
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

async function solicitar(metodo, ruta, { cuerpo, parametros } = {}) {
  if (!URL_BASE) {
    throw new ApiError('Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.local.', 0);
  }

  const tokenEnviado = tokenActual;
  const encabezados = { Accept: 'application/json' };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  if (tokenEnviado) encabezados.Authorization = `Bearer ${tokenEnviado}`;

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);

  let respuesta;
  try {
    respuesta = await fetch(armarUrl(ruta, parametros), {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisá que el backend esté levantado y la IP de EXPO_PUBLIC_API_URL.',
      0
    );
  } finally {
    clearTimeout(temporizador);
  }

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    // Un 401 con token enviado significa que la sesión venció o es inválida.
    if (respuesta.status === 401 && tokenEnviado && tokenEnviado === tokenActual) {
      alPerderSesion?.();
    }
    throw new ApiError(datos?.message ?? `Error inesperado (${respuesta.status}).`, respuesta.status);
  }

  return datos;
}

export const api = {
  get: (ruta, parametros) => solicitar('GET', ruta, { parametros }),
  post: (ruta, cuerpo) => solicitar('POST', ruta, { cuerpo }),
  patch: (ruta, cuerpo) => solicitar('PATCH', ruta, { cuerpo }),
  delete: (ruta) => solicitar('DELETE', ruta),
};
