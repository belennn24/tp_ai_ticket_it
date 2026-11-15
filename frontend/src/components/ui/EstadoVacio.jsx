import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, tamanios } from '@/theme';

// Mensaje centrado para listas sin resultados, errores o secciones pendientes.
export function EstadoVacio({ icono = 'ticket-outline', titulo, descripcion, accion }) {
  return (
    <View style={estilos.contenedor}>
      <Ionicons name={icono} size={48} color={colores.textoAtenuado} />
      <Text style={estilos.titulo}>{titulo}</Text>
      {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
      {accion ? <View style={estilos.accion}>{accion}</View> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacios.xl,
    gap: espacios.sm,
  },
  titulo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
  accion: {
    marginTop: espacios.md,
    alignSelf: 'stretch',
  },
});
