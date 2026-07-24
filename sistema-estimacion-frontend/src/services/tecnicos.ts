export interface Tecnico {
  cliente_id: number;
  nombre: string;
  direccion: string;
  correo_electronico: string;
  tipo_persona: string;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export async function obtenerTecnicos(): Promise<Tecnico[]> {
  const response = await fetch(`${apiBaseUrl}/tecnicos`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los técnicos');
  }

  return response.json();
}
