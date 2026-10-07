import type { Rol } from '../context/AuthContext';

export interface UsuarioAutenticado {
  usuarioId: number;
  nombre: string;
  rol: Rol;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export async function login(nombre: string, contrasena: string): Promise<UsuarioAutenticado> {
  const response = await fetch(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nombre, contrasena }),
  });

  if (!response.ok) {
    const datos = await response.json().catch(() => null);
    throw new Error(datos?.message || 'No se pudo iniciar sesión');
  }

  return response.json();
}
