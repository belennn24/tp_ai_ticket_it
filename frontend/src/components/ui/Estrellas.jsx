import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colores, espacios } from '@/theme';

const POSICIONES = [1, 2, 3, 4, 5];

function nombreIcono(posicion, valor) {
  if (valor >= posicion) return 'star';
  if (valor >= posicion - 0.5) return 'star-half';
  return 'star-outline';
}

// Muestra un puntaje de 1 a 5. Si recibe `onCambiar`, permite elegirlo tocando.
export function Estrellas({ valor = 0, tamanio = 18, onCambiar }) {
  return (
    <View
      style={estilos.fila}
      accessibilityRole={onCambiar ? 'adjustable' : 'image'}
      accessibilityLabel={`Puntaje: ${valor} de 5`}>
      {POSICIONES.map((posicion) => {
        const icono = <Ionicons name={nombreIcono(posicion, valor)} size={tamanio} color={colores.primario} />;
        if (!onCambiar) {
          return <View key={posicion}>{icono}</View>;
        }
        return (
          <Pressable
            key={posicion}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${posicion} de 5`}
            onPress={() => onCambiar(posicion)}>
            {icono}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: espacios.xs,
  },
});
