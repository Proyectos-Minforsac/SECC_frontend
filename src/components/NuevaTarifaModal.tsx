import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import AgregarEditarModal from './Modal';
import { hoyISO } from '../services/mantenimientos';
import { DESTINO_GENERAL, INDUCTORES, type Inductor, type NuevaTarifa } from '../services/tarifario';
import { aceptarMonto } from '../services/montos';

interface NuevaTarifaModalProps {
  isOpen: boolean;
  // Destinos que ya tienen tarifa, para sugerirlos al escribir.
  destinos: string[];
  guardando?: boolean;
  onClose: () => void;
  onGuardar: (tarifa: NuevaTarifa) => void;
}

export default function NuevaTarifaModal({ isOpen, destinos, guardando = false, onClose, onGuardar }: NuevaTarifaModalProps) {
  const [inductor, setInductor] = useState<Inductor | ''>('');
  const [destino, setDestino] = useState(DESTINO_GENERAL);
  const [monto, setMonto] = useState('');
  const [vigenteDesde, setVigenteDesde] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInductor('');
      setDestino(DESTINO_GENERAL);
      setMonto('');
      setVigenteDesde(hoyISO());
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    const valor = Number(monto);
    if (!inductor) return setError('Selecciona el inductor de costo.');
    if (!destino.trim()) return setError('Ingresa el destino o deja GENERAL.');
    if (!monto || !Number.isFinite(valor) || valor <= 0) return setError('Ingresa un monto mayor a 0.');
    if (!vigenteDesde) return setError('Ingresa desde cuándo rige la tarifa.');

    onGuardar({ inductor, destino: destino.trim(), monto: valor, vigenteDesde });
  };

  return (
    <AgregarEditarModal isOpen={isOpen} onClose={onClose} title="Nueva tarifa">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3">
        <label className="text-white">Inductor de costo</label>
        <div className="relative">
          <select
            value={inductor}
            onChange={(e) => setInductor(e.target.value as Inductor)}
            className="w-full appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
          >
            <option value="" disabled>Seleccionar inductor</option>
            {INDUCTORES.map((i) => (
              <option key={i.clave} value={i.clave}>{i.etiqueta} ({i.unidad})</option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        <label className="text-white">Destino</label>
        <input
          type="text"
          list="destinos-tarifario"
          maxLength={60}
          placeholder="GENERAL o el nombre de un destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
        />
        <datalist id="destinos-tarifario">
          {destinos.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
        <p className="text-sm text-white/70 px-1 -mt-1">
          GENERAL rige para todos los destinos que no tengan tarifa propia.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-white">
            Monto
            <div className="relative">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-gray-500">S/</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => aceptarMonto(e.target.value, setMonto)}
                className="w-full bg-white rounded-full pl-12 pr-5 py-2.5 text-sm text-black placeholder-gray-500 shadow-sm outline-none"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-white">
            Rige desde
            <input
              type="date"
              value={vigenteDesde}
              onChange={(e) => setVigenteDesde(e.target.value)}
              className="w-full bg-white rounded-full px-4 py-2.5 text-sm text-black outline-none shadow-sm"
            />
          </label>
        </div>

        <p className="text-sm text-white/70 px-1">
          Las tarifas no se modifican: la nueva rige desde la fecha indicada y la anterior queda en el historial. Si te
          equivocas, registra otra con la misma fecha y reemplaza a esta.
        </p>

        {error && <p className="text-sm text-red-300 text-center">{error}</p>}

        <div className="flex flex-row justify-center items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}
          >
            {guardando ? 'Registrando tarifa...' : 'Registrar tarifa'}
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
