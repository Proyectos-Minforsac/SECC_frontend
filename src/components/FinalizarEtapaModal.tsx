import AgregarEditarModal from './Modal';

interface FinalizarEtapaModalProps {
  isOpen: boolean;
  clienteNombre: string;
  // Etapa que se finaliza y las que se habilitan para el técnico al hacerlo.
  etapa: string;
  etapasHabilitadas: string[];
  // Mientras se guarda en el servidor se bloquean los botones.
  guardando: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export default function FinalizarEtapaModal({
  isOpen,
  clienteNombre,
  etapa,
  etapasHabilitadas,
  guardando,
  onClose,
  onConfirmar,
}: FinalizarEtapaModalProps) {
  return (
    <AgregarEditarModal isOpen={isOpen} onClose={guardando ? () => undefined : onClose} title="Finalizar etapa">
      <div className="flex flex-col gap-3 my-3">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{clienteNombre}</p>
          <p className="text-gray-600">{etapa}</p>
        </div>

        <p className="text-sm text-white">
          ¿Finalizar la etapa "{etapa}"? No se podrán agregar más visitas a esta etapa.
        </p>
        <p className="text-sm text-slate-300">
          Se habilitarán {etapasHabilitadas.map((e) => `"${e}"`).join(' y ')} para el técnico.
        </p>

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
            type="button"
            onClick={onConfirmar}
            disabled={guardando}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}
          >
            {guardando ? 'Finalizando etapa...' : 'Finalizar etapa'}
          </button>
        </div>
      </div>
    </AgregarEditarModal>
  );
}
