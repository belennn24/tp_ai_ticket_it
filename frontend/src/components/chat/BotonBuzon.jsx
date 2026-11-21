import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ALTO_TACTIL, colores, radios } from '@/theme';

// Botón con ícono de buzón para abrir la lista de todos los chats desde cualquier pantalla.
export function BotonBuzon({ compacto = false }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Buzón de chats"
      accessibilityHint="Abre todas tus conversaciones"
      onPress={() => router.push('/chats')}
      style={({ pressed }) => [
        estilos.boton,
        compacto ? estilos.compacto : estilos.encabezado,
        pressed && estilos.presionado,
      ]}>
      <Ionicons name="mail-outline" size={compacto ? 22 : 23} color={colores.primario} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pildora,
  },
  encabezado: {
    width: ALTO_TACTIL,
    height: ALTO_TACTIL,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.bordeControl,
  },
  compacto: {
    width: 40,
    height: 40,
    backgroundColor: colores.insigniaFondo,
    borderWidth: 1,
    borderColor: colores.insigniaBorde,
  },
  presionado: {
    opacity: 0.75,
  },
});
