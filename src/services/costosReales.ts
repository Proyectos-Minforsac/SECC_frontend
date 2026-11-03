import { pedir } from './http';
import { RUBROS, redondear, unidadesDe, type Valor } from './calculoCostos';

// Control de los costos reales de un servicio. Se liquidan en dos pasos: al finalizar la instalación (diagnóstico e
// instalación) y al cerrar el servicio (mantenimiento y soporte). Entre uno y otro se registran los imprevistos
// (doble pasaje, material faltante...). Al cerrar, el servidor compara lo real con lo estimado y validado.
// Son costos internos: solo los ven el trabajador y el jefe.

export type EtapaCosto = 'DIAGNOSTICO' | 'INSTALACION' | 'MANTENIMIENTO' | 'SOPORTE';
export type FaseLiquidacion = 'INSTALACION' | 'FINAL';
export type CategoriaCosto = 'TRANSPORTE' | 'HOSPEDAJE' | 'ALIMENTACION' | 'MANO_OBRA';
export type ConceptoImprevisto = 'DOBLE_PASAJE' | 'TRASLADO_MATERIAL' | 'MATERIAL_FALTANTE' | 'OTRO';

export const NOMBRE_ETAPA_COSTO: Record<EtapaCosto, string> = {
  DIAGNOSTICO: 'Diagnóstico inicial',
  INSTALACION: 'Instalación',
  MANTENIMIENTO: 'Mantenimiento preventivo',
  SOPORTE: 'Soporte técnico',
};

export const CONCEPTOS_IMPREVISTO: { clave: ConceptoImprevisto; etiqueta: string }[] = [
  { clave: 'DOBLE_PASAJE', etiqueta: 'Doble pasaje' },
  { clave: 'TRASLADO_MATERIAL', etiqueta: 'Traslado de material' },
  { clave: 'MATERIAL_FALTANTE', etiqueta: 'Material faltante' },
  { clave: 'OTRO', etiqueta: 'Otro' },
];

// --- Propuesta de liquidación -------------------------------------------------------------------------------

export interface EntradasEtapa {
  nTecnicos: number;
  dias: number;
  noches: number;
  viajes: number;
}

// Una etapa de la tabla de liquidación, ya llenada por el servidor con lo planificado y lo ejecutado.
export interface PropuestaEtapa {
  etapa: EtapaCosto;
  nombre: string;
  // Visitas completadas y días en que hubo visita (solo informativo)
  ejecutado: { visitas: number; dias: number };
  // Solo el diagnóstico: lo que costó la oferta aceptada. Es un hecho y no se edita.
  diagnostico?: number;
  entradas?: EntradasEtapa;
  precios?: Record<CategoriaCosto, number>;
  // Solo la instalación: costo real de los materiales
  materiales?: number;
  planificado: {
    entradas?: EntradasEtapa | null;
    rubros: Partial<Record<CategoriaCosto, number>>;
    materiales?: number;
    subtotal: number;
  };
}

export type EstadoImprevisto = 'REGISTRADO' | 'PENDIENTE';

export interface Imprevisto {
  costoRealId: number;
  visitaId: number;
  etapa: EtapaCosto;
  rubro: string;
  concepto: ConceptoImprevisto;
  etiqueta: string;
  // Sin monto mientras el trabajador no lo registre (aviso del técnico)
  subtotal: number | null;
  motivo: string;
  estado: EstadoImprevisto;
  registradoPor: string;
  registradoEn: string;
  confirmadoPor: string;
  // Solo en la lista de un servicio: su etapa ya se liquidó y no admite cambios
  liquidada?: boolean;
}

export interface PropuestaSinControl {
  aplica: false;
}

export interface PropuestaYaLiquidada {
  aplica: true;
  yaLiquidada: true;
  fase: FaseLiquidacion;
  liquidadaEn: string;
}

export interface PropuestaConTabla {
  aplica: true;
  yaLiquidada: false;
  fase: FaseLiquidacion;
  etapas: PropuestaEtapa[];
  imprevistos: Imprevisto[];
  // Avisos del técnico que aún no tienen monto: hay que registrarlos o descartarlos antes de liquidar
  pendientes: number;
  // La provisión de imprevistos que se calculó al cotizar y lo que ya se usó en todo el servicio
  provision: number;
  imprevistosServicio: number;
}

export type PropuestaLiquidacion = PropuestaSinControl | PropuestaYaLiquidada | PropuestaConTabla;

// Lo que el trabajador edita de una etapa y se envía al servidor.
export interface EtapaEditable {
  etapa: EtapaCosto;
  nTecnicos: Valor;
  dias: Valor;
  noches: Valor;
  viajes: Valor;
  precios: Record<CategoriaCosto, Valor>;
  materiales: Valor;
}

export const editableDe = (propuesta: PropuestaEtapa): EtapaEditable => ({
  etapa: propuesta.etapa,
  nTecnicos: propuesta.entradas?.nTecnicos ?? 0,
  dias: propuesta.entradas?.dias ?? 0,
  noches: propuesta.entradas?.noches ?? 0,
  viajes: propuesta.entradas?.viajes ?? 0,
  precios: propuesta.precios ?? { TRANSPORTE: 0, HOSPEDAJE: 0, ALIMENTACION: 0, MANO_OBRA: 0 },
  materiales: propuesta.materiales ?? 0,
});

const num = (valor: Valor) => Number(valor) || 0;

export interface RubroReal {
  categoria: CategoriaCosto;
  etiqueta: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

// Cuánto cuesta lo que se confirmó en una etapa: técnicos × unidades × precio, igual que al estimar. Es la fórmula del
// servidor (services/costosReales.js, lineasDeEtapa): aquí solo sirve para mostrar el resultado mientras se escribe.
export function costoDeEtapa(propuesta: PropuestaEtapa, editable: EtapaEditable) {
  if (propuesta.etapa === 'DIAGNOSTICO') {
    const diagnostico = propuesta.diagnostico ?? 0;
    return { rubros: [] as RubroReal[], materiales: 0, subtotal: diagnostico };
  }

  const entradas = { nTecnicos: num(editable.nTecnicos), dias: num(editable.dias), noches: num(editable.noches), viajes: num(editable.viajes) };
  const rubros: RubroReal[] = RUBROS.map((rubro) => {
    const cantidad = unidadesDe(rubro.campo, entradas);
    const precio = num(editable.precios[rubro.categoria as CategoriaCosto]);
    return {
      categoria: rubro.categoria as CategoriaCosto,
      etiqueta: rubro.etiqueta,
      cantidad,
      precio,
      subtotal: redondear(cantidad * precio),
    };
  });
  const materiales = propuesta.etapa === 'INSTALACION' ? redondear(num(editable.materiales)) : 0;

  return { rubros, materiales, subtotal: redondear(rubros.reduce((total, r) => total + r.subtotal, 0) + materiales) };
}

// Lo que no deja confirmar la etapa. El servidor vuelve a comprobarlo.
export function problemasDeEtapa(propuesta: PropuestaEtapa, editable: EtapaEditable): string[] {
  if (propuesta.etapa === 'DIAGNOSTICO') return [];

  const problemas: string[] = [];
  const campos: [keyof Pick<EtapaEditable, 'nTecnicos' | 'dias' | 'noches' | 'viajes'>, string, number][] = [
    ['nTecnicos', 'técnicos', 50],
    ['dias', 'días', 365],
    ['noches', 'noches', 365],
    ['viajes', 'viajes', 50],
  ];
  for (const [campo, etiqueta, max] of campos) {
    const valor = num(editable[campo]);
    if (!Number.isInteger(valor) || valor < 0 || valor > max) {
      problemas.push(`${propuesta.nombre}: ${etiqueta} debe ser un número entero entre 0 y ${max}`);
    }
  }
  if (num(editable.noches) > num(editable.dias)) problemas.push(`${propuesta.nombre}: las noches no pueden ser más que los días`);
  return problemas;
}

// Lo que se envía al confirmar: solo las etapas editables (el diagnóstico lo toma el servidor de la oferta aceptada).
export interface EtapaPayload {
  etapa: EtapaCosto;
  nTecnicos: number;
  dias: number;
  noches: number;
  viajes: number;
  precios: Record<CategoriaCosto, number>;
  materiales?: number;
}

export const aPayloadLiquidacion = (propuestas: PropuestaEtapa[], editables: Record<string, EtapaEditable>): EtapaPayload[] =>
  propuestas
    .filter((p) => p.etapa !== 'DIAGNOSTICO')
    .map((p) => {
      const e = editables[p.etapa];
      return {
        etapa: p.etapa,
        nTecnicos: num(e.nTecnicos),
        dias: num(e.dias),
        noches: num(e.noches),
        viajes: num(e.viajes),
        precios: {
          TRANSPORTE: num(e.precios.TRANSPORTE),
          HOSPEDAJE: num(e.precios.HOSPEDAJE),
          ALIMENTACION: num(e.precios.ALIMENTACION),
          MANO_OBRA: num(e.precios.MANO_OBRA),
        },
        ...(p.etapa === 'INSTALACION' ? { materiales: num(e.materiales) } : {}),
      };
    });

// --- Llamadas al servidor ------------------------------------------------------------------------------------

export const obtenerLiquidacion = (visitaId: number, fase: FaseLiquidacion) =>
  pedir<PropuestaLiquidacion>(`/visitas/${visitaId}/liquidacion?fase=${fase}`, 'GET', undefined, 'No se pudo preparar la liquidación de costos');

// La de diagnóstico e instalación va con "Finalizar etapa" (visitas.ts); esta es la de mantenimiento y soporte.
export const liquidarFinal = (visitaId: number, etapas: EtapaPayload[]) =>
  pedir<{ visitaId: number; etapas: EtapaCosto[] }>(
    `/visitas/${visitaId}/liquidacion-final`,
    'POST',
    { etapas },
    'No se pudo registrar la liquidación de costos'
  );

export interface CostosServicio {
  aplicaControl: boolean;
  liquidacionInstalacion: string | null;
  liquidacionFinal: string | null;
  // Las etapas ya liquidadas no admiten más imprevistos
  etapasLiquidadas: Record<EtapaCosto, boolean>;
  imprevistos: Imprevisto[];
  totales: { directos: number; imprevistos: number; pendientes: number };
  provision: number;
}

export const obtenerCostosDelServicio = (visitaId: number) =>
  pedir<CostosServicio>(`/visitas/${visitaId}/costos`, 'GET', undefined, 'No se pudieron cargar los costos del servicio');

export interface NuevoImprevisto {
  etapa: EtapaCosto;
  concepto: ConceptoImprevisto;
  monto: number;
  motivo: string;
}

export const registrarImprevisto = async (visitaId: number, datos: NuevoImprevisto) => {
  const imprevisto = await pedir<Imprevisto>(`/visitas/${visitaId}/imprevistos`, 'POST', datos, 'No se pudo registrar el imprevisto');
  await cargarResumenCostos().catch(() => undefined);
  return imprevisto;
};

// Le pone el monto al aviso del técnico.
export const completarImprevisto = async (costoRealId: number, monto: number) => {
  const imprevisto = await pedir<Imprevisto>(`/imprevistos/${costoRealId}`, 'PATCH', { monto }, 'No se pudo registrar el monto del imprevisto');
  await cargarResumenCostos().catch(() => undefined);
  return imprevisto;
};

export const eliminarImprevisto = async (costoRealId: number) => {
  await pedir(`/imprevistos/${costoRealId}`, 'DELETE', undefined, 'No se pudo descartar el imprevisto');
  await cargarResumenCostos().catch(() => undefined);
};

// --- Resumen por servicio (Historial de Servicios y Visitas Técnicas) ---------------------------------------------

// Márgenes y punto del control de cada servicio. Los márgenes reales llegan al cerrar el servicio.
export interface ResumenCostosServicio {
  visitaId: number;
  aplicaControl: boolean;
  liquidacionInstalacion?: boolean;
  liquidacionFinal?: boolean;
  costoEstimado?: number;
  margenEstimado?: number | null;
  costoReal?: number | null;
  margenReal?: number | null;
  desviacionCosto?: number | null;
  desviacionMargen?: number | null;
  imprevistos?: { cantidad: number; total: number; pendientes: number };
}

// Se guarda aquí para compartirlo entre pantallas, como las visitas y las solicitudes.
let resumenes: ResumenCostosServicio[] = [];
const listeners = new Set<() => void>();

const emitirCambio = () => listeners.forEach((listener) => listener());

let cargaEnCurso: Promise<void> | null = null;

export const cargarResumenCostos = () => {
  if (!cargaEnCurso) {
    cargaEnCurso = pedir<ResumenCostosServicio[]>('/servicios-costos', 'GET', undefined, 'No se pudieron cargar los costos de los servicios')
      .then((recibidos) => {
        resumenes = recibidos;
        emitirCambio();
      })
      .finally(() => {
        cargaEnCurso = null;
      });
  }
  return cargaEnCurso;
};

export const obtenerResumenCostos = () => resumenes;

export const suscribirseAResumenCostos = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const formatearMargen = (margen: number | null | undefined) =>
  margen === null || margen === undefined ? '—' : `${margen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
