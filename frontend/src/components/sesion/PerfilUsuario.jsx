import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Boton, Input, Pantalla } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';

const NOMBRE_ROL = {
  comprador: 'Comprador',
  organizador: 'Organizador',
};

// Datos del usuario autenticado, edición de nombre y cierre de sesión. Lo usan ambos roles.
export function PerfilUsuario() {
  const { usuario, cerrarSesion, actualizarPerfil } = useSesion();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (!usuario) return null;

  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
  const iniciales = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .map((parte) => parte[0].toUpperCase())
    .join('');

  const abrirEdicion = () => {
    setNombre(usuario.nombre ?? '');
    setApellido(usuario.apellido ?? '');
    setError(null);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setError(null);
  };

  const guardarNombre = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await actualizarPerfil({
        nombre: nombreLimpio,
        apellido: apellido.trim(),
      });
      setEditando(false);
    } catch (err) {
      setError(err?.message ?? 'No se pudo actualizar el nombre.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla titulo="Perfil">
      <View style={estilos.contenido}>
        <View style={estilos.tarjeta}>
          {/* Avatar decorativo: el nombre completo ya está escrito debajo. */}
          <LinearGradient
            colors={degrades.primario}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={estilos.avatar}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden>
            <Text style={estilos.iniciales}>{iniciales}</Text>
          </LinearGradient>
          <View style={estilos.insignia}>
            <Text style={estilos.textoInsignia}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Text>
          </View>
          <Text style={estilos.nombre}>{nombreCompleto}</Text>
          <Text style={estilos.email}>{usuario.email}</Text>

          {editando ? (
            <View style={estilos.formularioEdicion}>
              <Input
                etiqueta="Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                autoCapitalize="words"
                returnKeyType="next"
              />
              <Input
                etiqueta="Apellido"
                value={apellido}
                onChangeText={setApellido}
                placeholder="Tu apellido (opcional)"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={guardarNombre}
              />
              {error ? <Text style={estilos.error} accessibilityRole="alert">{error}</Text> : null}
              <View style={estilos.accionesEdicion}>
                <Boton
                  titulo="Cancelar"
                  variante="secundario"
                  onPress={cancelarEdicion}
                  deshabilitado={guardando}
                  style={estilos.botonMitad}
                />
                <Boton
                  titulo="Guardar"
                  onPress={guardarNombre}
                  cargando={guardando}
                  style={estilos.botonMitad}
                />
              </View>
            </View>
          ) : (
            <Boton
              titulo="Editar nombre"
              variante="secundario"
              onPress={abrirEdicion}
              icono={<Ionicons name="pencil-outline" size={18} color={colores.texto} />}
              style={estilos.botonEditar}
            />
          )}
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacios.sm,
  },
  iniciales: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xl,
    color: colores.sobreVioleta,
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
  botonEditar: {
    marginTop: espacios.md,
  },
  formularioEdicion: {
    marginTop: espacios.md,
    gap: espacios.md,
  },
  accionesEdicion: {
    flexDirection: 'row',
    gap: espacios.md,
  },
  botonMitad: {
    flex: 1,
  },
  error: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.error,
  },
});
