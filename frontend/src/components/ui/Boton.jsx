import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ALTO_TACTIL, colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';

// Todas las variantes tienen contraste AA entre el texto y cada color del fondo.
const VARIANTES = {
  primario: { degrade: degrades.primario, texto: colores.sobreVioleta },
  degradeVioleta: { degrade: degrades.primario, texto: colores.sobreVioleta },
  degradeAzul: { degrade: degrades.azul, texto: colores.sobreVioleta },
  degradeDorado: { degrade: degrades.dorado, texto: colores.sobrePrimario },
  lila: { fondo: colores.primario, texto: colores.sobrePrimario, borde: colores.primario },
  secundario: { fondo: 'rgba(30, 21, 69, 0.6)', texto: colores.texto, borde: colores.bordeControl },
  peligro: { fondo: 'transparent', texto: colores.error, borde: colores.error },
};

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  degrade,
  cargando = false,
  deshabilitado = false,
  icono,
  accessibilityLabel,
  accessibilityHint,
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
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [estilos.contenedor, inactivo && estilos.inactivo, pressed && estilos.presionado, style]}>
      {coloresDegrade ? (
        <LinearGradient colors={coloresDegrade} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.base}>
          {contenido}
        </LinearGradient>
      ) : (
        <View
          style={[estilos.base, estilos.conBorde, { backgroundColor: configuracion.fondo, borderColor: configuracion.borde }]}>
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
    paddingVertical: espacios.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.sm,
  },
  conBorde: {
    borderWidth: 1,
  },
  inactivo: {
    opacity: 0.5,
  },
  presionado: {
    opacity: 0.85,
  },
  texto: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    textAlign: 'center',
  },
});
