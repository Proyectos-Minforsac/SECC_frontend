import { pedir } from './http';

// Inductores de costo que tienen tarifa. Los mismos del backend (services/tarifas.js).
export type Inductor = 'PASAJE' | 'NOCHE' | 'ALIMENTACION' | 'JORNADA';

export const INDUCTORES: { clave: Inductor; etiqueta: string; unidad: string }[] = [
  { clave: 'PASAJE', etiqueta: 'Pasaje', unidad: 'por técnico y viaje' },
  { clave: 'NOCHE', etiqueta: 'Hospedaje', unidad: 'por técnico y noche' },
  { clave: 'ALIMENTACION', etiqueta: 'Alimentación', unidad: 'por técnico y día' },
  { clave: 'JORNADA', etiqueta: 'Mano de obra', unidad: 'por técnico y jornada' },
];

export const etiquetaInductor = (inductor: Inductor) =>
  INDUCTORES.find((i) => i.clave === inductor)?.etiqueta ?? inductor;

// Destino que rige para todos los que no tengan tarifa propia.
export const DESTINO_GENERAL = 'GENERAL';

// VIGENTE rige hoy; REEMPLAZADA ya la sustituyó otra más reciente; PROGRAMADA aún no empieza.
export type EstadoTarifa = 'VIGENTE' | 'REEMPLAZADA' | 'PROGRAMADA';

export const ESTILO_ESTADO_TARIFA: Record<EstadoTarifa, string> = {
  'VIGENTE': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
  'PROGRAMADA': 'bg-indigo-100 text-indigo-700 border-indigo-300/60',
  'REEMPLAZADA': 'bg-slate-100 text-slate-600 border-slate-300/60',
};

export interface Tarifa {
  tarifaId: number;
  inductor: Inductor;
  destino: string;
  monto: number;
  // YYYY-MM-DD
  vigenteDesde: string;
  registradoPor: string;
  // Instante ISO en que se registró.
  registradoEn: string;
  estado: EstadoTarifa;
}

// Tarifa que rige hoy para un destino; `heredada` indica que es la del destino GENERAL porque el destino no tiene la suya.
export interface TarifaVigente {
  tarifaId: number;
  monto: number;
  vigenteDesde: string;
  destino: string;
  heredada: boolean;
}

export interface Tarifario {
  // Todas, las más recientes primero.
  tarifas: Tarifa[];
  // GENERAL primero y luego los destinos que tienen tarifa propia.
  destinos: string[];
  // Lo que rige hoy en cada destino; null cuando ni el destino ni GENERAL tienen tarifa de ese inductor.
  vigentes: Record<string, Record<Inductor, TarifaVigente | null>>;
}

export interface NuevaTarifa {
  inductor: Inductor;
  destino: string;
  monto: number;
  vigenteDesde: string;
}

export const obtenerTarifario = () =>
  pedir<Tarifario>('/tarifas', 'GET', undefined, 'No se pudo cargar el tarifario');

export const registrarTarifa = (tarifa: NuevaTarifa) =>
  pedir<Tarifa>('/tarifas', 'POST', tarifa, 'No se pudo registrar la tarifa');
