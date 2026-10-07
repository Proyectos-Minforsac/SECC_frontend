import { useState } from "react";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useVisitas } from "../hooks/useVisitas";
import { useVisitasProgramadas } from "../hooks/useVisitasProgramadas";
import { useSolicitudes } from "../hooks/useSolicitudes";
import VisitasTecnicasTable from "../components/VisitasTecnicasTable";
import VisitaProgramadaModal, { type DatosVisitaProgramada } from "../components/VisitaProgramadaModal";
import AvanceVisitaDetalle from "../components/AvanceVisitaDetalle";
import SeguimientoVisitas from "../components/SeguimientoVisitas";
import DetalleVisitaPanel from "../components/DetalleVisitaPanel";
import {
  detalleVisitaDiagnostico,
  detalleVisitaProgramada,
  type SeleccionVisita,
} from "../services/detalleVisita";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Toast from "../components/Toast";
import { agregarNotificacion } from "../services/notificaciones";
import {
  agregarVisitaProgramada,
  editarVisitaProgramada,
  eliminarVisitaProgramada,
  formatearFechaISO,
  ordenarPorFechaHora,
  type VisitaProgramada,
} from "../services/visitasProgramadas";
import type { VisitaTecnica } from "../services/visitas";

export default function VisitasTecnicasScreen() {
  const visitas = useVisitas();
  const visitasProgramadas = useVisitasProgramadas();
  const solicitudes = useSolicitudes();

  const [visitaSeleccionada, setVisitaSeleccionada] = useState<VisitaTecnica | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitaProgramadaEditando, setVisitaProgramadaEditando] = useState<VisitaProgramada | null>(null);
  const [visitaProgramadaEliminar, setVisitaProgramadaEliminar] = useState<VisitaProgramada | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const mostrarError = (e: unknown, porDefecto: string) =>
    setToast({ show: true, message: e instanceof Error ? e.message : porDefecto });

  const [seleccionDetalle, setSeleccionDetalle] = useState<SeleccionVisita | null>(null);

  const detalleVisita = (() => {
    if (!seleccionDetalle) return null;
    const servicio = visitas.find((v) => v.visitaId === seleccionDetalle.visitaId);
    if (!servicio) return null;
    if (seleccionDetalle.tipo === 'diagnostico') return detalleVisitaDiagnostico(servicio);

    const hermanas = visitasProgramadas.filter((v) => v.visitaId === servicio.visitaId);
    const programada = hermanas.find((v) => v.visitaProgramadaId === seleccionDetalle.visitaProgramadaId);
    return programada ? detalleVisitaProgramada(servicio, programada, hermanas) : null;
  })();

  const clienteDelDetalle = (() => {
    const servicio = visitas.find((v) => v.visitaId === seleccionDetalle?.visitaId);
    return solicitudes.find((s) => s.solicitudId === servicio?.solicitudId)?.cliente ?? null;
  })();

  const seleccionarServicio = (visita: VisitaTecnica) => {
    setVisitaSeleccionada((actual) => (actual?.visitaId === visita.visitaId ? null : visita));
  };

  const programadasDelServicio = visitaSeleccionada
    ? ordenarPorFechaHora(visitasProgramadas.filter((v) => v.visitaId === visitaSeleccionada.visitaId))
    : [];

  const abrirNuevaVisita = () => {
    setVisitaProgramadaEditando(null);
    setIsModalOpen(true);
  };

  const abrirEditarVisita = (visita: VisitaProgramada) => {
    setVisitaProgramadaEditando(visita);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setVisitaProgramadaEditando(null);
  };

  const handleGuardarVisitaProgramada = async (datos: DatosVisitaProgramada) => {
    if (!visitaSeleccionada || guardando) return;

    setGuardando(true);
    try {
      const datosServicio = { ...datos, visitaId: visitaSeleccionada.visitaId };
      if (visitaProgramadaEditando) {
        await editarVisitaProgramada(visitaProgramadaEditando.visitaProgramadaId, datosServicio);
      } else {
        await agregarVisitaProgramada(datosServicio);
      }
    } catch (e) {
      return mostrarError(e, "No se pudo guardar la visita programada.");
    } finally {
      setGuardando(false);
    }

    agregarNotificacion({
      rolDestino: 'tecnico',
      tecnicoDestino: visitaSeleccionada.tecnicoNombre,
      solicitudId: visitaSeleccionada.solicitudId,
      mensaje: `${visitaProgramadaEditando ? 'Se reprogramó' : 'Se programó'} una visita a ${visitaSeleccionada.clienteNombre} el ${formatearFechaISO(datos.fecha)} de ${datos.horaInicio} a ${datos.horaFin}. Tareas: ${datos.descripcionTareas}`,
    });

    cerrarModal();
  };

  const confirmarEliminarVisitaProgramada = async () => {
    if (!visitaProgramadaEliminar) return;

    setEliminando(true);
    try {
      await eliminarVisitaProgramada(visitaProgramadaEliminar.visitaProgramadaId);
    } catch (e) {
      mostrarError(e, "No se pudo eliminar la visita programada.");
    } finally {
      setEliminando(false);
      setVisitaProgramadaEliminar(null);
    }
  };

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="text-4xl font-bold text-black tracking-tight mb-8">Visitas Técnicas</h1>

        <div className="my-5">
          <VisitasTecnicasTable
            visitas={visitas}
            visitaSeleccionadaId={visitaSeleccionada?.visitaId ?? null}
            onSeleccionar={seleccionarServicio}
          />
        </div>

        <h2 className="text-2xl font-bold text-black tracking-tight mt-10 mb-4">Seguimiento por etapas</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <SeguimientoVisitas
            visitas={visitas}
            visitasProgramadas={visitasProgramadas}
            seleccion={seleccionDetalle}
            onSeleccionar={setSeleccionDetalle}
          />
          {detalleVisita && (
            <div className="xl:sticky xl:top-4">
              <DetalleVisitaPanel detalle={detalleVisita} cliente={clienteDelDetalle} onCerrar={() => setSeleccionDetalle(null)} />
            </div>
          )}
        </div>

        {visitaSeleccionada && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Agenda de visitas — {visitaSeleccionada.clienteNombre}
                </h2>
                <p className="text-sm text-slate-500">Técnico: {visitaSeleccionada.tecnicoNombre}</p>
              </div>
              <button
                onClick={abrirNuevaVisita}
                disabled={visitaSeleccionada.cierre !== undefined}
                title={visitaSeleccionada.cierre ? 'El servicio ya fue cerrado' : undefined}
                className="flex items-center gap-1 px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {programadasDelServicio.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {programadasDelServicio.map((visita) => (
                  <li
                    key={visita.visitaProgramadaId}
                    className="flex items-start justify-between gap-4 bg-slate-50 rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        {formatearFechaISO(visita.fecha)} · {visita.horaInicio} - {visita.horaFin}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">{visita.descripcionTareas}</p>
                      {visita.avance && <AvanceVisitaDetalle avance={visita.avance} />}
                    </div>
                    {visita.avance ? (
                      <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border bg-emerald-100 text-emerald-700 border-emerald-300/60">
                        COMPLETADA
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0 text-gray-700">
                        <button
                          onClick={() => abrirEditarVisita(visita)}
                          aria-label="Reprogramar visita"
                          className="hover:text-black cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVisitaProgramadaEliminar(visita)}
                          aria-label="Eliminar visita"
                          className="hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">Aún no hay visitas programadas para este servicio.</p>
            )}
          </div>
        )}

        <VisitaProgramadaModal
          isOpen={isModalOpen}
          clienteNombre={visitaSeleccionada?.clienteNombre ?? ''}
          visitaProgramada={visitaProgramadaEditando}
          onClose={cerrarModal}
          onGuardar={handleGuardarVisitaProgramada}
        />

        <ConfirmDeleteModal
          open={visitaProgramadaEliminar !== null}
          title="Eliminar visita programada"
          message={
            <>
              ¿Está seguro de que quiere eliminar la visita del{' '}
              <span className="font-semibold">
                {visitaProgramadaEliminar ? formatearFechaISO(visitaProgramadaEliminar.fecha) : ''}
              </span>
              ? Esta acción no se puede deshacer.
            </>
          }
          deleting={eliminando}
          onCancel={() => setVisitaProgramadaEliminar(null)}
          onConfirm={confirmarEliminarVisitaProgramada}
        />

        <Toast
          show={toast.show}
          type="error"
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
}
