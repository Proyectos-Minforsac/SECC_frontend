import { useEffect, useSyncExternalStore } from "react";
import {
  cargarVisitasProgramadas,
  obtenerVisitasProgramadas,
  suscribirseAVisitasProgramadas,
} from "../services/visitasProgramadas";

export function useVisitasProgramadas() {
  // Cada pantalla que usa las visitas programadas las refresca al abrirse, para ver lo que cambió el otro rol.
  useEffect(() => {
    cargarVisitasProgramadas().catch((error) => console.error('Error al cargar las visitas programadas', error));
  }, []);

  return useSyncExternalStore(suscribirseAVisitasProgramadas, obtenerVisitasProgramadas);
}
