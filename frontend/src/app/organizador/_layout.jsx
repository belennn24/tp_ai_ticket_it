import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useOpcionesPestanias } from '@/components/sesion/useOpcionesPestanias';

const icono = (nombre) =>
  function IconoPestania({ color, size }) {
    return <Ionicons name={nombre} color={color} size={size} />;
  };

export default function PestaniasOrganizador() {
  const opcionesPestanias = useOpcionesPestanias();

  return (
    <Tabs screenOptions={opcionesPestanias}>
      <Tabs.Screen name="eventos" options={{ title: 'Mis eventos', tabBarIcon: icono('calendar-outline') }} />
      <Tabs.Screen name="crear" options={{ title: 'Crear evento', tabBarIcon: icono('add-circle-outline') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person-outline') }} />
    </Tabs>
  );
}
