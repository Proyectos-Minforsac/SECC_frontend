import { ExternalLink, Loader2, Lock } from 'lucide-react';
import {
  ESTILO_ESTADO_SERVICIO,
  estadoServicio,
  progresoServicio,
} from '../services/servicios';
import type { VisitaTecnica } from '../services/visitas';
import type { VisitaProgramada } from '../services/visitasProgramadas';

interface HistorialServiciosProps {
  servicios: VisitaTecnica[];
  visitasProgramadas: VisitaProgramada[];
  // Servicio que se está cerrando y el avance de la subida a Drive.
  cerrandoId: number | null;
  progreso: string;
  onCerrarServicio: (servicio: VisitaTecnica) => void;
}

export default function HistorialServicios({
  servicios,
  visitasProgramadas,
  cerrandoId,
  progreso,
  onCerrarServicio,
}: HistorialServiciosProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5 text-center">Ítem</th>
            <th className="py-3 px-3.5">Empresa</th>
            <th className="py-3 px-3.5">Descripción</th>
            <th className="py-3 px-3.5 text-center">Inicio</th>
            <th className="py-3 px-3.5 text-center">Visitas</th>
            <th className="py-3 px-3.5 text-center">Encargado</th>
            <th className="py-3 px-3.5 text-center">Estado</th>
            <th className="py-3 px-3.5 text-center">Carpeta / Cierre</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {servicios.length > 0 ? (
            servicios.map((servicio) => {
              const estado = estadoServicio(servicio);
              const progresoVisitas = progresoServicio(
                visitasProgramadas.filter((v) => v.visitaId === servicio.visitaId)
              );
              const cerrando = cerrandoId === servicio.visitaId;

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
                  <td className="py-2.5 px-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border whitespace-nowrap ${ESTILO_ESTADO_SERVICIO[estado]}`}>
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
                        <span className="text-[11px] text-slate-400">Cerrado el {servicio.cierre.fecha}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => onCerrarServicio(servicio)}
                          disabled={!progresoVisitas.culminado || cerrandoId !== null}
                          title={
                            progresoVisitas.culminado
                              ? 'Reúne los archivos del servicio en una carpeta de Google Drive'
                              : 'Se habilita cuando todas las visitas del servicio tengan su reporte'
                          }
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2A317A] text-white text-xs font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {cerrando ? <Loader2 size={14} className="animate-spin" /> : !progresoVisitas.culminado && <Lock size={12} />}
                          {cerrando ? 'Cerrando…' : 'Cerrar Servicio'}
                        </button>
                        {cerrando && <span className="text-[11px] text-slate-500">{progreso}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="py-6 text-center text-slate-400">
                No se encontraron servicios que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
