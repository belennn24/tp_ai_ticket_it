import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/ui';
import { ALTO_TACTIL, colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearFecha, formatearPrecio, precioDesde } from '@/utils/formato';

const CONFIG_LUGAR = {
  estadio: { etiqueta: 'Estadio', icono: 'trophy-outline' },
  teatro: { etiqueta: 'Teatro', icono: 'easel-outline' },
  arena: { etiqueta: 'Arena', icono: 'mic-outline' },
  club: { etiqueta: 'Club / Bar', icono: 'musical-notes-outline' },
  centro_convenciones: { etiqueta: 'Centro de Convenciones', icono: 'business-outline' },
  centro_cultural: { etiqueta: 'Centro Cultural', icono: 'color-palette-outline' },
  predio: { etiqueta: 'Predio al aire libre', icono: 'leaf-outline' },
};

export function infoTipoLugar(tipo) {
  return CONFIG_LUGAR[tipo] ?? { etiqueta: 'Lugar', icono: 'location-outline' };
}

export function abrirUbicacionEnMaps(ubicacion) {
  if (!ubicacion) return;
  const query =
    ubicacion.latitud !== undefined && ubicacion.longitud !== undefined
      ? `${ubicacion.latitud},${ubicacion.longitud}`
      : encodeURIComponent(`${ubicacion.nombre ?? ''} ${ubicacion.direccion ?? ''}`.trim());
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

// Proyecta coordenadas (lat, lng) a porcentajes [12%, 88%] dentro del lienzo del mapa.
function calcularPosiciones(eventosConUbicacion) {
  if (eventosConUbicacion.length === 0) return [];
  const lats = eventosConUbicacion.map((e) => e.ubicacion.latitud);
  const lngs = eventosConUbicacion.map((e) => e.ubicacion.longitud);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.02;
  const spanLng = maxLng - minLng || 0.02;

  return eventosConUbicacion.map((evento) => {
    const { latitud, longitud } = evento.ubicacion;
    // En el mapa: norte (mayor latitud) va arriba (menor `top`), este (mayor longitud) va a la derecha.
    const xPct = 14 + ((longitud - minLng) / spanLng) * 72;
    const yPct = 16 + ((maxLat - latitud) / spanLat) * 68;
    return { evento, xPct, yPct };
  });
}

// Mapa interactivo de ubicaciones para la pantalla Explorar.
export function MapaUbicaciones({ eventos, onSeleccionarEvento }) {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  const conUbicacion = useMemo(() => (eventos ?? []).filter((e) => e.ubicacion), [eventos]);

  const tiposDisponibles = useMemo(() => {
    const vistos = new Set();
    const lista = [{ valor: 'todos', etiqueta: 'Todos' }];
    conUbicacion.forEach((e) => {
      const t = e.ubicacion.tipo;
      if (t && !vistos.has(t)) {
        vistos.add(t);
        lista.push({ valor: t, etiqueta: infoTipoLugar(t).etiqueta });
      }
    });
    return lista;
  }, [conUbicacion]);

  const filtrados = useMemo(
    () => (filtroTipo === 'todos' ? conUbicacion : conUbicacion.filter((e) => e.ubicacion.tipo === filtroTipo)),
    [conUbicacion, filtroTipo],
  );

  const pines = useMemo(() => calcularPosiciones(filtrados), [filtrados]);
  const activo = filtrados.find((e) => e.id === seleccionadoId) ?? filtrados[0] ?? null;

  if (conUbicacion.length === 0) {
    return (
      <View style={estilos.vacio}>
        <Ionicons name="map-outline" size={40} color={colores.textoAtenuado} />
        <Text style={estilos.textoVacio}>No hay ubicaciones para mostrar en el mapa.</Text>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.barraTipos}
        style={estilos.scrollTipos}>
        {tiposDisponibles.map((op) => {
          const esActivo = op.valor === filtroTipo;
          return (
            <Pressable
              key={op.valor}
              accessibilityRole="button"
              accessibilityState={{ selected: esActivo }}
              onPress={() => {
                setFiltroTipo(op.valor);
                setSeleccionadoId(null);
              }}
              style={[estilos.chipTipo, esActivo && estilos.chipTipoActivo]}>
              <Text style={[estilos.textoChip, esActivo && estilos.textoChipActivo]}>{op.etiqueta}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={estilos.lienzo}>
        {/* Grilla urbana decorativa */}
        <View style={estilos.grilla} pointerEvents="none">
          <View style={[estilos.calleH, { top: '25%' }]} />
          <View style={[estilos.calleH, { top: '52%' }]} />
          <View style={[estilos.calleH, { top: '78%' }]} />
          <View style={[estilos.calleV, { left: '24%' }]} />
          <View style={[estilos.calleV, { left: '54%' }]} />
          <View style={[estilos.calleV, { left: '80%' }]} />
          <View style={estilos.zonaAgua} />
        </View>

        <View style={estilos.etiquetaCiudad} pointerEvents="none">
          <Ionicons name="compass-outline" size={14} color={colores.textoSecundario} />
          <Text style={estilos.textoCiudad}>Buenos Aires · {filtrados.length} lugares</Text>
        </View>

        {pines.map(({ evento, xPct, yPct }) => {
          const esSeleccionado = activo?.id === evento.id;
          const { icono } = infoTipoLugar(evento.ubicacion.tipo);
          return (
            <Pressable
              key={evento.id}
              accessibilityRole="button"
              accessibilityLabel={`${evento.nombre} en ${evento.ubicacion.nombre}`}
              onPress={() => setSeleccionadoId(evento.id)}
              style={[
                estilos.pinContenedor,
                { left: `${xPct}%`, top: `${yPct}%` },
                esSeleccionado && estilos.pinContenedorActivo,
              ]}>
              <View style={[estilos.pin, esSeleccionado && estilos.pinActivo]}>
                <Ionicons
                  name={icono}
                  size={16}
                  color={esSeleccionado ? colores.sobrePrimario : colores.texto}
                />
              </View>
              <View style={[estilos.etiquetaPin, esSeleccionado && estilos.etiquetaPinActiva]}>
                <Text
                  style={[estilos.textoPin, esSeleccionado && estilos.textoPinActivo]}
                  numberOfLines={1}>
                  {evento.ubicacion.nombre}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {activo ? <TarjetaResumenMapa evento={activo} onVerEvento={() => onSeleccionarEvento(activo)} /> : null}
    </View>
  );
}

function TarjetaResumenMapa({ evento, onVerEvento }) {
  const { etiqueta, icono } = infoTipoLugar(evento.ubicacion.tipo);
  const imagen = evento.multimedia?.[0];
  const desde = precioDesde(evento);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.tarjetaSuperior}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={estilos.miniatura} resizeMode="cover" accessible={false} />
        ) : (
          <View style={[estilos.miniatura, estilos.miniaturaVacia]}>
            <Ionicons name={icono} size={24} color={colores.primario} />
          </View>
        )}
        <View style={estilos.tarjetaInfo}>
          <View style={estilos.badgeLugar}>
            <Ionicons name={icono} size={12} color={colores.primario} />
            <Text style={estilos.textoBadge}>{etiqueta}</Text>
          </View>
          <Text style={estilos.tituloEvento} numberOfLines={1}>
            {evento.nombre}
          </Text>
          <Text style={estilos.nombreLugar} numberOfLines={1}>
            {evento.ubicacion.nombre}
          </Text>
          {evento.ubicacion.direccion ? (
            <Text style={estilos.direccion} numberOfLines={1}>
              {evento.ubicacion.direccion}
            </Text>
          ) : null}
          <Text style={estilos.meta}>
            {formatearFecha(evento.fecha)}
            {desde !== null ? ` · Desde ${formatearPrecio(desde)}` : ''}
          </Text>
        </View>
      </View>
      <View style={estilos.accionesTarjeta}>
        <View style={estilos.accionFlex}>
          <Boton titulo="Ver evento" onPress={onVerEvento} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${evento.ubicacion.nombre} en Google Maps`}
          onPress={() => abrirUbicacionEnMaps(evento.ubicacion)}
          style={estilos.botonMaps}>
          <Ionicons name="navigate-outline" size={20} color={colores.texto} />
        </Pressable>
      </View>
    </View>
  );
}

// Tarjeta de ubicación con mini-mapa para la pantalla de detalle de un evento.
export function TarjetaUbicacion({ ubicacion }) {
  if (!ubicacion) return null;
  const { etiqueta, icono } = infoTipoLugar(ubicacion.tipo);

  return (
    <View style={estilos.tarjetaDetalle}>
      <View style={estilos.miniMapa}>
        <View style={estilos.grilla} pointerEvents="none">
          <View style={[estilos.calleH, { top: '35%' }]} />
          <View style={[estilos.calleH, { top: '68%' }]} />
          <View style={[estilos.calleV, { left: '30%' }]} />
          <View style={[estilos.calleV, { left: '66%' }]} />
        </View>
        <View style={estilos.pinCentro}>
          <View style={[estilos.pin, estilos.pinActivo]}>
            <Ionicons name={icono} size={18} color={colores.sobrePrimario} />
          </View>
        </View>
        {ubicacion.latitud !== undefined && ubicacion.longitud !== undefined ? (
          <Text style={estilos.coordenadas}>
            {ubicacion.latitud.toFixed(4)}, {ubicacion.longitud.toFixed(4)}
          </Text>
        ) : null}
      </View>

      <View style={estilos.detalleContenido}>
        <View style={estilos.badgeLugar}>
          <Ionicons name={icono} size={13} color={colores.primario} />
          <Text style={estilos.textoBadge}>{etiqueta}</Text>
        </View>
        <Text style={estilos.nombreLugarDetalle}>{ubicacion.nombre}</Text>
        {ubicacion.direccion ? <Text style={estilos.direccion}>{ubicacion.direccion}</Text> : null}
        <Boton
          titulo="Abrir en Maps"
          variante="secundario"
          icono={<Ionicons name="navigate-outline" size={18} color={colores.texto} />}
          onPress={() => abrirUbicacionEnMaps(ubicacion)}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    paddingHorizontal: espacios.xl,
    paddingBottom: espacios.lg,
    gap: espacios.md,
  },
  scrollTipos: {
    flexGrow: 0,
  },
  barraTipos: {
    gap: espacios.sm,
    paddingVertical: espacios.xs,
  },
  chipTipo: {
    minHeight: 36,
    paddingHorizontal: espacios.md,
    borderRadius: radios.pildora,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.tarjeta,
    justifyContent: 'center',
  },
  chipTipoActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  textoChipActivo: {
    color: colores.sobrePrimario,
  },
  lienzo: {
    flex: 1,
    minHeight: 280,
    borderRadius: radios.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: '#130D2B',
    overflow: 'hidden',
    position: 'relative',
  },
  grilla: {
    ...StyleSheet.absoluteFillObject,
  },
  calleH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  calleV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  zonaAgua: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '28%',
    height: '45%',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderBottomLeftRadius: 80,
  },
  etiquetaCiudad: {
    position: 'absolute',
    top: espacios.md,
    left: espacios.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    backgroundColor: colores.veloFoto,
  },
  textoCiudad: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  pinContenedor: {
    position: 'absolute',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    alignItems: 'center',
    maxWidth: 130,
    zIndex: 1,
  },
  pinContenedorActivo: {
    zIndex: 10,
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colores.tarjetaElevada,
    borderWidth: 2,
    borderColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinActivo: {
    backgroundColor: colores.primario,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.12 }],
  },
  etiquetaPin: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colores.veloFoto,
  },
  etiquetaPinActiva: {
    backgroundColor: colores.primario,
  },
  textoPin: {
    fontFamily: fuentes.semibold,
    fontSize: 10,
    color: colores.texto,
  },
  textoPinActivo: {
    color: colores.sobrePrimario,
  },
  tarjeta: {
    borderRadius: radios.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    padding: espacios.md,
    gap: espacios.md,
  },
  tarjetaSuperior: {
    flexDirection: 'row',
    gap: espacios.md,
  },
  miniatura: {
    width: 78,
    height: 78,
    borderRadius: radios.input,
    backgroundColor: colores.tarjetaElevada,
  },
  miniaturaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaInfo: {
    flex: 1,
    gap: 2,
  },
  badgeLugar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: espacios.sm,
    paddingVertical: 2,
    borderRadius: radios.pildora,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  textoBadge: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.primario,
  },
  tituloEvento: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  nombreLugar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  direccion: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
  meta: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.acentoFecha,
  },
  accionesTarjeta: {
    flexDirection: 'row',
    gap: espacios.sm,
    alignItems: 'center',
  },
  accionFlex: {
    flex: 1,
  },
  botonMaps: {
    width: ALTO_TACTIL,
    height: ALTO_TACTIL,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.tarjetaElevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.md,
    padding: espacios.xl,
  },
  textoVacio: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
  tarjetaDetalle: {
    borderRadius: radios.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    overflow: 'hidden',
  },
  miniMapa: {
    height: 130,
    backgroundColor: '#130D2B',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCentro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordenadas: {
    position: 'absolute',
    bottom: espacios.sm,
    right: espacios.md,
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
  detalleContenido: {
    padding: espacios.lg,
    gap: espacios.sm,
  },
  nombreLugarDetalle: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
  },
});
