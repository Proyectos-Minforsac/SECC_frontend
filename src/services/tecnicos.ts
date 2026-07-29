export interface PrecioAire {
  precio_aire_id: number,
  tipo_aire: string,
  precio: number,
}

export interface Tecnico {
  tecnico_id: number,
  nombre: string,
  tipo_documento: string,
  numero_documento: string,
  telefono: string,
  ubicacion: string,
  servicio: string,
  area: string,
  calificacion: string,
  precios: PrecioAire[],
}

export type NuevoTecnico = Omit<Tecnico, 'tecnico_id'>

export interface TecnicosPaginados{ 
  tecnicos: Tecnico[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nombre: string;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export async function obtenerTecnicos(
  page: number = 1,
  limit: number = 9,
  search: string
): Promise<TecnicosPaginados> {
  const response = await fetch(`${apiBaseUrl}/tecnicos?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los técnicos');
  }

  return response.json();
}
