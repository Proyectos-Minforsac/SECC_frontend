import { leerSesion } from './sesion';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

// El servidor identifica a quien le escribe por el id que devolvió el inicio de sesión.
export const cabeceraSesion = (): Record<string, string> => {
  const sesion = leerSesion();
  return sesion ? { Authorization: `Usuario ${sesion.usuarioId}` } : {};
};

// Petición JSON al backend. Si responde con error lanza un Error con el mensaje que envió el servidor.
export const pedir = async <T>(
  ruta: string,
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  cuerpo: unknown,
  porDefecto: string
): Promise<T> => {
  const respuesta = await fetch(`${apiBaseUrl}${ruta}`, {
    method: metodo,
    headers: {
      ...cabeceraSesion(),
      ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
    },
    ...(cuerpo !== undefined && { body: JSON.stringify(cuerpo) }),
  });

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null);
    throw new Error(error?.message ?? porDefecto);
  }
  return respuesta.json();
};
