export interface Cliente {
  cliente_id: number;
  nombre: string;
  direccion: string;
  correo_electronico: string;
  tipo_persona: string;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export async function obtenerClientes(): Promise<Cliente[]> {
  const response = await fetch(`${apiBaseUrl}/clientes`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los clientes');
  }

  return response.json();
}
