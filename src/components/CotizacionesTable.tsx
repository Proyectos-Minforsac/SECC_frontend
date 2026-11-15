import { ESTILO_ESTADO_COTIZACION, ESTILO_ESTADO_VALIDACION, type CotizacionListada } from '../services/cotizaciones';

// Cambio de estado que se está enviando al servidor.
export interface ActualizacionCotizacion {
  cotizacionId: number;
  accion: 'aceptar' | 'rechazar';
}

interface CotizacionesTableProps {
  cotizaciones: CotizacionListada[];
  actualizando: ActualizacionCotizacion | null;
  // El jefe es quien revisa las cotizaciones en validación; el trabajador solo espera su decisión.
  esJefe: boolean;
  onAceptar: (cotizacionId: number) => void;
  onRechazar: (cotizacionId: number) => void;
  onVerPdf: (cotizacionId: number) => void;
  onCorregir: (cotizacionId: number) => void;
  onRevisar: (cotizacionId: number) => void;
}

const BOTON_NEUTRO =
  'px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full hover:bg-slate-200 transition-colors cursor-pointer';

export default function CotizacionesTable({
  cotizaciones,
  actualizando,
  esJefe,
  onAceptar,
  onRechazar,
  onVerPdf,
  onCorregir,
  onRevisar,
}: CotizacionesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-sm font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5">N° Cotización</th>
            <th className="py-3 px-3.5">Cliente</th>
            <th className="py-3 px-3.5">Solicitante</th>
            <th className="py-3 px-3.5 text-center">Fecha</th>
            <th className="py-3 px-3.5 text-right">Total</th>
            <th className="py-3 px-3.5 text-center">Validación</th>
            <th className="py-3 px-3.5 text-right">Margen</th>
            <th className="py-3 px-3.5 text-center">Estado</th>
            <th className="py-3 px-3.5 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cotizaciones.length > 0 ? (
            cotizaciones.map((cotizacion) => {
              const ocupada = actualizando?.cotizacionId === cotizacion.cotizacionId;
              // Sin estimación (anteriores al control de costos) o validada: se puede entregar y decidir.
              const entregable = cotizacion.validacionEstado === '' || cotizacion.validacionEstado === 'VALIDADA';

              return (
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
                    {cotizacion.validacionEstado ? (
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border whitespace-nowrap ${ESTILO_ESTADO_VALIDACION[cotizacion.validacionEstado]}`}>
                        {cotizacion.validacionEstado}
                      </span>
                    ) : (
                      <span className="text-slate-400" title="Anterior al control de costos: no pasa por validación">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    {cotizacion.margen === null ? <span className="text-slate-400">—</span> : `${Number(cotizacion.margen).toFixed(2)} %`}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border ${ESTILO_ESTADO_COTIZACION[cotizacion.estado]}`}>
                      {cotizacion.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {cotizacion.estado === 'PENDIENTE' && cotizacion.validacionEstado === 'EN REVISIÓN' && (
                        esJefe ? (
                          <button
                            onClick={() => onRevisar(cotizacion.cotizacionId)}
                            className="px-3 py-1 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors cursor-pointer"
                          >
                            Revisar
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">Esperando al jefe</span>
                        )
                      )}

                      {cotizacion.estado === 'PENDIENTE' && cotizacion.validacionEstado === 'DEVUELTA' && (
                        <button
                          onClick={() => onCorregir(cotizacion.cotizacionId)}
                          className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          Corregir
                        </button>
                      )}

                      {entregable && (
                        <button onClick={() => onVerPdf(cotizacion.cotizacionId)} className={BOTON_NEUTRO}>
                          Ver PDF
                        </button>
                      )}

                      {cotizacion.estado === 'PENDIENTE' && entregable && (
                        <>
                          <button
                            disabled={ocupada}
                            onClick={() => onAceptar(cotizacion.cotizacionId)}
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full hover:bg-emerald-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {ocupada && actualizando.accion === 'aceptar' ? 'Aceptando cotización...' : 'Aceptar'}
                          </button>
                          <button
                            disabled={ocupada}
                            onClick={() => onRechazar(cotizacion.cotizacionId)}
                            className="px-3 py-1 bg-rose-100 text-rose-700 text-sm font-medium rounded-full hover:bg-rose-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {ocupada && actualizando.accion === 'rechazar' ? 'Rechazando cotización...' : 'Rechazar'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="py-6 text-center text-slate-400">
                No hay cotizaciones registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
