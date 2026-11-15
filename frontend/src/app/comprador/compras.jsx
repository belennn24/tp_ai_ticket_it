import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { listarMisCompras } from '@/api/compras';
import { CompraCard } from '@/components/compras/CompraCard';
import { FilaChips } from '@/components/eventos/FilaChips';
import { Boton, Cargando, EstadoVacio, Pantalla } from '@/components/ui';
import { useConsulta } from '@/hooks/useConsulta';
import { colores, espacios, estadosCompra } from '@/theme';

const TODAS = 'todas';

export default function MisCompras() {
  const router = useRouter();
  const [estado, setEstado] = useState(TODAS);
  const compras = useConsulta(listarMisCompras);

  const todas = compras.datos ?? [];
  // Solo se ofrecen como filtro los estados que el comprador realmente tiene.
  const estadosPresentes = Object.keys(estadosCompra).filter((clave) => todas.some((compra) => compra.estado === clave));
  const opciones = [
    { valor: TODAS, etiqueta: 'Todas' },
    ...estadosPresentes.map((clave) => ({ valor: clave, etiqueta: estadosCompra[clave].etiqueta })),
  ];
  const estadoActivo = estado === TODAS || estadosPresentes.includes(estado) ? estado : TODAS;
  const visibles = estadoActivo === TODAS ? todas : todas.filter((compra) => compra.estado === estadoActivo);

  if (compras.cargando && !compras.datos) {
    return (
      <Pantalla titulo="Mis compras">
        <Cargando />
      </Pantalla>
    );
  }

  if (compras.error && !compras.datos) {
    return (
      <Pantalla titulo="Mis compras">
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo="No se pudieron cargar tus compras"
          descripcion={compras.error}
          accion={<Boton titulo="Reintentar" variante="secundario" onPress={compras.recargar} />}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Mis compras">
      {todas.length > 0 ? (
        <View style={estilos.filtros}>
          <FilaChips opciones={opciones} seleccionado={estadoActivo} onSeleccionar={setEstado} />
        </View>
      ) : null}
      <FlatList
        data={visibles}
        keyExtractor={(compra) => compra.id}
        renderItem={({ item }) => <CompraCard compra={item} onPress={() => router.push(`/compras/${item.id}`)} />}
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={Separador}
        refreshControl={
          <RefreshControl refreshing={compras.recargando} onRefresh={compras.recargar} tintColor={colores.primario} />
        }
        ListEmptyComponent={
          <EstadoVacio
            titulo="Todavía no tenés compras"
            descripcion="Cuando compres entradas las vas a ver acá, con su estado."
            accion={<Boton titulo="Explorar eventos" onPress={() => router.navigate('/comprador/explorar')} />}
          />
        }
      />
    </Pantalla>
  );
}

function Separador() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  filtros: {
    paddingBottom: espacios.md,
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
