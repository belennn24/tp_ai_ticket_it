import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { crearCompra } from '@/api/compras';
import { obtenerEvento } from '@/api/eventos';
import { agregarFavorito, eliminarFavorito, listarFavoritos } from '@/api/favoritos';
import { TarjetaUbicacion } from '@/components/eventos/MapaUbicaciones';
import { MapaSectores } from '@/components/eventos/MapaSectores';
import { SelectorCantidad } from '@/components/eventos/SelectorCantidad';
import { TipoEntradaItem } from '@/components/eventos/TipoEntradaItem';
import { ReseniaItem } from '@/components/resenias/ReseniaItem';
import { Boton, EstadoConsulta, Estrellas } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { useReseniasOrganizador } from '@/hooks/useReseniasOrganizador';
import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';
import { confirmar } from '@/utils/dialogos';
import { formatearFecha, formatearPrecio, nombreCompleto, yaOcurrio } from '@/utils/formato';

export default function DetalleEvento() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { rol } = useSesion();
  const { bottom } = useSafeAreaInsets();
  const { width: anchoPantalla } = useWindowDimensions();

  const [tipoId, setTipoId] = useState(null);
  const [fotoActiva, setFotoActiva] = useState(0);

  const consulta = useConsulta(() => obtenerEvento(id), id);
  const evento = consulta.datos;
  const organizadorId = evento?.organizador?.id;
  const resenias = useReseniasOrganizador(organizadorId);

  const consultaFavoritos = useConsulta(
    () => (rol === 'comprador' ? listarFavoritos() : Promise.resolve([])),
    rol === 'comprador' ? 'favoritos' : '',
  );
  const esFavorito = (consultaFavoritos.datos ?? []).some((f) => String(f.id) === String(id));
  const [toggleandoFavorito, setToggleandoFavorito] = useState(false);

  const toggleFavorito = async () => {
    if (toggleandoFavorito || rol !== 'comprador') return;
    setToggleandoFavorito(true);
    try {
      if (esFavorito) {
        await eliminarFavorito(id);
      } else {
        await agregarFavorito(id);
      }
      await consultaFavoritos.recargar();
    } catch {
      // Ignorar
    } finally {
      setToggleandoFavorito(false);
    }
  };

  if (!evento) {
    return <EstadoConsulta consulta={consulta} tituloError="No se pudo cargar el evento" />;
  }

  const finalizado = yaOcurrio(evento.fecha);
  const puedeComprar = rol === 'comprador' && !finalizado;
  const tipo = evento.tiposEntrada.find((t) => t.id === tipoId) ?? null;
  const fotos = Array.isArray(evento.multimedia) ? evento.multimedia.filter(Boolean) : [];

  const alDesplazarFotos = ({ nativeEvent }) => {
    const ancho = nativeEvent.layoutMeasurement?.width || anchoPantalla;
    if (!ancho) return;
    const indice = Math.round(nativeEvent.contentOffset.x / ancho);
    setFotoActiva(indice);
  };

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: espacios.xxl + bottom }]}>
        {/* Portada decorativa con galería deslizable si el evento tiene varias fotos. */}
        <View style={estilos.portada}>
          {fotos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={alDesplazarFotos}>
              {fotos.map((uri, indice) => (
                <Image
                  key={`${uri}-${indice}`}
                  source={{ uri }}
                  style={[estilos.imagenGaleria, { width: anchoPantalla }]}
                  resizeMode="cover"
                  accessible={false}
                />
              ))}
            </ScrollView>
          ) : (
            <LinearGradient colors={degrades.ticket} style={[estilos.imagen, estilos.sinImagen]}>
              <Ionicons name="musical-notes" size={56} color={colores.textoTicket} />
            </LinearGradient>
          )}
          <LinearGradient colors={['rgba(15, 10, 36, 0)', colores.fondo]} style={estilos.fundido} pointerEvents="none" />
          {fotos.length > 1 ? (
            <View style={estilos.indicadorFotos} pointerEvents="none">
              <View style={estilos.puntos}>
                {fotos.map((_, indice) => (
                  <View key={indice} style={[estilos.punto, indice === fotoActiva && estilos.puntoActivo]} />
                ))}
              </View>
              <Text style={estilos.contadorFotos}>
                {fotoActiva + 1} / {fotos.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[estilos.bloque, estilos.encabezado]}>
          <View style={estilos.filaTitulo}>
            <View style={estilos.columnaTitulo}>
              {evento.categoria?.nombre ? <Text style={estilos.categoria}>{evento.categoria.nombre.toUpperCase()}</Text> : null}
              <Text style={estilos.nombre} accessibilityRole="header">
                {evento.nombre}
              </Text>
            </View>
            {rol === 'comprador' ? (
              <Pressable
                onPress={toggleFavorito}
                accessibilityRole="button"
                accessibilityLabel={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                style={estilos.botonFavorito}>
                <Ionicons
                  name={esFavorito ? 'heart' : 'heart-outline'}
                  size={26}
                  color={esFavorito ? '#F43F5E' : colores.textoSecundario}
                />
              </Pressable>
            ) : null}
          </View>
          <View style={estilos.pastillas}>
            <View style={estilos.pastilla}>
              <Ionicons name="calendar-outline" size={16} color={colores.acentoFecha} />
              <Text style={estilos.textoPastilla}>{formatearFecha(evento.fecha)}</Text>
            </View>
            {evento.ubicacion?.nombre ? (
              <View style={estilos.pastilla}>
                <Ionicons name="location-outline" size={16} color={colores.primario} />
                <Text style={estilos.textoPastilla}>{evento.ubicacion.nombre}</Text>
              </View>
            ) : null}
            {finalizado ? (
              <View style={[estilos.pastilla, estilos.pastillaAlerta]}>
                <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                <Text style={[estilos.textoPastilla, estilos.textoAlerta]}>Este evento ya finalizó</Text>
              </View>
            ) : null}
          </View>
          {evento.descripcion ? <Text style={estilos.descripcion}>{evento.descripcion}</Text> : null}
        </View>

        {evento.ubicacion ? (
          <View style={estilos.bloque}>
            <Text style={estilos.tituloSeccion} accessibilityRole="header">
              Ubicación
            </Text>
            <TarjetaUbicacion ubicacion={evento.ubicacion} />
          </View>
        ) : null}

        <View style={estilos.bloque}>
          <Text style={estilos.tituloSeccion} accessibilityRole="header">
            Entradas y sectores
          </Text>
          <MapaSectores
            tiposEntrada={evento.tiposEntrada}
            tipoUbicacion={evento.ubicacion?.tipo}
            seleccionadoId={tipoId}
            deshabilitado={!puedeComprar}
            onSeleccionar={setTipoId}
          />
          <View style={estilos.listaTipos} accessibilityRole="radiogroup">
            {evento.tiposEntrada.map((t) => (
              <TipoEntradaItem
                key={t.id}
                tipo={t}
                seleccionado={t.id === tipoId}
                deshabilitado={!puedeComprar}
                onPress={() => setTipoId(t.id)}
              />
            ))}
          </View>
        </View>

        <View style={estilos.bloque}>
          <Text style={estilos.tituloSeccion} accessibilityRole="header">
            Organiza
          </Text>
          <View style={estilos.organizador}>
            <Text style={estilos.nombreOrganizador}>{nombreCompleto(evento.organizador)}</Text>
            <View style={estilos.reputacion}>
              <Estrellas valor={resenias.datos?.reputacionPromedio ?? evento.organizador?.reputacion ?? 0} />
              <Text style={estilos.textoReputacion}>
                {Number(resenias.datos?.reputacionPromedio ?? evento.organizador?.reputacion ?? 0).toFixed(1)}
                {resenias.datos ? ` · ${resenias.datos.totalResenias} reseñas` : ''}
              </Text>
            </View>
          </View>

          <Text style={estilos.subtitulo}>Reseñas de eventos anteriores</Text>
          {resenias.datos?.resenias?.length ? (
            <View style={estilos.listaResenias}>
              {resenias.datos.resenias.map((resenia) => (
                <ReseniaItem key={resenia.id} resenia={resenia} />
              ))}
            </View>
          ) : (
            <Text style={estilos.sinResenias}>
              {resenias.error ? 'No se pudieron cargar las reseñas.' : 'Este organizador todavía no tiene reseñas.'}
            </Text>
          )}
        </View>
      </ScrollView>

      {puedeComprar && tipo ? (
        // `key` reinicia la cantidad y los mensajes al cambiar de tipo de entrada.
        <BarraCompra
          key={tipo.id}
          eventoId={evento.id}
          tipo={tipo}
          onComprada={(compra) => router.replace({ pathname: '/compras/[id]', params: { id: compra.id, nueva: '1' } })}
          onError={consulta.recargar}
        />
      ) : null}
    </View>
  );
}

const MAX_ENTRADAS_POR_PERSONA = 5;

// Barra inferior de compra. Solo se muestra con un tipo de entrada elegido,
// por eso acá `tipo` nunca es nulo.
function BarraCompra({ eventoId, tipo, onComprada, onError }) {
  const { bottom } = useSafeAreaInsets();
  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState(null);

  // El selector se limita tanto por el cupo disponible como por el máximo por persona.
  const maximoPermitido = Math.min(tipo.cupo, MAX_ENTRADAS_POR_PERSONA);
  const cantidadValida = Math.min(cantidad, Math.max(maximoPermitido, 1));
  const total = tipo.precio * cantidadValida;

  const comprar = async () => {
    const confirmado = await confirmar({
      titulo: 'Confirmar compra',
      mensaje: `${cantidadValida} × ${tipo.nombre}\nTotal: ${formatearPrecio(total)}\n\nLas entradas quedan reservadas hasta que el organizador confirme el pago.`,
      textoConfirmar: 'Comprar',
    });
    if (!confirmado) return;

    setError(null);
    setComprando(true);
    try {
      const compra = await crearCompra({ eventoId, tipoEntradaId: tipo.id, cantidad: cantidadValida });
      onComprada(compra);
    } catch (e) {
      // Por ejemplo: el cupo se agotó mientras se elegía. Se refresca para mostrar el disponible real.
      setError(e.message);
      setComprando(false);
      onError();
    }
  };

  return (
    <View style={[estilos.barraCompra, { paddingBottom: bottom + espacios.md }]}>
      {error ? (
        <Text style={estilos.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={estilos.filaCompra}>
        <SelectorCantidad cantidad={cantidadValida} maximo={maximoPermitido} onCambiar={setCantidad} />
        <View style={estilos.total}>
          <Text style={estilos.etiquetaTotal}>TOTAL</Text>
          <Text style={estilos.montoTotal}>{formatearPrecio(total)}</Text>
        </View>
      </View>
      <Boton titulo="Comprar" variante="degradeDorado" cargando={comprando} onPress={comprar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    paddingBottom: espacios.xxl,
    gap: espacios.xl,
  },
  portada: {
    height: 260,
  },
  imagen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colores.violetaOscuro,
  },
  imagenGaleria: {
    height: 260,
    backgroundColor: colores.violetaOscuro,
  },
  indicadorFotos: {
    position: 'absolute',
    left: espacios.xl,
    right: espacios.xl,
    bottom: espacios.xxl + espacios.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  puntos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  puntoActivo: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  contadorFotos: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: '#FFFFFF',
    backgroundColor: colores.veloFoto,
    paddingHorizontal: espacios.sm,
    paddingVertical: 2,
    borderRadius: radios.pildora,
  },
  fundido: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  encabezado: {
    marginTop: -espacios.xxl,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: espacios.md,
  },
  columnaTitulo: {
    flex: 1,
    gap: 4,
  },
  botonFavorito: {
    padding: espacios.xs,
    borderRadius: radios.pildora,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pastillas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacios.sm,
    marginTop: espacios.xs,
  },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.sm,
    borderRadius: radios.pildora,
    borderWidth: 1,
    borderColor: colores.insigniaBorde,
    backgroundColor: colores.tarjeta,
  },
  pastillaAlerta: {
    backgroundColor: colores.rojoInsignia,
    borderColor: colores.rojoInsignia,
  },
  textoPastilla: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  textoAlerta: {
    fontFamily: fuentes.semibold,
    color: '#FFFFFF',
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloque: {
    paddingHorizontal: espacios.xl,
    gap: espacios.sm,
  },
  categoria: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.primario,
    letterSpacing: 1,
  },
  nombre: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xxl - 4,
    color: colores.texto,
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    lineHeight: 24,
    color: colores.textoSecundario,
    marginTop: espacios.xs,
  },
  tituloSeccion: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
  },
  subtitulo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
    marginTop: espacios.sm,
  },
  listaTipos: {
    gap: espacios.md,
  },
  organizador: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: radios.boton,
    padding: espacios.lg,
    gap: espacios.sm,
  },
  nombreOrganizador: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  reputacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
  },
  textoReputacion: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  listaResenias: {
    gap: espacios.md,
  },
  sinResenias: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoAtenuado,
  },
  barraCompra: {
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.fondoAlt,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    gap: espacios.md,
  },
  filaCompra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: {
    alignItems: 'flex-end',
  },
  etiquetaTotal: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
    letterSpacing: 1,
  },
  montoTotal: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.xl,
    color: colores.dorado,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
  },
});
