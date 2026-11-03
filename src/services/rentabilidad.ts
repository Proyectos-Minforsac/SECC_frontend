import { pedir } from './http';
import type { OrigenServicio } from './analoga';

// Indicador «Margen de rentabilidad por proceso»: lo que el jefe ve en el tablero. Todas las cifras las calcula el servidor
// con los filtros elegidos, así los totales siempre coinciden con la tabla.

export interface ServicioRentabilidad {
  resumenId: number | null;
  visitaId: number | null;
  origen: OrigenServicio;
  referencia: string;
  tipoServicio: string;
  destino: string;
  // Fecha de cierre (ISO; en los del histórico solo la fecha)
  cerradoEn: string;
  ventaSoles: number | null;
  costoParametrico: number | null;
  costoAnalogo: number | null;
  costoEstimado: number | null;
  costoReal: number | null;
  imprevistosProvision: number | null;
  imprevistosReal: number | null;
  margenEstimado: number | null;
  margenReal: number | null;
  desviacionCosto: number | null;
  desviacionMargen: number | null;
  // Desviación del costo real frente al estimado, en %
  desviacionCostoPorcentaje: number | null;
  // null cuando el jefe aún no definió el parámetro o falta el dato
  cumpleMargenMinimo: boolean | null;
  dentroTolerancia: boolean | null;
}

export interface ResumenGlobal {
  servicios: number;
  sistema: number;
  historicos: number;
  ventaSoles: number;
  costoReal: number;
  margenReal: number | null;
  // Servicios que traen el costo estimado: con ellos se compara lo estimado con lo real
  comparables: number;
  margenEstimado: number | null;
  margenRealComparable: number | null;
  // Puntos de margen: real menos estimado
  desviacionMargen: number | null;
  desviacionCostoPorcentaje: number | null;
  imprevistos: {
    real: number;
    porcentajeDeDirectos: number | null;
    provision: number;
    realConProvision: number;
    serviciosConProvision: number;
  };
}

export interface Agrupacion {
  clave: string;
  servicios: number;
  ventaSoles: number;
  costoReal: number;
  margenReal: number | null;
  comparables: number;
  margenEstimado: number | null;
  desviacionMargen: number | null;
}

export type ClaveMetodo = 'PARAMETRICO' | 'ANALOGO' | 'FINAL';

export interface ExactitudMetodo {
  clave: ClaveMetodo;
  etiqueta: string;
  n: number;
  errorMedioAbsoluto: number | null;
  errorPorcentualMedio: number | null;
  // Positivo: el método tiende a estimar de más; negativo, de menos
  sesgoPorcentual: number | null;
  // % de servicios cuyo error cae dentro de la tolerancia (null si el jefe no la definió)
  dentroTolerancia: number | null;
}

export interface Comparacion {
  metodos: ExactitudMetodo[];
  // Los servicios que traen los tres estimados: la comparación justa
  comunes: { n: number; metodos: ExactitudMetodo[] };
  mejor: ClaveMetodo | null;
  basadoEn: 'COMUNES' | 'PROPIOS' | null;
}

export interface ServicioCancelado {
  visitaId: number;
  clienteNombre: string;
  tipoServicio: string;
  monto: number;
  motivo: string;
  canceladaEn: string;
}

export interface Rentabilidad {
  parametros: { margenMinimo: number | null; tolerancia: number | null; minCasos: number };
  // Opciones de los filtros (salen de todos los servicios, no de los filtrados)
  filtros: { tipos: string[]; anios: string[]; origenes: OrigenServicio[] };
  resumen: ResumenGlobal;
  porTipo: Agrupacion[];
  porPeriodo: Agrupacion[];
  comparacion: Comparacion;
  servicios: ServicioRentabilidad[];
  cancelados: { cantidad: number; costoDiagnosticos: number; servicios: ServicioCancelado[] };
}

export interface FiltrosRentabilidad {
  tipoServicio: string;
  anio: string;
  origen: OrigenServicio | '';
}

export const obtenerRentabilidad = ({ tipoServicio, anio, origen }: FiltrosRentabilidad) => {
  const parametros = new URLSearchParams();
  if (tipoServicio) parametros.set('tipoServicio', tipoServicio);
  if (anio) parametros.set('anio', anio);
  if (origen) parametros.set('origen', origen);

  const consulta = parametros.toString();
  return pedir<Rentabilidad>(`/rentabilidad${consulta ? `?${consulta}` : ''}`, 'GET', undefined, 'No se pudo cargar el tablero de rentabilidad');
};

export const ETIQUETA_ORIGEN: Record<OrigenServicio, string> = {
  SISTEMA: 'Sistema',
  HISTORICO: 'Histórico',
};

// «2026-11» -> «Nov 2026»; lo que no es un mes (por ejemplo «Sin fecha») se deja igual
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
export const etiquetaPeriodo = (periodo: string) => {
  const m = periodo.match(/^(\d{4})-(\d{2})$/);
  return m ? `${MESES[Number(m[2]) - 1] ?? m[2]} ${m[1]}` : periodo;
};

// «2026-11-02T15:00:00.000Z» o «2025-03-14» -> «02/11/2026»
export const fechaDeCierre = (iso: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
