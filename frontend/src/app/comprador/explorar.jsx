import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { listarCategorias } from '@/api/categorias';
import { buscarEventos } from '@/api/eventos';
import { EventoCard } from '@/components/eventos/EventoCard';
import { FilaChips } from '@/components/eventos/FilaChips';
import { MapaUbicaciones } from '@/components/eventos/MapaUbicaciones';
import { Boton, Cargando, EstadoVacio, Input, Pantalla } from '@/components/ui';
import { useConsulta } from '@/hooks/useConsulta';
import { ALTO_TACTIL, colores, espacios, fuentes, radios, tamanios } from '@/theme';

const TODAS = 'todas';
const ORDENES = [
  { valor: 'fecha', etiqueta: 'Fecha' },
  { valor: 'precio', etiqueta: 'Precio' },
  { valor: 'reputacion', etiqueta: 'Puntaje del organizador' },
];
const ESPERA_BUSQUEDA_MS = 400;

export default function Explorar() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [textoBuscado, setTextoBuscado] = useState('');
  const [categoriaId, setCategoriaId] = useState(TODAS);
  const [orden, setOrden] = useState('fecha');
  const [vista, setVista] = useState('lista');

  // Espera a que se deje de escribir antes de consultar al backend.
  useEffect(() => {
    const temporizador = setTimeout(() => setTextoBuscado(texto.trim()), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(temporizador);
  }, [texto]);

  const categorias = useConsulta(listarCategorias);
  const eventos = useConsulta(
    () => buscarEventos({ texto: textoBuscado, categoriaId: categoriaId === TODAS ? undefined : categoriaId, orden }),
    `${textoBuscado}|${categoriaId}|${orden}`
  );

  const opcionesCategoria = [
    { valor: TODAS, etiqueta: 'Todas' },
    ...(categorias.datos ?? []).map((categoria) => ({ valor: categoria.id, etiqueta: categoria.nombre })),
  ];

  const hayFiltros = textoBuscado !== '' || categoriaId !== TODAS;
  const limpiarFiltros = () => {
    setTexto('');
    setTextoBuscado('');
    setCategoriaId(TODAS);
  };

  const renderContenido = () => {
    if (eventos.cargando && !eventos.datos) {
      return <Cargando />;
    }
    if (eventos.error && !eventos.datos) {
      return (
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo="No se pudieron cargar los eventos"
          descripcion={eventos.error}
          accion={<Boton titulo="Reintentar" variante="secundario" onPress={eventos.recargar} />}
        />
      );
    }
    if (vista === 'mapa') {
      return (
        <MapaUbicaciones
          eventos={eventos.datos ?? []}
          onSeleccionarEvento={(evento) => router.push(`/eventos/${evento.id}`)}
        />
      );
    }
    return (
      <FlatList
        data={eventos.datos ?? []}
        keyExtractor={(evento) => evento.id}
        renderItem={({ item }) => <EventoCard evento={item} onPress={() => router.push(`/eventos/${item.id}`)} />}
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={Separador}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={eventos.recargando} onRefresh={eventos.recargar} tintColor={colores.primario} />
        }
        ListEmptyComponent={
          <EstadoVacio
            icono="search-outline"
            titulo="Sin resultados"
            descripcion="No hay eventos que coincidan con la búsqueda."
            accion={hayFiltros ? <Boton titulo="Limpiar filtros" variante="secundario" onPress={limpiarFiltros} /> : null}
          />
        }
      />
    );
  };

  return (
    <Pantalla titulo="Explorar">
      <View style={estilos.filtros}>
        <View style={estilos.filaBuscador}>
          <View style={estilos.buscador}>
            <Input
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar eventos"
              accessibilityLabel="Buscar eventos"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={vista === 'mapa' ? 'Ver lista de eventos' : 'Ver mapa de ubicaciones'}
            onPress={() => setVista((v) => (v === 'mapa' ? 'lista' : 'mapa'))}
            style={[estilos.botonVista, vista === 'mapa' && estilos.botonVistaActiva]}>
            <Ionicons
              name={vista === 'mapa' ? 'list-outline' : 'map-outline'}
              size={22}
              color={vista === 'mapa' ? colores.sobrePrimario : colores.texto}
            />
          </Pressable>
        </View>
        <FilaChips opciones={opcionesCategoria} seleccionado={categoriaId} onSeleccionar={setCategoriaId} />
        {vista === 'lista' ? (
          <>
            <Text style={estilos.tituloOrden}>ORDENAR POR</Text>
            <FilaChips opciones={ORDENES} seleccionado={orden} onSeleccionar={setOrden} />
          </>
        ) : null}
      </View>
      {renderContenido()}
    </Pantalla>
  );
}

function Separador() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  filtros: {
    gap: espacios.md,
    paddingBottom: espacios.md,
  },
  filaBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingHorizontal: espacios.xl,
  },
  buscador: {
    flex: 1,
  },
  botonVista: {
    width: ALTO_TACTIL,
    height: ALTO_TACTIL,
    borderRadius: radios.input,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonVistaActiva: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  tituloOrden: {
    paddingHorizontal: espacios.xl,
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
    letterSpacing: 1,
  },
  lista: {
    flexGrow: 1,
    paddingHorizontal: espacios.xl,
    paddingBottom: espacios.xl,
  },
  separador: {
    height: espacios.lg,
  },
});
