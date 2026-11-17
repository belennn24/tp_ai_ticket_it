import { Tabs } from 'expo-router/js-tabs';

import { iconoPestania as icono } from '@/components/sesion/IconoPestania';
import { useOpcionesPestanias } from '@/components/sesion/useOpcionesPestanias';

export default function PestaniasComprador() {
  const opcionesPestanias = useOpcionesPestanias();

  return (
    <Tabs screenOptions={opcionesPestanias}>
      <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: icono('compass') }} />
      <Tabs.Screen name="compras" options={{ title: 'Mis compras', tabBarLabel: 'Compras', tabBarIcon: icono('ticket') }} />
      <Tabs.Screen name="favoritos" options={{ title: 'Favoritos', tabBarIcon: icono('heart') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person') }} />
    </Tabs>
  );
}
