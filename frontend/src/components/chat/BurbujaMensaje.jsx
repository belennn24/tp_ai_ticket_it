import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearFechaCorta, nombreCompleto } from '@/utils/formato';

const NOMBRE_ROL = { comprador: 'Comprador', organizador: 'Organizador' };

// Mensaje del chat de una compra. Los propios van a la derecha.
// `autor` es el usuario que lo escribió (comprador u organizador de la compra).
export function BurbujaMensaje({ mensaje, autor, esPropio }) {
  const nombre = nombreCompleto(autor) || 'Usuario';
  const rol = NOMBRE_ROL[autor?.rol];

  return (
    <View style={[estilos.fila, esPropio ? estilos.filaPropia : estilos.filaAjena]}>
      <View style={[estilos.burbuja, esPropio ? estilos.propia : estilos.ajena]}>
        {!esPropio ? (
          <Text style={estilos.autor}>
            {nombre}
            {rol ? ` · ${rol}` : ''}
          </Text>
        ) : null}
        <Text style={[estilos.texto, esPropio && estilos.textoPropio]}>{mensaje.mensaje}</Text>
        <Text style={[estilos.hora, esPropio && estilos.horaPropia]}>{formatearFechaCorta(mensaje.fechaHora)}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
  },
  filaPropia: {
    justifyContent: 'flex-end',
  },
  filaAjena: {
    justifyContent: 'flex-start',
  },
  burbuja: {
    maxWidth: '82%',
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.md,
    borderRadius: radios.boton,
    gap: 2,
  },
  propia: {
    backgroundColor: colores.secundario,
    borderBottomRightRadius: 4,
  },
  ajena: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderBottomLeftRadius: 4,
  },
  autor: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.primario,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  textoPropio: {
    color: colores.sobrePrimario,
  },
  hora: {
    alignSelf: 'flex-end',
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
  horaPropia: {
    color: 'rgba(22, 16, 43, 0.65)',
  },
});
