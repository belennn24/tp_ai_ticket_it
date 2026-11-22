// Cliente HTTP único de la app. Conoce la URL base del backend, agrega el
// token Bearer, renueva la sesión cuando el access token vence y traduce los
// errores a un formato común (ApiError).
//
// Sesión: el access token dura poco (15 min) y el refresh token sirve para pedir
// un par nuevo sin volver a loguearse. Los dos viven solo en memoria. La app se
// identifica como cliente móvil (X-Cliente: movil), así el backend le entrega el
// refresh token en el cuerpo en lugar de una cookie HttpOnly, pensada para navegadores.

const URL_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const TIEMPO_MAXIMO_MS = 10000;
const ENCABEZADOS_BASE = { Accept: 'application/json', 'X-Cliente': 'movil' };

let tokenActual = null;
let refreshTokenActual = null;
let alPerderSesion = null;
// Si varios pedidos reciben 401 a la vez, comparten una única renovación.
let renovacionEnCurso = null;

export class ApiError extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ApiError';
    // Código HTTP de la respuesta, o 0 si no hubo respuesta del servidor.
    this.estado = estado;
  }
}

// Guarda (o borra, sin argumentos) los tokens de la sesión.
export function definirTokens({ token = null, refreshToken = null } = {}) {
  tokenActual = token;
  refreshTokenActual = refreshToken;
}

export function obtenerRefreshToken() {
  return refreshTokenActual;
}

// Registra qué hacer cuando la sesión no se puede renovar (refresh token vencido o revocado).
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

async function enviar(metodo, url, encabezados, cuerpo) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  try {
    return await fetch(url, {
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
}

// Pide un par de tokens nuevo con el refresh token. Devuelve true si la sesión se renovó.
// El backend rota el refresh token: el anterior deja de servir.
function renovarSesion() {
  if (!refreshTokenActual) return Promise.resolve(false);
  if (!renovacionEnCurso) {
    const refreshEnviado = refreshTokenActual;
    renovacionEnCurso = (async () => {
      try {
        const respuesta = await enviar(
          'POST',
          armarUrl('/auth/refresh'),
          { ...ENCABEZADOS_BASE, 'Content-Type': 'application/json' },
          { refreshToken: refreshEnviado }
        );
        const datos = await leerCuerpo(respuesta);
        // Si mientras tanto se cerró la sesión, no se reviven los tokens.
        if (!respuesta.ok || !datos?.token || !datos?.refreshToken || refreshTokenActual !== refreshEnviado) {
          return false;
        }
        definirTokens({ token: datos.token, refreshToken: datos.refreshToken });
        return true;
      } catch {
        return false;
      } finally {
        renovacionEnCurso = null;
      }
    })();
  }
  return renovacionEnCurso;
}

async function solicitar(metodo, ruta, { cuerpo, parametros } = {}, puedeRenovar = true) {
  if (!URL_BASE) {
    throw new ApiError('Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.local.', 0);
  }

  const tokenEnviado = tokenActual;
  const encabezados = { ...ENCABEZADOS_BASE };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  if (tokenEnviado) encabezados.Authorization = `Bearer ${tokenEnviado}`;

  const respuesta = await enviar(metodo, armarUrl(ruta, parametros), encabezados, cuerpo);
  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    // Un 401 con token enviado significa que el access token venció o es inválido:
    // se intenta renovar la sesión una vez y repetir el pedido.
    if (respuesta.status === 401 && tokenEnviado && tokenActual) {
      if (puedeRenovar) {
        // Si otro pedido ya renovó la sesión, alcanza con repetir este con el token nuevo.
        const renovada = tokenActual !== tokenEnviado || (await renovarSesion());
        if (renovada) return solicitar(metodo, ruta, { cuerpo, parametros }, false);
      }
      if (tokenEnviado === tokenActual || !puedeRenovar) {
        alPerderSesion?.();
      }
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
