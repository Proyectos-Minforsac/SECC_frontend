import type { VisitaTecnica } from './visitas';
import type { VisitaProgramada } from './visitasProgramadas';

export type EstadoServicio = 'EN CURSO' | 'CERRADO';

export const ESTILO_ESTADO_SERVICIO: Record<EstadoServicio, string> = {
  'EN CURSO': 'bg-amber-100 text-amber-700 border-amber-300/60',
  'CERRADO': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
};

// Los servicios del historial son los que ya pasaron el diagnóstico y fueron activados
// (cotización aceptada); un servicio cerrado se mantiene aunque cambie después.
export const esServicioDelHistorial = (visita: VisitaTecnica) => visita.estado === 'ACTIVO' || visita.cierre !== undefined;

export const estadoServicio = (visita: VisitaTecnica): EstadoServicio => (visita.cierre ? 'CERRADO' : 'EN CURSO');

export interface ProgresoServicio {
  total: number;
  completadas: number;
  // Se puede cerrar cuando hubo visitas y todas tienen reporte del técnico.
  culminado: boolean;
}

export const progresoServicio = (visitasDelServicio: VisitaProgramada[]): ProgresoServicio => {
  const completadas = visitasDelServicio.filter((v) => v.avance).length;
  return {
    total: visitasDelServicio.length,
    completadas,
    culminado: visitasDelServicio.length > 0 && completadas === visitasDelServicio.length,
  };
};

// "12/02/2025" -> "2025"
export const anioDeFecha = (fecha: string) => fecha.split('/').pop() ?? '';
