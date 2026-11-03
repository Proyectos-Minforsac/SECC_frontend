import { useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import ActividadCostos from './ActividadCostos';
import { ACTIVIDADES, type Actividad, type Actividades, type ResultadoEstimacion, type Valor } from '../services/calculoCostos';
import { formatearMonto } from '../services/solicitudes';

interface HojaCostosProps {
  cargando: boolean;
  // Sin tarifario no se puede estimar.
  errorTarifario: string;
  destinos: string[];
  destino: string;
  onDestino: (destino: string) => void;
  moneda: string;
  tipoCambio: Valor;
  onTipoCambio: (valor: Valor) => void;
  actividades: Actividades;
  onActividades: (actividades: Actividades) => void;
  resultado: ResultadoEstimacion;
}

// Estimación de costos del proceso (uso interno, no aparece en el PDF). Es obligatoria: el trabajador indica cuántos
// técnicos, días y noches necesita cada actividad y el sistema calcula el costo con las tarifas del jefe.
export default function HojaCostos({
  cargando,
  errorTarifario,
  destinos,
  destino,
  onDestino,
  moneda,
  tipoCambio,
  onTipoCambio,
  actividades,
  onActividades,
  resultado,
}: HojaCostosProps) {
  const [abierta, setAbierta] = useState(true);

  const cambiar = (etapa: Actividad, campo: string, valor: Valor) =>
    onActividades({ ...actividades, [etapa]: { ...actividades[etapa], [campo]: valor } });

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        className="w-full bg-[#E2E4E9] rounded-full px-5 py-2.5 flex items-center justify-between text-black hover:bg-white transition-all shadow-sm focus:outline-none"
      >
        <div className="flex items-center gap-2 cursor-pointer">
          <Wallet className="w-4 h-4 text-black" />
          <span className="text-sm font-medium">Hoja de costos del proceso (uso interno)</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-black transition-transform duration-300 cursor-pointer ${abierta ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {abierta && (
        <div className="bg-[#1C204E] rounded-2xl p-4 space-y-4 border border-[#343C8F]">
          {cargando && <p className="text-sm text-slate-300">Cargando tarifas...</p>}
          {errorTarifario && (
            <p className="text-sm text-rose-300">
              No se pudo cargar el tarifario ({errorTarifario}). Sin él no se puede estimar el costo.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-300">
              Destino (define las tarifas)
              <div className="relative">
                <select
                  value={destino}
                  onChange={(e) => onDestino(e.target.value)}
                  className="w-full h-9 appearance-none bg-white rounded-full px-3 pr-8 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                >
                  {destinos.map((d) => (
                    <option key={d} value={d}>{d === 'GENERAL' ? 'GENERAL (tarifa general)' : d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
              </div>
            </label>

            {moneda === 'DÓLARES' && (
              <label className="flex flex-col gap-1 text-[11px] text-slate-300">
                Tipo de cambio (S/ por US$)
                <input
                  type="number"
                  min={0}
                  step={0.001}
                  placeholder="3.75"
                  value={tipoCambio}
                  onChange={(e) => onTipoCambio(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-9 w-full bg-white rounded-full px-3 text-black text-center text-sm outline-none shadow-sm"
                />
              </label>
            )}
          </div>

          {ACTIVIDADES.map((etapa) => (
            <div key={etapa} className="border-t border-[#343C8F] pt-3">
              <ActividadCostos
                etapa={etapa}
                datos={actividades[etapa] as unknown as Record<string, Valor>}
                detalle={resultado.actividades[etapa]}
                tarifasUsadas={resultado.tarifasUsadas}
                onCambiar={(campo, valor) => cambiar(etapa, campo, valor)}
              />
            </div>
          ))}

          <div className="border-t border-[#343C8F] pt-3 space-y-1 text-[11px] text-slate-300">
            <p className="flex justify-between gap-3">
              <span>Materiales: el costo de compra se ingresa al agregar cada ítem</span>
              <span className="text-white">{formatearMonto(resultado.materiales)}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span>Diagnóstico: monto de la oferta aceptada</span>
              <span className="text-white">{formatearMonto(resultado.diagnostico)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
