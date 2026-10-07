import { useEffect, useState } from 'react';
import AgregarEditarModal from './Modal';
import type { AutorizacionViaje } from '../services/solicitudes';

interface AutorizarViajeModalProps {
  isOpen: boolean;
  clienteNombre: string;
  tecnicoNombre: string;
  onClose: () => void;
  onAutorizar: (autorizacion: AutorizacionViaje) => void;
}

export default function AutorizarViajeModal({
  isOpen,
  clienteNombre,
  tecnicoNombre,
  onClose,
  onAutorizar,
}: AutorizarViajeModalProps) {
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescripcion('');
      setFechaInicio('');
      setFechaFin('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return setError('Ingresa las instrucciones para la visita.');
    if (!fechaInicio || !fechaFin) return setError('Ingresa las fechas tentativas de la visita.');
    if (fechaFin < fechaInicio) return setError('La fecha final no puede ser anterior a la inicial.');
    onAutorizar({ instrucciones: descripcion.trim(), fechaInicio, fechaFin });
  }

  return (
    <AgregarEditarModal isOpen={isOpen} onClose={onClose} title="Autorizar viaje del técnico">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{clienteNombre}</p>
          <p className="text-gray-600">Técnico asignado: {tecnicoNombre}</p>
        </div>

        <label className="text-white">Descripción</label>
        <textarea
          placeholder="Instrucciones para la primera visita técnica"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full h-28 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
        />

        <label className="text-white">Fechas tentativas</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-white/80">
            Desde
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-white rounded-full px-4 py-2 text-sm text-black outline-none shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/80">
            Hasta
            <input
              type="date"
              value={fechaFin}
              min={fechaInicio}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-white rounded-full px-4 py-2 text-sm text-black outline-none shadow-sm"
            />
          </label>
        </div>

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
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Autorizar viaje
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
