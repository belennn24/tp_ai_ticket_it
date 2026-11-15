import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, estadosCompra, fuentes, tamanios } from '@/theme';
import { formatearFechaCorta, nombreCompleto } from '@/utils/formato';

// Línea de tiempo con los cambios de estado de una compra.
export function HistorialEstados({ cambios }) {
  const ordenados = [...cambios].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  return (
    <View style={estilos.lista}>
      {ordenados.map((cambio, indice) => {
        const config = estadosCompra[cambio.estado] ?? { etiqueta: cambio.estado, color: colores.textoAtenuado };
        const esUltimo = indice === ordenados.length - 1;
        const quien = nombreCompleto(cambio.quien);
        return (
          <View key={cambio.id ?? indice} style={estilos.fila}>
            <View style={estilos.marcador}>
              <View style={[estilos.punto, { backgroundColor: config.color }]} />
              {!esUltimo ? <View style={estilos.linea} /> : null}
            </View>
            <View style={estilos.info}>
              <Text style={[estilos.estado, { color: config.color }]}>{config.etiqueta}</Text>
              <Text style={estilos.detalle}>
                {formatearFechaCorta(cambio.fechaHora)}
                {quien ? ` · ${quien}` : ''}
              </Text>
              {cambio.motivo ? <Text style={estilos.motivo}>{cambio.motivo}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: 0,
  },
  fila: {
    flexDirection: 'row',
    gap: espacios.md,
  },
  marcador: {
    alignItems: 'center',
    width: 12,
  },
  punto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  linea: {
    flex: 1,
    width: 2,
    backgroundColor: colores.borde,
    marginVertical: 2,
  },
  info: {
    flex: 1,
    paddingBottom: espacios.lg,
    gap: 2,
  },
  estado: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.sm,
  },
  detalle: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  motivo: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
});
