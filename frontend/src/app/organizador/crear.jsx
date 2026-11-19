import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listarCategorias } from '@/api/categorias';
import { crearEvento } from '@/api/eventos';
import { Boton, Cargando, Chip, Input, Pantalla } from '@/components/ui';
import { useConsulta } from '@/hooks/useConsulta';
import { ALTO_TACTIL, colores, degrades, espacios, fuentes, radios, tamanios } from '@/theme';

function obtenerFechaManiana() {
  const maniana = new Date();
  maniana.setDate(maniana.getDate() + 7);
  const anio = maniana.getFullYear();
  const mes = String(maniana.getMonth() + 1).padStart(2, '0');
  const dia = String(maniana.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export default function CrearEvento() {
  const router = useRouter();
  const categorias = useConsulta(listarCategorias);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaManiana);
  const [hora, setHora] = useState('21:00');
  const [ubicacionNombre, setUbicacionNombre] = useState('');
  const [ubicacionDireccion, setUbicacionDireccion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  const [tiposEntrada, setTiposEntrada] = useState([
    { id: 1, nombre: 'General', precio: '15000', cupo: '100', descripcion: 'Acceso general' },
  ]);

  const [errores, setErrores] = useState({});
  const [creando, setCreando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  // Seleccionar la primera categoría por defecto cuando cargan
  if (!categoriaId && categorias.datos && categorias.datos.length > 0) {
    setCategoriaId(categorias.datos[0].id);
  }

  const agregarTipoEntrada = () => {
    setTiposEntrada((actuales) => [
      ...actuales,
      {
        id: Date.now(),
        nombre: '',
        precio: '',
        cupo: '',
        descripcion: '',
      },
    ]);
  };

  const eliminarTipoEntrada = (id) => {
    if (tiposEntrada.length <= 1) return;
    setTiposEntrada((actuales) => actuales.filter((t) => t.id !== id));
  };

  const actualizarTipoEntrada = (id, campo, valor) => {
    setTiposEntrada((actuales) =>
      actuales.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)),
    );
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre del evento es obligatorio.';
    }

    if (!categoriaId) {
      nuevosErrores.categoria = 'Debés seleccionar una categoría.';
    }

    if (!fecha.trim()) {
      nuevosErrores.fecha = 'La fecha es obligatoria (formato AAAA-MM-DD).';
    } else {
      const parsedFecha = Date.parse(`${fecha}T${hora || '00:00'}:00`);
      if (isNaN(parsedFecha)) {
        nuevosErrores.fecha = 'El formato de fecha o hora es inválido.';
      } else if (parsedFecha < Date.now()) {
        nuevosErrores.fecha = 'La fecha del evento debe ser a futuro.';
      }
    }

    if (!tiposEntrada.length) {
      nuevosErrores.tiposEntrada = 'Debe incluir al menos un tipo de entrada.';
    } else {
      tiposEntrada.forEach((tipo, index) => {
        if (!tipo.nombre.trim()) {
          nuevosErrores[`tipo_${index}_nombre`] = 'Ingresá el nombre de la entrada.';
        }
        const precio = Number(tipo.precio);
        if (isNaN(precio) || precio <= 0) {
          nuevosErrores[`tipo_${index}_precio`] = 'Precio mayor a 0.';
        }
        const cupo = Number(tipo.cupo);
        if (isNaN(cupo) || !Number.isInteger(cupo) || cupo <= 0) {
          nuevosErrores[`tipo_${index}_cupo`] = 'Cupo entero mayor a 0.';
        }
      });
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarEvento = async () => {
    if (!validarFormulario()) return;

    setErrorEnvio(null);
    setCreando(true);

    try {
      const fechaIso = new Date(`${fecha}T${hora}:00`).toISOString();

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaId,
        fecha: fechaIso,
        tiposEntrada: tiposEntrada.map((t) => ({
          nombre: t.nombre.trim(),
          precio: Number(t.precio),
          cupo: Number(t.cupo),
          descripcion: t.descripcion ? t.descripcion.trim() : '',
        })),
        multimedia: imagenUrl.trim() ? [imagenUrl.trim()] : [],
        ubicacion: ubicacionNombre.trim()
          ? {
              nombre: ubicacionNombre.trim(),
              direccion: ubicacionDireccion.trim(),
              tipo: 'lugar',
              latitud: -34.6037,
              longitud: -58.3816,
            }
          : null,
      };

      await crearEvento(payload);

      Alert.alert('¡Evento publicado!', 'El evento se ha creado con éxito.', [
        {
          text: 'Aceptar',
          onPress: () => router.replace('/organizador/eventos'),
        },
      ]);
    } catch (e) {
      setErrorEnvio(e.message || 'Error al publicar el evento.');
    } finally {
      setCreando(false);
    }
  };

  if (categorias.cargando && !categorias.datos) {
    return (
      <Pantalla titulo="Crear evento">
        <Cargando />
      </Pantalla>
    );
  }

  const verticalOffset = Platform.OS === 'ios' ? 90 : 80;

  return (
    <Pantalla titulo="Crear evento">
      <KeyboardAvoidingView
        style={estilos.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalOffset}>
        <ScrollView
          style={estilos.contenedor}
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled">
          {errorEnvio ? (
            <View style={estilos.bannerError}>
              <Ionicons name="alert-circle" size={20} color={colores.error} />
              <Text style={estilos.textoErrorEnvio}>{errorEnvio}</Text>
            </View>
          ) : null}

          {/* Sección 1: Información básica */}
          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Información básica</Text>

            <Input
              etiqueta="Nombre del evento *"
              placeholder="Ej: Festival de Primavera 2026"
              value={nombre}
              onChangeText={setNombre}
              error={errores.nombre}
            />

            <Input
              etiqueta="Descripción"
              placeholder="Detalles sobre el espectáculo, artistas o cronograma..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={3}
              style={estilos.inputArea}
            />

            <View style={estilos.campoSelector}>
              <Text style={estilos.etiquetaCampo}>Categoría *</Text>
              <View style={estilos.filaChips}>
                {(categorias.datos ?? []).map((cat) => {
                  const seleccionada = categoriaId === cat.id;
                  return (
                    <Chip
                      key={cat.id}
                      etiqueta={cat.nombre}
                      seleccionado={seleccionada}
                      onPress={() => setCategoriaId(cat.id)}
                    />
                  );
                })}
              </View>
              {errores.categoria ? (
                <Text style={estilos.textoError}>{errores.categoria}</Text>
              ) : null}
            </View>

            <View style={estilos.filaDoble}>
              <View style={estilos.columnaDoble}>
                <Input
                  etiqueta="Fecha (AAAA-MM-DD) *"
                  placeholder="2026-12-20"
                  value={fecha}
                  onChangeText={setFecha}
                  error={errores.fecha}
                />
              </View>
              <View style={estilos.columnaDoble}>
                <Input
                  etiqueta="Hora (HH:mm) *"
                  placeholder="21:00"
                  value={hora}
                  onChangeText={setHora}
                />
              </View>
            </View>
          </View>

          {/* Sección 2: Ubicación e imagen */}
          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Lugar y multimedia</Text>

            <Input
              etiqueta="Nombre del lugar"
              placeholder="Ej: Estadio Movistar Arena"
              value={ubicacionNombre}
              onChangeText={setUbicacionNombre}
            />

            <Input
              etiqueta="Dirección"
              placeholder="Ej: Humboldt 450, CABA"
              value={ubicacionDireccion}
              onChangeText={setUbicacionDireccion}
            />

            <Input
              etiqueta="URL de la portada / imagen"
              placeholder="https://..."
              value={imagenUrl}
              onChangeText={setImagenUrl}
            />
          </View>

          {/* Sección 3: Tipos de entrada */}
          <View style={estilos.seccion}>
            <View style={estilos.cabeceraEntradas}>
              <View>
                <Text style={estilos.tituloSeccion}>Tipos de entrada *</Text>
                <Text style={estilos.subtituloSeccion}>
                  Definí los cupos y precios de las localidades
                </Text>
              </View>
            </View>

            {errores.tiposEntrada ? (
              <Text style={estilos.textoError}>{errores.tiposEntrada}</Text>
            ) : null}

            {tiposEntrada.map((tipo, idx) => (
              <View key={tipo.id} style={estilos.tarjetaTipoEntrada}>
                <View style={estilos.cabeceraTipo}>
                  <Text style={estilos.numeroTipo}>Entrada #{idx + 1}</Text>
                  {tiposEntrada.length > 1 ? (
                    <Pressable
                      onPress={() => eliminarTipoEntrada(tipo.id)}
                      accessibilityLabel="Eliminar tipo de entrada">
                      <Ionicons name="trash-outline" size={20} color={colores.error} />
                    </Pressable>
                  ) : null}
                </View>

                <Input
                  etiqueta="Nombre de la entrada *"
                  placeholder="Ej: General, VIP, Platea"
                  value={tipo.nombre}
                  onChangeText={(val) => actualizarTipoEntrada(tipo.id, 'nombre', val)}
                  error={errores[`tipo_${idx}_nombre`]}
                />

                <View style={estilos.filaDoble}>
                  <View style={estilos.columnaDoble}>
                    <Input
                      etiqueta="Precio ($) *"
                      placeholder="15000"
                      keyboardType="numeric"
                      value={tipo.precio}
                      onChangeText={(val) => actualizarTipoEntrada(tipo.id, 'precio', val)}
                      error={errores[`tipo_${idx}_precio`]}
                    />
                  </View>
                  <View style={estilos.columnaDoble}>
                    <Input
                      etiqueta="Cupo total *"
                      placeholder="100"
                      keyboardType="numeric"
                      value={tipo.cupo}
                      onChangeText={(val) => actualizarTipoEntrada(tipo.id, 'cupo', val)}
                      error={errores[`tipo_${idx}_cupo`]}
                    />
                  </View>
                </View>

                <Input
                  etiqueta="Descripción corta"
                  placeholder="Ej: Incluye acceso exclusivo..."
                  value={tipo.descripcion}
                  onChangeText={(val) => actualizarTipoEntrada(tipo.id, 'descripcion', val)}
                />
              </View>
            ))}

            <Boton
              titulo="Agregar otro tipo de entrada"
              variante="secundario"
              icono={<Ionicons name="add" size={18} color={colores.texto} />}
              onPress={agregarTipoEntrada}
            />
          </View>

          {/* Botón de publicación */}
          <View style={estilos.seccionBoton}>
            <Boton
              titulo="Publicar evento"
              cargando={creando}
              onPress={guardarEvento}
              icono={<Ionicons name="checkmark-circle" size={20} color={colores.sobreVioleta} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenido: {
    padding: espacios.xl,
    paddingBottom: espacios.xxl * 2,
    gap: espacios.xl,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    backgroundColor: 'rgba(252, 165, 165, 0.15)',
    borderWidth: 1,
    borderColor: colores.error,
    padding: espacios.md,
    borderRadius: radios.card,
  },
  textoErrorEnvio: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.error,
  },
  seccion: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacios.lg,
    gap: espacios.md,
  },
  tituloSeccion: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  subtituloSeccion: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  campoSelector: {
    gap: espacios.xs,
  },
  etiquetaCampo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacios.xs,
    marginTop: 4,
  },
  filaDoble: {
    flexDirection: 'row',
    gap: espacios.md,
  },
  columnaDoble: {
    flex: 1,
  },
  inputArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: espacios.sm,
  },
  cabeceraEntradas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tarjetaTipoEntrada: {
    backgroundColor: colores.fondoAlt,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    padding: espacios.md,
    gap: espacios.sm,
  },
  cabeceraTipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numeroTipo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.sm,
    color: colores.primario,
  },
  textoError: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.error,
  },
  seccionBoton: {
    marginTop: espacios.sm,
  },
});
