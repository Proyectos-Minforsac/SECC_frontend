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
  items: CrearCotizacionItem[];
}

export interface CotizacionCreada {
  cotizacionId: number;
  numeroCotizacion: string;
  clienteId: string;
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
}

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
