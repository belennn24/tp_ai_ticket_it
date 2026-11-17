import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colores, degrades } from '@/theme';

const ALTO_BRILLO = 280;

// Fondo oscuro con un resplandor violeta arriba. El resplandor es decorativo:
// no recibe toques ni lo anuncian los lectores de pantalla.
export function FondoConBrillo({ children, style }) {
  return (
    <View style={[estilos.contenedor, style]}>
      <LinearGradient
        colors={degrades.brillo}
        style={estilos.brillo}
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  brillo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ALTO_BRILLO,
  },
});
