import { useEffect } from "react";
import { useVisitas } from "./useVisitas";
import { useVisitasProgramadas } from "./useVisitasProgramadas";
import { agregarNotificacion } from "../services/notificaciones";
import {
  describirCercania,
  marcarRecordatorioEnviado,
  mantenimientosPorAvisar,
} from "../services/mantenimientos";
import { formatearFechaISO } from "../services/visitasProgramadas";

const REVISION_MS = 60_000;

// Avisa al empleado y al técnico cuando una visita de mantenimiento está cerca.
// Se monta en el Layout para que corra mientras haya alguien con sesión iniciada.
export function useRecordatoriosMantenimiento() {
  const servicios = useVisitas();
  const visitasProgramadas = useVisitasProgramadas();

  useEffect(() => {
    const avisar = () => {
      for (const visita of mantenimientosPorAvisar(visitasProgramadas)) {
        const servicio = servicios.find((s) => s.visitaId === visita.visitaId);
        if (!servicio) continue;

        // Se marca antes de notificar para que ninguna revisión posterior repita el aviso.
        marcarRecordatorioEnviado(visita);

        const cuando = describirCercania(visita.fecha);
        const fecha = formatearFechaISO(visita.fecha);

        agregarNotificacion({
          rolDestino: 'empleado',
          solicitudId: servicio.solicitudId,
          clave: `recordatorio-${visita.visitaProgramadaId}-${visita.fecha}-empleado`,
          mensaje: `Recordatorio: el mantenimiento en ${servicio.clienteNombre} es ${cuando} (${fecha}). Técnico asignado: ${servicio.tecnicoNombre}.`,
        });
        agregarNotificacion({
          rolDestino: 'tecnico',
          tecnicoDestino: servicio.tecnicoNombre,
          solicitudId: servicio.solicitudId,
          clave: `recordatorio-${visita.visitaProgramadaId}-${visita.fecha}-tecnico`,
          mensaje: `Recordatorio: tienes un mantenimiento ${cuando} (${fecha}, ${visita.horaInicio} - ${visita.horaFin}) en ${servicio.clienteNombre}.`,
        });
      }
    };

    avisar();
    // Cubre el cambio de día con la sesión abierta.
    const temporizador = setInterval(avisar, REVISION_MS);
    return () => clearInterval(temporizador);
  }, [servicios, visitasProgramadas]);
}
