import { Alert, Platform } from 'react-native';

// Pide confirmación antes de una acción. Devuelve una promesa con true o false.
export function confirmar({ titulo, mensaje, textoConfirmar = 'Aceptar', textoCancelar = 'Volver', destructivo = false }) {
  // En navegador, Alert.alert no muestra botones: se usa el diálogo nativo del browser.
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: textoCancelar, style: 'cancel', onPress: () => resolver(false) },
        { text: textoConfirmar, style: destructivo ? 'destructive' : 'default', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) }
    );
  });
}

export function avisar(titulo, mensaje) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
}
