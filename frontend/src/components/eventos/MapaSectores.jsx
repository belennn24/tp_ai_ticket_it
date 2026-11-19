import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espacios, fuentes, radios, tamanios } from '@/theme';
import { formatearPrecio } from '@/utils/formato';

const TITULO_ESCENARIO = {
  estadio: 'ESCENARIO PRINCIPAL',
  arena: 'ESCENARIO CENTRAL',
  teatro: 'ESCENARIO · TELÓN',
  club: 'ESCENARIO · BARRA',
  centro_convenciones: 'AUDITORIO PRINCIPAL',
  centro_cultural: 'ESCENARIO / SALA',
  predio: 'ESCENARIO FESTIVAL',
};

// Clasifica visualmente cada tipo de entrada para ubicarlo en el plano del lugar
// (cerca del escenario vs. platea/general/laterales).
function prioridadSector(tipo) {
  const nombre = (tipo.nombre ?? '').toLowerCase();
  if (nombre.includes('vip') || nombre.includes('backstage') || nombre.includes('soundcheck') || nombre.includes('mesa')) {
    return 0;
  }
  if (nombre.includes('delantero') || nombre.includes('campo') || nombre.includes('comfort') || nombre.includes('workshop') || nombre.includes('training')) {
    return 1;
  }
  if (nombre.includes('platea') || nombre.includes('full')) {
    return 2;
  }
  return 3;
}

// Mapa interactivo de sectores del lugar (estadio, teatro, predio, auditorio, etc.).
// Muestra cada `tipoEntrada` como un sector seleccionable con su cupo disponible.
export function MapaSectores({ tiposEntrada = [], tipoUbicacion, seleccionadoId, deshabilitado = false, onSeleccionar }) {
  if (!tiposEntrada.length) return null;

  const ordenados = [...tiposEntrada].sort((a, b) => prioridadSector(a) - prioridadSector(b));
  const esEstadioOPlaza = tipoUbicacion === 'estadio' || tipoUbicacion === 'arena' || tipoUbicacion === 'predio';
  const tituloEscenario = TITULO_ESCENARIO[tipoUbicacion] ?? 'ESCENARIO';

  // El primer sector (más cercano/exclusivo) ocupa la fila frontal completa;
  // si hay 3 o más, los siguientes se distribuyen en grilla de 2 columnas.
  const frontal = ordenados[0];
  const resto = ordenados.slice(1);

  const renderSector = (tipo, esFrontal = false) => {
    const agotado = tipo.cupo <= 0;
    const seleccionado = tipo.id === seleccionadoId;
    const bloqueado = deshabilitado || agotado;

    return (
      <Pressable
        key={tipo.id}
        accessibilityRole="button"
        accessibilityState={{ selected: seleccionado, disabled: bloqueado }}
        accessibilityLabel={`Sector ${tipo.nombre}, ${formatearPrecio(tipo.precio)}, ${agotado ? 'agotado' : `${tipo.cupo} disponibles`}`}
        disabled={bloqueado}
        onPress={() => onSeleccionar(tipo.id)}
        style={[
          estilos.sector,
          esFrontal && estilos.sectorFrontal,
          esEstadioOPlaza && esFrontal && estilos.sectorCurvo,
          seleccionado && estilos.sectorSeleccionado,
          agotado && estilos.sectorAgotado,
        ]}>
        <View style={estilos.sectorCabecera}>
          <Text
            style={[
              estilos.nombreSector,
              seleccionado && estilos.textoSeleccionado,
              agotado && estilos.textoAgotado,
            ]}
            numberOfLines={1}>
            {tipo.nombre}
          </Text>
          {seleccionado ? <Ionicons name="checkmark-circle" size={16} color={colores.primario} /> : null}
        </View>
        <View style={estilos.sectorPie}>
          <Text style={[estilos.precioSector, agotado && estilos.textoAgotado]}>
            {formatearPrecio(tipo.precio)}
          </Text>
          <Text style={[estilos.cupoSector, agotado && estilos.cupoAgotado]}>
            {agotado ? 'Agotado' : `${tipo.cupo} disp.`}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={estilos.contenedor}>
      {/* Escenario */}
      <View style={[estilos.escenario, esEstadioOPlaza && estilos.escenarioCurvo]}>
        <Ionicons name="musical-notes-outline" size={14} color={colores.sobreVioleta} />
        <Text style={estilos.textoEscenario}>{tituloEscenario}</Text>
      </View>

      {/* Sectores */}
      <View style={estilos.plano}>
        {renderSector(frontal, true)}
        {resto.length > 0 ? (
          <View style={estilos.grillaResto}>
            {resto.map((t) => (
              <View key={t.id} style={resto.length === 1 ? estilos.columnaCompleta : estilos.columnaMedia}>
                {renderSector(t, false)}
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Leyenda */}
      <View style={estilos.leyenda}>
        <View style={estilos.itemLeyenda}>
          <View style={[estilos.muestra, estilos.muestraDisponible]} />
          <Text style={estilos.textoLeyenda}>Disponible</Text>
        </View>
        <View style={estilos.itemLeyenda}>
          <View style={[estilos.muestra, estilos.muestraSeleccionado]} />
          <Text style={estilos.textoLeyenda}>Seleccionado</Text>
        </View>
        <View style={estilos.itemLeyenda}>
          <View style={[estilos.muestra, estilos.muestraAgotado]} />
          <Text style={estilos.textoLeyenda}>Agotado</Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: radios.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: '#130D2B',
    padding: espacios.lg,
    gap: espacios.md,
  },
  escenario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.xs,
    paddingVertical: espacios.sm,
    borderRadius: radios.input,
    backgroundColor: '#6D28D9',
  },
  escenarioCurvo: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginHorizontal: espacios.lg,
  },
  textoEscenario: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
    color: colores.sobreVioleta,
    letterSpacing: 1,
  },
  plano: {
    gap: espacios.sm,
  },
  grillaResto: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacios.sm,
  },
  columnaMedia: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  columnaCompleta: {
    flex: 1,
  },
  sector: {
    minHeight: 60,
    padding: espacios.md,
    borderRadius: radios.input,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.tarjeta,
    justifyContent: 'space-between',
    gap: espacios.xs,
  },
  sectorFrontal: {
    minHeight: 64,
  },
  sectorCurvo: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectorSeleccionado: {
    borderColor: colores.primario,
    borderWidth: 2,
    backgroundColor: colores.tarjetaElevada,
  },
  sectorAgotado: {
    opacity: 0.45,
    backgroundColor: colores.fondoAlt,
  },
  sectorCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.xs,
  },
  nombreSector: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  textoSeleccionado: {
    color: colores.primario,
  },
  textoAgotado: {
    color: colores.textoAtenuado,
  },
  sectorPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.xs,
  },
  precioSector: {
    fontFamily: fuentes.monoBold,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
  cupoSector: {
    fontFamily: fuentes.mono,
    fontSize: tamanios.xs,
    color: colores.exito,
  },
  cupoAgotado: {
    color: colores.error,
  },
  leyenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: espacios.lg,
    paddingTop: espacios.xs,
  },
  itemLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muestra: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
  },
  muestraDisponible: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.bordeControl,
  },
  muestraSeleccionado: {
    backgroundColor: colores.tarjetaElevada,
    borderColor: colores.primario,
    borderWidth: 2,
  },
  muestraAgotado: {
    backgroundColor: colores.fondoAlt,
    borderColor: colores.borde,
    opacity: 0.5,
  },
  textoLeyenda: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoSecundario,
  },
});
