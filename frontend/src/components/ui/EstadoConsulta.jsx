import { Boton } from './Boton';
import { Cargando } from './Cargando';
import { EstadoVacio } from './EstadoVacio';

// Muestra el estado inicial de carga o error de una o más consultas antes de renderizar su contenido.
export function EstadoConsulta({
  consulta,
  consultas,
  tituloError = 'No se pudieron cargar los datos',
  onReintentar,
  children,
}) {
  const lista = consultas ?? (consulta ? [consulta] : []);
  const cargando = lista.some((c) => c?.cargando && !c?.datos);

  if (cargando) {
    return <Cargando />;
  }

  const conError = lista.find((c) => c?.error && !c?.datos);
  if (conError) {
    const reintentar = onReintentar ?? (() => lista.forEach((c) => c?.recargar?.()));
    return (
      <EstadoVacio
        icono="cloud-offline-outline"
        titulo={tituloError}
        descripcion={conError.error}
        accion={<Boton titulo="Reintentar" variante="secundario" onPress={reintentar} />}
      />
    );
  }

  return children ?? null;
}
