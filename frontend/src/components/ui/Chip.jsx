import { Pressable, StyleSheet, Text } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';

// Píldora seleccionable, pensada para filtros (categorías, orden, estados).
export function Chip({ etiqueta, seleccionado = false, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      onPress={onPress}
      style={[estilos.base, seleccionado && estilos.seleccionado]}>
      <Text style={[estilos.texto, seleccionado && estilos.textoSeleccionado]}>{etiqueta}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: espacios.lg,
    borderRadius: radios.pildora,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  seleccionado: {
    backgroundColor: colores.primarioSuave,
    borderColor: colores.primarioSuave,
  },
  texto: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  textoSeleccionado: {
    color: colores.sobrePrimario,
  },
});
