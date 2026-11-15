import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, Input } from '@/components/ui';
import { useSesion } from '@/context/SesionContext';
import { colores, espacios, fuentes, radios, tamanios } from '@/theme';

// Usuarios que carga el seed del backend. La contraseña no se guarda en el
// código: si EXPO_PUBLIC_SEED_PASSWORD está definida en .env.local, los botones
// de acceso rápido ingresan directo; si no, solo completan el email.
const USUARIOS_DEMO = [
  { rol: 'comprador', etiqueta: 'Entrar como comprador', email: 'comprador@ticketit.com' },
  { rol: 'organizador', etiqueta: 'Entrar como organizador', email: 'organizador@ticketit.com' },
];
const PASSWORD_DEMO = process.env.EXPO_PUBLIC_SEED_PASSWORD;

export default function Login() {
  const { iniciarSesion, sesionVencida } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enCurso, setEnCurso] = useState(null); // 'formulario' | rol demo | null
  const campoPassword = useRef(null);

  const ingresar = async (emailIngresado, passwordIngresada, origen) => {
    if (!emailIngresado.trim() || !passwordIngresada) {
      setError('Completá el email y la contraseña.');
      return;
    }
    setError(null);
    setEnCurso(origen);
    try {
      await iniciarSesion(emailIngresado, passwordIngresada);
      // Al iniciar sesión, la guardia del layout raíz reemplaza esta pantalla.
    } catch (e) {
      setError(e.message);
      setEnCurso(null);
    }
  };

  const accesoRapido = (usuarioDemo) => {
    setEmail(usuarioDemo.email);
    if (PASSWORD_DEMO) {
      ingresar(usuarioDemo.email, PASSWORD_DEMO, usuarioDemo.rol);
    } else {
      setError(null);
      campoPassword.current?.focus();
    }
  };

  const ocupado = enCurso !== null;

  return (
    <SafeAreaView style={estilos.contenedor}>
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.encabezado}>
            <Text style={estilos.marca}>AI Ticket It</Text>
            <Text style={estilos.bajada}>Tus entradas, en un solo lugar.</Text>
          </View>

          <View style={estilos.tarjeta}>
            {sesionVencida ? <Text style={estilos.aviso}>Tu sesión venció. Volvé a ingresar.</Text> : null}

            <Input
              etiqueta="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@ejemplo.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!ocupado}
              onSubmitEditing={() => campoPassword.current?.focus()}
            />
            <Input
              ref={campoPassword}
              etiqueta="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              editable={!ocupado}
              onSubmitEditing={() => ingresar(email, password, 'formulario')}
            />

            {error ? <Text style={estilos.error}>{error}</Text> : null}

            <Boton
              titulo="Ingresar"
              variante="degradeVioleta"
              cargando={enCurso === 'formulario'}
              deshabilitado={ocupado}
              onPress={() => ingresar(email, password, 'formulario')}
            />
          </View>

          <View style={estilos.demo}>
            <Text style={estilos.tituloDemo}>ACCESO RÁPIDO (DEMO)</Text>
            {USUARIOS_DEMO.map((usuarioDemo) => (
              <Boton
                key={usuarioDemo.rol}
                titulo={usuarioDemo.etiqueta}
                variante="secundario"
                cargando={enCurso === usuarioDemo.rol}
                deshabilitado={ocupado}
                onPress={() => accesoRapido(usuarioDemo)}
              />
            ))}
            {!PASSWORD_DEMO ? (
              <Text style={estilos.ayudaDemo}>Completan el email; la contraseña la escribís vos.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: espacios.xl,
    gap: espacios.xl,
  },
  encabezado: {
    gap: espacios.xs,
  },
  marca: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xxl,
    color: colores.primario,
  },
  bajada: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.md,
    color: colores.textoSecundario,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: radios.tarjeta,
    padding: espacios.xl,
    gap: espacios.lg,
  },
  aviso: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.primario,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.error,
  },
  demo: {
    gap: espacios.md,
  },
  tituloDemo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
    letterSpacing: 1,
  },
  ayudaDemo: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
});
