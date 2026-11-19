import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';

// Contador con botones - y +, limitado entre 1 y `maximo` (el cupo disponible).
export function SelectorCantidad({ cantidad, maximo, onCambiar }) {
  const puedeRestar = cantidad > 1;
  const puedeSumar = cantidad < maximo;

  return (
    <View style={estilos.fila}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quitar una entrada"
        disabled={!puedeRestar}
        onPress={() => onCambiar(cantidad - 1)}
        style={[estilos.boton, !puedeRestar && estilos.inactivo]}>
        <Ionicons name="remove" size={22} color={colores.texto} />
      </Pressable>
      <Text
        style={estilos.cantidad}
        accessibilityLabel={`Cantidad: ${cantidad}, máximo ${maximo}`}
        accessibilityLiveRegion="polite">
        {cantidad}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar una entrada"
        disabled={!puedeSumar}
        onPress={() => onCambiar(cantidad + 1)}
        style={[estilos.boton, !puedeSumar && estilos.inactivo]}>
        <Ionicons name="add" size={22} color={colores.texto} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.lg,
  },
  boton: {
    width: 48,
    height: 48,
    borderRadius: radios.input,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactivo: {
    opacity: 0.4,
  },
  cantidad: {
    minWidth: 32,
    textAlign: 'center',
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.xl,
    color: colores.texto,
  },
});
