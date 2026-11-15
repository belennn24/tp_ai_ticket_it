import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cancelarCompra, obtenerCompra, obtenerHistorial } from '@/api/compras';
import { crearResenia, obtenerReseniasDeOrganizador } from '@/api/resenias';
import { CompraCard } from '@/components/compras/CompraCard';
import { HistorialEstados } from '@/components/compras/HistorialEstados';
import { FormularioResenia } from '@/components/resenias/FormularioResenia';
import { ReseniaItem } from '@/components/resenias/ReseniaItem';
import { Boton, Cargando, EstadoVacio } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { colores, espacios, fuentes, tamanios } from '@/theme';
import { confirmar } from '@/utils/dialogos';
import { idDe, yaOcurrio } from '@/utils/formato';

const ESTADOS_CANCELABLES = ['PENDIENTE', 'CONFIRMADA'];

export default function DetalleCompra() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { usuario, rol } = useSesion();
  const [cancelando, setCancelando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);

  const consulta = useConsulta(() => obtenerCompra(id), id);
  const historial = useConsulta(() => obtenerHistorial(id), id);
  const compra = consulta.datos;

  // Las reseñas solo hacen falta cuando la entrada ya fue utilizada.
  const organizadorId = compra?.evento?.organizador?.id;
  const pideResenias = compra?.estado === 'UTILIZADA' && Boolean(organizadorId);
  const resenias = useConsulta(
    () => (pideResenias ? obtenerReseniasDeOrganizador(organizadorId) : Promise.resolve(null)),
    pideResenias ? organizadorId : ''
  );

  if (consulta.cargando && !compra) {
    return <Cargando />;
  }
  if (!compra) {
    return (
      <EstadoVacio
        icono="alert-circle-outline"
        titulo="No se pudo cargar la compra"
        descripcion={consulta.error}
        accion={<Boton titulo="Reintentar" variante="secundario" onPress={consulta.recargar} />}
      />
    );
  }

  const esComprador = rol === 'comprador';
  // Regla del negocio: se puede cancelar si no fue utilizada y el evento todavía no ocurrió.
  // El backend valida lo mismo; acá solo se decide si mostrar el botón.
  const puedeCancelar = esComprador && ESTADOS_CANCELABLES.includes(compra.estado) && !yaOcurrio(compra.evento?.fecha);
  const miResenia = (resenias.datos?.resenias ?? []).find(
    (resenia) => idDe(resenia.comprador) === usuario?.id && idDe(resenia.evento) === compra.evento?.id
  );

  const recargarTodo = () => Promise.all([consulta.recargar(), historial.recargar(), resenias.recargar()]);

  const cancelar = async () => {
    const confirmado = await confirmar({
      titulo: 'Cancelar compra',
      mensaje: 'Se cancela la compra y las entradas vuelven a estar disponibles. Esta acción no se puede deshacer.',
      textoConfirmar: 'Cancelar compra',
      textoCancelar: 'Volver',
      destructivo: true,
    });
    if (!confirmado) return;

    setErrorAccion(null);
    setCancelando(true);
    try {
      await cancelarCompra(compra.id);
    } catch (e) {
      setErrorAccion(e.message);
    }
    await recargarTodo();
    setCancelando(false);
  };

  const enviarResenia = async ({ puntuacion, detalle }) => {
    await crearResenia({ eventoId: compra.evento.id, puntuacion, detalle });
    await resenias.recargar();
  };

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={consulta.recargando} onRefresh={recargarTodo} tintColor={colores.primario} />}>
      <CompraCard compra={compra} />

      <View style={estilos.acciones}>
        <Boton
          titulo="Chat con el organizador"
          variante="secundario"
          icono={<Ionicons name="chatbubbles-outline" size={20} color={colores.texto} />}
          onPress={() => router.push(`/compras/${compra.id}/chat`)}
        />
        {puedeCancelar ? <Boton titulo="Cancelar compra" variante="peligro" cargando={cancelando} onPress={cancelar} /> : null}
        {errorAccion ? <Text style={estilos.error}>{errorAccion}</Text> : null}
      </View>

      {esComprador && compra.estado === 'UTILIZADA' ? (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{miResenia ? 'Tu reseña' : 'Calificá el evento'}</Text>
          {resenias.cargando && !resenias.datos ? (
            <Text style={estilos.ayuda}>Cargando…</Text>
          ) : miResenia ? (
            <ReseniaItem resenia={{ ...miResenia, comprador: usuario }} />
          ) : (
            <FormularioResenia onEnviar={enviarResenia} />
          )}
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>Historial</Text>
        {historial.datos?.length ? (
          <HistorialEstados cambios={historial.datos} />
        ) : (
          <Text style={estilos.ayuda}>{historial.error ?? (historial.cargando ? 'Cargando…' : 'Sin cambios registrados.')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: espacios.xl,
    gap: espacios.xl,
  },
  acciones: {
    gap: espacios.md,
  },
  seccion: {
    gap: espacios.md,
  },
  tituloSeccion: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoAtenuado,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
  },
});
