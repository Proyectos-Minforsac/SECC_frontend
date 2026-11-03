import { pedir } from './http';

// Qué es cada parámetro (etiqueta, unidad y rango válido). Lo envía el backend para no repetirlo aquí.
export interface DefinicionParametro {
  clave: string;
  etiqueta: string;
  unidad: string;
  min: number;
  max: number;
  entero: boolean;
  // null = sin valor por defecto: queda "sin definir" hasta que el jefe lo ingrese.
  defecto: number | null;
  ayuda: string;
}

export interface ValorParametro {
  // Valor que se usa: el guardado o, si no hay, el por defecto (null si no hay ninguno).
  valor: number | null;
  // true cuando el jefe lo ingresó.
  definido: boolean;
  esDefecto: boolean;
  actualizadoPor: string;
  // Instante ISO de la última actualización.
  actualizadoEn: string;
}

export interface ParametrosCosto {
  definiciones: DefinicionParametro[];
  valores: Record<string, ValorParametro>;
}

export const obtenerParametros = () =>
  pedir<ParametrosCosto>('/parametros-costo', 'GET', undefined, 'No se pudieron cargar los parámetros de costo');

// null deja el parámetro sin definir (o con su valor por defecto).
export const guardarParametros = (valores: Record<string, number | null>) =>
  pedir<ParametrosCosto>('/parametros-costo', 'PUT', { valores }, 'No se pudieron guardar los parámetros de costo');
