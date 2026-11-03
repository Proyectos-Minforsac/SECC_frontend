import { useEffect, useSyncExternalStore } from 'react';
import { cargarResumenCostos, obtenerResumenCostos, suscribirseAResumenCostos } from '../services/costosReales';

// Los costos y márgenes de cada servicio. Solo para pantallas del trabajador y del jefe: el técnico no accede a ellos.
export function useResumenCostos() {
  // Cada pantalla que lo usa lo refresca al abrirse, para ver lo que cambió el otro rol.
  useEffect(() => {
    cargarResumenCostos().catch((error) => console.error('Error al cargar los costos de los servicios', error));
  }, []);

  return useSyncExternalStore(suscribirseAResumenCostos, obtenerResumenCostos);
}
