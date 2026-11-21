import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { obtenerCompra } from '@/api/compras';
import { enviarMensaje } from '@/api/mensajes';
import { BurbujaMensaje } from '@/components/chat/BurbujaMensaje';
import { EstadoConsulta, EstadoVacio, FondoConBrillo, Separador } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { useSondeo } from '@/hooks/useSondeo';
import { ALTO_TACTIL, colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { idDe, nombreCompleto } from '@/utils/formato';

// Cada cuánto se buscan mensajes nuevos mientras el chat está abierto.
// Con el límite de pedidos del backend en desarrollo (1000 cada 15 min) sobra margen;
// con el de producción (100 cada 15 min) conviene subirlo a 15000 o más.
const INTERVALO_SONDEO_MS = 5000;
// Distancia al final (en px) dentro de la cual se considera que el usuario está leyendo lo último.
const MARGEN_FINAL = 80;

// Chat entre comprador y organizador dentro de una compra.
// La barra de entrada flota sobre el teclado y la lista se desplaza automáticamente.
// Los mensajes nuevos llegan por sondeo (polling): mientras el chat está abierto
// se vuelve a consultar la compra cada INTERVALO_SONDEO_MS.
export default function ChatCompra() {
  const { id } = useLocalSearchParams();
  const { usuario } = useSesion();
  const { bottom } = useSafeAreaInsets();
  const lista = useRef(null);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  // Si el usuario está leyendo mensajes viejos, los nuevos no lo mueven: se avisa con un botón.
  const [hayNuevos, setHayNuevos] = useState(false);
  const [reducirMovimiento, setReducirMovimiento] = useState(false);
  const [idsAnimar, setIdsAnimar] = useState(() => new Set());
  const [animEnvio] = useState(() => new Animated.Value(0));
  const cercaDelFinal = useRef(true);
  const ultimoMensajeId = useRef(null);
  const idsConocidos = useRef(null);

  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((habilitado) => {
      if (activo) setReducirMovimiento(habilitado);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducirMovimiento);
    return () => {
      activo = false;
      sub.remove();
    };
  }, []);

  // Escuchar apertura y cierre del teclado para ajustar el scroll y el padding inferior
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvent, () => {
      setTecladoAbierto(true);
      setTimeout(() => {
        lista.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const subHide = Keyboard.addListener(hideEvent, () => {
      setTecladoAbierto(false);
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // Los mensajes se leen de la compra (GET /compras/:id), que trae la conversación
  // completa y los datos de los dos participantes.
  const mensajes = useConsulta(() => obtenerCompra(id), id);
  const compra = mensajes.datos;
  const ordenados = [...(compra?.mensajes ?? [])].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  // Un mensaje puede traer el usuario completo o solo su id: se resuelve con los participantes.
  const participantes = [compra?.comprador, compra?.evento?.organizador].filter(Boolean);
  const autorDe = (mensaje) => participantes.find((participante) => participante.id === idDe(mensaje.usuario)) ?? null;

  useSondeo(mensajes.refrescar, { intervaloMs: INTERVALO_SONDEO_MS });

  // Los mensajes nuevos que llegan después de la carga inicial se marcan para animar su entrada.
  useEffect(() => {
    if (!compra) return;
    const idsActuales = (compra.mensajes ?? []).map((m) => m.id);
    if (idsConocidos.current === null) {
      idsConocidos.current = new Set(idsActuales);
      return;
    }
    const nuevos = idsActuales.filter((msgId) => !idsConocidos.current.has(msgId));
    if (nuevos.length === 0) return;
    nuevos.forEach((msgId) => idsConocidos.current.add(msgId));
    setIdsAnimar((prev) => {
      const siguiente = new Set(prev);
      nuevos.forEach((msgId) => siguiente.add(msgId));
      return siguiente;
    });
  }, [compra]);

  // Cuando llega un mensaje de la otra persona, los lectores de pantalla lo anuncian.
  const ultimo = ordenados[ordenados.length - 1] ?? null;
  const ultimoId = ultimo?.id ?? null;
  const ultimoEsPropio = ultimo ? idDe(ultimo.usuario) === usuario?.id : false;
  const ultimoTexto = ultimo?.mensaje ?? '';
  const ultimoAutor = ultimo ? nombreCompleto(autorDe(ultimo)) : '';
  useEffect(() => {
    if (!ultimoId) return;
    const anterior = ultimoMensajeId.current;
    ultimoMensajeId.current = ultimoId;
    // La primera carga no se anuncia: solo lo que llega con el chat abierto.
    if (anterior === null || anterior === ultimoId) return;
    if (!ultimoEsPropio) {
      AccessibilityInfo.announceForAccessibility(`Nuevo mensaje de ${ultimoAutor || 'la otra persona'}: ${ultimoTexto}`);
      if (!cercaDelFinal.current) setHayNuevos(true);
    }
  }, [ultimoId, ultimoEsPropio, ultimoTexto, ultimoAutor]);

  const irAlFinal = () => {
    setHayNuevos(false);
    cercaDelFinal.current = true;
    lista.current?.scrollToEnd({ animated: true });
  };

  const alDesplazar = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distancia = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    cercaDelFinal.current = distancia < MARGEN_FINAL;
    if (cercaDelFinal.current) setHayNuevos(false);
  };

  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    if (!reducirMovimiento) {
      animEnvio.setValue(0);
      Animated.sequence([
        Animated.timing(animEnvio, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(animEnvio, {
          toValue: 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setErrorEnvio(null);
    setEnviando(true);
    try {
      await enviarMensaje(id, contenido);
      setTexto('');
      await mensajes.refrescar();
      cercaDelFinal.current = true;
      setTimeout(() => {
        lista.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (e) {
      setErrorEnvio(e.message);
    }
    setEnviando(false);
  };

  const botonActualizar = () => (
    <Pressable accessibilityRole="button" accessibilityLabel="Actualizar mensajes" hitSlop={12} onPress={mensajes.recargar}>
      <Ionicons name="refresh" size={22} color={colores.texto} />
    </Pressable>
  );

  const renderLista = () => (
    <EstadoConsulta consulta={mensajes} tituloError="No se pudo cargar el chat">
      <FlatList
        ref={lista}
        data={ordenados}
        keyExtractor={(mensaje) => mensaje.id}
        renderItem={({ item }) => (
          <BurbujaMensaje
            mensaje={item}
            autor={autorDe(item)}
            esPropio={idDe(item.usuario) === usuario?.id}
            animar={!reducirMovimiento && idsAnimar.has(item.id)}
          />
        )}
        contentContainerStyle={[estilos.lista, { paddingBottom: espacios.lg }]}
        ItemSeparatorComponent={Separador}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={alDesplazar}
        scrollEventThrottle={100}
        // Solo baja solo si el usuario ya estaba viendo lo último.
        onContentSizeChange={() => {
          if (cercaDelFinal.current) lista.current?.scrollToEnd({ animated: false });
        }}
        refreshControl={
          <RefreshControl refreshing={mensajes.recargando} onRefresh={mensajes.recargar} tintColor={colores.primario} />
        }
        ListEmptyComponent={
          <EstadoVacio
            icono="chatbubbles-outline"
            titulo="Todavía no hay mensajes"
            descripcion="Escribí tu consulta sobre el evento, el acceso o cambios de fecha."
          />
        }
      />
    </EstadoConsulta>
  );

  // En Android con adjustResize el offset suele ser 0 u 80 según el header del stack.
  const verticalOffset = Platform.OS === 'ios' ? 90 : 80;

  return (
    <FondoConBrillo>
      <KeyboardAvoidingView
        style={estilos.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={verticalOffset}>
        <Stack.Screen options={{ title: compra?.evento?.nombre ?? 'Chat', headerRight: botonActualizar }} />

        {renderLista()}

        {/* Si el último sondeo falló se avisa, pero se siguen mostrando los mensajes ya cargados. */}
        {mensajes.error && mensajes.datos ? (
          <View style={estilos.avisoConexion} accessibilityLiveRegion="polite">
            <Ionicons name="cloud-offline-outline" size={16} color={colores.error} />
            <Text style={estilos.textoAviso} accessibilityRole="alert">
              Sin conexión con el servidor. Reintentando…
            </Text>
          </View>
        ) : null}

        {hayNuevos ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hay mensajes nuevos. Ir al último mensaje"
            onPress={irAlFinal}
            style={estilos.botonNuevos}>
            <Ionicons name="arrow-down" size={16} color={colores.sobrePrimario} />
            <Text style={estilos.textoNuevos}>Mensajes nuevos</Text>
          </Pressable>
        ) : null}

        {/* Barra de envío flotante sobre el teclado */}
        <View
          style={[
            estilos.barra,
            {
              paddingBottom: tecladoAbierto ? espacios.sm : bottom + espacios.sm,
            },
          ]}>
          {errorEnvio ? (
            <Text style={estilos.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {errorEnvio}
            </Text>
          ) : null}
          <View style={estilos.filaEnvio}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              onFocus={() => {
                setTimeout(() => {
                  lista.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
              placeholder="Escribí un mensaje..."
              placeholderTextColor={colores.textoAtenuado}
              selectionColor={colores.primario}
              accessibilityLabel="Mensaje"
              multiline
              maxLength={500}
              editable={!enviando}
              style={estilos.campo}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              disabled={enviando || !texto.trim()}
              onPress={enviar}
              style={[estilos.botonEnviar, (enviando || !texto.trim()) && estilos.botonInactivo]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: animEnvio.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                    },
                    {
                      translateY: animEnvio.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
                    },
                    {
                      scale: animEnvio.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }),
                    },
                  ],
                }}>
                <Ionicons name="send" size={20} color={colores.sobrePrimario} />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </FondoConBrillo>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  avisoConexion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.xs,
    paddingVertical: espacios.sm,
    paddingHorizontal: espacios.lg,
    backgroundColor: colores.fondoAlt,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  textoAviso: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.error,
  },
  botonNuevos: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    minHeight: 44,
    marginBottom: espacios.sm,
    paddingHorizontal: espacios.lg,
    borderRadius: radios.pildora,
    backgroundColor: colores.primario,
  },
  textoNuevos: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.sm,
    color: colores.sobrePrimario,
  },
  lista: {
    flexGrow: 1,
    padding: espacios.xl,
  },
  separador: {
    height: espacios.md,
  },
  barra: {
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.fondoAlt,
    paddingHorizontal: espacios.lg,
    paddingTop: espacios.md,
    gap: espacios.sm,
    // Efecto sutil de elevación / sombra flotante sobre el contenido
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  filaEnvio: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espacios.md,
  },
  campo: {
    flex: 1,
    minHeight: ALTO_TACTIL,
    maxHeight: 120,
    borderRadius: radios.input,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.fondo,
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.md,
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  botonEnviar: {
    width: ALTO_TACTIL,
    height: ALTO_TACTIL,
    borderRadius: ALTO_TACTIL / 2,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonInactivo: {
    opacity: 0.4,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
  },
});
