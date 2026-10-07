import AgregarEditarModal from './Modal';
import OfertaFila from './OfertaFila';
import { admiteDecisionDeOfertas, type SolicitudServicio } from '../services/solicitudes';

interface OfertasModalProps {
  solicitud: SolicitudServicio | null;
  isOpen: boolean;
  onClose: () => void;
  onAceptar: (ofertaId: number) => void;
  onRechazar: (ofertaId: number) => void;
}

export default function OfertasModal({ solicitud, isOpen, onClose, onAceptar, onRechazar }: OfertasModalProps) {
  return (
    <AgregarEditarModal
      isOpen={isOpen}
      onClose={onClose}
      title={solicitud ? `Ofertas para ${solicitud.clienteNombre}` : 'Ofertas'}
    >
      {solicitud && (
        <div className="flex flex-col gap-2.5 my-3 max-h-96 overflow-y-auto">
          {solicitud.ofertas.map((oferta) => (
            <OfertaFila
              key={oferta.ofertaId}
              oferta={oferta}
              puedeDecidir={admiteDecisionDeOfertas(solicitud.estado)}
              onAceptar={() => onAceptar(oferta.ofertaId)}
              onRechazar={() => onRechazar(oferta.ofertaId)}
            />
          ))}
        </div>
      )}
    </AgregarEditarModal>
  );
}
