import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { crearCompra } from '@/api/compras';
import { obtenerEvento } from '@/api/eventos';
import { obtenerReseniasDeOrganizador } from '@/api/resenias';
import { SelectorCantidad } from '@/components/eventos/SelectorCantidad';
import { TipoEntradaItem } from '@/components/eventos/TipoEntradaItem';
import { ReseniaItem } from '@/components/resenias/ReseniaItem';
import { Boton, Cargando, EstadoVacio, Estrellas } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { confirmar } from '@/utils/dialogos';
import { formatearFecha, formatearPrecio, nombreCompleto, yaOcurrio } from '@/utils/formato';

export default function DetalleEvento() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { rol } = useSesion();

  const [tipoId, setTipoId] = useState(null);

  const consulta = useConsulta(() => obtenerEvento(id), id);
  const evento = consulta.datos;
  const organizadorId = evento?.organizador?.id;
  const resenias = useConsulta(
    () => (organizadorId ? obtenerReseniasDeOrganizador(organizadorId) : Promise.resolve(null)),
    organizadorId ?? ''
  );

  if (consulta.cargando && !evento) {
    return <Cargando />;
  }
  if (!evento) {
    return (
      <EstadoVacio
        icono="alert-circle-outline"
        titulo="No se pudo cargar el evento"
        descripcion={consulta.error}
        accion={<Boton titulo="Reintentar" variante="secundario" onPress={consulta.recargar} />}
      />
    );
  }

  const finalizado = yaOcurrio(evento.fecha);
  const puedeComprar = rol === 'comprador' && !finalizado;
  const tipo = evento.tiposEntrada.find((t) => t.id === tipoId) ?? null;
  const imagen = evento.multimedia?.[0];

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={estilos.portada} resizeMode="cover" />
        ) : (
          <View style={[estilos.portada, estilos.sinImagen]}>
            <Ionicons name="musical-notes-outline" size={48} color={colores.textoAtenuado} />
          </View>
        )}

        <View style={estilos.bloque}>
          {evento.categoria?.nombre ? <Text style={estilos.categoria}>{evento.categoria.nombre.toUpperCase()}</Text> : null}
          <Text style={estilos.nombre}>{evento.nombre}</Text>
          <Text style={estilos.fecha}>{formatearFecha(evento.fecha)}</Text>
          {finalizado ? <Text style={estilos.finalizado}>Este evento ya finalizó.</Text> : null}
          {evento.descripcion ? <Text style={estilos.descripcion}>{evento.descripcion}</Text> : null}
        </View>

        <View style={estilos.bloque}>
          <Text style={estilos.tituloSeccion}>Entradas</Text>
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
          <Text style={estilos.tituloSeccion}>Organiza</Text>
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
          onComprada={(compra) => router.replace(`/compras/${compra.id}`)}
          onError={consulta.recargar}
        />
      ) : null}
    </View>
  );
}

// Barra inferior de compra. Solo se muestra con un tipo de entrada elegido,
// por eso acá `tipo` nunca es nulo.
function BarraCompra({ eventoId, tipo, onComprada, onError }) {
  const { bottom } = useSafeAreaInsets();
  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState(null);

  // Si el cupo bajó desde la última consulta, la cantidad se ajusta al disponible.
  const cantidadValida = Math.min(cantidad, Math.max(tipo.cupo, 1));
  const total = tipo.precio * cantidadValida;

  const comprar = async () => {
    const confirmado = await confirmar({
      titulo: 'Confirmar compra',
      mensaje: `${cantidadValida} × ${tipo.nombre}\nTotal: ${formatearPrecio(total)}`,
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
      {error ? <Text style={estilos.error}>{error}</Text> : null}
      <View style={estilos.filaCompra}>
        <SelectorCantidad cantidad={cantidadValida} maximo={tipo.cupo} onCambiar={setCantidad} />
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
    width: '100%',
    height: 220,
    backgroundColor: colores.fondoAlt,
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
    color: colores.secundario,
    letterSpacing: 1,
  },
  nombre: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xl,
    color: colores.texto,
  },
  fecha: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.sm,
    color: colores.primario,
  },
  finalizado: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
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
    color: colores.primario,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
  },
});
