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
  detalleImpresora?: DetalleImpresora;
}

export interface CotizacionData {
  cliente: string;
  ruc: string;
  direccion: string;
  // Correo del cliente (registrado en Clientes) para que el empleado la envíe manualmente.
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

// --- Inductores de costo (uso interno: no se imprimen en el PDF del cliente) ---

// Categorías fijas de gastos logísticos que arman el costo interno del servicio.
export const CATEGORIAS_COSTO = ['Alimentación', 'Hospedaje', 'Transporte', 'Horas-hombre'] as const;
export type CategoriaCosto = typeof CATEGORIAS_COSTO[number];

export interface CostoInductor {
  categoria: CategoriaCosto;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

// --- Payload que espera POST /api/cotizaciones ---

export interface CrearCotizacionItem {
  tipo: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
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
  items: CrearCotizacionItem[];
  costos?: Omit<CostoInductor, 'subtotal'>[];
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
  costos: Array<CostoInductor & { inductorCostoId: number; cotizacionId: number }>;
  costoInternoTotal: number;
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

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export async function crearCotizacion(
  payload: CrearCotizacionPayload
): Promise<CotizacionCreada> {
  const response = await fetch(`${apiBaseUrl}/cotizaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo guardar la cotización');
  }

  return response.json();
}

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

  const response = await fetch(`${apiBaseUrl}/cotizaciones?${params.toString()}`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar las cotizaciones');
  }

  return response.json();
}

// El motivo es obligatorio al rechazar y se ignora al aceptar.
export async function actualizarEstadoCotizacion(
  cotizacionId: number,
  estado: EstadoCotizacion,
  motivo?: string
): Promise<CotizacionListada> {
  const response = await fetch(`${apiBaseUrl}/cotizaciones/${cotizacionId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado, motivo }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo actualizar la cotización');
  }

  return response.json();
}


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

export async function obtenerCotizacionesDeSolicitud(solicitudId: number): Promise<CotizacionDeSolicitud[]> {
  const response = await fetch(`${apiBaseUrl}/cotizaciones/solicitud/${solicitudId}`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar las cotizaciones del servicio');
  }

  return response.json();
}

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
