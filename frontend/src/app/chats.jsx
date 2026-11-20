import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listarMisCompras } from '@/api/compras';
import { listarEventosDeOrganizador, obtenerComprasDeEvento } from '@/api/eventos';
import { FilaChips } from '@/components/eventos/FilaChips';
import { EstadoBadge, EstadoConsulta, EstadoVacio, FondoConBrillo, ImagenEvento, Separador } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearFechaCorta, idDe, nombreCompleto } from '@/utils/formato';

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'con_mensajes', etiqueta: 'Con mensajes' },
];

function ultimoMensajeDe(compra) {
  const mensajes = Array.isArray(compra?.mensajes) ? compra.mensajes : [];
  if (mensajes.length === 0) return null;
  return [...mensajes].sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))[0];
}

function fechaActividadDe(compra) {
  const ultimo = ultimoMensajeDe(compra);
  const referencia = ultimo?.fechaHora ?? compra?.fechaCompra ?? compra?.createdAt ?? 0;
  return new Date(referencia).getTime() || 0;
}

// Buzón centralizado de chats: reúne todas las conversaciones del usuario
// (como comprador con organizadores, o como organizador con sus compradores).
export default function BuzonChats() {
  const router = useRouter();
  const { usuario, rol } = useSesion();
  const { bottom } = useSafeAreaInsets();
  const [filtro, setFiltro] = useState('todos');

  const cargarConversaciones = useCallback(async () => {
    if (rol === 'organizador') {
      const misEventos = await listarEventosDeOrganizador(usuario?.id);
      if (misEventos.length === 0) return [];

      const respuestas = await Promise.all(
        misEventos.map(async (ev) => {
          const detalle = await obtenerComprasDeEvento(ev.id);
          return (detalle?.compras ?? []).map((compra) => ({
            ...compra,
            evento: compra.evento ?? ev,
          }));
        })
      );
      return respuestas.flat();
    }

    return (await listarMisCompras()) ?? [];
  }, [rol, usuario?.id]);

  const consulta = useConsulta(cargarConversaciones, `${rol}|${usuario?.id ?? ''}`);
  const compras = consulta.datos ?? [];

  const ordenadas = [...compras].sort((a, b) => {
    const tieneA = (a.mensajes?.length ?? 0) > 0;
    const tieneB = (b.mensajes?.length ?? 0) > 0;
    if (tieneA !== tieneB) return tieneB ? 1 : -1;
    return fechaActividadDe(b) - fechaActividadDe(a);
  });

  const filtradas = filtro === 'con_mensajes'
    ? ordenadas.filter((c) => (c.mensajes?.length ?? 0) > 0)
    : ordenadas;

  return (
    <FondoConBrillo>
      <EstadoConsulta consulta={consulta} tituloError="No se pudieron cargar los chats">
        <View style={estilos.filtros}>
          <FilaChips opciones={FILTROS} seleccionado={filtro} onSeleccionar={setFiltro} />
        </View>
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversacionItem
              compra={item}
              rol={rol}
              usuarioId={usuario?.id}
              onPress={() => router.push(`/compras/${item.id}/chat`)}
            />
          )}
          contentContainerStyle={[estilos.lista, { paddingBottom: espacios.xl + bottom }]}
          ItemSeparatorComponent={Separador}
          refreshControl={
            <RefreshControl refreshing={consulta.recargando} onRefresh={consulta.recargar} tintColor={colores.primario} />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="mail-open-outline"
              titulo={filtro === 'con_mensajes' ? 'Sin mensajes todavía' : 'Sin conversaciones'}
              descripcion={
                filtro === 'con_mensajes'
                  ? 'Cuando envíes o recibas un mensaje en una compra va a aparecer acá.'
                  : rol === 'organizador'
                    ? 'Cuando un comprador adquiera entradas para tus eventos vas a poder chatear desde acá.'
                    : 'Cuando compres entradas para un evento vas a poder chatear con el organizador desde acá.'
              }
            />
          }
        />
      </EstadoConsulta>
    </FondoConBrillo>
  );
}

function ConversacionItem({ compra, rol, usuarioId, onPress }) {
  const ultimo = ultimoMensajeDe(compra);
  const cantidadMensajes = compra.mensajes?.length ?? 0;
  const imagen = Array.isArray(compra.evento?.multimedia) ? compra.evento.multimedia.find(Boolean) : null;
  const contraparte = rol === 'organizador'
    ? nombreCompleto(compra.comprador) || 'Comprador'
    : nombreCompleto(compra.evento?.organizador) || 'Organizador';

  const esUltimoPropio = ultimo && idDe(ultimo.emisor ?? ultimo.emisorId) === usuarioId;
  const textoUltimo = ultimo
    ? `${esUltimoPropio ? 'Vos: ' : ''}${ultimo.mensaje}`
    : 'Sin mensajes aún · Tocá para escribir';

  const resumen = [
    compra.evento?.nombre ?? 'Evento',
    rol === 'organizador' ? `Comprador ${contraparte}` : `Organiza ${contraparte}`,
    ultimo ? `Último mensaje: ${ultimo.mensaje}` : 'Sin mensajes aún',
  ].join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resumen}
      accessibilityHint="Abre el chat de esta compra"
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      <View style={estilos.miniaturaContenedor}>
        <ImagenEvento uri={imagen} tamanoIcono={22} />
      </View>

      <View style={estilos.contenido}>
        <View style={estilos.filaTitulo}>
          <Text style={estilos.evento} numberOfLines={1}>
            {compra.evento?.nombre ?? 'Evento'}
          </Text>
          {ultimo ? (
            <Text style={estilos.hora}>{formatearFechaCorta(ultimo.fechaHora)}</Text>
          ) : null}
        </View>

        <View style={estilos.filaSubtitulo}>
          <Text style={estilos.contraparte} numberOfLines={1}>
            {rol === 'organizador' ? `De: ${contraparte}` : `Organiza: ${contraparte}`}
          </Text>
          <EstadoBadge estado={compra.estado} />
        </View>

        <View style={estilos.filaMensaje}>
          <Text style={[estilos.ultimoMensaje, !ultimo && estilos.sinMensajes]} numberOfLines={1}>
            {textoUltimo}
          </Text>
          {cantidadMensajes > 0 ? (
            <View style={estilos.badgeCantidad}>
              <Text style={estilos.textoCantidad}>{cantidadMensajes}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  filtros: {
    paddingTop: espacios.md,
    paddingBottom: espacios.sm,
  },
  lista: {
    flexGrow: 1,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.sm,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    padding: espacios.md,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  presionada: {
    opacity: 0.85,
  },
  miniaturaContenedor: {
    width: 56,
    height: 56,
    borderRadius: radios.input,
    overflow: 'hidden',
    backgroundColor: colores.violetaOscuro,
  },
  contenido: {
    flex: 1,
    gap: 4,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.sm,
  },
  evento: {
    flex: 1,
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  hora: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
  filaSubtitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.sm,
  },
  contraparte: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  filaMensaje: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.sm,
  },
  ultimoMensaje: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  sinMensajes: {
    color: colores.textoAtenuado,
  },
  badgeCantidad: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radios.pildora,
    backgroundColor: colores.insigniaFondo,
    borderWidth: 1,
    borderColor: colores.insigniaBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCantidad: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.xs,
    color: colores.primario,
  },
});
