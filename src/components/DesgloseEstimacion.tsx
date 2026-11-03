import {
  ACTIVIDADES,
  ETIQUETA_SEMAFORO,
  FACTOR_RUBRO,
  NOMBRE_ACTIVIDAD,
  RUBROS,
  formatearPorcentaje,
  pluralizar,
  semaforoMargen,
} from '../services/calculoCostos';
import { formatearMonto } from '../services/solicitudes';
import type { DetalleEstimacion } from '../services/estimaciones';

const dinero = (valor: number | null) => formatearMonto(valor ?? 0);

// Lo que el jefe revisa antes de decidir: de dónde sale cada costo (actividad, rubro, tarifa usada), los materiales con
// su costo de compra y qué margen deja frente a lo que se va a cobrar. Es de solo lectura y de uso interno.
export default function DesgloseEstimacion({ detalle }: { detalle: DetalleEstimacion }) {
  const { estimacion: e, lineas, items, margenMinimo } = detalle;
  const enDolares = e.moneda === 'DÓLARES';
  const ajustada = e.costoFinal !== null && e.costoParametrico !== null && e.costoFinal !== e.costoParametrico;
  const semaforo = semaforoMargen(e.margenFinal, margenMinimo);
  const viaticos = (e.costoTransporte ?? 0) + (e.costoHospedaje ?? 0) + (e.costoAlimentacion ?? 0);

  const fila = (etiqueta: string, valor: number | null, nota?: string) => (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">
        {etiqueta}
        {nota && <span className="text-slate-400"> {nota}</span>}
      </span>
      <span className="font-medium text-slate-800">{dinero(valor)}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Resumen y margen */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1 text-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Costo estimado</h3>
          {fila('Viáticos', viaticos, '(transporte, hospedaje y alimentación)')}
          {fila('Mano de obra', e.costoManoObra)}
          {fila('Materiales', e.costoMateriales)}
          {fila('Diagnóstico', e.costoDiagnostico, '(oferta aceptada)')}
          {fila('Imprevistos', e.costoImprevistos, e.tasaImprevistos === null ? '' : `(${e.tasaImprevistos} %)`)}
          <div className="flex justify-between gap-3 pt-2 mt-1 border-t border-slate-200 font-bold text-slate-900">
            <span>Costo estimado</span>
            <span>{dinero(e.costoParametrico)}</span>
          </div>
          {ajustada && (
            <div className="flex justify-between gap-3 font-bold text-amber-700">
              <span>Costo ajustado por el jefe</span>
              <span>{dinero(e.costoFinal)}</span>
            </div>
          )}
        </div>

        <div className="space-y-1 text-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Venta y margen</h3>
          <div className="flex justify-between gap-3">
            <span className="text-slate-600">Venta sin IGV{enDolares ? ' (US$)' : ''}</span>
            <span className="font-medium text-slate-800">
              {enDolares
                ? `US$ ${(e.ventaSinIGV ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                : dinero(e.ventaSinIGV)}
            </span>
          </div>
          {enDolares && (
            <>
              {fila('Venta en soles', e.ventaSoles, e.tipoCambio === null ? '' : `(tipo de cambio ${e.tipoCambio})`)}
            </>
          )}
          <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-slate-200">
            <div>
              <p className="font-bold text-slate-900">
                Margen: {e.margenFinal === null ? '—' : formatearPorcentaje(e.margenFinal)}
              </p>
              <p className="text-[11px] text-slate-500">
                {margenMinimo === null ? 'El mínimo aún no está definido' : `Mínimo: ${formatearPorcentaje(margenMinimo)}`}
                {ajustada && e.margenParametrico !== null && ` · antes del ajuste: ${formatearPorcentaje(e.margenParametrico)}`}
              </p>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border whitespace-nowrap ${ETIQUETA_SEMAFORO[semaforo].estilo}`}>
              {ETIQUETA_SEMAFORO[semaforo].texto}
            </span>
          </div>
        </div>
      </section>

      {/* Por actividad y rubro */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Actividades · destino {e.destino || 'GENERAL'}
        </h3>
        {ACTIVIDADES.map((etapa) => {
          const delaEtapa = lineas.filter((linea) => linea.etapa === etapa);
          if (delaEtapa.length === 0) return null;

          return (
            <div key={etapa} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <div className="flex justify-between gap-3 font-semibold text-slate-800">
                <span>{NOMBRE_ACTIVIDAD[etapa]}</span>
                <span>{dinero(delaEtapa.reduce((total, linea) => total + linea.subtotal, 0))}</span>
              </div>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                {delaEtapa.map((linea) => {
                  const rubro = RUBROS.find((r) => r.categoria === linea.categoria);
                  if (!rubro) return null;

                  const factor = FACTOR_RUBRO[rubro.campo];
                  const tarifa = e.tarifasUsadas?.[rubro.inductor];
                  return (
                    <li key={linea.categoria} className="flex justify-between gap-3">
                      <span>
                        {`${rubro.etiqueta}: ${pluralizar(linea.nTecnicos, 'técnico')} × ${pluralizar(factor.cantidad(linea), factor.unidad)} × ${formatearMonto(linea.costoUnitario)}`}
                        {tarifa && (
                          <span className="text-slate-400">
                            {' '}({tarifa.heredada || tarifa.destino === 'GENERAL' ? 'tarifa general' : `tarifa de ${tarifa.destino}`}, desde {tarifa.vigenteDesde})
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-slate-800">{formatearMonto(linea.subtotal)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {lineas.length === 0 && <p className="text-sm text-slate-400">La estimación no tiene actividades: el costo viene de los materiales.</p>}
      </section>

      {/* Ítems con su costo de compra */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Ítems de la cotización</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Ítem</th>
                <th className="py-2 px-3 font-semibold text-right">Cant.</th>
                <th className="py-2 px-3 font-semibold text-right">Precio</th>
                <th className="py-2 px-3 font-semibold text-right">Subtotal venta</th>
                <th className="py-2 px-3 font-semibold text-right">Costo de compra</th>
                <th className="py-2 pl-3 font-semibold text-right">Costo total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, indice) => (
                <tr key={indice} className={item.tipo === 'Título' ? 'font-semibold text-slate-800' : ''}>
                  <td className="py-2 pr-3">
                    {item.nombre}
                    <span className="text-slate-400"> · {item.tipo}</span>
                  </td>
                  {item.tipo === 'Título' ? (
                    <td colSpan={5} />
                  ) : (
                    <>
                      <td className="py-2 px-3 text-right">{item.cantidad}</td>
                      <td className="py-2 px-3 text-right">{item.precioUnitario.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{item.subtotal.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{item.costoUnitario === null ? '—' : item.costoUnitario.toFixed(2)}</td>
                      <td className="py-2 pl-3 text-right">{item.costoSubtotal === null ? '—' : item.costoSubtotal.toFixed(2)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400">
          Los servicios no llevan costo de compra: su costo está en la mano de obra de las actividades.
        </p>
      </section>
    </div>
  );
}
