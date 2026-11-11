import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Pantalla provisoria del Paso 1: confirma que el proyecto abre en el celular
// y que la paleta y las tipografías cargan. Se reemplaza en el Paso 2.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PantallaInicial() {
  return (
    <SafeAreaView style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.marca}>AI Ticket It</Text>
        <Text style={estilos.subtitulo}>Proyecto Expo listo</Text>
        <View style={estilos.separador} />
        <Text style={estilos.etiqueta}>API</Text>
        <Text style={estilos.valor}>{API_URL ?? 'EXPO_PUBLIC_API_URL sin configurar'}</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#16102B',
    justifyContent: 'center',
    padding: 24,
  },
  tarjeta: {
    backgroundColor: '#221942',
    borderColor: '#3B3155',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  marca: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 32,
    color: '#F6C85F',
  },
  subtitulo: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#F4F1FA',
    marginTop: 4,
  },
  separador: {
    height: 1,
    backgroundColor: '#3B3155',
    marginVertical: 20,
  },
  etiqueta: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#A9A2BA',
    letterSpacing: 1,
  },
  valor: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: '#F4F1FA',
    marginTop: 4,
  },
});
