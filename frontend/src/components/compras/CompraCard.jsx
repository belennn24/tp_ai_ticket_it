import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CodigoBarras } from './CodigoBarras';
import { EstadoBadge } from '@/components/ui';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearFecha, formatearPrecio, textoDiasFaltantes } from '@/utils/formato';

// Tarjeta de compra con aspecto de ticket: datos del evento arriba,
// línea de corte en el medio y detalle de la entrada con código de barras abajo.
export function CompraCard({ compra, onPress, mostrarCodigoBarras = true }) {
  // El backend calcula `diasFaltantes`; se muestra solo en compras confirmadas.
  const faltan = compra.estado === 'CONFIRMADA' ? textoDiasFaltantes(compra.diasFaltantes) : null;
  const codigoTicket = compra.id ? `TCK-${String(compra.id).slice(-6).toUpperCase()}` : null;

  const contenido = (
    <>
      <View style={estilos.seccion}>
        <View style={estilos.filaEstado}>
          <EstadoBadge estado={compra.estado} />
          {faltan ? <Text style={estilos.faltan}>{faltan}</Text> : null}
        </View>
        <Text style={estilos.evento} numberOfLines={2}>
          {compra.evento?.nombre}
        </Text>
        <Text style={estilos.fecha}>{formatearFecha(compra.evento?.fecha)}</Text>
      </View>

      <View style={estilos.corte}>
        <View style={[estilos.muesca, estilos.muescaIzquierda]} />
        <View style={estilos.lineaPunteada} />
        <View style={[estilos.muesca, estilos.muescaDerecha]} />
      </View>

      <View style={[estilos.seccion, estilos.seccionInferior]}>
        <View style={estilos.filaDetalle}>
          <View style={estilos.entrada}>
            <Text style={estilos.etiqueta}>ENTRADA</Text>
            <Text style={estilos.valor} numberOfLines={1}>
              {compra.cantidad} × {compra.tipoEntrada?.nombre}
            </Text>
          </View>
          <View style={estilos.total}>
            <Text style={estilos.etiqueta}>TOTAL</Text>
            <Text style={estilos.monto}>{formatearPrecio(compra.total)}</Text>
          </View>
        </View>

        {mostrarCodigoBarras ? (
          <View style={estilos.zonaBarras}>
            <CodigoBarras codigo={codigoTicket} altura={28} />
          </View>
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={estilos.tarjeta}>{contenido}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver compra de ${compra.evento?.nombre}`}
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      {contenido}
    </Pressable>
  );
}

const MUESCA = 20;

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: radios.tarjeta,
    overflow: 'hidden',
  },
  presionada: {
    opacity: 0.85,
  },
  seccion: {
    padding: espacios.lg,
    gap: espacios.sm,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.md,
  },
  faltan: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.sm,
    color: colores.primario,
  },
  evento: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
  },
  fecha: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.secundario,
  },
  corte: {
    height: MUESCA,
    justifyContent: 'center',
  },
  lineaPunteada: {
    marginHorizontal: MUESCA,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colores.borde,
  },
  muesca: {
    position: 'absolute',
    width: MUESCA,
    height: MUESCA,
    borderRadius: MUESCA / 2,
    backgroundColor: colores.fondo,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  muescaIzquierda: {
    left: -MUESCA / 2,
  },
  muescaDerecha: {
    right: -MUESCA / 2,
  },
  filaDetalle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: espacios.md,
  },
  entrada: {
    flex: 1,
    gap: 2,
  },
  total: {
    alignItems: 'flex-end',
    gap: 2,
  },
  etiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
    letterSpacing: 1,
  },
  valor: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  monto: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.md,
    color: colores.primario,
  },
  seccionInferior: {
    gap: espacios.md,
  },
  zonaBarras: {
    paddingTop: espacios.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.borde,
  },
});
