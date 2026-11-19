import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

// Ejecuta una consulta a la API y expone su estado.
// - Se ejecuta al entrar a la pantalla y cada vez que vuelve a estar en foco,
//   así los datos se actualizan al regresar (por ejemplo, después de comprar).
// - `clave` identifica la consulta: cuando cambia (otro filtro, otro id) se vuelve a pedir.
// - `recargar()` es para "deslizar para actualizar" (muestra el indicador de carga).
// - `refrescar()` vuelve a pedir en silencio, sin indicador; lo usa el sondeo periódico.
//   Devuelve true si la consulta salió bien y false si falló.
export function useConsulta(consulta, clave = '') {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);

  const consultaActual = useRef(consulta);
  consultaActual.current = consulta;
  const ultimoPedido = useRef(0);
  const yaCargo = useRef(false);

  const ejecutar = useCallback(async () => {
    const pedido = ++ultimoPedido.current;
    try {
      const resultado = await consultaActual.current();
      // Si mientras tanto se lanzó otro pedido, esta respuesta quedó vieja.
      if (pedido !== ultimoPedido.current) return;
      setDatos(resultado);
      setError(null);
      yaCargo.current = true;
      return true;
    } catch (e) {
      if (pedido !== ultimoPedido.current) return false;
      setError(e.message);
      return false;
    } finally {
      if (pedido === ultimoPedido.current) {
        setCargando(false);
        setRecargando(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!yaCargo.current) setCargando(true);
      ejecutar();
      // `clave` no se usa adentro: está para volver a pedir cuando cambia.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ejecutar, clave]),
  );

  const recargar = useCallback(() => {
    setRecargando(true);
    return ejecutar();
  }, [ejecutar]);

  const refrescar = useCallback(() => ejecutar(), [ejecutar]);

  return { datos, error, cargando, recargando, recargar, refrescar };
}
