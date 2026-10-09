import { useState } from "react"
import { Check, ChevronDown, Lock, Clock } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useVisitas } from "../hooks/useVisitas"
import { useVisitasProgramadas } from "../hooks/useVisitasProgramadas"
import DiagnosticoModal from "../components/DiagnosticoModal"
import AvanceVisitaModal from "../components/AvanceVisitaModal"
import AvanceVisitaDetalle from "../components/AvanceVisitaDetalle"
import Toast from "../components/Toast"
import { agregarNotificacion } from "../services/notificaciones"
import {
  formatearFechaISO,
  guardarAvanceVisitaProgramada,
  visitaProgramadaActual,
  visitasDeEtapa,
  type AvanceVisita,
} from "../services/visitasProgramadas"
import {
  ESTILO_ESTADO_VISITA,
  ETAPAS_SERVICIO,
  etapasCompletadas,
  etapaActivaIndice,
  etapaHabilitada,
  guardarDiagnostico,
  tipoDeEtapa,
  type DiagnosticoVisita,
} from "../services/visitas"

export default function VisitasTecnicoScreen() {
  const { usuario } = useAuth();
  const tecnicoNombre = usuario?.nombre ?? "";

  const visitas = useVisitas().filter((v) => v.tecnicoNombre === tecnicoNombre);
  const visitasProgramadas = useVisitasProgramadas();
  const [expandidaId, setExpandidaId] = useState<number | null>(null);
  const [diagnosticoVisitaId, setDiagnosticoVisitaId] = useState<number | null>(null);
  const visitaDiagnostico = visitas.find((v) => v.visitaId === diagnosticoVisitaId) ?? null;
  const [avanceVisitaId, setAvanceVisitaId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>({
    show: false,
    type: "success",
    message: "",
  });
  const [guardando, setGuardando] = useState(false);
  const visitaProgramadaAvance = visitasProgramadas.find((vp) => vp.visitaProgramadaId === avanceVisitaId) ?? null;
  const servicioAvance = visitas.find((v) => v.visitaId === visitaProgramadaAvance?.visitaId) ?? null;

  const mostrarError = (e: unknown, porDefecto: string) =>
    setToast({ show: true, type: "error", message: e instanceof Error ? e.message : porDefecto });

  const handleGuardarAvance = async (avance: AvanceVisita) => {
    if (!visitaProgramadaAvance || !servicioAvance || guardando) return;

    setGuardando(true);
    try {
      await guardarAvanceVisitaProgramada(visitaProgramadaAvance.visitaProgramadaId, avance);
    } catch (e) {
      return mostrarError(e, "No se pudo guardar el avance de la visita.");
    } finally {
      setGuardando(false);
    }

    agregarNotificacion({
      rolDestino: 'empleado',
      solicitudId: servicioAvance.solicitudId,
      mensaje: `${tecnicoNombre} completó exitosamente la visita del ${formatearFechaISO(visitaProgramadaAvance.fecha)} a ${servicioAvance.clienteNombre}.`,
    });

    setAvanceVisitaId(null);
    setToast({ show: true, type: "success", message: "La visita se completó y se notificó al empleado." });
  }

  const handleGuardarDiagnostico = async (diagnostico: DiagnosticoVisita) => {
    if (!visitaDiagnostico || guardando) return;

    setGuardando(true);
    try {
      await guardarDiagnostico(visitaDiagnostico.visitaId, diagnostico);
    } catch (e) {
      return mostrarError(e, "No se pudo guardar el diagnóstico.");
    } finally {
      setGuardando(false);
    }

    agregarNotificacion({
      rolDestino: 'empleado',
      tipo: 'DIAGNOSTICO_COMPLETADO',
      solicitudId: visitaDiagnostico.solicitudId,
      mensaje: `${tecnicoNombre} completó el diagnóstico inicial de ${visitaDiagnostico.clienteNombre}.`,
    });

    setDiagnosticoVisitaId(null);
  }

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="text-4xl font-bold text-black tracking-tight mb-8">Visitas Técnicas</h1>

        <div className="flex flex-col gap-3">
          {visitas.length > 0 ? (
            visitas.map((visita) => {
              const expandida = expandidaId === visita.visitaId;
              const completadas = etapasCompletadas(visita);
              const activaIndice = etapaActivaIndice(visita);
              const esperandoCotizacion = visita.estado === 'DIAGNÓSTICO COMPLETADO';

              return (
                <section key={visita.visitaId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandidaId(expandida ? null : visita.visitaId)}
                    aria-expanded={expandida}
                    className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left cursor-pointer hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        N° {visita.visitaId} · {visita.clienteNombre}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{visita.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${ESTILO_ESTADO_VISITA[visita.estado]}`}>
                        {visita.estado}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-500 transition-transform ${expandida ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {expandida && (
                    <ul className="border-t border-slate-100 divide-y divide-slate-100">
                      {ETAPAS_SERVICIO.map((etapa, indice) => {
                        const completada = indice < completadas;
                        const activa = indice === activaIndice;
                        const esDiagnostico = indice === 0;
                        const esInstalacion = indice === 1;
                        const tipo = tipoDeEtapa(indice);
                        // Habilitada = completada o activa; las demás se ven bloqueadas hasta que el empleado
                        // finalice la anterior. Solo la etapa activa admite ingreso de datos.
                        const habilitada = etapaHabilitada(visita, indice);
                        const visitasEtapa = tipo ? visitasDeEtapa(visitasProgramadas, visita.visitaId, tipo) : [];
                        const visitaActual = activa ? visitaProgramadaActual(visitasEtapa) : null;

                        return (
                          <li key={etapa} className={`px-5 py-3 ${habilitada ? "" : "opacity-50"}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                {completada ? (
                                  <Check size={16} className="text-emerald-600" />
                                ) : activa ? (
                                  <span className="w-4 h-4 rounded-full border-2 border-[#2A317A]" />
                                ) : (
                                  <Lock size={14} className="text-slate-400" />
                                )}
                                <span className="font-medium text-slate-800">{etapa}</span>
                                <span className="text-xs text-slate-400">
                                  {completada
                                    ? "Completada"
                                    : activa
                                      ? "Activa"
                                      : esInstalacion && esperandoCotizacion
                                        ? "Esperando aceptación de la cotización"
                                        : "Bloqueada hasta finalizar la etapa anterior"}
                                </span>
                              </div>

                              {activa && esDiagnostico && (
                                <button
                                  onClick={() => setDiagnosticoVisitaId(visita.visitaId)}
                                  className="px-4 py-1 bg-[#2A317A] text-white text-xs font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer"
                                >
                                  Agregar
                                </button>
                              )}
                            </div>

                            {tipo !== null && visitasEtapa.length > 0 && (
                              <div className="mt-3 ml-6 flex flex-col gap-2">
                                {visitasEtapa.map((vp) => {
                                  const esActual = vp.visitaProgramadaId === visitaActual?.visitaProgramadaId;
                                  const contenido = (
                                    <>
                                      <span className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 font-medium text-slate-800">
                                          <Clock size={14} className="text-slate-500 shrink-0" />
                                          {formatearFechaISO(vp.fecha)} · {vp.horaInicio} - {vp.horaFin}
                                        </span>
                                        {vp.avance ? (
                                          <span className="text-[10px] font-bold tracking-wider text-emerald-700">COMPLETADA</span>
                                        ) : esActual ? (
                                          <span className="px-3 py-0.5 bg-[#2A317A] text-white text-xs font-medium rounded-full">
                                            Registrar avance
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold tracking-wider text-slate-400">PENDIENTE</span>
                                        )}
                                      </span>
                                      <span className="block mt-1">{vp.descripcionTareas}</span>
                                    </>
                                  );

                                  // Solo la visita del momento es clicable; el resto es de solo lectura.
                                  return esActual ? (
                                    <button
                                      key={vp.visitaProgramadaId}
                                      onClick={() => setAvanceVisitaId(vp.visitaProgramadaId)}
                                      className="w-full text-left text-sm text-slate-600 bg-slate-50 rounded-xl px-3.5 py-2.5 ring-1 ring-[#2A317A]/30 hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                      {contenido}
                                    </button>
                                  ) : (
                                    <div
                                      key={vp.visitaProgramadaId}
                                      className={`text-sm text-slate-600 bg-slate-50 rounded-xl px-3.5 py-2.5 ${vp.avance ? "" : "opacity-60"}`}
                                    >
                                      {contenido}
                                      {vp.avance && <AvanceVisitaDetalle avance={vp.avance} />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {tipo !== null && habilitada && visitasEtapa.length === 0 && (
                              <p className="mt-3 ml-6 text-sm text-slate-400">Aún no hay visitas programadas.</p>
                            )}

                            {completada && esDiagnostico && visita.diagnostico && (
                              <div className="mt-3 ml-6 flex flex-col gap-2 text-sm text-slate-600">
                                <p>{visita.diagnostico.descripcion}</p>
                                <p>
                                  <span className="font-medium text-slate-700">Componentes: </span>
                                  {visita.diagnostico.componentes.join(", ")}
                                </p>
                                {visita.diagnostico.evidencias.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {visita.diagnostico.evidencias.map((evidencia) => (
                                      <a key={evidencia.url} href={evidencia.url} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={evidencia.url}
                                          alt={evidencia.nombre}
                                          className="w-20 h-20 object-cover rounded-xl shadow-sm"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          ) : (
            <p className="text-slate-400">No tienes visitas técnicas autorizadas.</p>
          )}
        </div>

        <DiagnosticoModal
          isOpen={visitaDiagnostico !== null}
          clienteNombre={visitaDiagnostico?.clienteNombre ?? ""}
          onClose={() => setDiagnosticoVisitaId(null)}
          onGuardar={handleGuardarDiagnostico}
        />

        <AvanceVisitaModal
          isOpen={visitaProgramadaAvance !== null}
          clienteNombre={servicioAvance?.clienteNombre ?? ""}
          resumenVisita={
            visitaProgramadaAvance
              ? `${formatearFechaISO(visitaProgramadaAvance.fecha)} · ${visitaProgramadaAvance.horaInicio} - ${visitaProgramadaAvance.horaFin}`
              : ""
          }
          onClose={() => setAvanceVisitaId(null)}
          onGuardar={handleGuardarAvance}
        />

        <Toast
          show={toast.show}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  )
}
