import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useVisitas } from "./useVisitas";
import { useVisitasProgramadas } from "./useVisitasProgramadas";
import { agregarNotificacion } from "../services/notificaciones";
import { garantiaDelServicio, garantiaVigente } from "../services/mantenimientos";
import { formatearFechaISO } from "../services/visitasProgramadas";

const REVISION_MS = 60_000;

// Evita repetir el aviso mientras la pestaña siga abierta; el servidor tampoco crea dos con la misma clave.
const avisados = new Set<number>();

// Avisa al trabajador y al jefe cuando la garantía de un servicio abierto ya terminó: es el momento de revisar los imprevistos
// pendientes, liquidar los costos reales y cerrar el servicio (HU-30). Se monta en el Layout, como los recordatorios de mantenimiento.
export function useAvisosGarantia() {
  const { usuario } = useAuth();
  const servicios = useVisitas();
  const visitasProgramadas = useVisitasProgramadas();
  // El técnico no cierra servicios ni ve costos
  const aplica = usuario?.rol === "trabajador" || usuario?.rol === "jefe";

  useEffect(() => {
    if (!aplica) return;

    const avisar = () => {
      for (const servicio of servicios) {
        if (servicio.estado !== "ACTIVO" || servicio.cierre || avisados.has(servicio.visitaId)) continue;

        const garantia = garantiaDelServicio(
          visitasProgramadas.filter((v) => v.visitaId === servicio.visitaId),
          servicio.garantiaMeses
        );
        if (!garantia || garantiaVigente(garantia)) continue;

        // Se marca antes de notificar para que ninguna revisión posterior repita el aviso.
        avisados.add(servicio.visitaId);

        // El jefe recibe también los avisos del trabajador
        agregarNotificacion({
          rolDestino: "trabajador",
          tipo: "GARANTIA_VENCIDA",
          solicitudId: servicio.solicitudId,
          clave: `garantia-vencida-${servicio.visitaId}-${garantia.fin}`,
          mensaje: `La garantía del servicio de ${servicio.clienteNombre} terminó el ${formatearFechaISO(garantia.fin)}. Revisa los imprevistos pendientes, liquida los costos reales y cierra el servicio en el Historial de Servicios.`,
        });
      }
    };

    avisar();
    // Cubre el cambio de día con la sesión abierta.
    const temporizador = setInterval(avisar, REVISION_MS);
    return () => clearInterval(temporizador);
  }, [aplica, servicios, visitasProgramadas]);
}
