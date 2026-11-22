import { Redirect } from 'expo-router';

import { Boton, EstadoVacio, Pantalla } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';

// Punto de entrada con sesión iniciada: deriva a las pestañas según el rol.
const INICIO_POR_ROL = {
  comprador: '/comprador/explorar',
  organizador: '/organizador/eventos',
};

export default function Inicio() {
  const { rol, cerrarSesion } = useSesion();
  const destino = INICIO_POR_ROL[rol];

  if (destino) {
    return <Redirect href={destino} />;
  }

  // Respaldo por si la sesión trajera un rol sin pantallas en la app.
  return (
    <Pantalla bordes={['top', 'bottom']}>
      <EstadoVacio
        icono="lock-closed-outline"
        titulo="Rol sin acceso a la app"
        descripcion={`El rol "${rol}" no tiene pantallas disponibles. Ingresá como comprador u organizador.`}
        accion={<Boton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />}
      />
    </Pantalla>
  );
}
