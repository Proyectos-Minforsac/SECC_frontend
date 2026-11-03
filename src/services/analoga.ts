import { pedir } from './http';
import { redondear, type EstimacionPayload } from './calculoCostos';
import { margenConCosto } from './estimaciones';

// Estimación por analogía: los servicios ya cerrados que se parecen a una cotización (mismo tipo de servicio y, si hay
// suficientes, mismo destino), con lo que costaron en la realidad y cuánto se equivocó el cálculo paramétrico en ellos.
// Es información interna: la ven el trabajador y el jefe.

export type OrigenServicio = 'SISTEMA' | 'HISTORICO';

export interface Estadistica {
  promedio: number | null;
  min: number | null;
  max: number | null;
}

// Los parámetros con los que se estimó un servicio cerrado por el sistema (los del histórico no los tienen).
export interface EntradasEstimacion {
  destino: string;
  tipoCambio: number;
  actividades: EstimacionPayload['actividades'];
}

export interface ServicioSimilar {
  origen: OrigenServicio;
  referencia: string;
  tipoServicio: string;
  destino: string;
  cerradoEn: string;
  ventaSoles: number | null;
  costoReal: number | null;
  margenReal: number | null;
  entradas: EntradasEstimacion | null;
}

export interface Analoga {
  tipoServicio: string;
  destino: string;
  // Mínimo de servicios similares que fijó el jefe
  minCasos: number;
  // Con qué se comparó: el mismo tipo y destino, o solo el mismo tipo cuando no alcanzaban los del destino
  criterio: 'TIPO_Y_DESTINO' | 'TIPO' | null;
  n: number;
  suficiente: boolean;
  costoReal: Estadistica;
  margenReal: Estadistica;
  desviacion: {
    casos: number;
    // Cuánto más (o menos) costó la realidad que el cálculo paramétrico, en %
    relativaPromedio: number | null;
    costoPromedio: number | null;
    margenPromedio: number | null;
  };
  sugerible: boolean;
  // Por qué no hay datos suficientes, cuando es así
  motivo: string;
  recientes: ServicioSimilar[];
}

export interface SugerenciaAnaloga {
  costo: number;
  margen: number | null;
  casos: number;
  desviacionPorcentaje: number;
}

// Costo paramétrico corregido con la desviación histórica. Es la misma fórmula del servidor (services/analoga.js,
// sugerir): aquí solo sirve para mostrarla mientras el trabajador cambia la hoja de costos; al cotizar el servidor guarda la suya.
export function sugerirCosto(analoga: Analoga | null, costoParametrico: number, ventaSoles: number): SugerenciaAnaloga | null {
  if (!analoga?.sugerible || analoga.desviacion.relativaPromedio === null || !(costoParametrico > 0)) return null;

  const costo = redondear(costoParametrico * (1 + analoga.desviacion.relativaPromedio / 100));
  return {
    costo,
    margen: ventaSoles > 0 ? margenConCosto(ventaSoles, costo) : null,
    casos: analoga.desviacion.casos,
    desviacionPorcentaje: analoga.desviacion.relativaPromedio,
  };
}

export const obtenerAnaloga = (tipoServicio: string, destino: string) =>
  pedir<Analoga>(
    `/analoga?tipoServicio=${encodeURIComponent(tipoServicio)}&destino=${encodeURIComponent(destino)}`,
    'GET',
    undefined,
    'No se pudieron cargar los servicios similares'
  );
