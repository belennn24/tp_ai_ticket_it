import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colores, espacios, fuentes, tamanios } from '@/theme';

// Contenedor base de cada pantalla: fondo, áreas seguras y título opcional.
export function Pantalla({ titulo, children, bordes = ['top'] }) {
  return (
    <SafeAreaView style={estilos.contenedor} edges={bordes}>
      {titulo ? (
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>{titulo}</Text>
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  encabezado: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.lg,
    paddingBottom: espacios.md,
  },
  titulo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xl,
    color: colores.texto,
  },
});
