import { pedir } from './http';

export type EstadoVisita ='AUTORIZADA' | 'DIAGNÓSTICO COMPLETADO' | 'ACTIVO';

// Etapas generales de un servicio; se activan de forma secuencial.
export const ETAPAS_SERVICIO = [
  'Diagnóstico inicial',
  'Instalación',
  'Mantenimiento preventivo',
  'Soporte técnico',
] as const;

export interface EvidenciaVisita {
  nombre: string;
  url: string;
  // false para documentos (PDF, Word, etc.); si no se indica se trata como imagen.
  esImagen?: boolean;
  // Fecha y hora (ISO) en que el técnico subió el archivo.
  subidoEn: string;
}

export type TipoEvidencia = 'imagen' | 'pdf' | 'otro';

export const tipoEvidencia = (evidencia: EvidenciaVisita): TipoEvidencia => {
  if (evidencia.esImagen !== false) return 'imagen';
  return evidencia.nombre.toLowerCase().endsWith('.pdf') ? 'pdf' : 'otro';
}

// Más antiguos primero, de acuerdo a la fecha y hora en que los subió el técnico.
export const ordenarEvidencias = (evidencias: EvidenciaVisita[]) =>
  [...evidencias].sort((a, b) => a.subidoEn.localeCompare(b.subidoEn));

// "2026-10-05T14:30:00.000Z" -> "05/10/2026 · 14:30" (hora local)
export const formatearFechaHora = (iso: string) => {
  const fecha = new Date(iso);
  return `${fecha.toLocaleDateString('es-PE')} · ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

// Diagnóstico en sitio que el técnico registra para que la empresa arme el presupuesto.
export interface DiagnosticoVisita {
  descripcion: string;
  componentes: string[];
  evidencias: EvidenciaVisita[];
}

// Se registra cuando el empleado cierra el servicio: toda su documentación queda en una carpeta de Drive.
export interface CierreServicio {
  fecha: string;
  carpetaUrl: string;
}

export interface VisitaTecnica {
  visitaId: number;
  solicitudId: number;
  clienteNombre: string;
  tecnicoNombre: string;
  // Instrucciones escritas por el empleado para la primera visita técnica.
  descripcion: string;
  fecha: string;
  estado: EstadoVisita;
  diagnostico?: DiagnosticoVisita;
  cierre?: CierreServicio;
}

export const ESTILO_ESTADO_VISITA: Record<EstadoVisita, string> = {
  'AUTORIZADA': 'bg-indigo-100 text-indigo-700 border-indigo-300/60',
  'DIAGNÓSTICO COMPLETADO': 'bg-amber-100 text-amber-700 border-amber-300/60',
  'ACTIVO': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
};

// Cantidad de etapas ya completadas.
export const etapasCompletadas = (visita: VisitaTecnica) =>
  visita.estado === 'AUTORIZADA' ? 0 : 1;

// Etapas visibles y desbloqueadas para el técnico. Con el servicio activo se habilitan
// todas las posteriores al diagnóstico, aunque solo la etapa activa admite ingreso de datos.
export const etapaHabilitada = (visita: VisitaTecnica, indice: number) =>
  indice < etapasCompletadas(visita) || (visita.estado === 'ACTIVO' && indice >= 1);

// Índice de la etapa habilitada para trabajar ahora mismo, o null si no hay ninguna
// (p.ej. tras completar el diagnóstico, la Instalación queda bloqueada hasta que el
// empleado registre la aceptación de la cotización y active el servicio).
export const etapaActivaIndice = (visita: VisitaTecnica): number | null => {
  if (visita.estado === 'AUTORIZADA') return 0;
  if (visita.estado === 'ACTIVO') return 1;
  return null;
}

// Las visitas se cargan del backend y se guardan aquí para compartirlas entre las pantallas del empleado
// y del técnico. La visita la crea el backend al autorizar el viaje; cada operación devuelve la visita
// actualizada y la reemplaza en el store.
let visitas: VisitaTecnica[] = [];
const listeners = new Set<() => void>();

const emitirCambio = () => listeners.forEach((listener) => listener());

// Las evidencias (imágenes y documentos) todavía no se guardan en el backend. Se conservan en el navegador
// mientras la pestaña siga abierta y se vuelven a unir a la visita cada vez que llega una versión del servidor.
const evidenciasDiagnostico = new Map<number, EvidenciaVisita[]>();

const conEvidencias = (visita: VisitaTecnica): VisitaTecnica =>
  visita.diagnostico
    ? { ...visita, diagnostico: { ...visita.diagnostico, evidencias: evidenciasDiagnostico.get(visita.visitaId) ?? [] } }
    : visita;

const guardarVisita = (recibida: VisitaTecnica) => {
  const visita = conEvidencias(recibida);
  visitas = visitas.some((v) => v.visitaId === visita.visitaId)
    ? visitas.map((v) => (v.visitaId === visita.visitaId ? visita : v))
    : [visita, ...visitas];
  emitirCambio();
  return visita;
}

// Si varios componentes piden la carga a la vez, comparten la misma petición.
let cargaEnCurso: Promise<void> | null = null;

export const cargarVisitas = () => {
  if (!cargaEnCurso) {
    cargaEnCurso = pedir<VisitaTecnica[]>('/visitas', 'GET', undefined, 'No se pudieron cargar las visitas técnicas')
      .then((recibidas) => {
        visitas = recibidas.map(conEvidencias);
        emitirCambio();
      })
      .finally(() => {
        cargaEnCurso = null;
      });
  }
  return cargaEnCurso;
}

export const guardarDiagnostico = async (visitaId: number, diagnostico: DiagnosticoVisita) => {
  const { descripcion, componentes, evidencias } = diagnostico;
  const visita = await pedir<VisitaTecnica>(
    `/visitas/${visitaId}/diagnostico`,
    'POST',
    { descripcion, componentes },
    'No se pudo guardar el diagnóstico'
  );
  evidenciasDiagnostico.set(visitaId, evidencias);
  return guardarVisita(visita);
}

// Se llama al aceptar la cotización ligada a esta solicitud: habilita la etapa de
// Instalación para el técnico. Devuelve la visita activada, o null si la solicitud no tiene una.
export const activarVisitaPorSolicitud = async (solicitudId: number): Promise<VisitaTecnica | null> => {
  const visita = await pedir<VisitaTecnica | null>(
    `/solicitudes/${solicitudId}/activar-visita`,
    'POST',
    {},
    'No se pudo activar el servicio'
  );
  return visita ? guardarVisita(visita) : null;
}

export const registrarCierreServicio = async (visitaId: number, carpetaUrl: string) =>
  guardarVisita(await pedir<VisitaTecnica>(`/visitas/${visitaId}/cierre`, 'POST', { carpetaUrl }, 'No se pudo registrar el cierre del servicio'));

export const obtenerVisitas = () => visitas;

export const suscribirseAVisitas = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
