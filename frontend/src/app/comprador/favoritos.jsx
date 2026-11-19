import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { listarFavoritos } from '@/api/favoritos';
import { EventoCard } from '@/components/eventos/EventoCard';
import { Boton, Cargando, EstadoVacio, Pantalla } from '@/components/ui';
import { useConsulta } from '@/hooks/useConsulta';
import { colores, espacios } from '@/theme';

export default function MisFavoritos() {
  const router = useRouter();
  const consulta = useConsulta(listarFavoritos);
  const eventos = consulta.datos ?? [];

  if (consulta.cargando && !consulta.datos) {
    return (
      <Pantalla titulo="Favoritos">
        <Cargando />
      </Pantalla>
    );
  }

  if (consulta.error && !consulta.datos) {
    return (
      <Pantalla titulo="Favoritos">
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo="No se pudieron cargar tus favoritos"
          descripcion={consulta.error}
          accion={<Boton titulo="Reintentar" variante="secundario" onPress={consulta.recargar} />}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Favoritos">
      <FlatList
        data={eventos}
        keyExtractor={(item) => String(item.id)}
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
            icono="heart-outline"
            titulo="Aún no tenés eventos favoritos"
            descripcion="Explorá los próximos recitales y festivales y guardá los que más te interesen."
            accion={
              <Boton
                titulo="Explorar eventos"
                onPress={() => router.push('/comprador/explorar')}
              />
            }
          />
        }
        renderItem={({ item }) => (
          <EventoCard evento={item} onPress={() => router.push(`/eventos/${item.id}`)} />
        )}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  lista: {
    padding: espacios.xl,
    paddingTop: espacios.xs,
    gap: espacios.lg,
  },
});
