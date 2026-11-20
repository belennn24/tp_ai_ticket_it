import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonBuzon } from '@/components/chat/BotonBuzon';
import { useSesion } from '@/context/SesionContext';
import { colores, espacios, fuentes, tamanios } from '@/theme';

import { FondoConBrillo } from './FondoConBrillo';

// Contenedor base de cada pantalla: fondo con resplandor, áreas seguras y título opcional.
// El título se marca como encabezado para que los lectores de pantalla lo anuncien.
export function Pantalla({ titulo, children, bordes = ['top'], mostrarBuzon = true }) {
  const { haySesion } = useSesion();

  return (
    <FondoConBrillo>
      <SafeAreaView style={estilos.contenedor} edges={bordes}>
        {titulo ? (
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              {titulo}
            </Text>
            {haySesion && mostrarBuzon ? <BotonBuzon /> : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.md,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.lg,
    paddingBottom: espacios.md,
  },
  titulo: {
    flex: 1,
    fontFamily: fuentes.bold,
    fontSize: tamanios.xxl - 4,
    color: colores.texto,
  },
});
