import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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
import { Boton, Cargando, EstadoVacio } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { useConsulta } from '@/hooks/useConsulta';
import { ALTO_TACTIL, colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { idDe } from '@/utils/formato';

// Chat entre comprador y organizador dentro de una compra.
// La barra de entrada flota sobre el teclado y la lista se desplaza automáticamente.
export default function ChatCompra() {
  const { id } = useLocalSearchParams();
  const { usuario } = useSesion();
  const { bottom } = useSafeAreaInsets();
  const lista = useRef(null);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [tecladoAbierto, setTecladoAbierto] = useState(false);

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

  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    setErrorEnvio(null);
    setEnviando(true);
    try {
      await enviarMensaje(id, contenido);
      setTexto('');
      await mensajes.recargar();
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

  const renderLista = () => {
    if (mensajes.cargando && !mensajes.datos) {
      return <Cargando />;
    }
    if (mensajes.error && !mensajes.datos) {
      return (
        <EstadoVacio
          icono="alert-circle-outline"
          titulo="No se pudo cargar el chat"
          descripcion={mensajes.error}
          accion={<Boton titulo="Reintentar" variante="secundario" onPress={mensajes.recargar} />}
        />
      );
    }
    return (
      <FlatList
        ref={lista}
        data={ordenados}
        keyExtractor={(mensaje) => mensaje.id}
        renderItem={({ item }) => (
          <BurbujaMensaje mensaje={item} autor={autorDe(item)} esPropio={idDe(item.usuario) === usuario?.id} />
        )}
        contentContainerStyle={[estilos.lista, { paddingBottom: espacios.lg }]}
        ItemSeparatorComponent={Separador}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
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
    );
  };

  // En Android con adjustResize el offset suele ser 0 u 80 según el header del stack.
  const verticalOffset = Platform.OS === 'ios' ? 90 : 80;

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={verticalOffset}>
      <Stack.Screen options={{ title: compra?.evento?.nombre ?? 'Chat', headerRight: botonActualizar }} />
      
      {renderLista()}

      {/* Barra de envío flotante sobre el teclado */}
      <View
        style={[
          estilos.barra,
          {
            paddingBottom: tecladoAbierto ? espacios.sm : bottom + espacios.sm,
          },
        ]}>
        {errorEnvio ? <Text style={estilos.error}>{errorEnvio}</Text> : null}
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
            <Ionicons name="send" size={20} color={colores.sobrePrimario} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Separador() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
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
    borderColor: colores.borde,
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
