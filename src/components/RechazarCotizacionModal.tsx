import { useEffect, useState } from 'react';
import AgregarEditarModal from './Modal';

interface RechazarCotizacionModalProps {
  isOpen: boolean;
  numeroCotizacion: string;
  clienteNombre: string;
  // Mientras se guarda en el servidor se bloquean los botones.
  guardando: boolean;
  onClose: () => void;
  onConfirmar: (motivo: string) => void;
}

export default function RechazarCotizacionModal({
  isOpen,
  numeroCotizacion,
  clienteNombre,
  guardando,
  onClose,
  onConfirmar,
}: RechazarCotizacionModalProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return setError('Indica el motivo por el que se rechaza la cotización.');

    onConfirmar(motivo.trim());
  };

  return (
    <AgregarEditarModal isOpen={isOpen} onClose={guardando ? () => undefined : onClose} title="Rechazar cotización">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{numeroCotizacion}</p>
          <p className="text-gray-600">{clienteNombre}</p>
        </div>

        <label className="text-white">Motivo del rechazo</label>
        <textarea
          placeholder="Por qué el cliente rechazó la cotización"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full h-28 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
        />

        <p className="text-xs text-slate-300">
          El servicio se cancelará porque no se llegó a un acuerdo con el cliente, y se avisará al técnico.
        </p>

        {error && <p className="text-sm text-red-300 text-center">{error}</p>}

        <div className="flex flex-row justify-center items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-1.5 bg-rose-500 text-white text-sm font-medium rounded-full hover:bg-rose-600 transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? 'Rechazando…' : 'Rechazar cotización'}
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
