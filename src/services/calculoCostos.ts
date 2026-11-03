import type { Inductor, TarifaVigente } from './tarifario';

// Cálculo de la estimación de costos de una cotización. Es la misma fórmula del servidor (backend, services/
// calculoCostos.js): aquí se usa para mostrar el resultado mientras el trabajador escribe, y el servidor la vuelve a
// calcular al guardar y es la que vale. Si cambias una, cambia la otra.
//
// Por cada actividad, con N técnicos:
//   transporte = N × pasaje × viajes · hospedaje = N × noche × noches
//   alimentación = N × alimentación diaria × días · mano de obra = N × jornada × días
// Materiales = Σ cantidad × costo de compra. Diagnóstico = oferta aceptada. Imprevistos = tasa % × costos directos
// futuros (sin el diagnóstico). Margen = (venta sin IGV − costo total) / venta sin IGV × 100, en soles.

export type Actividad = 'INSTALACION' | 'MANTENIMIENTO' | 'SOPORTE';

export const ACTIVIDADES: readonly Actividad[] = ['INSTALACION', 'MANTENIMIENTO', 'SOPORTE'];

export const NOMBRE_ACTIVIDAD: Record<Actividad, string> = {
  INSTALACION: 'Instalación',
  MANTENIMIENTO: 'Mantenimiento preventivo',
  SOPORTE: 'Soporte técnico',
};

// Lo que se escribe en el formulario: un número o vacío (que cuenta como 0).
export type Valor = number | '';

export interface DatosInstalacion {
  nTecnicos: Valor;
  dias: Valor;
  noches: Valor;
  viajes: Valor;
}

// Mantenimiento y soporte se piden por visita: el total sale de multiplicar por las visitas previstas.
export interface DatosVisitas {
  nTecnicos: Valor;
  visitas: Valor;
  diasPorVisita: Valor;
  nochesPorVisita: Valor;
}

export interface Actividades {
  INSTALACION: DatosInstalacion;
  MANTENIMIENTO: DatosVisitas;
  SOPORTE: DatosVisitas;
}

export const actividadesVacias = (): Actividades => ({
  INSTALACION: { nTecnicos: '', dias: '', noches: '', viajes: 1 },
  MANTENIMIENTO: { nTecnicos: '', visitas: '', diasPorVisita: 1, nochesPorVisita: 0 },
  // El soporte es por falla: por defecto no se prevén visitas y lo cubre la provisión de imprevistos.
  SOPORTE: { nTecnicos: '', visitas: 0, diasPorVisita: 1, nochesPorVisita: 0 },
});

export type RubroCampo = 'transporte' | 'hospedaje' | 'alimentacion' | 'manoObra';

export const RUBROS: { campo: RubroCampo; categoria: string; inductor: Inductor; etiqueta: string; tarifa: string }[] = [
  { campo: 'transporte', categoria: 'TRANSPORTE', inductor: 'PASAJE', etiqueta: 'Transporte', tarifa: 'el pasaje' },
  { campo: 'hospedaje', categoria: 'HOSPEDAJE', inductor: 'NOCHE', etiqueta: 'Hospedaje', tarifa: 'la noche de hospedaje' },
  { campo: 'alimentacion', categoria: 'ALIMENTACION', inductor: 'ALIMENTACION', etiqueta: 'Alimentación', tarifa: 'la alimentación diaria' },
  { campo: 'manoObra', categoria: 'MANO_OBRA', inductor: 'JORNADA', etiqueta: 'Mano de obra', tarifa: 'la jornada de mano de obra' },
];

// Segundo factor de cada rubro (el primero siempre son los técnicos): viajes, noches, días de alimentación, jornadas.
export const FACTOR_RUBRO: Record<RubroCampo, { unidad: string; cantidad: (a: Pick<DetalleActividad, 'viajes' | 'noches' | 'dias'>) => number }> = {
  transporte: { unidad: 'viaje', cantidad: (a) => a.viajes },
  hospedaje: { unidad: 'noche', cantidad: (a) => a.noches },
  alimentacion: { unidad: 'día', cantidad: (a) => a.dias },
  manoObra: { unidad: 'jornada', cantidad: (a) => a.dias },
};

export const pluralizar = (cantidad: number, unidad: string) => `${cantidad} ${unidad}${cantidad === 1 ? '' : 's'}`;

type CampoDeActividad = 'nTecnicos' | 'dias' | 'noches' | 'viajes' | 'visitas' | 'diasPorVisita' | 'nochesPorVisita';

const CAMPOS: Record<CampoDeActividad, { etiqueta: string; max: number }> = {
  nTecnicos: { etiqueta: 'técnicos', max: 50 },
  dias: { etiqueta: 'días', max: 365 },
  noches: { etiqueta: 'noches', max: 365 },
  viajes: { etiqueta: 'viajes', max: 50 },
  visitas: { etiqueta: 'visitas', max: 50 },
  diasPorVisita: { etiqueta: 'días por visita', max: 30 },
  nochesPorVisita: { etiqueta: 'noches por visita', max: 30 },
};

// Los ítems Servicio no llevan costo de compra: su costo ya está en la mano de obra.
export const COSTO_OBLIGATORIO = ['Producto', 'Impresora'];
export const COSTO_OPCIONAL = ['Alquiler'];
export const TIPOS_CON_COSTO = [...COSTO_OBLIGATORIO, ...COSTO_OPCIONAL];
const COSTO_ITEM_MAXIMO = 10000000;
const TIPO_CAMBIO_MAXIMO = 100;

export const redondear = (numero: number) => Math.round((numero + Number.EPSILON) * 100) / 100;

// Número entero entre 0 y `max`, o null si no lo es. Vacío cuenta como 0.
const leerEntero = (valor: unknown, max: number): number | null => {
  if (valor === undefined || valor === null || valor === '') return 0;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 && numero <= max ? numero : null;
};

export interface ItemParaCosto {
  tipo: string;
  nombre: string;
  cantidad: number;
  precio: number;
  // Costo de compra por unidad (uso interno).
  costoUnitario?: number | null;
}

// Mismo criterio que la cotización: un ítem es "Título" si viene marcado o si cantidad y precio son 0.
export const esTitulo = (item: Pick<ItemParaCosto, 'tipo' | 'cantidad' | 'precio'>) =>
  item.tipo === 'Título' || (Number(item.cantidad) === 0 && Number(item.precio) === 0);

// ¿Este ítem lleva costo de compra? Los títulos y los servicios no.
export const llevaCosto = (item: Pick<ItemParaCosto, 'tipo' | 'cantidad' | 'precio'>) =>
  !esTitulo(item) && TIPOS_CON_COSTO.includes(item.tipo);

export interface DetalleActividad {
  activa: boolean;
  nTecnicos: number;
  dias: number;
  noches: number;
  viajes: number;
  transporte: number;
  hospedaje: number;
  alimentacion: number;
  manoObra: number;
  subtotal: number;
}

type BaseActividad = Pick<DetalleActividad, 'activa' | 'nTecnicos' | 'dias' | 'noches' | 'viajes'>;

const INACTIVA: BaseActividad = { activa: false, nTecnicos: 0, dias: 0, noches: 0, viajes: 0 };

// Lo ingresado en una actividad -> técnicos, días, noches y viajes totales. Sin técnicos (o, en mantenimiento y
// soporte, sin visitas) la actividad no se incluye y no cuesta nada.
function expandirActividad(etapa: Actividad, datos: Partial<Record<CampoDeActividad, Valor>> | undefined, problemas: string[]): BaseActividad {
  const nombre = NOMBRE_ACTIVIDAD[etapa];
  const leer = (campo: CampoDeActividad) => {
    const valor = leerEntero(datos?.[campo], CAMPOS[campo].max);
    if (valor === null) {
      problemas.push(`${nombre}: ${CAMPOS[campo].etiqueta} debe ser un número entero entre 0 y ${CAMPOS[campo].max}`);
    }
    return valor ?? 0;
  };

  const nTecnicos = leer('nTecnicos');
  if (nTecnicos === 0) return INACTIVA;

  if (etapa === 'INSTALACION') {
    const dias = leer('dias');
    const noches = leer('noches');
    const viajes = leer('viajes');
    if (dias < 1) problemas.push(`${nombre}: indica cuántos días`);
    if (viajes < 1) problemas.push(`${nombre}: indica cuántos viajes (1 si es uno solo)`);
    if (noches > dias) problemas.push(`${nombre}: las noches no pueden ser más que los días`);
    return { activa: true, nTecnicos, dias, noches, viajes };
  }

  const visitas = leer('visitas');
  const diasPorVisita = leer('diasPorVisita');
  const nochesPorVisita = leer('nochesPorVisita');
  if (visitas === 0) return INACTIVA;
  if (diasPorVisita < 1) problemas.push(`${nombre}: indica cuántos días dura cada visita`);
  if (nochesPorVisita > diasPorVisita) problemas.push(`${nombre}: las noches de cada visita no pueden ser más que los días`);
  return {
    activa: true,
    nTecnicos,
    dias: visitas * diasPorVisita,
    noches: visitas * nochesPorVisita,
    viajes: visitas,
  };
}

// Unidades que se cobran en cada rubro: pasajes, noches de hospedaje, días de alimentación, jornadas.
export const unidadesDe = (campo: RubroCampo, a: Pick<DetalleActividad, 'nTecnicos' | 'dias' | 'noches' | 'viajes'>) => {
  if (campo === 'transporte') return a.nTecnicos * a.viajes;
  if (campo === 'hospedaje') return a.nTecnicos * a.noches;
  return a.nTecnicos * a.dias;
};

export interface CostoItem {
  costoUnitario: number | null;
  costoSubtotal: number;
}

function costoDeItem(item: ItemParaCosto, problemas: string[]): CostoItem | null {
  const nombre = item.nombre || 'sin nombre';
  const obligatorio = COSTO_OBLIGATORIO.includes(item.tipo);
  if (esTitulo(item) || !(obligatorio || COSTO_OPCIONAL.includes(item.tipo))) return null;

  const crudo: unknown = item.costoUnitario;
  if (crudo === undefined || crudo === null || crudo === '') {
    if (obligatorio) {
      problemas.push(`El ítem «${nombre}» necesita su costo de compra`);
      return null;
    }
    return { costoUnitario: null, costoSubtotal: 0 };
  }

  const costo = Number(crudo);
  if (!Number.isFinite(costo) || costo < 0 || costo > COSTO_ITEM_MAXIMO) {
    problemas.push(`El costo de compra del ítem «${nombre}» no es válido`);
    return null;
  }
  const costoUnitario = redondear(costo);
  return { costoUnitario, costoSubtotal: redondear((Number(item.cantidad) || 0) * costoUnitario) };
}

export interface TarifaUsada {
  tarifaId: number;
  monto: number;
  destino: string;
  heredada: boolean;
  vigenteDesde: string;
}

export interface EntradaEstimacion {
  actividades: Actividades;
  // Lo que rige para el destino elegido; sin tarifario cargado, undefined.
  tarifas: Partial<Record<Inductor, TarifaVigente | null>> | undefined;
  destino?: string;
  items?: ItemParaCosto[];
  costoDiagnostico?: number;
  // % que fijó el jefe, o null si aún no lo definió (se aplica 0 y se avisa con `sinTasaImprevistos`).
  tasaImprevistos?: number | null;
  // Subtotal de la cotización en su moneda, sin IGV.
  ventaSinIGV?: number;
  moneda?: string;
  tipoCambio?: Valor | null;
}

export interface ResultadoEstimacion {
  actividades: Record<Actividad, DetalleActividad>;
  costosItems: (CostoItem | null)[];
  tarifasUsadas: Partial<Record<Inductor, TarifaUsada>>;
  transporte: number;
  hospedaje: number;
  alimentacion: number;
  manoObra: number;
  viaticos: number;
  materiales: number;
  diagnostico: number;
  directosFuturos: number;
  tasaImprevistos: number;
  sinTasaImprevistos: boolean;
  imprevistos: number;
  costoTotal: number;
  ventaSinIGV: number;
  tipoCambio: number;
  ventaSoles: number;
  // null cuando no hay venta con la que compararlo.
  margen: number | null;
}

// Nunca falla: devuelve el resultado con lo que se pudo calcular y la lista de `problemas` que impiden darla por
// buena (falta una tarifa, un costo de compra...). El servidor rechaza al guardar si hay alguno.
export function calcularEstimacion({
  actividades,
  tarifas,
  destino = 'GENERAL',
  items = [],
  costoDiagnostico = 0,
  tasaImprevistos = null,
  ventaSinIGV = 0,
  moneda = 'SOLES',
  tipoCambio = null,
}: EntradaEstimacion): { resultado: ResultadoEstimacion; problemas: string[] } {
  const problemas: string[] = [];

  // 1. Actividades y su costo, con las tarifas usadas
  const detalle = {} as Record<Actividad, DetalleActividad>;
  const tarifasUsadas: Partial<Record<Inductor, TarifaUsada>> = {};
  const tarifasFaltantes = new Set<Inductor>();

  for (const etapa of ACTIVIDADES) {
    const base = expandirActividad(etapa, actividades?.[etapa], problemas);
    const actividad: DetalleActividad = { ...base, transporte: 0, hospedaje: 0, alimentacion: 0, manoObra: 0, subtotal: 0 };

    for (const rubro of RUBROS) {
      const cantidad = unidadesDe(rubro.campo, actividad);
      if (cantidad === 0) continue;

      const tarifa = tarifas?.[rubro.inductor] ?? null;
      if (!tarifa) {
        tarifasFaltantes.add(rubro.inductor);
        continue;
      }

      actividad[rubro.campo] = redondear(cantidad * tarifa.monto);
      tarifasUsadas[rubro.inductor] = {
        tarifaId: tarifa.tarifaId,
        monto: tarifa.monto,
        destino: tarifa.destino,
        heredada: tarifa.heredada,
        vigenteDesde: tarifa.vigenteDesde,
      };
    }

    actividad.subtotal = redondear(RUBROS.reduce((total, rubro) => total + actividad[rubro.campo], 0));
    detalle[etapa] = actividad;
  }

  for (const rubro of RUBROS.filter((r) => tarifasFaltantes.has(r.inductor))) {
    problemas.push(`Falta la tarifa de ${rubro.tarifa} para ${destino}: pídele al jefe que la registre en el Tarifario`);
  }

  const sumar = (campo: RubroCampo) => redondear(ACTIVIDADES.reduce((total, etapa) => total + detalle[etapa][campo], 0));
  const transporte = sumar('transporte');
  const hospedaje = sumar('hospedaje');
  const alimentacion = sumar('alimentacion');
  const manoObra = sumar('manoObra');
  const viaticos = redondear(transporte + hospedaje + alimentacion);

  // 2. Materiales
  const costosItems = items.map((item) => costoDeItem(item, problemas));
  const materiales = redondear(costosItems.reduce((total, costo) => total + (costo?.costoSubtotal ?? 0), 0));

  // 3. Totales
  const diagnostico = redondear(Number(costoDiagnostico) || 0);
  const directosFuturos = redondear(viaticos + manoObra + materiales);
  if (directosFuturos === 0) {
    problemas.push('La estimación no tiene costos: completa alguna actividad o el costo de compra de los materiales');
  }
  const tasa = tasaImprevistos ?? 0;
  const imprevistos = redondear((directosFuturos * tasa) / 100);
  const costoTotal = redondear(directosFuturos + diagnostico + imprevistos);

  // 4. Venta en soles y margen
  let cambio = 1;
  if (moneda === 'DÓLARES') {
    cambio = Number(tipoCambio);
    if (!(cambio > 0 && cambio <= TIPO_CAMBIO_MAXIMO)) {
      problemas.push('Ingresa el tipo de cambio (soles por dólar)');
      cambio = 0;
    }
    cambio = Math.round(cambio * 10000) / 10000;
  }
  const venta = redondear(Number(ventaSinIGV) || 0);
  const ventaSoles = redondear(venta * cambio);
  const margen = ventaSoles > 0 ? redondear(((ventaSoles - costoTotal) / ventaSoles) * 100) : null;

  return {
    resultado: {
      actividades: detalle,
      costosItems,
      tarifasUsadas,
      transporte,
      hospedaje,
      alimentacion,
      manoObra,
      viaticos,
      materiales,
      diagnostico,
      directosFuturos,
      tasaImprevistos: tasa,
      sinTasaImprevistos: tasaImprevistos === null || tasaImprevistos === undefined,
      imprevistos,
      costoTotal,
      ventaSinIGV: venta,
      tipoCambio: cambio,
      ventaSoles,
      margen,
    },
    problemas,
  };
}

// VERDE: el margen estimado llega al mínimo del jefe. ROJO: está por debajo. SIN_MINIMO: el jefe aún no definió el
// mínimo. SIN_VENTA: todavía no hay precio con el que calcularlo.
export type Semaforo = 'VERDE' | 'ROJO' | 'SIN_MINIMO' | 'SIN_VENTA';

export const semaforoMargen = (margen: number | null, minimo: number | null): Semaforo => {
  if (margen === null) return 'SIN_VENTA';
  if (minimo === null) return 'SIN_MINIMO';
  return margen >= minimo ? 'VERDE' : 'ROJO';
};

export const ETIQUETA_SEMAFORO: Record<Semaforo, { texto: string; estilo: string }> = {
  VERDE: { texto: 'En rango', estilo: 'bg-emerald-100 text-emerald-700 border-emerald-300/60' },
  ROJO: { texto: 'Bajo el mínimo', estilo: 'bg-rose-100 text-rose-700 border-rose-300/60' },
  SIN_MINIMO: { texto: 'Mínimo sin definir', estilo: 'bg-slate-200 text-slate-700 border-slate-300/60' },
  SIN_VENTA: { texto: 'Sin venta', estilo: 'bg-slate-200 text-slate-700 border-slate-300/60' },
};

export const formatearPorcentaje = (valor: number) =>
  `${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

// Lo que se envía al servidor al guardar la cotización (números enteros; vacío = 0).
export interface EstimacionPayload {
  destino: string;
  // Solo en cotizaciones en dólares.
  tipoCambio?: number;
  actividades: {
    INSTALACION: { nTecnicos: number; dias: number; noches: number; viajes: number };
    MANTENIMIENTO: { nTecnicos: number; visitas: number; diasPorVisita: number; nochesPorVisita: number };
    SOPORTE: { nTecnicos: number; visitas: number; diasPorVisita: number; nochesPorVisita: number };
  };
}

const num = (valor: Valor) => Number(valor) || 0;

export const aPayloadEstimacion = (
  destino: string,
  tipoCambio: Valor,
  { INSTALACION: i, MANTENIMIENTO: m, SOPORTE: s }: Actividades
): EstimacionPayload => ({
  destino,
  ...(tipoCambio !== '' ? { tipoCambio: Number(tipoCambio) } : {}),
  actividades: {
    INSTALACION: { nTecnicos: num(i.nTecnicos), dias: num(i.dias), noches: num(i.noches), viajes: num(i.viajes) },
    MANTENIMIENTO: { nTecnicos: num(m.nTecnicos), visitas: num(m.visitas), diasPorVisita: num(m.diasPorVisita), nochesPorVisita: num(m.nochesPorVisita) },
    SOPORTE: { nTecnicos: num(s.nTecnicos), visitas: num(s.visitas), diasPorVisita: num(s.diasPorVisita), nochesPorVisita: num(s.nochesPorVisita) },
  },
});
