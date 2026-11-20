import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui';
import { espacios } from '@/theme';

// Fila horizontal de chips de selección única.
// `opciones`: [{ valor, etiqueta }]. Se usa para categorías, orden y estados.
export function FilaChips({ opciones, seleccionado, onSeleccionar, sinMargenHorizontal = false }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[estilos.fila, sinMargenHorizontal && estilos.sinMargen]}
      style={estilos.contenedor}>
      {opciones.map((opcion) => (
        <Chip
          key={String(opcion.valor)}
          etiqueta={opcion.etiqueta}
          seleccionado={opcion.valor === seleccionado}
          onPress={() => onSeleccionar(opcion.valor)}
        />
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 0,
  },
  fila: {
    gap: espacios.sm,
    paddingHorizontal: espacios.xl,
  },
  sinMargen: {
    paddingHorizontal: 0,
  },
});
