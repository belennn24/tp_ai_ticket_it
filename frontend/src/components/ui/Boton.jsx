import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ALTO_TACTIL, colores, espacios, fuentes, radios, tamanios } from '@/theme';

const VARIANTES = {
  primario: {
    fondo: colores.primarioSuave,
    fondoPresionado: colores.primarioSuavePresionado,
    texto: colores.sobrePrimario,
    borde: colores.primarioSuave,
  },
  lila: {
    fondo: colores.secundario,
    fondoPresionado: colores.secundarioPresionado,
    texto: colores.sobrePrimario,
    borde: colores.secundario,
  },
  secundario: {
    fondo: 'transparent',
    fondoPresionado: colores.tarjeta,
    texto: colores.texto,
    borde: colores.borde,
  },
  peligro: {
    fondo: 'transparent',
    fondoPresionado: 'rgba(239, 68, 68, 0.15)',
    texto: colores.error,
    borde: colores.error,
  },
  // Degradados basados en la estética de las imágenes de referencia
  degradeVioleta: {
    degrade: ['#7C3AED', '#A855F7'],
    texto: '#FFFFFF',
    borde: 'transparent',
  },
  degradeDorado: {
    degrade: ['#FFD148', '#F59E0B'],
    texto: '#16102B',
    borde: 'transparent',
  },
  degradeAzul: {
    degrade: ['#3B82F6', '#8B5CF6'],
    texto: '#FFFFFF',
    borde: 'transparent',
  },
};

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  degrade,
  cargando = false,
  deshabilitado = false,
  icono,
  style,
}) {
  const configuracion = VARIANTES[variante] ?? VARIANTES.primario;
  const inactivo = deshabilitado || cargando;
  const coloresDegrade = degrade || configuracion.degrade;

  const contenido = cargando ? (
    <ActivityIndicator color={configuracion.texto} />
  ) : (
    <>
      {icono}
      <Text style={[estilos.texto, { color: configuracion.texto }]}>{titulo}</Text>
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.contenedor,
        inactivo && estilos.inactivo,
        pressed && estilos.presionado,
        style,
      ]}>
      {coloresDegrade ? (
        <LinearGradient
          colors={coloresDegrade}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={estilos.base}>
          {contenido}
        </LinearGradient>
      ) : (
        <View
          style={[
            estilos.base,
            {
              backgroundColor: configuracion.fondo,
              borderColor: configuracion.borde,
              borderWidth: configuracion.borde === 'transparent' ? 0 : 1,
            },
          ]}>
          {contenido}
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: radios.boton,
    overflow: 'hidden',
  },
  base: {
    minHeight: ALTO_TACTIL,
    borderRadius: radios.boton,
    paddingHorizontal: espacios.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.sm,
  },
  inactivo: {
    opacity: 0.5,
  },
  presionado: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  texto: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
  },
});
