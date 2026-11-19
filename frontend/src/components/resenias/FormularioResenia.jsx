import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Boton, Estrellas, Input } from '@/components/ui';
import { colores, espacios, fuentes, tamanios } from '@/theme';

// Formulario para calificar un evento: puntaje de 1 a 5 y comentario.
// `onEnviar({ puntuacion, detalle })` debe devolver una promesa.
export function FormularioResenia({ onEnviar, onEnfocarComentario }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const enviar = async () => {
    if (puntuacion < 1) {
      setError('Elegí un puntaje de 1 a 5 estrellas.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await onEnviar({ puntuacion, detalle: detalle.trim() });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.ayuda}>¿Cómo estuvo el evento?</Text>
      <Estrellas valor={puntuacion} tamanio={36} onCambiar={setPuntuacion} />
      <Input
        etiqueta="Comentario"
        value={detalle}
        onChangeText={setDetalle}
        placeholder="Contá tu experiencia"
        multiline
        maxLength={500}
        editable={!enviando}
        onFocus={onEnfocarComentario}
        style={estilos.comentario}
      />
      {error ? (
        <Text style={estilos.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Boton titulo="Enviar reseña" cargando={enviando} onPress={enviar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: espacios.md,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  comentario: {
    minHeight: 96,
    paddingTop: espacios.md,
    textAlignVertical: 'top',
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
  },
});
