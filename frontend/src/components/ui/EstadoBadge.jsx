import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, estadosCompra, fuentes, radios, tamanios } from '@/theme';

// Insignia con el estado de una compra. Siempre muestra ícono y texto, así el
// estado se entiende sin distinguir colores. El fondo es sólido para que el
// contraste no dependa de lo que haya detrás.
export function EstadoBadge({ estado }) {
  const config = estadosCompra[estado] ?? {
    etiqueta: estado ?? 'Sin estado',
    color: colores.textoSecundario,
    icono: 'help-circle-outline',
  };

  return (
    <View style={[estilos.base, { borderColor: config.color }]} accessible accessibilityLabel={`Estado: ${config.etiqueta}`}>
      <Ionicons name={config.icono} size={14} color={config.color} />
      <Text style={[estilos.texto, { color: config.color }]}>{config.etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    borderWidth: 1,
    backgroundColor: colores.fondoAlt,
  },
  texto: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
  },
});
