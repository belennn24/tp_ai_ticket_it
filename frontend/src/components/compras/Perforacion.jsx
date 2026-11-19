import { StyleSheet, View } from 'react-native';

import { colores } from '@/theme';

const MUESCA = 24;

// Línea de corte del ticket: dos semicírculos del color del fondo de la
// pantalla y una línea punteada. Es decorativa.
export function Perforacion({ colorLinea = 'rgba(237, 233, 254, 0.45)', colorFondo = colores.fondo }) {
  return (
    <View style={estilos.corte} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={[estilos.muesca, estilos.izquierda, { backgroundColor: colorFondo }]} />
      <View style={[estilos.linea, { borderColor: colorLinea }]} />
      <View style={[estilos.muesca, estilos.derecha, { backgroundColor: colorFondo }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  corte: {
    height: MUESCA,
    justifyContent: 'center',
  },
  linea: {
    marginHorizontal: MUESCA,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  muesca: {
    position: 'absolute',
    width: MUESCA,
    height: MUESCA,
    borderRadius: MUESCA / 2,
  },
  izquierda: {
    left: -MUESCA / 2,
  },
  derecha: {
    right: -MUESCA / 2,
  },
});
