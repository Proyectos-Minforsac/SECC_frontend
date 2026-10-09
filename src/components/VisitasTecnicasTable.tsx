import { ESTILO_ESTADO_VISITA, type VisitaTecnica } from '../services/visitas';

interface VisitasTecnicasTableProps {
  visitas: VisitaTecnica[];
}

export default function VisitasTecnicasTable({ visitas }: VisitasTecnicasTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead>
          <tr className="bg-[#1e295d] text-white uppercase text-[11px] font-semibold tracking-wider select-none">
            <th className="py-3 px-3.5 text-center">N°</th>
            <th className="py-3 px-3.5">Cliente</th>
            <th className="py-3 px-3.5">Técnico</th>
            <th className="py-3 px-3.5">Instrucciones</th>
            <th className="py-3 px-3.5 text-center">Fecha</th>
            <th className="py-3 px-3.5 text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visitas.length > 0 ? (
            visitas.map((visita) => (
              <tr key={visita.visitaId} className="transition-colors even:bg-slate-50/40 hover:bg-blue-50/50">
                <td className="py-2.5 px-3.5 font-medium text-slate-500 text-center">{visita.visitaId}</td>
                <td className="py-2.5 px-3.5 font-semibold text-slate-800">{visita.clienteNombre}</td>
                <td className="py-2.5 px-3.5 text-slate-700">{visita.tecnicoNombre}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{visita.descripcion}</td>
                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{visita.fecha}</td>
                <td className="py-2.5 px-3.5 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border whitespace-nowrap ${ESTILO_ESTADO_VISITA[visita.estado]}`}>
                    {visita.estado}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-6 text-center text-slate-400">
                No hay visitas técnicas autorizadas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
