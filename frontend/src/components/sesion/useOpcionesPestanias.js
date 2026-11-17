import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colores, fuentes, tamanios } from '@/theme';

const ALTO_BARRA = 66;

// Estilo común de la barra de pestañas inferior para ambos roles.
// El alto se calcula a mano para que entren el ícono y la etiqueta de 12 px,
// sumando el margen inferior del dispositivo (gestos o barra de inicio).
export function useOpcionesPestanias() {
  const { bottom } = useSafeAreaInsets();

  return {
    headerShown: false,
    tabBarActiveTintColor: colores.primario,
    tabBarInactiveTintColor: colores.textoSecundario,
    tabBarStyle: {
      backgroundColor: colores.barraPestanias,
      borderTopColor: colores.borde,
      height: ALTO_BARRA + bottom,
      paddingTop: 6,
      paddingBottom: bottom + 6,
    },
    tabBarLabelStyle: {
      fontFamily: fuentes.semibold,
      fontSize: tamanios.xs,
    },
    sceneStyle: {
      backgroundColor: colores.fondo,
    },
  };
}
