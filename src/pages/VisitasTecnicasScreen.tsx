import { useState } from "react";
import { useVisitas } from "../hooks/useVisitas";
import { useVisitasProgramadas } from "../hooks/useVisitasProgramadas";
import { useSolicitudes } from "../hooks/useSolicitudes";
import VisitasTecnicasTable from "../components/VisitasTecnicasTable";
import VisitaProgramadaModal, { type DatosVisitaProgramada } from "../components/VisitaProgramadaModal";
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
import { garantiaDelServicio } from "../services/mantenimientos";
import {
  agregarVisitaProgramada,
  editarVisitaProgramada,
  eliminarVisitaProgramada,
  formatearFechaISO,
  type VisitaProgramada,
} from "../services/visitasProgramadas";
import {
  ETAPAS_SERVICIO,
  etapaActivaIndice,
  finalizarEtapaServicio,
  nombreDeTipo,
  type TipoVisita,
  type VisitaTecnica,
} from "../services/visitas";

// Visita que se está programando (editando === null) o reprogramando dentro de la etapa `tipo` de un servicio.
interface ProgramacionEnCurso {
  visita: VisitaTecnica;
  tipo: TipoVisita;
  editando: VisitaProgramada | null;
}

export default function VisitasTecnicasScreen() {
  const visitas = useVisitas();
  const visitasProgramadas = useVisitasProgramadas();
  const solicitudes = useSolicitudes();

  const [programacion, setProgramacion] = useState<ProgramacionEnCurso | null>(null);
  const [visitaProgramadaEliminar, setVisitaProgramadaEliminar] = useState<VisitaProgramada | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>({
    show: false,
    type: "error",
    message: "",
  });

  const mostrarError = (e: unknown, porDefecto: string) =>
    setToast({ show: true, type: "error", message: e instanceof Error ? e.message : porDefecto });

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

  const garantiaFin = programacion?.tipo === 'MANTENIMIENTO'
    ? garantiaDelServicio(visitasProgramadas.filter((v) => v.visitaId === programacion.visita.visitaId))?.fin
    : undefined;

  const handleGuardarVisitaProgramada = async (datos: DatosVisitaProgramada) => {
    if (!programacion || guardando) return;
    const { visita, tipo, editando } = programacion;

    setGuardando(true);
    try {
      const datosServicio = { ...datos, visitaId: visita.visitaId, tipo };
      if (editando) {
        await editarVisitaProgramada(editando.visitaProgramadaId, datosServicio);
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
      tecnicoDestino: visita.tecnicoNombre,
      solicitudId: visita.solicitudId,
      mensaje: `${editando ? 'Se reprogramó' : 'Se programó'} una visita de ${nombreDeTipo(tipo).toLowerCase()} a ${visita.clienteNombre} el ${formatearFechaISO(datos.fecha)} de ${datos.horaInicio} a ${datos.horaFin}. Tareas: ${datos.descripcionTareas}`,
    });

    setProgramacion(null);
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

  const handleFinalizarEtapa = async (visita: VisitaTecnica) => {
    const indice = etapaActivaIndice(visita);
    if (indice === null || finalizandoId !== null) return;

    const etapa = ETAPAS_SERVICIO[indice];
    const siguiente = ETAPAS_SERVICIO[indice + 1];
    const consecuencia = siguiente
      ? `Se habilitará "${siguiente}" para el técnico.`
      : "Ya no quedarán etapas por trabajar.";
    if (!window.confirm(`¿Finalizar la etapa "${etapa}"? No se podrán agregar más visitas a esta etapa. ${consecuencia}`)) return;

    setFinalizandoId(visita.visitaId);
    try {
      await finalizarEtapaServicio(visita.visitaId);
    } catch (e) {
      return mostrarError(e, "No se pudo finalizar la etapa.");
    } finally {
      setFinalizandoId(null);
    }

    if (siguiente) {
      agregarNotificacion({
        rolDestino: 'tecnico',
        tecnicoDestino: visita.tecnicoNombre,
        solicitudId: visita.solicitudId,
        mensaje: `Se habilitó la etapa "${siguiente}" del servicio de ${visita.clienteNombre}.`,
      });
    }
    setToast({ show: true, type: "success", message: `La etapa "${etapa}" se finalizó.` });
  };

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="text-4xl font-bold text-black tracking-tight mb-8">Visitas Técnicas</h1>

        <div className="my-5">
          <VisitasTecnicasTable visitas={visitas} />
        </div>

        <h2 className="text-2xl font-bold text-black tracking-tight mt-10 mb-4">Seguimiento por etapas</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <SeguimientoVisitas
            visitas={visitas}
            visitasProgramadas={visitasProgramadas}
            seleccion={seleccionDetalle}
            finalizandoId={finalizandoId}
            onSeleccionar={setSeleccionDetalle}
            onAgregar={(visita, tipo) => setProgramacion({ visita, tipo, editando: null })}
            onEditar={(visita, visitaProgramada) =>
              setProgramacion({ visita, tipo: visitaProgramada.tipo, editando: visitaProgramada })
            }
            onEliminar={setVisitaProgramadaEliminar}
            onFinalizarEtapa={handleFinalizarEtapa}
          />
          {detalleVisita && (
            <div className="xl:sticky xl:top-4">
              <DetalleVisitaPanel detalle={detalleVisita} cliente={clienteDelDetalle} onCerrar={() => setSeleccionDetalle(null)} />
            </div>
          )}
        </div>

        <VisitaProgramadaModal
          isOpen={programacion !== null}
          clienteNombre={programacion?.visita.clienteNombre ?? ''}
          tipo={programacion?.tipo ?? 'INSTALACION'}
          garantiaFin={garantiaFin}
          visitaProgramada={programacion?.editando ?? null}
          onClose={() => setProgramacion(null)}
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
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
}
