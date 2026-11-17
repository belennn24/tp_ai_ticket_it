import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';

// Píldora seleccionable para filtros (categorías, orden, estados).
// El elegido cambia de relleno y además muestra una tilde: no depende solo del color.
export function Chip({ etiqueta, seleccionado = false, onPress }) {
  const contenido = (
    <>
      {seleccionado ? <Ionicons name="checkmark" size={16} color={colores.sobreVioleta} /> : null}
      <Text style={[estilos.texto, seleccionado && estilos.textoSeleccionado]}>{etiqueta}</Text>
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: seleccionado }}
      onPress={onPress}
      style={({ pressed }) => [estilos.contenedor, pressed && estilos.presionado]}>
      {seleccionado ? (
        <LinearGradient
          colors={degrades.primario}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[estilos.base, estilos.sinBorde]}>
          {contenido}
        </LinearGradient>
      ) : (
        <View style={[estilos.base, estilos.noSeleccionado]}>{contenido}</View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: radios.pildora,
    overflow: 'hidden',
  },
  presionado: {
    opacity: 0.85,
  },
  base: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.lg,
    borderRadius: radios.pildora,
  },
  sinBorde: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  noSeleccionado: {
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.tarjeta,
  },
  texto: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  textoSeleccionado: {
    color: colores.sobreVioleta,
  },
});
