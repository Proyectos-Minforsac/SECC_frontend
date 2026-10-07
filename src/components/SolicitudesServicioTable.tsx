import { useState } from 'react';
import {
  admiteDecisionDeOfertas,
  ESTILO_ESTADO,
  type SolicitudServicio,
} from '../services/solicitudes';
import OfertaFila from './OfertaFila';
import OfertasModal from './OfertasModal';

const MAX_OFERTAS_VISIBLES = 2;

interface SolicitudesServicioTableProps {
  solicitudes: SolicitudServicio[];
  onAceptarOferta: (solicitudId: number, ofertaId: number) => void;
  onRechazarOferta: (solicitudId: number, ofertaId: number) => void;
  onEditar: (solicitud: SolicitudServicio) => void;
  onEliminar: (solicitud: SolicitudServicio) => void;
}

export default function SolicitudesServicioTable({
  solicitudes,
  onAceptarOferta,
  onRechazarOferta,
  onEditar,
  onEliminar,
}: SolicitudesServicioTableProps) {
  const [solicitudModalId, setSolicitudModalId] = useState<number | null>(null);
  const solicitudModal = solicitudes.find((s) => s.solicitudId === solicitudModalId) ?? null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5 text-center">N°</th>
            <th className="py-3 px-3.5">Cliente</th>
            <th className="py-3 px-3.5">Descripción</th>
            <th className="py-3 px-3.5 text-center">Fecha</th>
            <th className="py-3 px-3.5">Enviada a</th>
            <th className="py-3 px-3.5">Técnicos que respondieron</th>
            <th className="py-3 px-3.5 text-center">Estado</th>
            <th className="py-3 px-3.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.length > 0 ? (
            solicitudes.map((solicitud) => (
              <tr
                key={solicitud.solicitudId}
                className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40"
              >
                <td className="py-2.5 px-3.5 font-medium text-slate-500 text-center">{solicitud.solicitudId}</td>
                <td className="py-2.5 px-3.5 font-semibold text-slate-800">{solicitud.clienteNombre}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{solicitud.descripcion}</td>
                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{solicitud.fecha}</td>
                <td className="py-2.5 px-3.5 text-slate-700">{solicitud.tecnicos.join(', ')}</td>
                <td className="py-2.5 px-3.5 text-slate-700 min-w-60">
                  {solicitud.ofertas.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {solicitud.ofertas.slice(0, MAX_OFERTAS_VISIBLES).map((oferta) => (
                        <OfertaFila
                          key={oferta.ofertaId}
                          oferta={oferta}
                          puedeDecidir={admiteDecisionDeOfertas(solicitud.estado)}
                          onAceptar={() => onAceptarOferta(solicitud.solicitudId, oferta.ofertaId)}
                          onRechazar={() => onRechazarOferta(solicitud.solicitudId, oferta.ofertaId)}
                        />
                      ))}
                      {solicitud.ofertas.length > MAX_OFERTAS_VISIBLES && (
                        <button
                          onClick={() => setSolicitudModalId(solicitud.solicitudId)}
                          className="text-blue-600 hover:text-blue-800 underline text-xs font-medium text-left cursor-pointer"
                        >
                          Ver todas las ofertas ({solicitud.ofertas.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">Sin ofertas</span>
                  )}
                </td>
                <td className="py-2.5 px-3.5 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${ESTILO_ESTADO[solicitud.estado]}`}>
                    {solicitud.estado}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                  {/* Una solicitud ya asignada tiene un servicio en marcha: no se edita ni se elimina. */}
                  {admiteDecisionDeOfertas(solicitud.estado) && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEditar(solicitud)}
                        className="px-4 py-1 bg-[#2A317A] text-white text-xs font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminar(solicitud)}
                        className="px-4 py-1 bg-white text-red-600 border border-red-300 text-xs font-medium rounded-full hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="py-6 text-center text-slate-400">
                No hay solicitudes de servicio.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <OfertasModal
        solicitud={solicitudModal}
        isOpen={solicitudModal !== null}
        onClose={() => setSolicitudModalId(null)}
        onAceptar={(ofertaId) => {
          if (!solicitudModal) return;
          onAceptarOferta(solicitudModal.solicitudId, ofertaId);
          setSolicitudModalId(null);
        }}
        onRechazar={(ofertaId) => solicitudModal && onRechazarOferta(solicitudModal.solicitudId, ofertaId)}
      />
    </div>
  );
}
