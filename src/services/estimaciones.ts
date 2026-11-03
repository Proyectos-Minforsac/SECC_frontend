import { pedir } from './http';
import type { EstadoValidacion } from './cotizaciones';
import { redondear, type Actividad, type EstimacionPayload, type TarifaUsada } from './calculoCostos';
import type { Inductor } from './tarifario';
import type { Analoga } from './analoga';

// Validación del jefe (juicio de expertos): lo que el jefe revisa y decide, y la bitácora de cada paso.

export type AccionValidacion = 'ENVIAR' | 'VALIDAR' | 'AJUSTAR' | 'DEVOLVER';

export const ETIQUETA_ACCION: Record<AccionValidacion, string> = {
  ENVIAR: 'Enviada a validación',
  VALIDAR: 'Validada',
  AJUSTAR: 'Validada con ajuste de costo',
  DEVOLVER: 'Devuelta',
};

// Una anotación de la bitácora. Solo se agregan: nunca se modifican.
export interface Anotacion {
  ajusteId: number;
  estimacionId: number;
  cotizacionId: number;
  version: number;
  accion: AccionValidacion;
  costoAntes: number | null;
  costoDespues: number | null;
  margenAntes: number | null;
  margenDespues: number | null;
  justificacion: string;
  usuario: string;
  rol: string;
  fecha: string;
}

export interface Pendiente {
  estimacionId: number;
  cotizacionId: number;
  version: number;
  numeroCotizacion: string;
  clienteNombre: string;
  tipoServicio: string;
  destino: string;
  moneda: string;
  creadaPor: string;
  enviadaEn: string;
  ventaSoles: number | null;
  costoFinal: number | null;
  margenFinal: number | null;
}

export type DecisionHistorial = Anotacion & { numeroCotizacion: string; clienteNombre: string };

export interface Bandeja {
  // Margen mínimo del jefe, o null si aún no lo definió.
  margenMinimo: number | null;
  pendientes: Pendiente[];
  historial: DecisionHistorial[];
}

export interface Estimacion {
  estimacionId: number;
  cotizacionId: number;
  version: number;
  estado: EstadoValidacion;
  tipoServicio: string;
  destino: string;
  moneda: string;
  tipoCambio: number | null;
  costoDiagnostico: number | null;
  costoTransporte: number | null;
  costoHospedaje: number | null;
  costoAlimentacion: number | null;
  costoManoObra: number | null;
  costoMateriales: number | null;
  costoImprevistos: number | null;
  tasaImprevistos: number | null;
  // Lo que salió de las fórmulas, y lo que rige (distinto si el jefe ajustó el costo).
  costoParametrico: number | null;
  margenParametrico: number | null;
  // Lo que sugería la analogía al cotizar (vacío si no había servicios similares suficientes) y con cuántos servicios
  costoAnalogo: number | null;
  casosAnalogo: number | null;
  costoFinal: number | null;
  margenFinal: number | null;
  ventaSinIGV: number | null;
  ventaSoles: number | null;
  entradas: { destino: string; tipoCambio: number; actividades: EstimacionPayload['actividades'] } | null;
  tarifasUsadas: Partial<Record<Inductor, TarifaUsada>> | null;
  creadaPor: string;
  creadaEn: string;
  enviadaEn: string;
  validadaPor: string;
  validadaEn: string;
}

// Un rubro de una actividad tal como se calculó: técnicos × unidades × tarifa.
export interface LineaCosto {
  etapa: Actividad;
  categoria: 'TRANSPORTE' | 'HOSPEDAJE' | 'ALIMENTACION' | 'MANO_OBRA';
  nTecnicos: number;
  dias: number;
  noches: number;
  viajes: number;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface ItemConCosto {
  tipo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  costoUnitario: number | null;
  costoSubtotal: number | null;
}

export interface DetalleEstimacion {
  margenMinimo: number | null;
  // Servicios cerrados parecidos a esta cotización, para contrastar la estimación con la realidad
  analoga: Analoga;
  cotizacion: {
    cotizacionId: number;
    numeroCotizacion: string;
    fecha: string;
    solicitante: string;
    moneda: string;
    estado: string;
    garantiaMeses: number | null;
    subtotal: number;
    total: number;
    clienteNombre: string;
  };
  estimacion: Estimacion;
  items: ItemConCosto[];
  lineas: LineaCosto[];
  // Todo el recorrido de la cotización (todas las versiones), en orden.
  bitacora: Anotacion[];
}

export interface ResultadoDecision {
  estimacionId: number;
  cotizacionId: number;
  version: number;
  estado: EstadoValidacion;
  costoFinal: number | null;
  margenFinal: number | null;
}

export const obtenerBandeja = () =>
  pedir<Bandeja>('/estimaciones', 'GET', undefined, 'No se pudieron cargar las validaciones');

export const obtenerDetalleEstimacion = (cotizacionId: number) =>
  pedir<DetalleEstimacion>(`/estimaciones/cotizacion/${cotizacionId}`, 'GET', undefined, 'No se pudo cargar la estimación');

// La justificación solo es obligatoria si el margen queda bajo el mínimo; el servidor lo comprueba.
export const validarEstimacion = (estimacionId: number, justificacion?: string) =>
  pedir<ResultadoDecision>(`/estimaciones/${estimacionId}/validar`, 'POST', { justificacion }, 'No se pudo validar la estimación');

export const ajustarEstimacion = (estimacionId: number, costoFinal: number, justificacion: string) =>
  pedir<ResultadoDecision>(
    `/estimaciones/${estimacionId}/ajustar`,
    'POST',
    { costoFinal, justificacion },
    'No se pudo ajustar la estimación'
  );

export const devolverEstimacion = (estimacionId: number, motivo: string) =>
  pedir<ResultadoDecision>(`/estimaciones/${estimacionId}/devolver`, 'POST', { motivo }, 'No se pudo devolver la cotización');

// ¿El margen queda bajo el mínimo del jefe? Es lo que obliga a justificar. Sin mínimo definido no se exige nada.
export const margenBajoMinimo = (margen: number | null, minimo: number | null) => {
  if (minimo === null) return false;
  return margen === null || margen < minimo;
};

// Margen (%) que queda con otro costo, sobre la misma venta en soles. Es la fórmula del servidor (calcularMargen).
export const margenConCosto = (ventaSoles: number, costo: number): number | null =>
  ventaSoles > 0 ? redondear(((ventaSoles - costo) / ventaSoles) * 100) : null;
