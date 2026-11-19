import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoBadge } from '@/components/ui';
import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';
import { codigoCompra, formatearFecha, formatearPrecio, resumenAccesibleCompra, textoDiasFaltantes } from '@/utils/formato';

import { CodigoBarras } from './CodigoBarras';
import { Perforacion } from './Perforacion';

// Ticket compacto para la lista de compras: datos del evento arriba, línea de
// corte y detalle de la entrada con código abajo.
// Los lectores de pantalla lo leen como un único botón con el resumen completo.
export function CompraCard({ compra, onPress, mostrarCodigoBarras = true }) {
  // El backend calcula `diasFaltantes`; se muestra solo en compras confirmadas.
  const faltan = compra.estado === 'CONFIRMADA' ? textoDiasFaltantes(compra.diasFaltantes) : null;
  const codigo = codigoCompra(compra);
  const imagen = compra.evento?.multimedia?.[0];

  const contenido = (
    <LinearGradient colors={degrades.ticketLista} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.ticket}>
      <View style={estilos.seccion}>
        <View style={estilos.filaEstado}>
          <EstadoBadge estado={compra.estado} />
          {faltan ? <Text style={estilos.faltan}>{faltan}</Text> : null}
        </View>
        <View style={estilos.filaEncabezado}>
          <View style={estilos.infoEncabezado}>
            <Text style={estilos.evento} numberOfLines={2}>
              {compra.evento?.nombre}
            </Text>
            <Text style={estilos.fecha}>{formatearFecha(compra.evento?.fecha)}</Text>
          </View>
          {imagen ? <Image source={{ uri: imagen }} style={estilos.miniatura} resizeMode="cover" accessible={false} /> : null}
        </View>
      </View>

      <Perforacion />

      <View style={[estilos.seccion, estilos.seccionInferior]}>
        <View style={estilos.filaDetalle}>
          <View style={estilos.entrada}>
            <Text style={estilos.etiqueta}>ENTRADA</Text>
            <Text style={estilos.valor} numberOfLines={2}>
              {compra.cantidad} × {compra.tipoEntrada?.nombre}
            </Text>
          </View>
          <View style={estilos.total}>
            <Text style={estilos.etiqueta}>TOTAL</Text>
            <Text style={estilos.monto}>{formatearPrecio(compra.total)}</Text>
          </View>
        </View>
        {mostrarCodigoBarras ? <CodigoBarras codigo={codigo} altura={28} /> : null}
      </View>
    </LinearGradient>
  );

  const resumen = resumenAccesibleCompra(compra, { faltan });

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={resumen} style={estilos.contenedor}>
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resumen}
      accessibilityHint="Abre el detalle de la compra"
      onPress={onPress}
      style={({ pressed }) => [estilos.contenedor, pressed && estilos.presionada]}>
      {contenido}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: radios.tarjeta,
  },
  ticket: {
    borderRadius: radios.tarjeta,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.25)',
    overflow: 'hidden',
  },
  presionada: {
    opacity: 0.85,
  },
  seccion: {
    padding: espacios.lg,
    gap: espacios.sm,
  },
  seccionInferior: {
    gap: espacios.md,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espacios.sm,
  },
  filaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
  },
  infoEncabezado: {
    flex: 1,
    gap: espacios.xs,
  },
  miniatura: {
    width: 56,
    height: 56,
    borderRadius: radios.input,
    backgroundColor: colores.violetaOscuro,
  },
  faltan: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.sm,
    color: colores.dorado,
  },
  evento: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
  },
  fecha: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoTicket,
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
    color: colores.textoTicket,
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
    color: colores.dorado,
  },
});
