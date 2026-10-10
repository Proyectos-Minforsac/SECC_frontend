import { useSyncExternalStore } from "react";
import { obtenerConformidadesEnviadas, suscribirseAConformidades } from "../services/conformidad";

export function useConformidades() {
  return useSyncExternalStore(suscribirseAConformidades, obtenerConformidadesEnviadas);
}
