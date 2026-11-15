import { useState } from "react";
import { useVisitas } from "../hooks/useVisitas";
import { useVisitasProgramadas } from "../hooks/useVisitasProgramadas";
import { useSolicitudes } from "../hooks/useSolicitudes";
import { useResumenCostos } from "../hooks/useResumenCostos";
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
import FinalizarEtapaModal from "../components/FinalizarEtapaModal";
import LiquidacionCostosModal from "../components/LiquidacionCostosModal";
import ImprevistoModal from "../components/ImprevistoModal";
import Toast from "../components/Toast";
import { agregarNotificacion } from "../services/notificaciones";
import { garantiaDelServicio } from "../services/mantenimientos";
import { obtenerLiquidacion, type EtapaPayload, type PropuestaConTabla } from "../services/costosReales";
import {
  agregarVisitaProgramada,
  editarVisitaProgramada,
  eliminarVisitaProgramada,
  formatearFechaISO,
  type VisitaProgramada,
} from "../services/visitasProgramadas";
import {
  ETAPAS_SERVICIO,
  INDICE_INSTALACION,
  estadoEtapa,
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
  const costos = useResumenCostos();

  const [programacion, setProgramacion] = useState<ProgramacionEnCurso | null>(null);
  const [visitaProgramadaEliminar, setVisitaProgramadaEliminar] = useState<VisitaProgramada | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  // Servicio cuya instalación se está confirmando en el modal (servicios anteriores al control de costos).
  const [visitaFinalizar, setVisitaFinalizar] = useState<VisitaTecnica | null>(null);
  // Servicio con control de costos: la instalación se finaliza confirmando sus costos reales (la tabla ya viene llena).
  const [liquidacion, setLiquidacion] = useState<{ visita: VisitaTecnica; propuesta: PropuestaConTabla } | null>(null);
  const [preparandoId, setPreparandoId] = useState<number | null>(null);
  const [visitaImprevistos, setVisitaImprevistos] = useState<VisitaTecnica | null>(null);
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

  // El mantenimiento y el soporte solo se programan dentro de la garantía.
  const garantiaFin = programacion && programacion.tipo !== 'INSTALACION'
    ? garantiaDelServicio(
        visitasProgramadas.filter((v) => v.visitaId === programacion.visita.visitaId),
        programacion.visita.garantiaMeses
      )?.fin
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

  // Solo la instalación se finaliza: habilita a la vez el mantenimiento preventivo y el soporte técnico.
  const etapaFinalizable = ETAPAS_SERVICIO[INDICE_INSTALACION];
  const etapasHabilitadas = [ETAPAS_SERVICIO[2], ETAPAS_SERVICIO[3]];

  const handleFinalizarEtapa = async (visita: VisitaTecnica) => {
    if (estadoEtapa(visita, INDICE_INSTALACION) !== 'activa' || finalizandoId !== null || preparandoId !== null) return;

    // Si el servicio pasa por el control de costos, la etapa se finaliza confirmando los costos reales de diagnóstico e instalación
    setPreparandoId(visita.visitaId);
    try {
      const propuesta = await obtenerLiquidacion(visita.visitaId, 'INSTALACION');
      if (propuesta.aplica && !propuesta.yaLiquidada) setLiquidacion({ visita, propuesta });
      else setVisitaFinalizar(visita);
    } catch (e) {
      mostrarError(e, "No se pudo preparar la liquidación de costos.");
    } finally {
      setPreparandoId(null);
    }
  };

  // `etapas` son los costos reales que confirmó el trabajador; sin ellos (servicio anterior al control) solo se finaliza.
  const finalizar = async (visita: VisitaTecnica, etapas?: EtapaPayload[]) => {
    if (finalizandoId !== null) return;

    setFinalizandoId(visita.visitaId);
    try {
      await finalizarEtapaServicio(visita.visitaId, etapas);
    } catch (e) {
      // Con la tabla de costos abierta se queda abierta: así no se pierde lo que se corrigió
      setVisitaFinalizar(null);
      return mostrarError(e, "No se pudo finalizar la etapa.");
    } finally {
      setFinalizandoId(null);
    }

    setVisitaFinalizar(null);
    setLiquidacion(null);
    agregarNotificacion({
      rolDestino: 'tecnico',
      tecnicoDestino: visita.tecnicoNombre,
      solicitudId: visita.solicitudId,
      mensaje: `Se habilitaron las etapas ${etapasHabilitadas.map((e) => `"${e}"`).join(' y ')} del servicio de ${visita.clienteNombre}.`,
    });
    setToast({ show: true, type: "success", message: `La etapa "${etapaFinalizable}" se finalizó.` });
  };

  const confirmarFinalizarEtapa = () => visitaFinalizar && finalizar(visitaFinalizar);

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
            preparandoId={preparandoId}
            costos={costos}
            onImprevistos={setVisitaImprevistos}
            onSeleccionar={setSeleccionDetalle}
            onAgregar={(visita, tipo) => setProgramacion({ visita, tipo, editando: null })}
            onEditar={(visita, visitaProgramada) =>
              setProgramacion({ visita, tipo: visitaProgramada.tipo, editando: visitaProgramada })
            }
            onEliminar={setVisitaProgramadaEliminar}
            onFinalizarEtapa={handleFinalizarEtapa}
          />
          {detalleVisita ? (
            <div className="xl:sticky xl:top-4">
              <DetalleVisitaPanel detalle={detalleVisita} cliente={clienteDelDetalle} onCerrar={() => setSeleccionDetalle(null)} />
            </div>
          ) : (
            visitas.length > 0 && (
              <div className="xl:sticky xl:top-4 flex min-h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-400/70 bg-white/50 p-8 text-center">
                <p className="text-sm text-slate-500">Acá verá los detalles de cada visita.</p>
              </div>
            )
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
          guardando={guardando}
        />

        <FinalizarEtapaModal
          isOpen={visitaFinalizar !== null}
          clienteNombre={visitaFinalizar?.clienteNombre ?? ''}
          etapa={etapaFinalizable}
          etapasHabilitadas={etapasHabilitadas}
          guardando={finalizandoId !== null}
          onClose={() => setVisitaFinalizar(null)}
          onConfirmar={confirmarFinalizarEtapa}
        />

        <LiquidacionCostosModal
          isOpen={liquidacion !== null}
          titulo="Finalizar etapa"
          textoConfirmar="Confirmar costos y finalizar etapa"
          clienteNombre={liquidacion?.visita.clienteNombre ?? ''}
          nota={`Se finaliza la etapa "${etapaFinalizable}" y se habilitan ${etapasHabilitadas.map((e) => `"${e}"`).join(' y ')} para el técnico.`}
          propuesta={liquidacion?.propuesta ?? null}
          guardando={finalizandoId !== null}
          onClose={() => setLiquidacion(null)}
          onConfirmar={(etapas) => liquidacion && finalizar(liquidacion.visita, etapas)}
        />

        <ImprevistoModal
          isOpen={visitaImprevistos !== null}
          visita={visitaImprevistos}
          onClose={() => setVisitaImprevistos(null)}
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
