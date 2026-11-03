import { useEffect, useState } from 'react';
import { obtenerTarifario, type Tarifario } from '../services/tarifario';
import { obtenerParametros, type ParametrosCosto } from '../services/parametrosCosto';

interface DatosDeCosto {
  cargando: boolean;
  tarifario: Tarifario | null;
  parametros: ParametrosCosto | null;
  // Sin tarifario no se puede estimar; sin parámetros sí (se aplican los valores por defecto y se avisa).
  errorTarifario: string;
  errorParametros: string;
}

const mensajeDe = (motivo: unknown, porDefecto: string) => (motivo instanceof Error ? motivo.message : porDefecto);

// Tarifas y parámetros del jefe que necesita la hoja de costos. Se piden una vez al abrir la pantalla.
export function useDatosDeCosto(): DatosDeCosto {
  const [datos, setDatos] = useState<DatosDeCosto>({
    cargando: true,
    tarifario: null,
    parametros: null,
    errorTarifario: '',
    errorParametros: '',
  });

  useEffect(() => {
    let vigente = true;

    Promise.allSettled([obtenerTarifario(), obtenerParametros()]).then(([tarifas, parametros]) => {
      if (!vigente) return;
      setDatos({
        cargando: false,
        tarifario: tarifas.status === 'fulfilled' ? tarifas.value : null,
        parametros: parametros.status === 'fulfilled' ? parametros.value : null,
        errorTarifario: tarifas.status === 'rejected' ? mensajeDe(tarifas.reason, 'No se pudo cargar el tarifario') : '',
        errorParametros:
          parametros.status === 'rejected' ? mensajeDe(parametros.reason, 'No se pudieron cargar los parámetros de costo') : '',
      });
    });

    return () => {
      vigente = false;
    };
  }, []);

  return datos;
}
