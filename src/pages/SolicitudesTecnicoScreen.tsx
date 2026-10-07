import { useState } from "react"
import AgregarEditarModal from "../components/Modal"
import DetalleSolicitudModal from "../components/DetalleSolicitudModal"
import {
  admiteDecisionDeOfertas,
  enviarOferta,
  ESTILO_ESTADO,
  formatearMonto,
  type SolicitudServicio,
} from "../services/solicitudes"
import { useSolicitudes } from "../hooks/useSolicitudes"
import { agregarNotificacion } from "../services/notificaciones"
import { useAuth } from "../context/AuthContext"

export default function SolicitudesTecnicoScreen() {
  const { usuario } = useAuth();
  const tecnicoNombre = usuario?.nombre ?? "";

  const todasLasSolicitudes = useSolicitudes();
  // Solo las solicitudes que el empleado envió a este técnico
  const solicitudes = todasLasSolicitudes.filter((s) => s.tecnicos.includes(tecnicoNombre));
  const [solicitudActiva, setSolicitudActiva] = useState<SolicitudServicio | null>(null);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const solicitudDetalle = solicitudes.find((s) => s.solicitudId === detalleId) ?? null;
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const miOferta = (solicitud: SolicitudServicio) =>
    solicitud.ofertas.find((oferta) => oferta.tecnicoNombre === tecnicoNombre);

  const abrirModal = (solicitud: SolicitudServicio) => {
    setSolicitudActiva(solicitud);
    setMonto(miOferta(solicitud)?.montoVisita.toString() ?? "");
    setError("");
  }

  const cerrarModal = () => {
    setSolicitudActiva(null);
    setMonto("");
    setError("");
  }

  const handleEnviarOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudActiva) return;

    const montoVisita = Number(monto);
    if (!monto || !Number.isFinite(montoVisita) || montoVisita <= 0) {
      return setError("Ingresa un monto válido para la visita.");
    }

    setEnviando(true);
    try {
      await enviarOferta(solicitudActiva.solicitudId, { tecnicoNombre, montoVisita });
    } catch (err) {
      setEnviando(false);
      return setError(err instanceof Error ? err.message : "No se pudo enviar la oferta.");
    }
    setEnviando(false);

    agregarNotificacion({
      rolDestino: 'empleado',
      solicitudId: solicitudActiva.solicitudId,
      mensaje: `${tecnicoNombre} envió una oferta de ${formatearMonto(montoVisita)} para la solicitud de ${solicitudActiva.clienteNombre}.`,
    });

    cerrarModal();
  }

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="text-4xl font-bold text-black tracking-tight mb-8">Solicitudes de Servicios</h1>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
                <th className="py-3 px-3.5 text-center">N°</th>
                <th className="py-3 px-3.5">Cliente</th>
                <th className="py-3 px-3.5">Descripción</th>
                <th className="py-3 px-3.5 text-center">Fecha</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Mi oferta de visita</th>
                <th className="py-3 px-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitudes.length > 0 ? (
                solicitudes.map((solicitud) => {
                  const oferta = miOferta(solicitud);
                  const puedeOfertar = admiteDecisionDeOfertas(solicitud.estado);
                  const puedeVerDetalles = solicitud.estado === 'AUTORIZADO' && oferta?.estado === 'ACEPTADA';

                  return (
                    <tr
                      key={solicitud.solicitudId}
                      className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40"
                    >
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 text-center">{solicitud.solicitudId}</td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800">{solicitud.clienteNombre}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">{solicitud.descripcion}</td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{solicitud.fecha}</td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${ESTILO_ESTADO[solicitud.estado]}`}>
                          {solicitud.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                        {oferta ? formatearMonto(oferta.montoVisita) : <span className="text-slate-400 font-normal">Sin enviar</span>}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {puedeOfertar && (
                          <button
                            onClick={() => abrirModal(solicitud)}
                            className="px-4 py-1 bg-[#2A317A] text-white text-xs font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            {oferta ? "Editar oferta" : "Enviar oferta"}
                          </button>
                        )}
                        {puedeVerDetalles && (
                          <button
                            onClick={() => setDetalleId(solicitud.solicitudId)}
                            className="px-4 py-1 bg-[#2A317A] text-white text-xs font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            Ver detalles
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No has recibido solicitudes de servicio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DetalleSolicitudModal solicitud={solicitudDetalle} onClose={() => setDetalleId(null)} />

        <AgregarEditarModal
          isOpen={solicitudActiva !== null}
          onClose={cerrarModal}
          title="Oferta por la visita técnica"
        >
          {solicitudActiva && (
            <form onSubmit={handleEnviarOferta} className="flex flex-col gap-3 my-3">
              <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
                <p className="font-semibold">{solicitudActiva.clienteNombre}</p>
                <p className="text-gray-600">{solicitudActiva.descripcion}</p>
              </div>

              <label className="text-white">Monto total de la visita</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-gray-500">S/</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-white rounded-full pl-12 pr-5 py-2.5 text-sm text-black placeholder-gray-500 shadow-sm outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-300 text-center">{error}</p>}

              <div className="flex flex-row justify-center items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm ${enviando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}
                >
                  {enviando ? "Enviando oferta..." : "Enviar oferta"}
                </button>
              </div>
            </form>
          )}
        </AgregarEditarModal>
      </main>
    </div>
  )
}
