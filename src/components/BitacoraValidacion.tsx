import { ETIQUETA_ACCION, type Anotacion } from '../services/estimaciones';
import { formatearPorcentaje } from '../services/calculoCostos';
import { formatearMonto } from '../services/solicitudes';
import { formatearFechaHora } from '../services/visitas';

const ESTILO_ACCION: Record<Anotacion['accion'], string> = {
  ENVIAR: 'bg-slate-100 text-slate-700 border-slate-300/60',
  VALIDAR: 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
  AJUSTAR: 'bg-amber-100 text-amber-800 border-amber-300/60',
  DEVOLVER: 'bg-rose-100 text-rose-700 border-rose-300/60',
};

// El recorrido de la cotización por la validación: quién hizo qué y cuándo, con el costo antes y después y la
// justificación. Solo se agregan anotaciones; las que ya están nunca se modifican.
export default function BitacoraValidacion({ anotaciones }: { anotaciones: Anotacion[] }) {
  if (anotaciones.length === 0) {
    return <p className="text-sm text-slate-400">Todavía no hay anotaciones.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {anotaciones.map((a) => {
        const cambioCosto = a.costoAntes !== null && a.costoDespues !== null && a.costoAntes !== a.costoDespues;

        return (
          <li key={a.ajusteId} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border whitespace-nowrap ${ESTILO_ACCION[a.accion]}`}>
                  {ETIQUETA_ACCION[a.accion]}
                </span>
                <span className="text-slate-500">versión {a.version}</span>
              </div>
              <span className="text-sm text-slate-400">
                {a.usuario} ({a.rol}) · {formatearFechaHora(a.fecha)}
              </span>
            </div>

            {cambioCosto && (
              <p className="mt-2 text-slate-700">
                Costo: {formatearMonto(a.costoAntes!)} → <strong>{formatearMonto(a.costoDespues!)}</strong>
                {a.margenAntes !== null && a.margenDespues !== null &&
                  ` · margen ${formatearPorcentaje(a.margenAntes)} → ${formatearPorcentaje(a.margenDespues)}`}
              </p>
            )}
            {a.justificacion && <p className="mt-2 text-slate-700 select-text">“{a.justificacion}”</p>}
          </li>
        );
      })}
    </ol>
  );
}
