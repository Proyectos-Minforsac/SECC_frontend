import { ETIQUETA_SEMAFORO, formatearPorcentaje, semaforoMargen } from '../services/calculoCostos';
import { ETIQUETA_ORIGEN, fechaDeCierre, type ServicioRentabilidad } from '../services/rentabilidad';
import { formatearMonto } from '../services/solicitudes';

interface TablaServiciosRentabilidadProps {
  servicios: ServicioRentabilidad[];
  margenMinimo: number | null;
}

const conSigno = (valor: number) => `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${Math.abs(valor).toFixed(2)}`;
const monto = (valor: number | null) => (valor === null ? '—' : formatearMonto(valor));
const NUMERO = { fontVariantNumeric: 'tabular-nums' } as const;

// Un renglón por servicio cerrado, con su semáforo: si el margen real llegó al mínimo del jefe y si el costo quedó dentro de
// la tolerancia. El estado nunca va solo en el color: lleva su texto.
export default function TablaServiciosRentabilidad({ servicios, margenMinimo }: TablaServiciosRentabilidadProps) {
  if (servicios.length === 0) {
    return <p className="px-6 pb-6 text-sm text-slate-400">No hay servicios cerrados con estos filtros.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-sm font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5">Servicio</th>
            <th className="py-3 px-3.5">Tipo</th>
            <th className="py-3 px-3.5 text-center">Cierre</th>
            <th className="py-3 px-3.5 text-right">Venta</th>
            <th className="py-3 px-3.5 text-right">Costo est.</th>
            <th className="py-3 px-3.5 text-right">Costo real</th>
            <th className="py-3 px-3.5 text-right">Margen est.</th>
            <th className="py-3 px-3.5 text-right">Margen real</th>
            <th className="py-3 px-3.5 text-right">Desv.</th>
            <th className="py-3 px-3.5 text-center">Margen mínimo</th>
            <th className="py-3 px-3.5 text-center">Tolerancia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {servicios.map((servicio, indice) => {
            const semaforo = semaforoMargen(servicio.margenReal, margenMinimo);

            return (
              <tr key={`${servicio.resumenId}-${indice}`} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40">
                <td className="py-2.5 px-3.5">
                  <span className="block font-semibold text-slate-800">{servicio.referencia || 'Sin referencia'}</span>
                  <span className="block text-sm text-slate-400">{ETIQUETA_ORIGEN[servicio.origen]}</span>
                </td>
                <td className="py-2.5 px-3.5">{servicio.tipoServicio || '—'}</td>
                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{fechaDeCierre(servicio.cerradoEn)}</td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" style={NUMERO}>{monto(servicio.ventaSoles)}</td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" style={NUMERO}>{monto(servicio.costoEstimado)}</td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" style={NUMERO}>{monto(servicio.costoReal)}</td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" style={NUMERO}>
                  {servicio.margenEstimado === null ? '—' : formatearPorcentaje(servicio.margenEstimado)}
                </td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-medium text-slate-900" style={NUMERO}>
                  {servicio.margenReal === null ? '—' : formatearPorcentaje(servicio.margenReal)}
                </td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" style={NUMERO}>
                  {servicio.desviacionMargen === null ? '—' : `${conSigno(servicio.desviacionMargen)} pts`}
                </td>
                <td className="py-2.5 px-3.5 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border whitespace-nowrap ${ETIQUETA_SEMAFORO[semaforo].estilo}`}>
                    {ETIQUETA_SEMAFORO[semaforo].texto}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                  {servicio.dentroTolerancia === null ? (
                    <span className="text-slate-400" title="Sin tolerancia definida o sin costo estimado">—</span>
                  ) : (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border ${servicio.dentroTolerancia ? 'bg-emerald-100 text-emerald-700 border-emerald-300/60' : 'bg-rose-100 text-rose-700 border-rose-300/60'}`}>
                      {servicio.dentroTolerancia ? 'DENTRO' : 'FUERA'}
                      {servicio.desviacionCostoPorcentaje !== null && ` ${conSigno(servicio.desviacionCostoPorcentaje)} %`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
