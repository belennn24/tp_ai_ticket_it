import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colores } from '@/theme';

export function Cargando() {
  return (
    <View style={estilos.contenedor} accessibilityLabel="Cargando">
      <ActivityIndicator size="large" color={colores.primario} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
