import { obtenerReseniasDeOrganizador } from '@/api/resenias';

import { useConsulta } from './useConsulta';

// Consulta las reseñas de un organizador solo cuando hay un ID válido y la vista lo requiere.
export function useReseniasOrganizador(organizadorId, { activo = true } = {}) {
  const pedir = activo && Boolean(organizadorId);
  return useConsulta(
    () => (pedir ? obtenerReseniasDeOrganizador(organizadorId) : Promise.resolve(null)),
    pedir ? organizadorId : '',
  );
}
