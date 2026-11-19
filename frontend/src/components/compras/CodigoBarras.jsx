import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, tamanios } from '@/theme';

// Patrón de grosores de barras para simular un código de barras de ticket real.
const PATRON_BARRAS = [2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 2, 1, 4, 2];

// Las barras son decorativas: no codifican nada, así que se ocultan a los
// lectores de pantalla. El código en texto sí es real (sale del id de la compra).
export function CodigoBarras({ codigo, altura = 36, color = colores.texto, colorTexto = colores.textoSecundario }) {
  return (
    <View style={estilos.contenedor}>
      <View
        style={[estilos.barras, { height: altura }]}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden>
        {PATRON_BARRAS.map((ancho, indice) => (
          <View key={indice} style={[estilos.barra, { width: ancho, backgroundColor: color }]} />
        ))}
      </View>
      {codigo ? <Text style={[estilos.textoCodigo, { color: colorTexto }]}>{codigo}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: espacios.xs,
  },
  barras: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: 1,
  },
  textoCodigo: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.xs,
    letterSpacing: 3,
  },
});
