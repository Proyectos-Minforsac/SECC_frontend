import { formatearPorcentaje } from '../services/calculoCostos';
import type { Agrupacion } from '../services/rentabilidad';
import { formatearMonto } from '../services/solicitudes';

interface TablaAgrupadaProps {
  // Qué agrupa cada renglón: «Tipo de servicio», «Periodo»...
  encabezado: string;
  grupos: Agrupacion[];
  etiqueta?: (clave: string) => string;
}

const conSigno = (valor: number) => `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${Math.abs(valor).toFixed(2)}`;

// Los servicios agrupados (por tipo, por mes): cuántos son, cuánto se vendió y el margen estimado frente al real.
export default function TablaAgrupada({ encabezado, grupos, etiqueta = (clave) => clave }: TablaAgrupadaProps) {
  if (grupos.length === 0) return <p className="text-sm text-slate-400">No hay servicios con estos filtros.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="text-sm uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-3 font-semibold">{encabezado}</th>
            <th className="py-2 px-3 font-semibold text-right">Servicios</th>
            <th className="py-2 px-3 font-semibold text-right">Venta</th>
            <th className="py-2 px-3 font-semibold text-right">Margen est.</th>
            <th className="py-2 px-3 font-semibold text-right">Margen real</th>
            <th className="py-2 pl-3 font-semibold text-right">Desv.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {grupos.map((grupo) => (
            <tr key={grupo.clave}>
              <td className="py-1.5 pr-3 text-slate-800">{etiqueta(grupo.clave)}</td>
              <td className="py-1.5 px-3 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{grupo.servicios}</td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatearMonto(grupo.ventaSoles)}</td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {grupo.margenEstimado === null ? '—' : formatearPorcentaje(grupo.margenEstimado)}
              </td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap font-medium text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {grupo.margenReal === null ? '—' : formatearPorcentaje(grupo.margenReal)}
              </td>
              <td className="py-1.5 pl-3 text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {grupo.desviacionMargen === null ? '—' : `${conSigno(grupo.desviacionMargen)} pts`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
