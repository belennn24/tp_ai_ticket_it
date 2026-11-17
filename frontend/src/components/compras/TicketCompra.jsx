import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { EstadoBadge } from '@/components/ui';
import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';
import { codigoCompra, formatearFecha, formatearPrecio, resumenAccesibleCompra, textoDiasFaltantes } from '@/utils/formato';

import { CodigoBarras } from './CodigoBarras';
import { Perforacion } from './Perforacion';

// Ticket completo de una compra: imagen del evento, cuerpo violeta en degradé,
// línea de corte y código. Se usa en el detalle y al confirmar una compra.
// Todo el ticket se anuncia como un único elemento con el resumen de la compra.
export function TicketCompra({ compra }) {
  const faltan = compra.estado === 'CONFIRMADA' ? textoDiasFaltantes(compra.diasFaltantes) : null;
  const imagen = compra.evento?.multimedia?.[0];

  return (
    <View style={estilos.sombra} accessible accessibilityLabel={resumenAccesibleCompra(compra, { faltan })}>
      <LinearGradient colors={degrades.ticket} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={estilos.ticket}>
        <View style={estilos.portada}>
          {imagen ? (
            <Image source={{ uri: imagen }} style={estilos.imagen} resizeMode="cover" accessible={false} />
          ) : (
            <View style={[estilos.imagen, estilos.sinImagen]}>
              <Ionicons name="musical-notes" size={44} color={colores.textoTicket} />
            </View>
          )}
          <LinearGradient colors={['rgba(124, 58, 237, 0)', degrades.ticket[0]]} style={estilos.fundido} />
          <View style={estilos.insignia}>
            <EstadoBadge estado={compra.estado} />
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.evento}>{compra.evento?.nombre}</Text>
          {compra.evento?.categoria?.nombre ? <Text style={estilos.categoria}>{compra.evento.categoria.nombre}</Text> : null}
          <View style={estilos.pastillaFecha}>
            <Ionicons name="calendar-outline" size={16} color={colores.texto} />
            <Text style={estilos.textoPastilla}>{formatearFecha(compra.evento?.fecha)}</Text>
          </View>
          {faltan ? (
            <View style={estilos.cuenta}>
              <Ionicons name="hourglass-outline" size={16} color={colores.dorado} />
              <Text style={estilos.textoCuenta}>{faltan}</Text>
            </View>
          ) : null}
        </View>

        <Perforacion />

        <View style={estilos.seccion}>
          <View style={estilos.grilla}>
            <Dato etiqueta="ENTRADA" valor={compra.tipoEntrada?.nombre} />
            <Dato etiqueta="CANTIDAD" valor={String(compra.cantidad)} alineado="derecha" />
            <Dato etiqueta="PRECIO UNITARIO" valor={formatearPrecio(compra.tipoEntrada?.precio)} />
            <Dato etiqueta="TOTAL" valor={formatearPrecio(compra.total)} alineado="derecha" destacado />
          </View>
          <View style={estilos.zonaCodigo}>
            <CodigoBarras codigo={codigoCompra(compra)} altura={44} color="#FFFFFF" colorTexto={colores.textoTicket} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function Dato({ etiqueta, valor, alineado = 'izquierda', destacado = false }) {
  const derecha = alineado === 'derecha';
  return (
    <View style={[estilos.dato, derecha && estilos.datoDerecha]}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <Text style={[estilos.valor, destacado && estilos.valorDestacado, derecha && estilos.textoDerecha]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  sombra: {
    borderRadius: radios.tarjeta,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  ticket: {
    borderRadius: radios.tarjeta,
    overflow: 'hidden',
  },
  portada: {
    height: 170,
  },
  imagen: {
    width: '100%',
    height: '100%',
    backgroundColor: colores.violetaOscuro,
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundido: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  insignia: {
    position: 'absolute',
    top: espacios.md,
    left: espacios.md,
  },
  seccion: {
    paddingHorizontal: espacios.xl,
    paddingVertical: espacios.lg,
    gap: espacios.sm,
  },
  evento: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xl,
    color: colores.texto,
  },
  categoria: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoTicket,
  },
  pastillaFecha: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    marginTop: espacios.xs,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    backgroundColor: 'rgba(15, 10, 36, 0.35)',
  },
  textoPastilla: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.texto,
  },
  cuenta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    backgroundColor: colores.fondo,
  },
  textoCuenta: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.sm,
    color: colores.dorado,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: espacios.md,
  },
  dato: {
    width: '50%',
    gap: 2,
  },
  datoDerecha: {
    alignItems: 'flex-end',
  },
  etiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoTicket,
    letterSpacing: 1,
  },
  valor: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  valorDestacado: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.lg,
  },
  textoDerecha: {
    textAlign: 'right',
  },
  zonaCodigo: {
    marginTop: espacios.md,
    padding: espacios.md,
    borderRadius: radios.boton,
    backgroundColor: 'rgba(15, 10, 36, 0.35)',
  },
});
