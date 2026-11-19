import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colores, radios } from '@/theme';

// Ícono de pestaña. La activa no se distingue solo por color: el ícono pasa a
// relleno y aparece una pastilla violeta detrás.
export function iconoPestania(nombreBase) {
  return function IconoPestania({ color, size, focused }) {
    return (
      <View style={[estilos.pastilla, focused && estilos.pastillaActiva]}>
        <Ionicons name={focused ? nombreBase : `${nombreBase}-outline`} color={color} size={size - 2} />
      </View>
    );
  };
}

const estilos = StyleSheet.create({
  pastilla: {
    width: 52,
    height: 30,
    borderRadius: radios.pildora,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaActiva: {
    backgroundColor: colores.pastillaActiva,
  },
});
