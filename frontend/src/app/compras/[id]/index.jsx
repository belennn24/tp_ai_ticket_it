import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cancelarCompra, obtenerCompra, obtenerHistorial } from '@/api/compras';
import { crearResenia } from '@/api/resenias';
import { HistorialEstados } from '@/components/compras/HistorialEstados';
import { TicketCompra } from '@/components/compras/TicketCompra';
import { FormularioResenia } from '@/components/resenias/FormularioResenia';
import { ReseniaItem } from '@/components/resenias/ReseniaItem';
import { Boton, EstadoConsulta, FondoConBrillo } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { useReseniasOrganizador } from '@/hooks/useReseniasOrganizador';
import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';
import { confirmar } from '@/utils/dialogos';
import { idDe, yaOcurrio } from '@/utils/formato';

const ESTADOS_CANCELABLES = ['PENDIENTE', 'CONFIRMADA'];

export default function DetalleCompra() {
  // `nueva=1` llega desde el detalle del evento cuando la compra se acaba de hacer.
  const { id, nueva } = useLocalSearchParams();
  const recienComprada = nueva === '1';
  const router = useRouter();
  const { usuario, rol } = useSesion();
  const { bottom } = useSafeAreaInsets();
  const [cancelando, setCancelando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const scrollRef = useRef(null);
  const seccionReseniaY = useRef(0);

  const consulta = useConsulta(() => obtenerCompra(id), id);
  const historial = useConsulta(() => obtenerHistorial(id), id);
  const compra = consulta.datos;

  // Los lectores de pantalla anuncian la confirmación apenas se muestra el ticket.
  const nombreEvento = compra?.evento?.nombre;
  useEffect(() => {
    if (recienComprada && nombreEvento) {
      AccessibilityInfo.announceForAccessibility(`Compra confirmada. Tu entrada para ${nombreEvento} está lista.`);
    }
  }, [recienComprada, nombreEvento]);

  // Las reseñas solo hacen falta cuando la entrada ya fue utilizada.
  const organizadorId = compra?.evento?.organizador?.id;
  const resenias = useReseniasOrganizador(organizadorId, { activo: compra?.estado === 'UTILIZADA' });

  if (!compra) {
    return <EstadoConsulta consulta={consulta} tituloError="No se pudo cargar la compra" />;
  }

  const esComprador = rol === 'comprador';
  // Regla del negocio: se puede cancelar si no fue utilizada y el evento todavía no ocurrió.
  // El backend valida lo mismo; acá solo se decide si mostrar el botón.
  const puedeCancelar = esComprador && ESTADOS_CANCELABLES.includes(compra.estado) && !yaOcurrio(compra.evento?.fecha);
  const miResenia = (resenias.datos?.resenias ?? []).find(
    (resenia) => idDe(resenia.comprador) === usuario?.id && idDe(resenia.evento) === compra.evento?.id,
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

  const desplazarAResenia = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, seccionReseniaY.current - espacios.md),
        animated: true,
      });
    }, 150);
  };

  const verticalOffset = Platform.OS === 'ios' ? 90 : 80;

  return (
    <FondoConBrillo>
      <KeyboardAvoidingView
        style={estilos.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={verticalOffset}>
        <ScrollView
          ref={scrollRef}
          style={estilos.contenedor}
          contentContainerStyle={[estilos.contenido, { paddingBottom: espacios.xxl + bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          refreshControl={
            <RefreshControl refreshing={consulta.recargando} onRefresh={recargarTodo} tintColor={colores.primario} />
          }>
        {recienComprada && compra.estado === 'CONFIRMADA' ? (
          <LinearGradient colors={degrades.primario} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.confirmacion}>
            <View style={estilos.iconoConfirmacion}>
              <Ionicons name="checkmark" size={28} color={colores.violeta} />
            </View>
            <View style={estilos.textosConfirmacion} accessibilityLiveRegion="polite">
              <Text style={estilos.tituloConfirmacion} accessibilityRole="header">
                ¡Compra confirmada!
              </Text>
              <Text style={estilos.textoConfirmacion}>Tu entrada está lista. La encontrás siempre en Mis compras.</Text>
            </View>
          </LinearGradient>
        ) : null}

        <TicketCompra compra={compra} />

        <View style={estilos.acciones}>
          <Boton
            titulo={esComprador ? 'Chat con el organizador' : 'Chat con el comprador'}
            variante="secundario"
            icono={<Ionicons name="chatbubbles-outline" size={20} color={colores.texto} />}
            onPress={() => router.push(`/compras/${compra.id}/chat`)}
          />
          {puedeCancelar ? <Boton titulo="Cancelar compra" variante="peligro" cargando={cancelando} onPress={cancelar} /> : null}
          {errorAccion ? (
            <Text style={estilos.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {errorAccion}
            </Text>
          ) : null}
        </View>

        {esComprador && compra.estado === 'UTILIZADA' ? (
          <View
            style={estilos.seccion}
            onLayout={(e) => {
              seccionReseniaY.current = e.nativeEvent.layout.y;
            }}>
            <Text style={estilos.tituloSeccion} accessibilityRole="header">
              {miResenia ? 'Tu reseña' : 'Calificá el evento'}
            </Text>
            {resenias.cargando && !resenias.datos ? (
              <Text style={estilos.ayuda}>Cargando…</Text>
            ) : miResenia ? (
              <ReseniaItem resenia={{ ...miResenia, comprador: usuario }} />
            ) : (
              <FormularioResenia onEnviar={enviarResenia} onEnfocarComentario={desplazarAResenia} />
            )}
          </View>
        ) : null}

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion} accessibilityRole="header">
            Historial
          </Text>
          {historial.datos?.length ? (
            <HistorialEstados cambios={historial.datos} />
          ) : (
            <Text style={estilos.ayuda}>
              {historial.error ?? (historial.cargando ? 'Cargando…' : 'Sin cambios registrados.')}
            </Text>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </FondoConBrillo>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  confirmacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    padding: espacios.lg,
    borderRadius: radios.tarjeta,
  },
  iconoConfirmacion: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  textosConfirmacion: {
    flex: 1,
    gap: 2,
  },
  tituloConfirmacion: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.sobreVioleta,
  },
  textoConfirmacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.sobreVioleta,
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
