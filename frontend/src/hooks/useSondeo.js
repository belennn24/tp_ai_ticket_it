import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';

const INTERVALO_MAXIMO_MS = 60000;

// Ejecuta `tarea` cada `intervaloMs` (sondeo o "polling").
// - Solo corre mientras la pantalla está en foco y la app en primer plano:
//   al salir del chat o minimizar la app se detiene, y al volver retoma.
// - Espera a que termine un pedido antes de programar el siguiente, así nunca
//   hay dos consultas superpuestas aunque la red esté lenta.
// - Si `tarea` devuelve false (falló), duplica la espera hasta un máximo de
//   60 segundos para no insistir contra un servidor caído o con límite de pedidos.
//   Con el primer acierto vuelve al intervalo normal.
export function useSondeo(tarea, { intervaloMs = 5000, activo = true } = {}) {
  const tareaActual = useRef(tarea);
  tareaActual.current = tarea;

  useFocusEffect(
    useCallback(() => {
      if (!activo) return undefined;

      let temporizador = null;
      let detenido = false;
      let espera = intervaloMs;

      const programar = () => {
        if (detenido || AppState.currentState !== 'active') return;
        temporizador = setTimeout(ciclo, espera);
      };

      async function ciclo() {
        temporizador = null;
        let salioBien = false;
        try {
          salioBien = (await tareaActual.current()) !== false;
        } catch {
          salioBien = false;
        }
        espera = salioBien ? intervaloMs : Math.min(espera * 2, INTERVALO_MAXIMO_MS);
        programar();
      }

      const suscripcion = AppState.addEventListener('change', (estado) => {
        if (estado === 'active') {
          // Al volver a la app se consulta enseguida, porque pudieron llegar mensajes.
          if (!temporizador && !detenido) {
            espera = intervaloMs;
            temporizador = setTimeout(ciclo, 0);
          }
        } else if (temporizador) {
          clearTimeout(temporizador);
          temporizador = null;
        }
      });

      programar();

      return () => {
        detenido = true;
        if (temporizador) clearTimeout(temporizador);
        suscripcion.remove();
      };
    }, [intervaloMs, activo]),
  );
}
