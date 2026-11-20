import { useSyncExternalStore } from "react";
import { obtenerConformidadesGeneradas, suscribirseAConformidades } from "../services/conformidad";

export function useConformidades() {
  return useSyncExternalStore(suscribirseAConformidades, obtenerConformidadesGeneradas);
}
