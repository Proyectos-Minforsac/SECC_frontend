import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  ESTILO_ESTADO_TARIFA,
  INDUCTORES,
  etiquetaInductor,
  type Inductor,
  type Tarifa,
} from '../services/tarifario';
import { formatearFechaISO, formatearMonto } from '../services/solicitudes';
import { formatearFechaHora } from '../services/visitas';

interface HistorialTarifasTablaProps {
  tarifas: Tarifa[];
  destinos: string[];
}

const ESTILO_FILTRO =
  'w-full h-10 appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none';

// Todas las tarifas que se han registrado, con quién y cuándo. Nunca se borran ni se editan.
export default function HistorialTarifasTabla({ tarifas, destinos }: HistorialTarifasTablaProps) {
  const [inductor, setInductor] = useState<Inductor | ''>('');
  const [destino, setDestino] = useState('');

  const filtradas = tarifas.filter((t) => (!inductor || t.inductor === inductor) && (!destino || t.destino === destino));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <div className="relative h-10">
          <select value={inductor} onChange={(e) => setInductor(e.target.value as Inductor | '')} className={ESTILO_FILTRO}>
            <option value="">Todos los inductores</option>
            {INDUCTORES.map((i) => (
              <option key={i.clave} value={i.clave}>{i.etiqueta}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
        <div className="relative h-10">
          <select value={destino} onChange={(e) => setDestino(e.target.value)} className={ESTILO_FILTRO}>
            <option value="">Todos los destinos</option>
            {destinos.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead>
            <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
              <th className="py-3 px-3.5">Registrada</th>
              <th className="py-3 px-3.5">Inductor</th>
              <th className="py-3 px-3.5">Destino</th>
              <th className="py-3 px-3.5 text-right">Monto</th>
              <th className="py-3 px-3.5 text-center">Rige desde</th>
              <th className="py-3 px-3.5">Registrada por</th>
              <th className="py-3 px-3.5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtradas.length > 0 ? (
              filtradas.map((tarifa) => (
                <tr key={tarifa.tarifaId} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40">
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500">
                    {tarifa.registradoEn ? formatearFechaHora(tarifa.registradoEn) : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-800">{etiquetaInductor(tarifa.inductor)}</td>
                  <td className="py-2.5 px-3.5 text-slate-700">{tarifa.destino}</td>
                  <td className="py-2.5 px-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                    {formatearMonto(tarifa.monto)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{formatearFechaISO(tarifa.vigenteDesde)}</td>
                  <td className="py-2.5 px-3.5 text-slate-700">{tarifa.registradoPor || '—'}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${ESTILO_ESTADO_TARIFA[tarifa.estado]}`}>
                      {tarifa.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  {tarifas.length === 0 ? 'Aún no se registró ninguna tarifa.' : 'No hay tarifas con esos filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
