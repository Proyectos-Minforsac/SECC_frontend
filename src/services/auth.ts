import type { Rol } from '../context/AuthContext';

export interface UsuarioAutenticado {
  usuarioId: number;
  nombre: string;
  nombreCompleto: string;
  rol: Rol;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

// Se inicia sesión con el nombre de usuario; la respuesta trae además el nombre completo para mostrarlo.
export async function login(nombreUsuario: string, contrasena: string): Promise<UsuarioAutenticado> {
  const response = await fetch(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nombreUsuario, contrasena }),
  });

  if (!response.ok) {
    const datos = await response.json().catch(() => null);
    throw new Error(datos?.message || 'No se pudo iniciar sesión');
  }

  return response.json();
}
