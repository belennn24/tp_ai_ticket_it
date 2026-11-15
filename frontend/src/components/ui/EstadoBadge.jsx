import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, estadosCompra, fuentes, radios, tamanios } from '@/theme';

// Insignia con el estado de una compra (PENDIENTE, CONFIRMADA, UTILIZADA...).
export function EstadoBadge({ estado }) {
  const config = estadosCompra[estado] ?? { etiqueta: estado ?? 'Sin estado', color: colores.textoAtenuado };

  return (
    <View style={[estilos.base, { borderColor: config.color }]}>
      <View style={[estilos.punto, { backgroundColor: config.color }]} />
      <Text style={[estilos.texto, { color: config.color }]}>{config.etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs + 2,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    borderWidth: 1,
    backgroundColor: colores.fondoAlt,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
  },
});
