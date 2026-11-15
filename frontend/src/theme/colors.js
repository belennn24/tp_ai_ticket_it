// Paleta "Twilight Violet & Champagne Gold", tomada del prototipo de diseño.
export const colores = {
  fondo: '#16102B',
  fondoAlt: '#18122E',
  tarjeta: '#221942',
  borde: '#3B3155',

  primario: '#FFD148',
  sobrePrimario: '#16102B',
  // Relleno de botones y chips: un dorado más suave que el de marca,
  // para que las superficies grandes no encandilen sobre el fondo oscuro.
  primarioSuave: '#EDD9A3',
  primarioSuavePresionado: '#DFC88A',
  secundario: '#D8B4FE',
  secundarioPresionado: '#C79BF5',
  acento: '#EF4444',

  texto: '#F4F1FA',
  textoSecundario: '#A9A2BA',
  textoAtenuado: '#847B9B',

  exito: '#10B981',
  error: '#EF4444',

  barraPestanias: 'rgba(22, 16, 43, 0.96)',
  insigniaFondo: 'rgba(255, 209, 72, 0.15)',
  insigniaBorde: 'rgba(255, 209, 72, 0.35)',
};

// Color y etiqueta de cada estado de compra que devuelve el backend.
export const estadosCompra = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#FFD148' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#10B981' },
  UTILIZADA: { etiqueta: 'Utilizada', color: '#847B9B' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#EF4444' },
  REEMBOLSADA: { etiqueta: 'Reembolsada', color: '#38BDF8' },
};
