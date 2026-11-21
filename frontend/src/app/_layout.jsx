import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { BotonBuzon } from '@/components/chat/BotonBuzon';
import { SesionProvider, useSesion } from '@/context/SesionContext';
import { colores, fuentes, mapaFuentes } from '@/theme';

// La pantalla de carga se mantiene visible hasta que las tipografías estén listas.
SplashScreen.preventAutoHideAsync();

const opcionesDetalle = {
  headerShown: true,
  headerStyle: { backgroundColor: colores.encabezado },
  headerTintColor: colores.texto,
  headerTitleStyle: { fontFamily: fuentes.bold },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  headerRight: () => <BotonBuzon compacto />,
};

// Guardia de sesión: cada grupo de rutas solo existe si se cumple su condición.
// Sin sesión solo se puede ver el login; con sesión, las pestañas del rol.
function Navegacion() {
  const { haySesion, rol } = useSesion();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
      <Stack.Protected guard={!haySesion} redirectTo="/">
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={haySesion} redirectTo="/login">
        <Stack.Screen name="index" />
        {/* Pantallas de detalle: se abren por encima de las pestañas, con encabezado y botón "atrás". */}
        <Stack.Screen name="chats" options={{ ...opcionesDetalle, title: 'Buzón de chats', headerRight: () => null }} />
        <Stack.Screen name="eventos/[id]" options={{ ...opcionesDetalle, title: 'Evento' }} />
        <Stack.Screen name="compras/[id]/index" options={{ ...opcionesDetalle, title: 'Mi compra' }} />
        <Stack.Screen name="compras/[id]/chat" options={{ ...opcionesDetalle, title: 'Chat', headerRight: () => null }} />
        <Stack.Screen name="gestion/[id]" options={{ ...opcionesDetalle, title: 'Gestión del evento' }} />
      </Stack.Protected>

      <Stack.Protected guard={rol === 'comprador'} redirectTo="/">
        <Stack.Screen name="comprador" />
      </Stack.Protected>

      <Stack.Protected guard={rol === 'organizador'} redirectTo="/">
        <Stack.Screen name="organizador" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts(mapaFuentes);
  const listo = fuentesCargadas || Boolean(errorFuentes);

  useEffect(() => {
    if (listo) {
      SplashScreen.hideAsync();
    }
  }, [listo]);

  if (!listo) {
    return null;
  }

  return (
    <SesionProvider>
      <StatusBar style="light" />
      <Navegacion />
    </SesionProvider>
  );
}
