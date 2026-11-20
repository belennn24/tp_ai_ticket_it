import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';

import { colores, degrades } from '@/theme';

// Foto del evento con respaldo en degradé si no hay URL o si falla la carga.
export function ImagenEvento({ uri, style, tamanoIcono = 48, icono = 'musical-notes' }) {
  const [uriConError, setUriConError] = useState(null);
  const mostrarFoto = Boolean(uri && uriConError !== uri);

  if (mostrarFoto) {
    return (
      <Image
        source={{ uri }}
        style={[estilos.base, style]}
        resizeMode="cover"
        accessible={false}
        onError={() => setUriConError(uri)}
      />
    );
  }

  return (
    <LinearGradient colors={degrades.ticket} style={[estilos.base, estilos.sinImagen, style]}>
      <Ionicons name={icono} size={tamanoIcono} color={colores.textoTicket} />
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  base: {
    width: '100%',
    height: '100%',
    backgroundColor: colores.violetaOscuro,
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
