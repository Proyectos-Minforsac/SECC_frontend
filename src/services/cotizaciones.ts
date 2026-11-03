import { pedir } from './http';
import type { Cliente } from './clientes';
import type { EstimacionPayload } from './calculoCostos';

export interface DetalleImpresora {
  fecha: string;
  tienda: string;
  cargo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  casoHD: string;
}

export interface CotizacionItem {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  cantidad: number;
  precio: number;
  total: number;
  // Costo de compra por unidad (uso interno, no se imprime). Solo en Producto, Impresora y Alquiler.
  costoUnitario?: number;
  detalleImpresora?: DetalleImpresora;
}

export interface CotizacionData {
  cliente: string;
  ruc: string;
  direccion: string;
  // Correo del cliente (registrado en Clientes) para que el trabajador la envíe manualmente.
  correo?: string;
  fecha: string;
  solicitante: string;
  moneda: string;
  numeroCotizacion?: string;
  subtotal?: number;
  igv?: number;
  total?: number;
  items: CotizacionItem[];
}

// --- Payload que espera POST /api/cotizaciones ---

export interface CrearCotizacionItem {
  tipo: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  // Costo de compra por unidad (uso interno): obligatorio en Producto e Impresora.
  costoUnitario?: number;
  orden: number;
  detalleImpresora?: DetalleImpresora;
}

export interface CrearCotizacionPayload {
  clienteId: number;
  fecha: string;
  solicitante: string;
  moneda: string;
  estado?: string;
  numeroCotizacion?: string;
  // Solicitud de servicio de origen (si la cotización nace de una notificación de
  // diagnóstico completado); permite activar la visita técnica al aceptarla.
  solicitudId?: number;
  // Garantía del servicio en meses (4 a 6). El servicio la hereda al aceptarse la cotización.
  garantiaMeses?: number;
  items: CrearCotizacionItem[];
  // Estimación de costos (uso interno): obligatoria. El servidor la recalcula con las tarifas vigentes.
  estimacion: EstimacionPayload;
  // Solo si la crea el jefe (queda validada): por qué acepta un margen bajo el mínimo.
  justificacion?: string;
}

// Lo que se envía para corregir una cotización devuelta: lo mismo, salvo el cliente y la solicitud, que no cambian.
export type CorregirCotizacionPayload = Pick<
  CrearCotizacionPayload,
  'solicitante' | 'moneda' | 'garantiaMeses' | 'items' | 'estimacion' | 'justificacion'
>;

// Estado de la estimación de una cotización frente al jefe. Las cotizaciones anteriores al control de costos no tienen.
export type EstadoValidacion = 'EN REVISIÓN' | 'VALIDADA' | 'DEVUELTA';

export const ESTILO_ESTADO_VALIDACION: Record<EstadoValidacion, string> = {
  'EN REVISIÓN': 'bg-amber-100 text-amber-700 border-amber-300/60',
  'VALIDADA': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
  'DEVUELTA': 'bg-rose-100 text-rose-700 border-rose-300/60',
};

// Resumen de la estimación que guardó el servidor.
export interface EstimacionGuardada {
  estimacionId: number;
  // 1 al crear la cotización; sube cada vez que se corrige y se reenvía.
  version: number;
  estado: EstadoValidacion;
  destino: string;
  viaticos: number;
  manoObra: number;
  materiales: number;
  diagnostico: number;
  imprevistos: number;
  costoTotal: number;
  ventaSoles: number;
  margen: number | null;
}

export interface CotizacionCreada {
  cotizacionId: number;
  numeroCotizacion: string;
  clienteId: string;
  solicitudId?: string;
  fecha: string;
  solicitante: string;
  moneda: string;
  estado: string;
  subtotal: number;
  igv: number;
  total: number;
  items: Array<{
    itemCotizacionId: number;
    itemId: number;
    tipo: string;
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    orden: number;
    esTitulo: boolean;
    detalleImpresora: (DetalleImpresora & { detalleImpresoraId: number; itemCotizacionId: number }) | null;
  }>;
  estimacion: EstimacionGuardada;
}

// --- Listado de cotizaciones (tabla general) ---

export type EstadoCotizacion = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface CotizacionListada {
  cotizacionId: number;
  clienteId: string;
  clienteNombre: string;
  solicitudId?: string;
  numeroCotizacion: string;
  fecha: string;
  solicitante: string;
  moneda: string;
  estado: EstadoCotizacion;
  subtotal: number;
  igv: number;
  total: number;
  // Estimación vigente: vacío en las cotizaciones anteriores al control de costos (que no pasan por validación).
  estimacionId: number | null;
  validacionEstado: EstadoValidacion | '';
  // Margen estimado (o el que dejó el jefe al ajustar), en %. Es de uso interno.
  margen: number | null;
}

export interface CotizacionesPaginadas {
  cotizaciones: CotizacionListada[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ESTILO_ESTADO_COTIZACION: Record<EstadoCotizacion, string> = {
  'PENDIENTE': 'bg-amber-100 text-amber-700 border-amber-300/60',
  'ACEPTADA': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
  'RECHAZADA': 'bg-rose-100 text-rose-700 border-rose-300/60',
};

// Las cotizaciones llevan costos internos: todas las llamadas pasan por `pedir`, que identifica a quien las hace.
export const crearCotizacion = (payload: CrearCotizacionPayload) =>
  pedir<CotizacionCreada>('/cotizaciones', 'POST', payload, 'No se pudo guardar la cotización');

// Corrige una cotización devuelta: reemplaza sus ítems y vuelve a enviar la estimación al jefe.
export const corregirCotizacion = (cotizacionId: number, payload: CorregirCotizacionPayload) =>
  pedir<CotizacionCreada>(`/cotizaciones/${cotizacionId}`, 'PUT', payload, 'No se pudo guardar la cotización corregida');

// Todo lo necesario para reabrir una cotización devuelta en el formulario.
export interface CotizacionParaEdicion {
  cotizacionId: number;
  numeroCotizacion: string;
  clienteId: number;
  cliente: Cliente | null;
  solicitante: string;
  moneda: string;
  garantiaMeses: number | null;
  solicitudId: number | null;
  items: Array<{
    tipo: string;
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    costoUnitario: number | null;
    detalleImpresora: DetalleImpresora | null;
  }>;
  // Lo que se ingresó en la estimación (tal como lo guardó el servidor).
  estimacion: {
    estimacionId: number;
    version: number;
    entradas: {
      destino: string;
      tipoCambio: number;
      actividades: EstimacionPayload['actividades'];
    } | null;
  };
  // Por qué el jefe la devolvió.
  devolucion: { usuario: string; fecha: string; motivo: string } | null;
}

export const obtenerCotizacionParaEdicion = (cotizacionId: number) =>
  pedir<CotizacionParaEdicion>(`/cotizaciones/${cotizacionId}/edicion`, 'GET', undefined, 'No se pudo cargar la cotización devuelta');

// Cotización lista para su PDF. El servidor la entrega solo si el jefe la validó.
export const obtenerCotizacion = (cotizacionId: number) =>
  pedir<CotizacionDeSolicitud>(`/cotizaciones/${cotizacionId}`, 'GET', undefined, 'No se pudo cargar la cotización');

export async function obtenerCotizaciones(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  estado: string = ''
): Promise<CotizacionesPaginadas> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  if (estado) {
    params.set('estado', estado);
  }

  return pedir<CotizacionesPaginadas>(`/cotizaciones?${params.toString()}`, 'GET', undefined, 'No se pudieron cargar las cotizaciones');
}

// El motivo es obligatorio al rechazar y se ignora al aceptar.
export const actualizarEstadoCotizacion = (cotizacionId: number, estado: EstadoCotizacion, motivo?: string) =>
  pedir<CotizacionListada>(
    `/cotizaciones/${cotizacionId}/estado`,
    'PATCH',
    { estado, motivo },
    'No se pudo actualizar la cotización'
  );


// Cotización completa (cliente + ítems) tal como la devuelve GET /api/cotizaciones/solicitud/:id
export interface CotizacionDeSolicitud {
  numeroCotizacion: string;
  fecha: string;
  solicitante: string;
  moneda: string;
  estado: EstadoCotizacion;
  subtotal: number;
  igv: number;
  total: number;
  cliente: { nombre: string; ruc: string; direccion: string; correoElectronico: string } | null;
  items: Array<{
    tipo: string;
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    detalleImpresora: DetalleImpresora | null;
  }>;
}

export const obtenerCotizacionesDeSolicitud = (solicitudId: number) =>
  pedir<CotizacionDeSolicitud[]>(
    `/cotizaciones/solicitud/${solicitudId}`,
    'GET',
    undefined,
    'No se pudieron cargar las cotizaciones del servicio'
  );

// Datos para dibujar el PDF de la cotización (el mismo documento que se envía al cliente).
export const aDatosCotizacion = (c: CotizacionDeSolicitud): CotizacionData => ({
  cliente: c.cliente?.nombre ?? '',
  ruc: c.cliente?.ruc ?? '',
  direccion: c.cliente?.direccion ?? '',
  correo: c.cliente?.correoElectronico,
  fecha: c.fecha,
  solicitante: c.solicitante,
  moneda: c.moneda,
  numeroCotizacion: c.numeroCotizacion,
  subtotal: c.subtotal,
  igv: c.igv,
  total: c.total,
  items: c.items.map((item, indice) => ({
    id: indice + 1,
    nombre: item.nombre,
    descripcion: item.descripcion,
    tipo: item.tipo,
    cantidad: item.cantidad,
    precio: item.precioUnitario,
    total: item.subtotal,
    detalleImpresora: item.detalleImpresora ?? undefined,
  })),
});
