const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

// Petición JSON al backend. Si responde con error lanza un Error con el mensaje que envió el servidor.
export const pedir = async <T>(
  ruta: string,
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
  cuerpo: unknown,
  porDefecto: string
): Promise<T> => {
  const respuesta = await fetch(`${apiBaseUrl}${ruta}`, {
    method: metodo,
    ...(cuerpo !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    }),
  });

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null);
    throw new Error(error?.message ?? porDefecto);
  }
  return respuesta.json();
};
