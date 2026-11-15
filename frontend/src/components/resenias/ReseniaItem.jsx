import { StyleSheet, Text, View } from 'react-native';

import { Estrellas } from '@/components/ui';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearFechaCorta, nombreCompleto } from '@/utils/formato';

// Reseña de un comprador sobre un evento del organizador.
export function ReseniaItem({ resenia }) {
  const autor = nombreCompleto(resenia.comprador) || 'Comprador';

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text style={estilos.autor}>{autor}</Text>
        <Estrellas valor={resenia.puntuacion} tamanio={14} />
      </View>
      {resenia.evento?.nombre ? <Text style={estilos.evento}>{resenia.evento.nombre}</Text> : null}
      {resenia.detalle ? <Text style={estilos.detalle}>{resenia.detalle}</Text> : null}
      <Text style={estilos.fecha}>{formatearFechaCorta(resenia.fechaCreacion)}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: radios.boton,
    padding: espacios.lg,
    gap: espacios.xs,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.md,
  },
  autor: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  evento: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.secundario,
  },
  detalle: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  fecha: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
});
