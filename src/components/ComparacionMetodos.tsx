import { formatearPorcentaje } from '../services/calculoCostos';
import type { Comparacion, ExactitudMetodo } from '../services/rentabilidad';
import { formatearMonto } from '../services/solicitudes';

interface ComparacionMetodosProps {
  comparacion: Comparacion;
  // Tolerancia de desviación que fijó el jefe, o null si aún no la definió
  tolerancia: number | null;
}

const conSigno = (valor: number) => `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${Math.abs(valor).toFixed(2)}`;

function Tabla({ metodos, mejor }: { metodos: ExactitudMetodo[]; mejor: string | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-3 font-semibold">Método</th>
            <th className="py-2 px-3 font-semibold text-right">Servicios</th>
            <th className="py-2 px-3 font-semibold text-right">Error medio</th>
            <th className="py-2 px-3 font-semibold text-right">Error medio (%)</th>
            <th className="py-2 px-3 font-semibold text-right">Tiende a</th>
            <th className="py-2 pl-3 font-semibold text-right">Dentro de la tolerancia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {metodos.map((metodo) => (
            <tr key={metodo.clave}>
              <td className="py-1.5 pr-3 text-slate-800">
                {metodo.etiqueta}
                {metodo.clave === mejor && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border bg-emerald-100 text-emerald-700 border-emerald-300/60 whitespace-nowrap">
                    ✓ MÁS EXACTO
                  </span>
                )}
              </td>
              <td className="py-1.5 px-3 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{metodo.n}</td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {metodo.errorMedioAbsoluto === null ? '—' : formatearMonto(metodo.errorMedioAbsoluto)}
              </td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap font-medium text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {metodo.errorPorcentualMedio === null ? '—' : formatearPorcentaje(metodo.errorPorcentualMedio)}
              </td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap">
                {metodo.sesgoPorcentual === null
                  ? '—'
                  : metodo.sesgoPorcentual === 0
                    ? 'Sin sesgo'
                    : `${metodo.sesgoPorcentual > 0 ? 'Estimar de más' : 'Estimar de menos'} (${conSigno(metodo.sesgoPorcentual)} %)`}
              </td>
              <td className="py-1.5 pl-3 text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {metodo.dentroTolerancia === null ? '—' : formatearPorcentaje(metodo.dentroTolerancia)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Qué tan cerca estuvo cada método del costo real (HU-38). El error es (estimado − real) / real: positivo si el método
// estimó de más. Como no todos los servicios traen los tres estimados, la comparación justa es sobre los que sí los traen.
export default function ComparacionMetodos({ comparacion, tolerancia }: ComparacionMetodosProps) {
  const { metodos, comunes, mejor, basadoEn } = comparacion;
  const hayDatos = metodos.some((metodo) => metodo.n > 0);

  if (!hayDatos) {
    return (
      <p className="text-sm text-slate-400">
        Todavía no hay servicios cerrados con costo estimado y real para comparar los métodos.
      </p>
    );
  }

  const nombreMejor = metodos.find((metodo) => metodo.clave === mejor)?.etiqueta;

  return (
    <div className="space-y-4">
      {comunes.n > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Comparación justa: {comunes.n} servicio{comunes.n === 1 ? '' : 's'} con los tres estimados
          </p>
          <Tabla metodos={comunes.metodos} mejor={basadoEn === 'COMUNES' ? mejor : null} />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Cada método con todos los servicios que lo tienen</p>
        <Tabla metodos={metodos} mejor={basadoEn === 'PROPIOS' ? mejor : null} />
      </div>

      <p className="text-[11px] text-slate-400">
        {nombreMejor
          ? `El más exacto es «${nombreMejor}», con el menor error medio. `
          : 'Hacen falta al menos dos métodos con servicios para decir cuál es más exacto. '}
        {tolerancia === null && 'Define la tolerancia de desviación en el Tarifario para ver cuántos servicios caen dentro. '}
        El método análogo solo tiene datos en las cotizaciones hechas cuando ya había servicios similares suficientes.
      </p>
    </div>
  );
}
