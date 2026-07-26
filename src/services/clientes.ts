export interface Cliente {
  cliente_id: number;
  nombre: string;
  direccion: string;
  ruc: string;
  correo_electronico: string;
  tipo_persona: string;
}

export interface ClientesPaginados {
  clientes: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nombre: string;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export async function obtenerClientes(
  page: number = 1,
  limit: number = 9,
  search: string
): Promise<ClientesPaginados> {
  const response = await fetch(`${apiBaseUrl}/clientes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los clientes');
  }

  return response.json();
}
