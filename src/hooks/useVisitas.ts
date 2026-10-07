import { useEffect, useSyncExternalStore } from "react";
import { cargarVisitas, obtenerVisitas, suscribirseAVisitas } from "../services/visitas";

export function useVisitas() {
  // Cada pantalla que usa las visitas las refresca al abrirse, para ver lo que cambió el otro rol.
  useEffect(() => {
    cargarVisitas().catch((error) => console.error('Error al cargar las visitas técnicas', error));
  }, []);

  return useSyncExternalStore(suscribirseAVisitas, obtenerVisitas);
}
