export interface CotizacionItem {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface CotizacionData {
  cliente: string;
  ruc: string;
  tipo_persona: string;
  direccion: string;
  fecha: string;
  solicitante: string;
  moneda: string;
  items: CotizacionItem[];
}