import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, tamanios } from '@/theme';

// Patrón de grosores de barras para simular un código de barras de ticket real
const PATRON_BARRAS = [2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 2, 1, 4, 2];

export function CodigoBarras({ codigo, altura = 36, color = colores.secundario }) {
  const codigoMostrar = codigo ? String(codigo).toUpperCase() : 'TICKET-IT-APP';

  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.barras, { height: altura }]}>
        {PATRON_BARRAS.map((ancho, index) => (
          <View
            key={index}
            style={[
              estilos.barra,
              {
                width: ancho,
                height: '100%',
                backgroundColor: color,
                opacity: index % 3 === 0 ? 0.9 : 0.65,
              },
            ]}
          />
        ))}
      </View>
      {codigoMostrar ? (
        <Text style={estilos.textoCodigo}>{codigoMostrar}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: espacios.xs,
    paddingTop: espacios.xs,
  },
  barras: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    overflow: 'hidden',
  },
  barra: {
    borderRadius: 1,
  },
  textoCodigo: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
    letterSpacing: 3,
  },
});
