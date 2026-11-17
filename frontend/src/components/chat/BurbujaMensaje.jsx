import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearFechaCorta, nombreCompleto } from '@/utils/formato';

const NOMBRE_ROL = { comprador: 'Comprador', organizador: 'Organizador' };

// Mensaje del chat de una compra. Los propios van a la derecha.
// `autor` es el usuario que lo escribió (comprador u organizador de la compra).
// Si `animar` es true, la burbuja entra con una animación suave de aparición y deslizamiento.
export function BurbujaMensaje({ mensaje, autor, esPropio, animar = false }) {
  const nombre = nombreCompleto(autor) || 'Usuario';
  const rol = NOMBRE_ROL[autor?.rol];

  const [opacidad] = useState(() => new Animated.Value(animar ? 0 : 1));
  const [entrada] = useState(() => new Animated.Value(animar ? 0 : 1));

  useEffect(() => {
    if (!animar) return;
    const animacion = Animated.parallel([
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(entrada, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);
    animacion.start();
    return () => animacion.stop();
  }, [animar, opacidad, entrada]);

  const estiloAnimado = {
    opacity: opacidad,
    transform: [
      {
        translateY: entrada.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
      {
        translateX: entrada.interpolate({
          inputRange: [0, 1],
          outputRange: [esPropio ? 16 : -16, 0],
        }),
      },
      {
        scale: entrada.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[estilos.fila, esPropio ? estilos.filaPropia : estilos.filaAjena, estiloAnimado]}>
      <View style={[estilos.burbuja, esPropio ? estilos.propia : estilos.ajena]}>
        {!esPropio ? (
          <Text style={estilos.autor}>
            {nombre}
            {rol ? ` · ${rol}` : ''}
          </Text>
        ) : null}
        <Text style={[estilos.texto, esPropio && estilos.textoPropio]}>{mensaje.mensaje}</Text>
        <Text style={[estilos.hora, esPropio && estilos.horaPropia]}>{formatearFechaCorta(mensaje.fechaHora)}</Text>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
  },
  filaPropia: {
    justifyContent: 'flex-end',
  },
  filaAjena: {
    justifyContent: 'flex-start',
  },
  burbuja: {
    maxWidth: '82%',
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.md,
    borderRadius: radios.boton,
    gap: 2,
  },
  propia: {
    backgroundColor: '#6D28D9',
    borderBottomRightRadius: 4,
  },
  ajena: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderBottomLeftRadius: 4,
  },
  autor: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.primario,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  textoPropio: {
    color: colores.sobreVioleta,
  },
  hora: {
    alignSelf: 'flex-end',
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
  horaPropia: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
