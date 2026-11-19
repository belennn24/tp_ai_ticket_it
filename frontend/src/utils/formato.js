const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dosDigitos = (numero) => String(numero).padStart(2, '0');

// 15000 -> "$ 15.000"
export function formatearPrecio(monto) {
  const entero = Math.round(Number(monto) || 0);
  return `$ ${String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

// ISO -> "vie 11 dic 2026 · 21:00"
export function formatearFecha(iso) {
  const fecha = new Date(iso);
  if (isNaN(fecha)) return 'Fecha a confirmar';
  const dia = `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
  return `${dia} · ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

// ISO -> "11 dic · 21:00" (para mensajes e historial)
export function formatearFechaCorta(iso) {
  const fecha = new Date(iso);
  if (isNaN(fecha)) return '';
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} · ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function yaOcurrio(iso) {
  return new Date(iso).getTime() < Date.now();
}

// Texto para el campo `diasFaltantes` que devuelve el backend en las compras.
export function textoDiasFaltantes(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias <= 0) return '¡Es hoy!';
  if (dias === 1) return 'Falta 1 día';
  return `Faltan ${dias} días`;
}

// Precio más bajo entre los tipos de entrada de un evento.
export function precioDesde(evento) {
  const precios = (evento?.tiposEntrada ?? []).map((tipo) => tipo.precio);
  return precios.length ? Math.min(...precios) : null;
}

// En un evento, `tipoEntrada.cupo` es la cantidad disponible.
export function entradasDisponibles(evento) {
  return (evento?.tiposEntrada ?? []).reduce((total, tipo) => total + (tipo.cupo ?? 0), 0);
}

export function nombreCompleto(usuario) {
  if (!usuario || typeof usuario !== 'object') return '';
  return [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
}

// El backend a veces devuelve la entidad completa y a veces solo su id.
export function idDe(entidad) {
  return entidad && typeof entidad === 'object' ? entidad.id : entidad;
}

// Código corto y legible de una compra, derivado de su id real (no es un dato inventado).
export function codigoCompra(compra) {
  return compra?.id ? `TCK-${String(compra.id).slice(-6).toUpperCase()}` : null;
}

// Descripción completa de una compra para lectores de pantalla, que leen el
// ticket como un único elemento en lugar de saltar por cada texto suelto.
export function resumenAccesibleCompra(compra, { faltan } = {}) {
  const partes = [
    `Entrada para ${compra?.evento?.nombre ?? 'evento'}`,
    formatearFecha(compra?.evento?.fecha),
    `Estado: ${compra?.estado ? compra.estado.toLowerCase() : 'sin estado'}`,
    faltan,
    `${compra?.cantidad} ${compra?.cantidad === 1 ? 'entrada' : 'entradas'} ${compra?.tipoEntrada?.nombre ?? ''}`.trim(),
    `Total ${formatearPrecio(compra?.total)}`,
    codigoCompra(compra) ? `Código ${codigoCompra(compra).split('').join(' ')}` : null,
  ];
  return partes.filter(Boolean).join('. ');
}
