import { useEffect, useSyncExternalStore } from "react";
import { cargarSolicitudes, obtenerSolicitudes, suscribirseASolicitudes } from "../services/solicitudes";

export function useSolicitudes() {
  // Cada pantalla que usa las solicitudes las refresca al abrirse, para ver lo que cambió el otro rol.
  useEffect(() => {
    cargarSolicitudes().catch((error) => console.error('Error al cargar las solicitudes', error));
  }, []);

  return useSyncExternalStore(suscribirseASolicitudes, obtenerSolicitudes);
}
