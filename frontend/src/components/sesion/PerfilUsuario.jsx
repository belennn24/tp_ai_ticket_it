import { StyleSheet, Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';

const NOMBRE_ROL = {
  comprador: 'Comprador',
  organizador: 'Organizador',
};

// Datos del usuario autenticado y cierre de sesión. Lo usan ambos roles.
export function PerfilUsuario() {
  const { usuario, cerrarSesion } = useSesion();
  if (!usuario) return null;

  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');

  return (
    <Pantalla titulo="Perfil">
      <View style={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <View style={estilos.insignia}>
            <Text style={estilos.textoInsignia}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Text>
          </View>
          <Text style={estilos.nombre}>{nombreCompleto}</Text>
          <Text style={estilos.email}>{usuario.email}</Text>
        </View>

        <Boton titulo="Cerrar sesión" variante="peligro" onPress={cerrarSesion} />
      </View>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    flex: 1,
    paddingHorizontal: espacios.xl,
    gap: espacios.xl,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: radios.tarjeta,
    padding: espacios.xl,
    gap: espacios.sm,
  },
  insignia: {
    alignSelf: 'flex-start',
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    borderRadius: radios.pildora,
    borderWidth: 1,
    borderColor: colores.insigniaBorde,
    backgroundColor: colores.insigniaFondo,
  },
  textoInsignia: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
    color: colores.primario,
  },
  nombre: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xl,
    color: colores.texto,
  },
  email: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
});
