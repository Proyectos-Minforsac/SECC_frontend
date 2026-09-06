export interface PrecioAire {
  precioAireId: number,
  tipoAire: string,
  precio: number,
}

export type NuevoPrecioAire = Omit<PrecioAire, 'precioAireId'>

export interface Tecnico {
  tecnicoId: number,
  nombre: string,
  tipoDocumento: string,
  numeroDocumento: string,
  telefono: string,
  ubicacion: string,
  servicio: string,
  area: string,
  calificacion: string,
  precios: PrecioAire[],
}

export type NuevoTecnico = Omit<Tecnico, 'tecnicoId' | 'precios'> & {
  precios?: NuevoPrecioAire[],
}

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

export async function crearTecnico(tecnico: NuevoTecnico): Promise<Tecnico> {
  const response = await fetch(`${apiBaseUrl}/tecnicos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tecnico),
  });

  if (!response.ok) {
    throw new Error('No se pudo crear el técnico');
  }

  return response.json();
}

export async function editarTecnico(id: string, tecnico: NuevoTecnico): Promise<Tecnico> {
  const response = await fetch(`${apiBaseUrl}/tecnicos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tecnico),
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar el técnico');
  }

  return response.json();
}

export async function eliminarTecnico(id: string): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/tecnicos/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo eliminar el técnico');
  }

  return response.json();
}
