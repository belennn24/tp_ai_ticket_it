import { Boton } from './Boton';
import { Cargando } from './Cargando';
import { EstadoVacio } from './EstadoVacio';

// Muestra el estado inicial de carga o error de una consulta antes de renderizar su contenido.
export function EstadoConsulta({ consulta, tituloError = 'No se pudieron cargar los datos', children }) {
  if (consulta.cargando && !consulta.datos) {
    return <Cargando />;
  }

  if (consulta.error && !consulta.datos) {
    return (
      <EstadoVacio
        icono="cloud-offline-outline"
        titulo={tituloError}
        descripcion={consulta.error}
        accion={<Boton titulo="Reintentar" variante="secundario" onPress={consulta.recargar} />}
      />
    );
  }

  return children ?? null;
}
