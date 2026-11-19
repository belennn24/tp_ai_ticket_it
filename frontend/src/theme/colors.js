// Paleta "Atardecer": violeta + rosa + naranja, con degradés. Cada par texto/fondo que se usa en la app
// cumple WCAG AA: 4.5:1 para texto y 3:1 para bordes de controles.
// Si cambiás un color, volvé a medir el contraste antes de usarlo con texto.
export const colores = {
  // Fondos
  fondo: '#0F0A24',
  fondoAlt: '#140D30',
  tarjeta: '#1E1545',
  tarjetaAlta: '#2A1D5C',

  // Bordes: `borde` es decorativo (separa tarjetas); `bordeControl` marca
  // inputs, chips y botones secundarios y tiene contraste 3:1 con el fondo.
  borde: '#3A2C6E',
  bordeControl: '#7C6BC0',

  // Acentos
  primario: '#FDBA74', // durazno: acentos de texto, íconos activos, foco
  violeta: '#7C3AED', // violeta de marca: rellenos con texto blanco
  violetaOscuro: '#4C1D95',
  dorado: '#FFD148', // precios, estrellas y cuenta regresiva
  sobrePrimario: '#0F0A24', // texto sobre durazno o dorado
  sobreVioleta: '#FFFFFF', // texto sobre violeta de marca

  // Se mantienen por compatibilidad con componentes existentes
  secundario: '#FDBA74',
  secundarioPresionado: '#FB923C',
  primarioSuave: '#FDBA74',
  primarioSuavePresionado: '#FB923C',
  acento: '#DC2626',

  // Texto
  texto: '#F5F3FF',
  textoSecundario: '#C9C2E6',
  textoAtenuado: '#A79DD0',
  textoTicket: '#EDE9FE', // texto secundario sobre el ticket en degradé
  acentoFecha: '#F9A8D4', // rosa claro: fechas e íconos de calendario

  // Estados
  exito: '#6EE7B7',
  error: '#FCA5A5',
  rojoInsignia: '#DC2626', // fondo de "Agotado" / "Finalizado", con texto blanco

  barraPestanias: '#140D30',
  encabezado: '#581131', // mismo tono que el inicio del resplandor, para que no haya corte
  pastillaActiva: 'rgba(124, 58, 237, 0.28)',
  insigniaFondo: 'rgba(124, 58, 237, 0.22)',
  insigniaBorde: 'rgba(196, 181, 253, 0.45)',
  veloFoto: 'rgba(15, 10, 36, 0.85)',
};

// Degradés. El texto blanco tiene contraste AA en todos sus colores.
export const degrades = {
  primario: ['#7C3AED', '#BE185D'],
  azul: ['#2563EB', '#6D28D9'],
  dorado: ['#FFD148', '#F59E0B'], // con texto `sobrePrimario`
  ticket: ['#6D28D9', '#BE185D', '#9A3412'],
  ticketLista: ['#3B1F7A', '#5C1A3A'],
  brillo: ['rgba(225, 29, 72, 0.35)', 'rgba(225, 29, 72, 0)'], // resplandor superior del fondo (empieza en `colores.encabezado`)
  veloFoto: ['rgba(15, 10, 36, 0)', 'rgba(15, 10, 36, 0.85)', '#0F0A24'],
};

// Color y etiqueta de cada estado de compra que devuelve el backend.
// La insignia muestra siempre el texto: el color nunca es la única pista.
export const estadosCompra = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#FFD148', icono: 'time-outline' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#6EE7B7', icono: 'checkmark-circle-outline' },
  UTILIZADA: { etiqueta: 'Utilizada', color: '#C9C2E6', icono: 'ticket-outline' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#FCA5A5', icono: 'close-circle-outline' },
  REEMBOLSADA: { etiqueta: 'Reembolsada', color: '#7DD3FC', icono: 'return-down-back-outline' },
};
