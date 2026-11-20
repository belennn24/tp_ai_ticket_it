import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';
import { entradasDisponibles, formatearFecha, formatearPrecio, nombreCompleto, precioDesde, yaOcurrio } from '@/utils/formato';

function etiquetaDisponibilidad(evento) {
  if (yaOcurrio(evento.fecha)) return 'Finalizado';
  if (entradasDisponibles(evento) === 0) return 'Agotado';
  return null;
}

// Tarjeta de evento: portada superior con la foto completa del evento y cuerpo
// debajo sobre superficie sólida para garantizar contraste y lectura clara.
export function EventoCard({ evento, onPress }) {
  const fotos = Array.isArray(evento.multimedia) ? evento.multimedia.filter(Boolean) : [];
  const imagen = fotos[0];
  const [imagenConError, setImagenConError] = useState(null);
  const mostrarImagen = Boolean(imagen && imagenConError !== imagen);

  const desde = precioDesde(evento);
  const disponibilidad = etiquetaDisponibilidad(evento);
  const reputacion = Number(evento.organizador?.reputacion) || 0;
  const organizador = nombreCompleto(evento.organizador);

  const descripcion = [
    evento.nombre,
    evento.categoria?.nombre,
    formatearFecha(evento.fecha),
    disponibilidad,
    organizador ? `Organiza ${organizador}, puntaje ${reputacion.toFixed(1)} de 5` : null,
    desde !== null ? `Desde ${formatearPrecio(desde)}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={descripcion}
      accessibilityHint="Abre el detalle del evento"
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      <View style={estilos.portada}>
        {mostrarImagen ? (
          <Image
            source={{ uri: imagen }}
            style={estilos.imagen}
            resizeMode="cover"
            accessible={false}
            onError={() => setImagenConError(imagen)}
          />
        ) : (
          <LinearGradient colors={degrades.ticket} style={[estilos.imagen, estilos.sinImagen]}>
            <Ionicons name="musical-notes" size={48} color={colores.textoTicket} />
          </LinearGradient>
        )}

        <View style={estilos.filaSuperior}>
          {evento.categoria?.nombre ? (
            <View style={estilos.pastilla}>
              <Text style={estilos.textoPastilla}>{evento.categoria.nombre}</Text>
            </View>
          ) : (
            <View />
          )}
          {disponibilidad ? (
            <View style={[estilos.pastilla, estilos.pastillaAlerta]}>
              <Text style={estilos.textoPastilla}>{disponibilidad}</Text>
            </View>
          ) : fotos.length > 1 ? (
            <View style={[estilos.pastilla, estilos.pastillaFotos]}>
              <Ionicons name="images-outline" size={12} color="#FFFFFF" />
              <Text style={estilos.textoPastilla}>{fotos.length}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <Text style={estilos.nombre} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <View style={estilos.fila}>
          <Ionicons name="calendar-outline" size={14} color={colores.acentoFecha} />
          <Text style={estilos.fecha}>{formatearFecha(evento.fecha)}</Text>
        </View>
        {evento.ubicacion?.nombre ? (
          <View style={estilos.fila}>
            <Ionicons name="location-outline" size={14} color={colores.textoSecundario} />
            <Text style={estilos.lugar} numberOfLines={1}>
              {evento.ubicacion.nombre}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={estilos.pie}>
        <View style={estilos.organizador}>
          <Text style={estilos.nombreOrganizador} numberOfLines={1}>
            {organizador}
          </Text>
          <View style={estilos.fila}>
            <Ionicons name="star" size={14} color={colores.dorado} />
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
    height: 170,
    width: '100%',
    position: 'relative',
    backgroundColor: colores.violetaOscuro,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaSuperior: {
    position: 'absolute',
    top: espacios.md,
    left: espacios.md,
    right: espacios.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: espacios.sm,
  },
  pastilla: {
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    backgroundColor: colores.veloFoto,
  },
  pastillaAlerta: {
    backgroundColor: colores.rojoInsignia,
  },
  pastillaFotos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoPastilla: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: '#FFFFFF',
  },
  cuerpo: {
    paddingHorizontal: espacios.lg,
    paddingTop: espacios.md,
    gap: espacios.xs,
  },
  nombre: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xl,
    color: colores.texto,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
  },
  fecha: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.acentoFecha,
  },
  lugar: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  pie: {
    backgroundColor: colores.tarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.md,
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.md,
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
  textoReputacion: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  precio: {
    alignItems: 'flex-end',
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.insigniaBorde,
    backgroundColor: colores.insigniaFondo,
  },
  desde: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  monto: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.lg,
    color: colores.dorado,
  },
});
