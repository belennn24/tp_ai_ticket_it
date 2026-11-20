import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listarEventosDeOrganizador } from '@/api/eventos';
import { FilaChips } from '@/components/eventos/FilaChips';
import { Boton, EstadoConsulta, EstadoVacio, ImagenEvento, Pantalla } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import {
  entradasDisponibles,
  formatearFecha,
  formatearPrecio,
  precioDesde,
  yaOcurrio,
} from '@/utils/formato';

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'finalizados', etiqueta: 'Finalizados' },
];

export default function MisEventos() {
  const router = useRouter();
  const { usuario } = useSesion();
  const [filtro, setFiltro] = useState('todos');

  const consulta = useConsulta(() => listarEventosDeOrganizador(usuario?.id), usuario?.id ?? '');
  const misEventos = consulta.datos ?? [];

  const eventosFiltrados = misEventos.filter((ev) => {
    const finalizado = yaOcurrio(ev.fecha);
    if (filtro === 'activos') return !finalizado;
    if (filtro === 'finalizados') return finalizado;
    return true;
  });

  return (
    <Pantalla titulo="Mis eventos">
      <EstadoConsulta consulta={consulta} tituloError="No se pudieron cargar tus eventos">
        <View style={estilos.contenedor}>
        {misEventos.length > 0 ? (
          <View style={estilos.filaFiltros}>
            <FilaChips opciones={FILTROS} seleccionado={filtro} onSeleccionar={setFiltro} />
          </View>
        ) : null}

        <FlatList
          data={eventosFiltrados}
          keyExtractor={(ev) => String(ev.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl
              refreshing={consulta.recargando}
              onRefresh={consulta.recargar}
              tintColor={colores.primario}
            />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="calendar-outline"
              titulo={
                misEventos.length === 0
                  ? 'Aún no tenés eventos publicados'
                  : 'No hay eventos en este estado'
              }
              descripcion={
                misEventos.length === 0
                  ? 'Comenzá publicando tu primer evento para gestionar ventas y cupos.'
                  : 'Cambiá el filtro para ver otros eventos.'
              }
              accion={
                misEventos.length === 0 ? (
                  <Boton
                    titulo="Publicar evento"
                    icono={<Ionicons name="add-circle" size={18} color={colores.sobreVioleta} />}
                    onPress={() => router.push('/organizador/crear')}
                  />
                ) : null
              }
            />
          }
          renderItem={({ item: ev }) => {
            const finalizado = yaOcurrio(ev.fecha);
            const disponibles = entradasDisponibles(ev);
            const imagen = ev.multimedia?.[0];
            const desde = precioDesde(ev);

            return (
              <View style={estilos.tarjeta}>
                <View style={estilos.cabeceraTarjeta}>
                  <ImagenEvento uri={imagen} style={estilos.miniatura} tamanoIcono={24} />

                  <View style={estilos.infoCabecera}>
                    <View style={estilos.filaInsignias}>
                      {ev.categoria?.nombre ? (
                        <View style={estilos.pastillaCategoria}>
                          <Text style={estilos.textoPastilla}>{ev.categoria.nombre}</Text>
                        </View>
                      ) : null}
                      <View
                        style={[
                          estilos.pastillaEstado,
                          finalizado ? estilos.pastillaFinalizado : estilos.pastillaActivo,
                        ]}>
                        <Text style={estilos.textoPastilla}>
                          {finalizado ? 'Finalizado' : 'Activo'}
                        </Text>
                      </View>
                    </View>

                    <Text style={estilos.nombreEvento} numberOfLines={2}>
                      {ev.nombre}
                    </Text>
                  </View>
                </View>

                <View style={estilos.detalles}>
                  <View style={estilos.filaDato}>
                    <Ionicons name="calendar-outline" size={16} color={colores.acentoFecha} />
                    <Text style={estilos.textoDato}>{formatearFecha(ev.fecha)}</Text>
                  </View>

                  {ev.ubicacion?.nombre ? (
                    <View style={estilos.filaDato}>
                      <Ionicons name="location-outline" size={16} color={colores.primario} />
                      <Text style={estilos.textoDato} numberOfLines={1}>
                        {ev.ubicacion.nombre}
                      </Text>
                    </View>
                  ) : null}

                  <View style={estilos.filaCupos}>
                    <View style={estilos.datoCupo}>
                      <Text style={estilos.etiquetaCupo}>DISPONIBLES</Text>
                      <Text style={estilos.valorCupo}>
                        {disponibles === 0 ? 'Agotado' : `${disponibles} entradas`}
                      </Text>
                    </View>
                    {desde !== null ? (
                      <View style={estilos.datoCupo}>
                        <Text style={estilos.etiquetaCupo}>PRECIO BASE</Text>
                        <Text style={estilos.valorPrecio}>{formatearPrecio(desde)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={estilos.acciones}>
                  <Boton
                    titulo="Gestionar cupos y ventas"
                    icono={<Ionicons name="stats-chart-outline" size={18} color={colores.sobreVioleta} />}
                    onPress={() => router.push(`/gestion/${ev.id}`)}
                    style={estilos.botonGestionar}
                  />
                  <Boton
                    titulo="Ver evento"
                    variante="secundario"
                    icono={<Ionicons name="eye-outline" size={18} color={colores.texto} />}
                    onPress={() => router.push(`/eventos/${ev.id}`)}
                  />
                </View>
              </View>
            );
          }}
        />
      </View>
      </EstadoConsulta>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  filaFiltros: {
    paddingHorizontal: espacios.xl,
    paddingBottom: espacios.sm,
  },
  lista: {
    padding: espacios.xl,
    paddingTop: espacios.xs,
    gap: espacios.lg,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacios.lg,
    gap: espacios.md,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    gap: espacios.md,
    alignItems: 'center',
  },
  miniatura: {
    width: 64,
    height: 64,
    borderRadius: radios.sm,
  },
  miniaturaVacia: {
    width: 64,
    height: 64,
    borderRadius: radios.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCabecera: {
    flex: 1,
    gap: espacios.xs,
  },
  filaInsignias: {
    flexDirection: 'row',
    gap: espacios.xs,
  },
  pastillaCategoria: {
    backgroundColor: colores.pastillaActiva,
    paddingHorizontal: espacios.sm,
    paddingVertical: 2,
    borderRadius: radios.pildora,
  },
  pastillaEstado: {
    paddingHorizontal: espacios.sm,
    paddingVertical: 2,
    borderRadius: radios.pildora,
  },
  pastillaActivo: {
    backgroundColor: 'rgba(110, 231, 183, 0.2)',
  },
  pastillaFinalizado: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  textoPastilla: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
    color: colores.texto,
  },
  nombreEvento: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  detalles: {
    gap: espacios.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: espacios.sm,
  },
  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
  },
  textoDato: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  filaCupos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espacios.xs,
    paddingTop: espacios.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  datoCupo: {
    gap: 2,
  },
  etiquetaCupo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs - 2,
    color: colores.textoAtenuado,
    letterSpacing: 0.8,
  },
  valorCupo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  valorPrecio: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.sm,
    color: colores.dorado,
  },
  acciones: {
    gap: espacios.xs,
    marginTop: espacios.xs,
  },
  botonGestionar: {
    marginBottom: espacios.xxs,
  },
});
