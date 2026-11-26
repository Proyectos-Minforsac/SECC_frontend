import { useEffect, useSyncExternalStore } from "react";
import { cargarNotificaciones, obtenerNotificaciones, suscribirseANotificaciones } from "../services/notificaciones";
import { useAuth } from "../context/AuthContext";

const REVISION_MS = 30_000;

export function useNotificaciones() {
  const { usuario } = useAuth();

  return useSyncExternalStore(
    suscribirseANotificaciones,
    // Los avisos para un técnico van dirigidos a su nombre completo (el de la hoja de técnicos)
    () => (usuario ? obtenerNotificaciones(usuario.rol, usuario.nombreCompleto) : [])
  );
}

// Mantiene al día las notificaciones de quien tiene la sesión abierta, para que lleguen las que generó otro rol.
// Se monta una sola vez, en el Layout.
export function useSincronizarNotificaciones() {
  const { usuario } = useAuth();
  const rol = usuario?.rol;
  const nombre = usuario?.nombreCompleto;

  useEffect(() => {
    if (!rol || nombre === undefined) return;

    const actualizar = () =>
      cargarNotificaciones(rol, nombre).catch((error) => console.error('Error al cargar las notificaciones', error));

    actualizar();
    const temporizador = setInterval(actualizar, REVISION_MS);
    window.addEventListener('focus', actualizar);
    return () => {
      clearInterval(temporizador);
      window.removeEventListener('focus', actualizar);
    };
  }, [rol, nombre]);
}
