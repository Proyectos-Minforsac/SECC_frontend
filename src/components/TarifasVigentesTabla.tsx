import {
  DESTINO_GENERAL,
  INDUCTORES,
  etiquetaInductor,
  type Tarifario,
} from '../services/tarifario';
import { formatearFechaISO, formatearMonto } from '../services/solicitudes';

interface TarifasVigentesTablaProps {
  tarifario: Tarifario;
}

// Lo que rige hoy en cada destino. Si un destino no tiene tarifa propia para un inductor se muestra la de GENERAL,
// en cursiva y gris, porque es la que se aplicará.
export default function TarifasVigentesTabla({ tarifario }: TarifasVigentesTablaProps) {
  const { destinos, vigentes } = tarifario;
  const sinGeneral = INDUCTORES.filter((i) => !vigentes[DESTINO_GENERAL]?.[i.clave]);

  return (
    <div className="flex flex-col gap-3">
      {sinGeneral.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-100 border border-amber-300/60 rounded-xl px-4 py-2.5">
          Falta la tarifa GENERAL de {sinGeneral.map((i) => i.etiqueta.toLowerCase()).join(', ')}. Sin ella no se podrá
          calcular ese costo al cotizar en los destinos que no tengan tarifa propia.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead>
            <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
              <th className="py-3 px-3.5">Destino</th>
              {INDUCTORES.map((inductor) => (
                <th key={inductor.clave} className="py-3 px-3.5 text-right">
                  {inductor.etiqueta}
                  <span className="block normal-case font-normal tracking-normal text-white/70">{inductor.unidad}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {destinos.map((destino) => (
              <tr key={destino} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40">
                <td className="py-2.5 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                  {destino === DESTINO_GENERAL ? 'GENERAL (todos los destinos)' : destino}
                </td>
                {INDUCTORES.map((inductor) => {
                  const tarifa = vigentes[destino]?.[inductor.clave] ?? null;
                  return (
                    <td
                      key={inductor.clave}
                      className="py-2.5 px-3.5 text-right whitespace-nowrap"
                      title={tarifa?.heredada ? `${etiquetaInductor(inductor.clave)}: se usa la tarifa GENERAL` : undefined}
                    >
                      {tarifa ? (
                        <>
                          <span className={tarifa.heredada ? 'italic text-slate-400' : 'font-medium text-slate-800'}>
                            {formatearMonto(tarifa.monto)}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {tarifa.heredada ? 'general' : `desde ${formatearFechaISO(tarifa.vigenteDesde)}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-rose-500 text-sm font-medium">Sin tarifa</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
