import { Tabs } from 'expo-router/js-tabs';

import { iconoPestania as icono } from '@/components/sesion/IconoPestania';
import { useOpcionesPestanias } from '@/components/sesion/useOpcionesPestanias';

export default function PestaniasOrganizador() {
  const opcionesPestanias = useOpcionesPestanias();

  return (
    <Tabs screenOptions={opcionesPestanias}>
      <Tabs.Screen name="eventos" options={{ title: 'Mis eventos', tabBarIcon: icono('calendar') }} />
      <Tabs.Screen name="crear" options={{ title: 'Crear evento', tabBarIcon: icono('add-circle') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person') }} />
    </Tabs>
  );
}
