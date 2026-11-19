import { Ionicons } from '@expo/vector-icons';
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
      {error ? (
        <View style={estilos.filaError} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={16} color={colores.error} />
          <Text style={estilos.error} accessibilityRole="alert">
            {error}
          </Text>
        </View>
      ) : null}
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
    borderColor: colores.bordeControl,
    backgroundColor: colores.fondoAlt,
    paddingHorizontal: espacios.lg,
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  // El foco se marca con borde más grueso además del cambio de color.
  campoEnfocado: {
    borderColor: colores.primario,
    borderWidth: 2,
  },
  campoConError: {
    borderColor: colores.error,
    borderWidth: 2,
  },
  filaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
  },
  error: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.error,
  },
});
