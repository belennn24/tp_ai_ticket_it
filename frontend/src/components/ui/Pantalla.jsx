import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colores, espacios, fuentes, tamanios } from '@/theme';

import { FondoConBrillo } from './FondoConBrillo';

// Contenedor base de cada pantalla: fondo con resplandor, áreas seguras y título opcional.
// El título se marca como encabezado para que los lectores de pantalla lo anuncien.
export function Pantalla({ titulo, children, bordes = ['top'] }) {
  return (
    <FondoConBrillo>
      <SafeAreaView style={estilos.contenedor} edges={bordes}>
        {titulo ? (
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              {titulo}
            </Text>
          </View>
        ) : null}
        {children}
      </SafeAreaView>
    </FondoConBrillo>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  encabezado: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.lg,
    paddingBottom: espacios.md,
  },
  titulo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xxl - 4,
    color: colores.texto,
  },
});
