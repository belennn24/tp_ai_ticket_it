import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';
import { entradasDisponibles, formatearFecha, formatearPrecio, nombreCompleto, precioDesde, yaOcurrio } from '@/utils/formato';

function etiquetaDisponibilidad(evento) {
  if (yaOcurrio(evento.fecha)) return 'Finalizado';
  if (entradasDisponibles(evento) === 0) return 'Agotado';
  return null;
}

// Tarjeta de evento: imagen grande con el nombre encima. Un velo oscuro en
// degradé garantiza el contraste del texto sea cual sea la foto.
export function EventoCard({ evento, onPress }) {
  const imagen = evento.multimedia?.[0];
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
        {imagen ? (
          <Image source={{ uri: imagen }} style={estilos.imagen} resizeMode="cover" accessible={false} />
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
          ) : evento.multimedia?.length > 1 ? (
            <View style={[estilos.pastilla, estilos.pastillaFotos]}>
              <Ionicons name="images-outline" size={12} color="#FFFFFF" />
              <Text style={estilos.textoPastilla}>{evento.multimedia.length}</Text>
            </View>
          ) : null}
        </View>

        {/* El texto va siempre sobre velo al 85 %: aunque la letra se agrande, nunca queda sobre la foto sin oscurecer. */}
        <View>
          <LinearGradient colors={[degrades.veloFoto[0], colores.veloFoto]} style={estilos.transicionVelo} />
          <View style={estilos.textoPortada}>
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
        </View>
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
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  imagen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colores.violetaOscuro,
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  transicionVelo: {
    height: 64,
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
  textoPortada: {
    backgroundColor: colores.veloFoto,
    paddingHorizontal: espacios.lg,
    paddingBottom: espacios.md,
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
