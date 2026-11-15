import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ALTO_TACTIL, colores, espacios, fuentes, radios, tamanios } from '@/theme';

// Campo de texto con etiqueta y mensaje de error. Acepta las props de TextInput.
export function Input({ etiqueta, error, style, ref, ...propsTextInput }) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={estilos.contenedor}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
      <TextInput
        ref={ref}
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores.textoAtenuado}
        selectionColor={colores.primario}
        {...propsTextInput}
        onFocus={(evento) => {
          setEnfocado(true);
          propsTextInput.onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          propsTextInput.onBlur?.(evento);
        }}
        style={[estilos.campo, enfocado && estilos.campoEnfocado, error && estilos.campoConError, style]}
      />
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: espacios.xs,
  },
  etiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  campo: {
    minHeight: ALTO_TACTIL,
    borderRadius: radios.input,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.fondoAlt,
    paddingHorizontal: espacios.lg,
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  campoEnfocado: {
    borderColor: colores.primario,
  },
  campoConError: {
    borderColor: colores.error,
  },
  error: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.error,
  },
});
