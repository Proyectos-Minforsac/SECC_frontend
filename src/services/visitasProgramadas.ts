import type { EvidenciaVisita, TipoVisita } from './visitas';
import type { ConceptoImprevisto } from './costosReales';
import { pedir } from './http';
import { conUrlCompleta } from './evidencias';

// Imprevisto que el técnico avisa en su reporte (doble pasaje, material faltante...). No lleva monto: lo pone el trabajador.
export interface AvisoImprevisto {
  concepto: ConceptoImprevisto;
  descripcion: string;
}

// Registro que el técnico deja al terminar una visita programada.
export interface AvanceVisita {
  descripcion: string;
  evidencias: EvidenciaVisita[];
}

// Lo que escribe el técnico al guardar el avance. Las evidencias ya se subieron al servidor antes. El aviso de imprevisto
// solo viaja al guardar: el servidor no lo devuelve dentro del avance.
export interface NuevoAvance {
  descripcion: string;
  imprevisto?: AvisoImprevisto;
}

// Cita concreta (fecha/hora) que el trabajador agenda dentro de un servicio activo,
// p.ej. una visita de instalación. Varias pueden pertenecer al mismo servicio (visitaId).
export interface VisitaProgramada {
  visitaProgramadaId: number;
  // Referencia al servicio (VisitaTecnica) al que pertenece esta cita.
  visitaId: number;
  // Etapa del servicio a la que pertenece la visita.
  tipo: TipoVisita;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  descripcionTareas: string;
  // Presente solo cuando el técnico ya completó la visita.
  avance?: AvanceVisita;
}

export type NuevaVisitaProgramada = Omit<VisitaProgramada, 'visitaProgramadaId' | 'avance'>;

// Las visitas programadas se cargan del backend y se guardan aquí para compartirlas entre las pantallas
// del trabajador y del técnico. Cada operación devuelve la visita actualizada y la reemplaza en el store.
let visitasProgramadas: VisitaProgramada[] = [];
const listeners = new Set<() => void>();

const emitirCambio = () => listeners.forEach((listener) => listener());

// Las evidencias del avance las guarda el servidor (en Drive) y llegan con la visita; su URL es relativa a la API.
const conEvidencias = (visita: VisitaProgramada): VisitaProgramada =>
  visita.avance
    ? { ...visita, avance: { ...visita.avance, evidencias: visita.avance.evidencias.map(conUrlCompleta) } }
    : visita;

const guardarVisitaProgramada = (recibida: VisitaProgramada) => {
  const visita = conEvidencias(recibida);
  visitasProgramadas = visitasProgramadas.some((v) => v.visitaProgramadaId === visita.visitaProgramadaId)
    ? visitasProgramadas.map((v) => (v.visitaProgramadaId === visita.visitaProgramadaId ? visita : v))
    : [...visitasProgramadas, visita];
  emitirCambio();
  return visita;
}

// Si varios componentes piden la carga a la vez, comparten la misma petición.
let cargaEnCurso: Promise<void> | null = null;

export const cargarVisitasProgramadas = () => {
  if (!cargaEnCurso) {
    cargaEnCurso = pedir<VisitaProgramada[]>(
      '/visitas-programadas',
      'GET',
      undefined,
      'No se pudieron cargar las visitas programadas'
    )
      .then((recibidas) => {
        visitasProgramadas = recibidas.map(conEvidencias);
        emitirCambio();
      })
      .finally(() => {
        cargaEnCurso = null;
      });
  }
  return cargaEnCurso;
}

export const agregarVisitaProgramada = async ({ visitaId, ...datos }: NuevaVisitaProgramada) =>
  guardarVisitaProgramada(
    await pedir<VisitaProgramada>(`/visitas/${visitaId}/programadas`, 'POST', datos, 'No se pudo programar la visita')
  );

export const editarVisitaProgramada = async (
  visitaProgramadaId: number,
  { fecha, horaInicio, horaFin, descripcionTareas }: NuevaVisitaProgramada
) =>
  guardarVisitaProgramada(
    await pedir<VisitaProgramada>(
      `/visitas-programadas/${visitaProgramadaId}`,
      'PUT',
      { fecha, horaInicio, horaFin, descripcionTareas },
      'No se pudo reprogramar la visita'
    )
  );

export const eliminarVisitaProgramada = async (visitaProgramadaId: number) => {
  await pedir(`/visitas-programadas/${visitaProgramadaId}`, 'DELETE', undefined, 'No se pudo eliminar la visita');
  visitasProgramadas = visitasProgramadas.filter((v) => v.visitaProgramadaId !== visitaProgramadaId);
  emitirCambio();
}

export const guardarAvanceVisitaProgramada = async (visitaProgramadaId: number, avance: NuevoAvance) =>
  guardarVisitaProgramada(
    await pedir<VisitaProgramada>(
      `/visitas-programadas/${visitaProgramadaId}/avance`,
      'POST',
      { descripcion: avance.descripcion, ...(avance.imprevisto ? { imprevisto: avance.imprevisto } : {}) },
      'No se pudo guardar el avance de la visita'
    )
  );

export const ordenarPorFechaHora = (lista: VisitaProgramada[]) =>
  [...lista].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`));

// Visitas de una etapa de un servicio, en orden cronológico.
export const visitasDeEtapa = (lista: VisitaProgramada[], visitaId: number, tipo: TipoVisita) =>
  ordenarPorFechaHora(lista.filter((v) => v.visitaId === visitaId && v.tipo === tipo));

// La visita "del momento" es la primera, en orden cronológico, que aún no tiene avance:
// es la única donde el técnico puede ingresar datos.
export const visitaProgramadaActual = (visitasDelServicio: VisitaProgramada[]) =>
  ordenarPorFechaHora(visitasDelServicio).find((v) => !v.avance) ?? null;

export const obtenerVisitasProgramadas = () => visitasProgramadas;

export const suscribirseAVisitasProgramadas = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// "2026-10-05" -> "05/10/2026"
export const formatearFechaISO = (fecha: string) => fecha.split('-').reverse().join('/');
