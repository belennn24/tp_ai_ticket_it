import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { confirmarPagoCompra, registrarReembolsoCompra, utilizarCompra } from '@/api/compras';
import { obtenerComprasDeEvento, obtenerEvento } from '@/api/eventos';
import { FilaChips } from '@/components/eventos/FilaChips';
import {
  Boton,
  EstadoBadge,
  EstadoConsulta,
  EstadoVacio,
  FondoConBrillo,
} from '@/components/ui';
import { useConsulta } from '@/hooks/useConsulta';
import {
  colores,
  espacios,
  fuentes,
  radios,
  tamanios,
} from '@/theme';
import { confirmar } from '@/utils/dialogos';
import {
  codigoCompra,
  formatearFecha,
  formatearFechaCorta,
  formatearPrecio,
  nombreCompleto,
} from '@/utils/formato';

const FILTROS = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes de pago' },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmadas' },
  { valor: 'UTILIZADA', etiqueta: 'Utilizadas' },
  { valor: 'CANCELADA', etiqueta: 'Canceladas' },
  { valor: 'REEMBOLSADA', etiqueta: 'Reembolsadas' },
];

// Lo que el organizador registra en cada estado. El pago y la devolución se coordinan
// por fuera de la app (por ejemplo, por el chat): acá solo se deja constancia.
const ACCIONES_POR_ESTADO = {
  PENDIENTE: {
    titulo: 'Confirmar pago',
    icono: 'card-outline',
    ejecutar: confirmarPagoCompra,
    pregunta: (nombre) => `¿Recibiste el pago de ${nombre}? La compra quedará CONFIRMADA y su entrada, lista para usar.`,
    error: 'No se pudo confirmar el pago.',
  },
  CONFIRMADA: {
    titulo: 'Validar ingreso',
    icono: 'checkmark-done',
    ejecutar: utilizarCompra,
    pregunta: (nombre) => `¿Deseás validar el ingreso de ${nombre}? La entrada quedará marcada como UTILIZADA.`,
    error: 'Error al validar la entrada.',
  },
  CANCELADA: {
    titulo: 'Registrar reembolso',
    icono: 'cash-outline',
    ejecutar: registrarReembolsoCompra,
    pregunta: (nombre) => `¿Ya le devolviste el dinero a ${nombre}? La compra quedará REEMBOLSADA.`,
    error: 'No se pudo registrar el reembolso.',
  },
};

export default function GestionEvento() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [filtro, setFiltro] = useState('todas');
  const [procesandoId, setProcesandoId] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const consultaCompras = useConsulta(() => obtenerComprasDeEvento(id), id);
  const consultaEvento = useConsulta(() => obtenerEvento(id), id);

  const datosCompras = consultaCompras.datos;
  const evento = consultaEvento.datos;

  const recargarTodo = async () => {
    await Promise.all([consultaCompras.recargar(), consultaEvento.recargar()]);
  };

  const balance = datosCompras?.balanceCupos ?? [];
  const compras = datosCompras?.compras ?? [];

  const comprasFiltradas = compras.filter((c) => {
    if (filtro === 'todas') return true;
    return c.estado === filtro;
  });

  const totalEntradasVendidas = balance.reduce((acc, b) => acc + (b.entradasVendidas ?? 0), 0);
  const totalEntradasReservadas = balance.reduce((acc, b) => acc + (b.entradasReservadas ?? 0), 0);
  const totalCupoDisponible = balance.reduce((acc, b) => acc + (b.cupoDisponible ?? 0), 0);
  const totalRecaudado = compras
    .filter((c) => c.estado === 'CONFIRMADA' || c.estado === 'UTILIZADA')
    .reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const ejecutarAccion = async (compra, accion) => {
    const compradorNombre = nombreCompleto(compra.comprador) || 'este comprador';
    const confirmado = await confirmar({
      titulo: accion.titulo,
      mensaje: accion.pregunta(compradorNombre),
      textoConfirmar: accion.titulo,
      textoCancelar: 'Volver',
    });
    if (!confirmado) return;

    setErrorAccion(null);
    setProcesandoId(compra.id);
    try {
      await accion.ejecutar(compra.id);
      await recargarTodo();
    } catch (e) {
      setErrorAccion(e.message || accion.error);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <EstadoConsulta
      consultas={[consultaCompras, consultaEvento]}
      tituloError="No se pudo cargar la gestión"
      onReintentar={recargarTodo}>
      <FondoConBrillo>
      <FlatList
        data={comprasFiltradas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={estilos.lista}
        refreshControl={
          <RefreshControl
            refreshing={consultaCompras.recargando}
            onRefresh={recargarTodo}
            tintColor={colores.primario}
          />
        }
        ListHeaderComponent={
          <View style={estilos.cabeceraPrincipal}>
            {/* Título del evento e info */}
            <View style={estilos.tarjetaEvento}>
              <Text style={estilos.tituloEvento}>{evento?.nombre ?? 'Gestión del evento'}</Text>
              {evento?.fecha ? (
                <View style={estilos.filaIcono}>
                  <Ionicons name="calendar-outline" size={16} color={colores.acentoFecha} />
                  <Text style={estilos.textoSecundario}>{formatearFecha(evento.fecha)}</Text>
                </View>
              ) : null}
              {evento?.ubicacion?.nombre ? (
                <View style={estilos.filaIcono}>
                  <Ionicons name="location-outline" size={16} color={colores.primario} />
                  <Text style={estilos.textoSecundario}>{evento.ubicacion.nombre}</Text>
                </View>
              ) : null}
            </View>

            {/* Métricas clave */}
            <View style={estilos.filaMetricas}>
              <View style={estilos.tarjetaMetrica}>
                <Text style={estilos.etiquetaMetrica}>VENDIDAS</Text>
                <Text style={estilos.valorMetrica}>{totalEntradasVendidas}</Text>
              </View>
              <View style={estilos.tarjetaMetrica}>
                <Text style={estilos.etiquetaMetrica}>RESERVADAS</Text>
                <Text style={estilos.valorMetrica}>{totalEntradasReservadas}</Text>
              </View>
              <View style={estilos.tarjetaMetrica}>
                <Text style={estilos.etiquetaMetrica}>DISPONIBLES</Text>
                <Text style={estilos.valorMetrica}>{totalCupoDisponible}</Text>
              </View>
              <View style={estilos.tarjetaMetrica}>
                <Text style={estilos.etiquetaMetrica}>RECAUDACIÓN</Text>
                <Text style={[estilos.valorMetrica, estilos.valorDorado]}>
                  {formatearPrecio(totalRecaudado)}
                </Text>
              </View>
            </View>

            {/* Balance detallado de cupos por tipo de entrada */}
            <View style={estilos.seccionBalance}>
              <Text style={estilos.subtitulo}>Balance de cupos</Text>
              {balance.map((item) => {
                const total = item.cupoTotal ?? item.cupo ?? 0;
                const vendidas = item.entradasVendidas ?? 0;
                const disponibles = item.cupoDisponible ?? 0;
                const reservadas = item.entradasReservadas ?? 0;
                const porcentaje = total > 0 ? Math.min(100, Math.round((vendidas / total) * 100)) : 0;

                return (
                  <View key={item.id || item.nombre} style={estilos.filaBalance}>
                    <View style={estilos.encabezadoTipo}>
                      <Text style={estilos.nombreTipo}>{item.nombre}</Text>
                      <Text style={estilos.cifraTipo}>
                        {vendidas} / {total} ({porcentaje}%)
                      </Text>
                    </View>

                    <View style={estilos.barraProgresoFondo}>
                      <View style={[estilos.barraProgresoRelleno, { width: `${porcentaje}%` }]} />
                    </View>

                    <Text style={estilos.detalleCupos}>
                      {disponibles === 0 ? 'Agotado' : `${disponibles} restantes`}
                      {reservadas > 0 ? ` · ${reservadas} reservadas pendientes de pago` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            {errorAccion ? (
              <View style={estilos.bannerError}>
                <Ionicons name="alert-circle" size={18} color={colores.error} />
                <Text style={estilos.textoError}>{errorAccion}</Text>
              </View>
            ) : null}

            {/* Filtros de compras */}
            <View style={estilos.seccionComprasHeader}>
              <Text style={estilos.subtitulo}>
                Compras realizadas ({compras.length})
              </Text>
              <FilaChips opciones={FILTROS} seleccionado={filtro} onSeleccionar={setFiltro} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacioContainer}>
            <EstadoVacio
              icono="receipt-outline"
              titulo="No hay compras registradas"
              descripcion={
                filtro === 'todas'
                  ? 'Aún no se han registrado compras para este evento.'
                  : 'No se encontraron compras con el estado seleccionado.'
              }
            />
          </View>
        }
        renderItem={({ item: compra }) => {
          const comprador = compra.comprador;
          const nombre = nombreCompleto(comprador) || comprador?.email || 'Comprador';
          const codigo = codigoCompra(compra);
          // Una compra cancelada antes de confirmar el pago no tiene nada que reembolsar.
          const sinReembolso = compra.estado === 'CANCELADA' && !compra.pagoConfirmado;
          const accion = sinReembolso ? null : ACCIONES_POR_ESTADO[compra.estado];
          const procesando = procesandoId === compra.id;
          const tieneMensajes = compra.mensajes && compra.mensajes.length > 0;

          return (
            <View style={estilos.tarjetaCompra}>
              <View style={estilos.cabeceraCompra}>
                <View style={estilos.infoComprador}>
                  <Text style={estilos.nombreComprador}>{nombre}</Text>
                  {comprador?.email ? (
                    <Text style={estilos.emailComprador}>{comprador.email}</Text>
                  ) : null}
                  {codigo ? <Text style={estilos.codigoCompra}>{codigo}</Text> : null}
                </View>
                <EstadoBadge estado={compra.estado} />
              </View>

              <View style={estilos.detalleCompraRow}>
                <View>
                  <Text style={estilos.etiquetaGris}>ENTRADA</Text>
                  <Text style={estilos.valorDetalle}>
                    {compra.cantidad} × {compra.tipoEntrada?.nombre ?? 'General'}
                  </Text>
                </View>

                <View>
                  <Text style={estilos.etiquetaGris}>TOTAL</Text>
                  <Text style={estilos.montoCompra}>{formatearPrecio(compra.total)}</Text>
                </View>

                {compra.fechaCompra ? (
                  <View>
                    <Text style={estilos.etiquetaGris}>FECHA</Text>
                    <Text style={estilos.valorDetalle}>
                      {formatearFechaCorta(compra.fechaCompra)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={estilos.accionesCompra}>
                {accion ? (
                  <Boton
                    titulo={accion.titulo}
                    icono={<Ionicons name={accion.icono} size={18} color={colores.sobreVioleta} />}
                    cargando={procesando}
                    onPress={() => ejecutarAccion(compra, accion)}
                    style={estilos.botonAccion}
                  />
                ) : null}

                <Boton
                  titulo={tieneMensajes ? `Chat (${compra.mensajes.length})` : 'Abrir chat'}
                  variante="secundario"
                  icono={<Ionicons name="chatbubble-outline" size={16} color={colores.texto} />}
                  onPress={() => router.push(`/compras/${compra.id}/chat`)}
                  style={estilos.botonChat}
                />
              </View>
            </View>
          );
        }}
      />
    </FondoConBrillo>
    </EstadoConsulta>
  );
}

const estilos = StyleSheet.create({
  lista: {
    padding: espacios.xl,
    paddingBottom: espacios.xxl * 2,
    gap: espacios.md,
  },
  cabeceraPrincipal: {
    gap: espacios.lg,
    marginBottom: espacios.md,
  },
  tarjetaEvento: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacios.lg,
    gap: espacios.xs,
  },
  tituloEvento: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.lg,
    color: colores.texto,
    marginBottom: 4,
  },
  filaIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
  },
  textoSecundario: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.textoSecundario,
  },
  filaMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacios.sm,
  },
  tarjetaMetrica: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colores.tarjetaAlta,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacios.md,
    alignItems: 'center',
    gap: 4,
  },
  etiquetaMetrica: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs - 2,
    color: colores.textoAtenuado,
    letterSpacing: 0.8,
  },
  valorMetrica: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  valorDorado: {
    color: colores.dorado,
  },
  seccionBalance: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacios.lg,
    gap: espacios.md,
  },
  subtitulo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  filaBalance: {
    gap: 6,
    paddingBottom: espacios.xs,
  },
  encabezadoTipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreTipo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.texto,
  },
  cifraTipo: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
    color: colores.primario,
  },
  barraProgresoFondo: {
    height: 8,
    borderRadius: radios.pildora,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: colores.violeta,
    borderRadius: radios.pildora,
  },
  detalleCupos: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
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
  textoError: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanios.sm,
    color: colores.error,
  },
  seccionComprasHeader: {
    gap: espacios.sm,
    marginTop: espacios.xs,
  },
  vacioContainer: {
    paddingVertical: espacios.xl,
  },
  tarjetaCompra: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.card,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacios.lg,
    gap: espacios.md,
  },
  cabeceraCompra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoComprador: {
    flex: 1,
    gap: 2,
  },
  nombreComprador: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.md,
    color: colores.texto,
  },
  emailComprador: {
    fontFamily: fuentes.regular,
    fontSize: tamanios.xs,
    color: colores.textoAtenuado,
  },
  codigoCompra: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs,
    color: colores.primario,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  detalleCompraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: espacios.sm,
  },
  etiquetaGris: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.xs - 2,
    color: colores.textoAtenuado,
    letterSpacing: 0.8,
  },
  valorDetalle: {
    fontFamily: fuentes.semibold,
    fontSize: tamanios.sm,
    color: colores.texto,
    marginTop: 2,
  },
  montoCompra: {
    fontFamily: fuentes.bold,
    fontSize: tamanios.sm,
    color: colores.dorado,
    marginTop: 2,
  },
  accionesCompra: {
    flexDirection: 'row',
    gap: espacios.sm,
    alignItems: 'center',
  },
  botonAccion: {
    flex: 1,
  },
  botonChat: {
    flex: 1,
  },
});
