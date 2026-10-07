import { ordenarEvidencias, type EvidenciaVisita, type VisitaTecnica } from './visitas';
import { claveVisitaConformidad } from './conformidad';
import { formatearFechaISO, ordenarPorFechaHora, type VisitaProgramada } from './visitasProgramadas';

// Qué visita eligió el empleado dentro de las etapas de un servicio.
export type SeleccionVisita =
  | { visitaId: number; tipo: 'diagnostico' }
  | { visitaId: number; tipo: 'programada'; visitaProgramadaId: number };

// Datos listos para mostrar en el panel de detalle, sin importar de qué etapa provienen.
export interface DetalleVisita {
  nombre: string;
  etapa: string;
  clienteNombre: string;
  tecnicoNombre: string;
  fechas: { etiqueta: string; valor: string }[];
  descripcion: string;
  // Información adicional que solo registra el técnico, p.ej. los componentes del diagnóstico.
  notasTecnico: { etiqueta: string; valor: string }[];
  // Documentos subidos por el técnico, ordenados por fecha y hora.
  documentos: EvidenciaVisita[];
  // Número de la visita dentro de su etapa (1 para el diagnóstico).
  numeroVisita: number;
  // Identifica la visita para recordar si ya se envió su documento de conformidad.
  claveConformidad: string;
  // true cuando el técnico ya envió el reporte de esta visita.
  reporteEnviado: boolean;
}

export const esSeleccionVisita = (seleccion: SeleccionVisita | null, visitaId: number, visitaProgramadaId?: number) =>
  seleccion?.visitaId === visitaId &&
  (visitaProgramadaId === undefined
    ? seleccion.tipo === 'diagnostico'
    : seleccion.tipo === 'programada' && seleccion.visitaProgramadaId === visitaProgramadaId);

export const detalleVisitaDiagnostico = (visita: VisitaTecnica): DetalleVisita => ({
  nombre: 'Visita de diagnóstico',
  etapa: 'Diagnóstico inicial',
  clienteNombre: visita.clienteNombre,
  tecnicoNombre: visita.tecnicoNombre,
  fechas: [{ etiqueta: 'Fecha tentativa de la visita', valor: visita.fecha }],
  descripcion: visita.descripcion,
  notasTecnico: visita.diagnostico
    ? [
        { etiqueta: 'Diagnóstico', valor: visita.diagnostico.descripcion },
        { etiqueta: 'Componentes', valor: visita.diagnostico.componentes.join(', ') },
      ]
    : [],
  documentos: ordenarEvidencias(visita.diagnostico?.evidencias ?? []),
  numeroVisita: 1,
  claveConformidad: claveVisitaConformidad(visita.visitaId),
  reporteEnviado: visita.diagnostico !== undefined,
});

// `hermanas` son todas las visitas programadas del mismo servicio; define el número de la visita.
export const detalleVisitaProgramada = (
  visita: VisitaTecnica,
  programada: VisitaProgramada,
  hermanas: VisitaProgramada[],
): DetalleVisita => {
  const numero = ordenarPorFechaHora(hermanas).findIndex(
    (v) => v.visitaProgramadaId === programada.visitaProgramadaId
  ) + 1;

  return {
    nombre: `Visita ${numero} de instalación`,
    etapa: 'Instalación',
    clienteNombre: visita.clienteNombre,
    tecnicoNombre: visita.tecnicoNombre,
    fechas: [
      {
        etiqueta: 'Programada',
        valor: `${formatearFechaISO(programada.fecha)} · ${programada.horaInicio} - ${programada.horaFin}`,
      },
    ],
    descripcion: programada.descripcionTareas,
    notasTecnico: programada.avance ? [{ etiqueta: 'Avance', valor: programada.avance.descripcion }] : [],
    documentos: ordenarEvidencias(programada.avance?.evidencias ?? []),
    numeroVisita: numero,
    claveConformidad: claveVisitaConformidad(visita.visitaId, programada.visitaProgramadaId),
    reporteEnviado: programada.avance !== undefined,
  };
};
