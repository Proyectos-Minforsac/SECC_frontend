import { ESTILO_ESTADO_COTIZACION, type CotizacionListada } from '../services/cotizaciones';

interface CotizacionesTableProps {
  cotizaciones: CotizacionListada[];
  actualizandoId: number | null;
  onAceptar: (cotizacionId: number) => void;
  onRechazar: (cotizacionId: number) => void;
}

export default function CotizacionesTable({
  cotizaciones,
  actualizandoId,
  onAceptar,
  onRechazar,
}: CotizacionesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5">N° Cotización</th>
            <th className="py-3 px-3.5">Cliente</th>
            <th className="py-3 px-3.5">Solicitante</th>
            <th className="py-3 px-3.5 text-center">Fecha</th>
            <th className="py-3 px-3.5 text-right">Total</th>
            <th className="py-3 px-3.5 text-center">Estado</th>
            <th className="py-3 px-3.5 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cotizaciones.length > 0 ? (
            cotizaciones.map((cotizacion) => (
              <tr
                key={cotizacion.cotizacionId}
                className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40"
              >
                <td className="py-2.5 px-3.5 font-medium text-slate-500 whitespace-nowrap">{cotizacion.numeroCotizacion}</td>
                <td className="py-2.5 px-3.5 font-semibold text-slate-800">{cotizacion.clienteNombre}</td>
                <td className="py-2.5 px-3.5 text-slate-700">{cotizacion.solicitante}</td>
                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{cotizacion.fecha}</td>
                <td className="py-2.5 px-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                  {cotizacion.moneda === 'DÓLARES' ? 'US$ ' : 'S/ '}{Number(cotizacion.total).toFixed(2)}
                </td>
                <td className="py-2.5 px-3.5 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${ESTILO_ESTADO_COTIZACION[cotizacion.estado]}`}>
                    {cotizacion.estado}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-center">
                  {cotizacion.estado === 'PENDIENTE' ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        disabled={actualizandoId === cotizacion.cotizacionId}
                        onClick={() => onAceptar(cotizacion.cotizacionId)}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full hover:bg-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Aceptar
                      </button>
                      <button
                        disabled={actualizandoId === cotizacion.cotizacionId}
                        onClick={() => onRechazar(cotizacion.cotizacionId)}
                        className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full hover:bg-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-6 text-center text-slate-400">
                No hay cotizaciones registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
