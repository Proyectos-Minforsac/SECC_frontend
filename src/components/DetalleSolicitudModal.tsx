import AgregarEditarModal from './Modal';
import { formatearFechaISO, type SolicitudServicio } from '../services/solicitudes';

interface DetalleSolicitudModalProps {
  solicitud: SolicitudServicio | null;
  onClose: () => void;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{etiqueta}</p>
      <p className="text-black">{valor || '—'}</p>
    </div>
  );
}

export default function DetalleSolicitudModal({ solicitud, onClose }: DetalleSolicitudModalProps) {
  const cliente = solicitud?.cliente;
  const autorizacion = solicitud?.autorizacion;

  return (
    <AgregarEditarModal
      isOpen={solicitud !== null}
      onClose={onClose}
      title="Detalles del servicio autorizado"
    >
      {solicitud && (
        <div className="flex flex-col gap-3 my-3 max-h-[70vh] overflow-y-auto text-sm">
          <section className="bg-white rounded-2xl px-5 py-3 shadow-sm flex flex-col gap-2">
            <h4 className="font-semibold text-[#222861]">Datos del cliente</h4>
            <Dato etiqueta="Nombre o razón social" valor={cliente?.nombre ?? solicitud.clienteNombre} />
            <Dato etiqueta="RUC" valor={cliente?.ruc} />
            <Dato etiqueta="Tipo de persona" valor={cliente?.tipoPersona} />
            <Dato etiqueta="Correo electrónico" valor={cliente?.correoElectronico} />
          </section>

          <section className="bg-white rounded-2xl px-5 py-3 shadow-sm flex flex-col gap-2">
            <h4 className="font-semibold text-[#222861]">Servicio</h4>
            <Dato etiqueta="Descripción del servicio" valor={solicitud.descripcion} />
            <Dato etiqueta="Instrucciones para la visita" valor={autorizacion?.instrucciones} />
          </section>

          <section className="bg-white rounded-2xl px-5 py-3 shadow-sm flex flex-col gap-2">
            <h4 className="font-semibold text-[#222861]">Fechas y ubicación</h4>
            <Dato
              etiqueta="Fechas tentativas"
              valor={
                autorizacion
                  ? `Del ${formatearFechaISO(autorizacion.fechaInicio)} al ${formatearFechaISO(autorizacion.fechaFin)}`
                  : undefined
              }
            />
            <Dato etiqueta="Ubicación de la empresa" valor={cliente?.direccion} />
          </section>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </AgregarEditarModal>
  );
}
