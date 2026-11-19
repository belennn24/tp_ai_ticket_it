import { EstadoVacio, Pantalla } from '@/components/ui';

// Pantalla provisoria para las pestañas que se implementan en los pasos 3 y 4.
export function EnConstruccion({ titulo, icono, paso }) {
  return (
    <Pantalla titulo={titulo}>
      <EstadoVacio icono={icono} titulo="Próximamente" descripcion={`Esta pantalla se implementa en el Paso ${paso} del plan.`} />
    </Pantalla>
  );
}
