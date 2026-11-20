import type { AvanceVisita } from '../services/visitasProgramadas';
import ListaEvidencias from './ListaEvidencias';

// Avance registrado por el técnico al completar una visita: descripción y documentación adjunta.
export default function AvanceVisitaDetalle({ avance }: { avance: AvanceVisita }) {
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
      <p>{avance.descripcion}</p>
      <ListaEvidencias evidencias={avance.evidencias} />
    </div>
  );
}
