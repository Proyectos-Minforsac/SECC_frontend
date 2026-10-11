import { useState } from 'react';
import { Check, ChevronDown, Clock, FileText, Flag, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  ESTILO_ESTADO_VISITA,
  ETAPAS_SERVICIO,
  INDICE_INSTALACION,
  estadoEtapa,
  formatearFechaHora,
  tipoDeEtapa,
  type TipoVisita,
  type VisitaTecnica,
} from '../services/visitas';
import { formatearFechaISO, visitasDeEtapa, type VisitaProgramada } from '../services/visitasProgramadas';
import { garantiaDelServicio, garantiaVigente } from '../services/mantenimientos';
import { esSeleccionVisita, type SeleccionVisita } from '../services/detalleVisita';

interface SeguimientoVisitasProps {
  visitas: VisitaTecnica[];
  visitasProgramadas: VisitaProgramada[];
  seleccion: SeleccionVisita | null;
  // Servicio cuya etapa se está finalizando, para deshabilitar el botón mientras responde el servidor.
  finalizandoId: number | null;
  onSeleccionar: (seleccion: SeleccionVisita) => void;
  onAgregar: (visita: VisitaTecnica, tipo: TipoVisita) => void;
  onEditar: (visita: VisitaTecnica, visitaProgramada: VisitaProgramada) => void;
  onEliminar: (visitaProgramada: VisitaProgramada) => void;
  onFinalizarEtapa: (visita: VisitaTecnica) => void;
}

const ESTILO_FILA = 'w-full text-left text-sm rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer';

// Servicios -> etapas -> visitas. El empleado abre los desplegables, programa las visitas de cada etapa,
// elige una para ver su detalle y finaliza la instalación, lo que habilita a la vez el mantenimiento preventivo
// y el soporte técnico para el técnico. Estos dos no se finalizan: terminan al cerrar el servicio.
export default function SeguimientoVisitas({
  visitas,
  visitasProgramadas,
  seleccion,
  finalizandoId,
  onSeleccionar,
  onAgregar,
  onEditar,
  onEliminar,
  onFinalizarEtapa,
}: SeguimientoVisitasProps) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  const alternar = (clave: string) =>
    setAbiertos((actual) => {
      const siguiente = new Set(actual);
      if (!siguiente.delete(clave)) siguiente.add(clave);
      return siguiente;
    });

  if (visitas.length === 0) {
    return <p className="text-slate-400 text-sm">No hay visitas técnicas autorizadas.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {visitas.map((visita) => {
        const claveServicio = `${visita.visitaId}`;
        const servicioAbierto = abiertos.has(claveServicio);
        const delServicio = visitasProgramadas.filter((vp) => vp.visitaId === visita.visitaId);
        const garantia = garantiaDelServicio(delServicio);
        // Programar es posible con el servicio activo y abierto, desde la etapa en curso en adelante.
        const servicioEditable = visita.estado === 'ACTIVO' && visita.cierre === undefined;

        return (
          <section key={visita.visitaId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => alternar(claveServicio)}
              aria-expanded={servicioAbierto}
              className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left cursor-pointer hover:bg-blue-50/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">
                  N° {visita.visitaId} · {visita.clienteNombre}
                </p>
                <p className="text-sm text-slate-500 truncate">Técnico: {visita.tecnicoNombre}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${ESTILO_ESTADO_VISITA[visita.estado]}`}>
                  {visita.estado}
                </span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${servicioAbierto ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {servicioAbierto && (
              <ul className="border-t border-slate-100 divide-y divide-slate-100">
                {visita.cancelacion && (
                  <li className="px-5 py-3 bg-rose-50 text-sm text-rose-800">
                    <p className="font-semibold">Servicio cancelado: no se llegó a un acuerdo con el cliente.</p>
                    <p className="mt-0.5">Motivo: {visita.cancelacion.motivo}</p>
                    <p className="mt-0.5 text-xs text-rose-600">{formatearFechaHora(visita.cancelacion.fecha)}</p>
                  </li>
                )}
                {ETAPAS_SERVICIO.map((etapa, indice) => {
                  const claveEtapa = `${visita.visitaId}-${indice}`;
                  const etapaAbierta = abiertos.has(claveEtapa);
                  const estado = estadoEtapa(visita, indice);
                  const completada = estado === 'completada';
                  const activa = estado === 'activa';
                  const tipo = tipoDeEtapa(indice);
                  const programadas = tipo ? visitasDeEtapa(visitasProgramadas, visita.visitaId, tipo) : [];

                  // Las etapas ya finalizadas no admiten cambios; las demás sí, aunque el técnico las vea bloqueadas.
                  const puedeProgramar = tipo !== null && servicioEditable && !completada;
                  // El mantenimiento y el soporte solo se programan dentro de la garantía.
                  const garantiaBloquea = (tipo === 'MANTENIMIENTO' || tipo === 'SOPORTE') && (!garantia || !garantiaVigente(garantia));
                  const motivoSinProgramar = garantiaBloquea
                    ? garantia
                      ? `La garantía venció: ya no se pueden programar ${tipo === 'SOPORTE' ? 'visitas de soporte' : 'mantenimientos'}.`
                      : 'Se habilita cuando se complete una visita de instalación.'
                    : undefined;

                  // Solo la instalación se finaliza; el mantenimiento y el soporte terminan al cerrar el servicio.
                  const puedeFinalizar = activa && indice === INDICE_INSTALACION && servicioEditable;
                  const ayudaEtapa =
                    tipo === 'MANTENIMIENTO'
                      ? 'Programa los mantenimientos preventivos del servicio. Esta etapa termina al cerrar el servicio.'
                      : tipo === 'SOPORTE'
                        ? 'Programa una visita cuando el cliente reporte una falla. Está disponible hasta que se cierre el servicio.'
                        : 'Programa las visitas que el técnico deberá realizar en esta etapa.';
                  const hayPendientes = programadas.some((vp) => !vp.avance);
                  const sinVisitas = programadas.length === 0;

                  return (
                    <li key={etapa}>
                      <button
                        onClick={() => alternar(claveEtapa)}
                        aria-expanded={etapaAbierta}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left cursor-pointer hover:bg-blue-50/50 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          {completada ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : activa ? (
                            <span className="w-4 h-4 rounded-full border-2 border-[#2A317A]" />
                          ) : (
                            <Lock size={14} className="text-slate-400" />
                          )}
                          <span className="font-medium text-slate-800">{etapa}</span>
                          <span className="text-xs text-slate-400">
                            {completada ? 'Completada' : activa ? 'En curso' : 'Pendiente'}
                          </span>
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${etapaAbierta ? 'rotate-180' : ''}`} />
                      </button>

                      {etapaAbierta && (
                        <div className="px-5 pb-3 ml-6 flex flex-col gap-2">
                          {indice === 0 && (
                            <button
                              onClick={() => onSeleccionar({ visitaId: visita.visitaId, tipo: 'diagnostico' })}
                              className={`${ESTILO_FILA} ${esSeleccionVisita(seleccion, visita.visitaId) ? 'bg-blue-50 ring-1 ring-[#2A317A]/40' : 'bg-slate-50 hover:bg-blue-50'}`}
                            >
                              <span className="flex items-center gap-2 font-medium text-slate-800">
                                <FileText size={14} className="text-slate-500 shrink-0" />
                                Visita de diagnóstico · {visita.fecha}
                              </span>
                              <span className="block mt-1 text-slate-600 truncate">{visita.descripcion}</span>
                            </button>
                          )}

                          {tipo !== null && (
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-slate-500">
                                {visita.estado === 'CANCELADA'
                                  ? 'El servicio fue cancelado.'
                                  : visita.cierre
                                    ? 'El servicio ya fue cerrado.'
                                    : completada
                                      ? 'Etapa finalizada.'
                                      : visita.estado !== 'ACTIVO'
                                        ? 'Se habilita cuando se acepte la cotización y el servicio pase a ACTIVO.'
                                        : motivoSinProgramar ?? ayudaEtapa}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                {puedeFinalizar && (
                                  <button
                                    onClick={() => onFinalizarEtapa(visita)}
                                    disabled={sinVisitas || hayPendientes || finalizandoId !== null}
                                    title={
                                      sinVisitas
                                        ? 'Programa al menos una visita antes de finalizar la etapa'
                                        : hayPendientes
                                          ? 'El técnico aún tiene visitas pendientes en esta etapa'
                                          : 'Habilita el mantenimiento preventivo y el soporte técnico para el técnico'
                                    }
                                    className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-all shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                                  >
                                    <Flag className="w-4 h-4" />
                                    {finalizandoId === visita.visitaId ? 'Finalizando etapa...' : 'Finalizar etapa'}
                                  </button>
                                )}
                                {puedeProgramar && (
                                  <button
                                    onClick={() => onAgregar(visita, tipo)}
                                    disabled={garantiaBloquea}
                                    title={motivoSinProgramar}
                                    className="flex items-center gap-1 px-4 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Agregar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {programadas.map((vp, orden) => (
                            <div key={vp.visitaProgramadaId} className="flex items-stretch gap-2">
                              <button
                                onClick={() =>
                                  onSeleccionar({
                                    visitaId: visita.visitaId,
                                    tipo: 'programada',
                                    visitaProgramadaId: vp.visitaProgramadaId,
                                  })
                                }
                                className={`${ESTILO_FILA} flex-1 min-w-0 ${esSeleccionVisita(seleccion, visita.visitaId, vp.visitaProgramadaId) ? 'bg-blue-50 ring-1 ring-[#2A317A]/40' : 'bg-slate-50 hover:bg-blue-50'}`}
                              >
                                <span className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-2 font-medium text-slate-800">
                                    <Clock size={14} className="text-slate-500 shrink-0" />
                                    Visita {orden + 1} · {formatearFechaISO(vp.fecha)} · {vp.horaInicio} - {vp.horaFin}
                                  </span>
                                  <span className={`text-[10px] font-bold tracking-wider ${vp.avance ? 'text-emerald-700' : 'text-slate-400'}`}>
                                    {vp.avance ? 'COMPLETADA' : 'PENDIENTE'}
                                  </span>
                                </span>
                                <span className="block mt-1 text-slate-600 truncate">{vp.descripcionTareas}</span>
                              </button>
                              {!vp.avance && servicioEditable && (
                                <div className="flex items-center gap-2 shrink-0 text-gray-700">
                                  <button
                                    onClick={() => onEditar(visita, vp)}
                                    aria-label="Reprogramar visita"
                                    className="hover:text-black cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onEliminar(vp)}
                                    aria-label="Eliminar visita"
                                    className="hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}

                          {tipo !== null && programadas.length === 0 && (
                            <p className="text-sm text-slate-400">Aún no hay visitas programadas.</p>
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
      })}
    </div>
  );
}
