import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/api/auth';
import { definirAlPerderSesion, definirTokens, obtenerRefreshToken } from '@/api/client';

const SesionContext = createContext(null);

// La sesión vive solo en memoria: al cerrar la app hay que volver a ingresar.
// Mientras está abierta, el cliente HTTP renueva el access token con el refresh token,
// así la sesión no se corta cuando vencen sus 15 minutos.
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [sesionVencida, setSesionVencida] = useState(false);

  const limpiar = useCallback(() => {
    definirTokens();
    setUsuario(null);
  }, []);

  // Si la sesión no se puede renovar (refresh token vencido o revocado), se vuelve al login con un aviso.
  useEffect(() => {
    definirAlPerderSesion(() => {
      limpiar();
      setSesionVencida(true);
    });
    return () => definirAlPerderSesion(null);
  }, [limpiar]);

  const iniciarSesion = useCallback(async (email, password) => {
    const respuesta = await authApi.iniciarSesion(email.trim(), password);
    definirTokens({ token: respuesta.token, refreshToken: respuesta.refreshToken });
    setSesionVencida(false);
    setUsuario(respuesta.usuario);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.cerrarSesion(obtenerRefreshToken());
    } catch {
      // Aunque el backend no responda, la sesión local se cierra igual.
    }
    limpiar();
  }, [limpiar]);

  const actualizarPerfil = useCallback(async ({ nombre, apellido }) => {
    const actualizado = await authApi.actualizarPerfil({ nombre, apellido });
    setUsuario(actualizado);
    return actualizado;
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      rol: usuario?.rol ?? null,
      haySesion: usuario !== null,
      sesionVencida,
      iniciarSesion,
      cerrarSesion,
      actualizarPerfil,
    }),
    [usuario, sesionVencida, iniciarSesion, cerrarSesion, actualizarPerfil]
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de SesionProvider');
  }
  return contexto;
}
