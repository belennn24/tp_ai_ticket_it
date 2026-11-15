import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearPrecio } from '@/utils/formato';

// Opción de tipo de entrada. `tipo.cupo` es la cantidad disponible.
export function TipoEntradaItem({ tipo, seleccionado = false, deshabilitado = false, onPress }) {
  const agotado = (tipo.cupo ?? 0) <= 0;
  const inactivo = deshabilitado || agotado;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado, disabled: inactivo }}
      disabled={inactivo}
      onPress={onPress}
      style={[estilos.base, seleccionado && estilos.seleccionado, inactivo && estilos.inactivo]}>
      <Ionicons
        name={seleccionado ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={seleccionado ? colores.primario : colores.textoAtenuado}
      />
      <View style={estilos.info}>
        <Text style={estilos.nombre}>{tipo.nombre}</Text>
        {tipo.descripcion ? <Text style={estilos.descripcion}>{tipo.descripcion}</Text> : null}
        <Text style={[estilos.cupo, agotado && estilos.cupoAgotado]}>
          {agotado ? 'Agotado' : `${tipo.cupo} disponibles`}
        </Text>
      </View>
      <Text style={estilos.precio}>{formatearPrecio(tipo.precio)}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    padding: espacios.lg,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  seleccionado: {
    borderColor: colores.primario,
  },
  inactivo: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  cupo: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.exito,
  },
  cupoAgotado: {
    color: colores.error,
  },
  precio: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.md,
    color: colores.primario,
  },
});
