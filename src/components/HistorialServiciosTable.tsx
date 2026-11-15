import { ExternalLink, Loader2, Lock } from 'lucide-react';
import {
  ESTILO_ESTADO_SERVICIO,
  estadoServicio,
  progresoServicio,
} from '../services/servicios';
import type { VisitaTecnica } from '../services/visitas';
import { formatearFechaISO, type VisitaProgramada } from '../services/visitasProgramadas';
import { garantiaDelServicio, garantiaVigente } from '../services/mantenimientos';
import { formatearMargen, type ResumenCostosServicio } from '../services/costosReales';

interface HistorialServiciosProps {
  servicios: VisitaTecnica[];
  visitasProgramadas: VisitaProgramada[];
  // Márgenes de cada servicio (solo el trabajador y el jefe llegan a esta tabla).
  costos: ResumenCostosServicio[];
  // Servicio cuya liquidación se está preparando, y el que se está cerrando con el avance de la subida a Drive.
  preparandoId: number | null;
  cerrandoId: number | null;
  progreso: string;
  onCerrarServicio: (servicio: VisitaTecnica) => void;
}

export default function HistorialServicios({
  servicios,
  visitasProgramadas,
  costos,
  preparandoId,
  cerrandoId,
  progreso,
  onCerrarServicio,
}: HistorialServiciosProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-sm font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5 text-center">Ítem</th>
            <th className="py-3 px-3.5">Empresa</th>
            <th className="py-3 px-3.5">Descripción</th>
            <th className="py-3 px-3.5 text-center">Inicio</th>
            <th className="py-3 px-3.5 text-center">Visitas</th>
            <th className="py-3 px-3.5 text-center">Encargado</th>
            <th className="py-3 px-3.5 text-center">Garantía hasta</th>
            <th className="py-3 px-3.5 text-center">Margen est.</th>
            <th className="py-3 px-3.5 text-center">Margen real</th>
            <th className="py-3 px-3.5 text-center">Estado</th>
            <th className="py-3 px-3.5 text-center">Carpeta / Cierre</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {servicios.length > 0 ? (
            servicios.map((servicio) => {
              const estado = estadoServicio(servicio);
              const delServicio = visitasProgramadas.filter((v) => v.visitaId === servicio.visitaId);
              const progresoVisitas = progresoServicio(delServicio);
              const cerrando = cerrandoId === servicio.visitaId;
              const preparando = preparandoId === servicio.visitaId;
              const garantia = garantiaDelServicio(delServicio, servicio.garantiaMeses);
              const garantiaVencida = garantia !== null && !garantiaVigente(garantia);
              const control = costos.find((c) => c.visitaId === servicio.visitaId);

              return (
                <tr key={servicio.visitaId} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40">
                  <td className="py-2.5 px-3.5 font-medium text-slate-500 text-center">{servicio.visitaId}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-800">{servicio.clienteNombre}</td>
                  <td className="py-2.5 px-3.5 text-slate-600">{servicio.descripcion}</td>
                  <td className="py-2.5 px-3.5 text-center text-slate-600 whitespace-nowrap">{servicio.fecha}</td>
                  <td className="py-2.5 px-3.5 text-center text-slate-700 whitespace-nowrap">
                    {progresoVisitas.completadas}/{progresoVisitas.total}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-medium text-slate-700">{servicio.tecnicoNombre}</td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    {garantia ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-700">{formatearFechaISO(garantia.fin)}</span>
                        {garantiaVencida && !servicio.cierre && <span className="text-sm font-bold tracking-wider text-rose-600">VENCIDA</span>}
                      </div>
                    ) : (
                      <span className="text-slate-400" title="Se calcula desde la última visita de instalación completada">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    {control?.aplicaControl ? (
                      formatearMargen(control.margenEstimado)
                    ) : (
                      <span className="text-slate-400" title="Anterior al control de costos">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    {control?.aplicaControl && control.margenReal !== null && control.margenReal !== undefined ? (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-slate-800">{formatearMargen(control.margenReal)}</span>
                        {control.desviacionMargen !== null && control.desviacionMargen !== undefined && (
                          <span className={`text-sm font-bold ${control.desviacionMargen < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {control.desviacionMargen > 0 ? '+' : ''}{control.desviacionMargen.toFixed(2)} pts
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400" title="El margen real se conoce al cerrar el servicio">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border whitespace-nowrap ${ESTILO_ESTADO_SERVICIO[estado]}`}>
                      {estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {servicio.cierre ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <a
                          href={servicio.cierre.carpetaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2A317A] hover:underline"
                        >
                          <ExternalLink size={14} />
                          Abrir carpeta
                        </a>
                        <span className="text-sm text-slate-400">Cerrado el {servicio.cierre.fecha}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => onCerrarServicio(servicio)}
                          disabled={!progresoVisitas.culminado || cerrandoId !== null || preparandoId !== null}
                          title={
                            progresoVisitas.culminado
                              ? 'Reúne los archivos del servicio en una carpeta de Google Drive'
                              : 'Se habilita cuando todas las visitas del servicio tengan su reporte'
                          }
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {cerrando || preparando ? <Loader2 size={14} className="animate-spin" /> : !progresoVisitas.culminado && <Lock size={12} />}
                          {cerrando ? 'Cerrando…' : preparando ? 'Preparando…' : 'Cerrar Servicio'}
                        </button>
                        {cerrando && <span className="text-sm text-slate-500">{progreso}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={11} className="py-6 text-center text-slate-400">
                No se encontraron servicios que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
