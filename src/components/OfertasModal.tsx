import AgregarEditarModal from './Modal';
import OfertaFila, { type DecisionOferta } from './OfertaFila';
import { admiteDecisionDeOfertas, type SolicitudServicio } from '../services/solicitudes';

interface OfertasModalProps {
  solicitud: SolicitudServicio | null;
  isOpen: boolean;
  onClose: () => void;
  decidiendo?: DecisionOferta | null;
  onAceptar: (ofertaId: number) => void;
  onRechazar: (ofertaId: number) => void;
}

export default function OfertasModal({ solicitud, isOpen, onClose, decidiendo = null, onAceptar, onRechazar }: OfertasModalProps) {
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
              decidiendo={decidiendo}
              onAceptar={() => onAceptar(oferta.ofertaId)}
              onRechazar={() => onRechazar(oferta.ofertaId)}
            />
          ))}
        </div>
      )}
    </AgregarEditarModal>
  );
}
