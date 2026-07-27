export interface Cliente {
  cliente_id: number;
  nombre: string;
  direccion: string;
  ruc: string;
  correo_electronico: string;
  tipo_persona: string;
}

export type NuevoCliente = Omit<Cliente, 'cliente_id'>

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

export async function crearCliente(
  cliente: NuevoCliente
): Promise<Cliente> {
  const response = await fetch(`${apiBaseUrl}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error('No se pudo crear el cliente');
  }

  return response.json();
}

export async function editarCliente(id: string, cliente: NuevoCliente): Promise<Cliente> {
  const response = await fetch(`${apiBaseUrl}/clientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error('No se pudo crear el cliente');
  }

  return response.json()
}

export async function eliminarCliente(id: string): Promise<Cliente> {
  const response = await fetch(`${apiBaseUrl}/clientes/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo crear el cliente');
  }

  return response.json()
}