import { useSyncExternalStore } from "react";
import { obtenerNotificaciones, suscribirseANotificaciones } from "../services/notificaciones";
import { useAuth } from "../context/AuthContext";

export function useNotificaciones() {
  const { usuario } = useAuth();

  return useSyncExternalStore(
    suscribirseANotificaciones,
    () => (usuario ? obtenerNotificaciones(usuario.rol, usuario.nombre) : [])
  );
}
