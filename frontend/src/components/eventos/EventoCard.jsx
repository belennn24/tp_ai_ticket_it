import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { entradasDisponibles, formatearFecha, formatearPrecio, nombreCompleto, precioDesde, yaOcurrio } from '@/utils/formato';

function etiquetaDisponibilidad(evento) {
  if (yaOcurrio(evento.fecha)) return 'Finalizado';
  if (entradasDisponibles(evento) === 0) return 'Agotado';
  return null;
}

// Tarjeta de evento para listados: imagen, fecha, organizador y precio "Desde".
export function EventoCard({ evento, onPress }) {
  const imagen = evento.multimedia?.[0];
  const desde = precioDesde(evento);
  const disponibilidad = etiquetaDisponibilidad(evento);
  const reputacion = Number(evento.organizador?.reputacion) || 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${evento.nombre}`}
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      <View style={estilos.portada}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={estilos.imagen} resizeMode="cover" />
        ) : (
          <View style={[estilos.imagen, estilos.sinImagen]}>
            <Ionicons name="musical-notes-outline" size={40} color={colores.textoAtenuado} />
          </View>
        )}
        {evento.categoria?.nombre ? (
          <View style={[estilos.etiqueta, estilos.etiquetaCategoria]}>
            <Text style={estilos.textoEtiqueta}>{evento.categoria.nombre}</Text>
          </View>
        ) : null}
        {disponibilidad ? (
          <View style={[estilos.etiqueta, estilos.etiquetaDisponibilidad]}>
            <Text style={estilos.textoEtiqueta}>{disponibilidad}</Text>
          </View>
        ) : null}
      </View>

      <View style={estilos.cuerpo}>
        <Text style={estilos.fecha}>{formatearFecha(evento.fecha)}</Text>
        <Text style={estilos.nombre} numberOfLines={2}>
          {evento.nombre}
        </Text>

        <View style={estilos.pie}>
          <View style={estilos.organizador}>
            <Text style={estilos.nombreOrganizador} numberOfLines={1}>
              {nombreCompleto(evento.organizador)}
            </Text>
            <View style={estilos.reputacion}>
              <Ionicons name="star" size={14} color={colores.primario} />
              <Text style={estilos.textoReputacion}>{reputacion.toFixed(1)}</Text>
            </View>
          </View>
          {desde !== null ? (
            <View style={estilos.precio}>
              <Text style={estilos.desde}>Desde</Text>
              <Text style={estilos.monto}>{formatearPrecio(desde)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

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
  portada: {
    height: 160,
  },
  imagen: {
    width: '100%',
    height: '100%',
    backgroundColor: colores.fondoAlt,
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiqueta: {
    position: 'absolute',
    top: espacios.md,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    backgroundColor: 'rgba(22, 16, 43, 0.85)',
  },
  etiquetaCategoria: {
    left: espacios.md,
  },
  etiquetaDisponibilidad: {
    right: espacios.md,
    backgroundColor: colores.acento,
  },
  textoEtiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.texto,
  },
  cuerpo: {
    padding: espacios.lg,
    gap: espacios.xs,
  },
  fecha: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.secundario,
  },
  nombre: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: espacios.md,
    marginTop: espacios.sm,
  },
  organizador: {
    flex: 1,
    gap: 2,
  },
  nombreOrganizador: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  reputacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
  },
  textoReputacion: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  precio: {
    alignItems: 'flex-end',
  },
  desde: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  monto: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.lg,
    color: colores.primario,
  },
});
