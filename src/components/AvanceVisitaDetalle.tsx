import { FileText } from 'lucide-react';
import type { AvanceVisita } from '../services/visitasProgramadas';

// Avance registrado por el técnico al completar una visita: descripción y documentación adjunta.
export default function AvanceVisitaDetalle({ avance }: { avance: AvanceVisita }) {
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
      <p>{avance.descripcion}</p>
      {avance.evidencias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {avance.evidencias.map((evidencia) =>
            evidencia.esImagen === false ? (
              <a
                key={evidencia.url}
                href={evidencia.url}
                download={evidencia.nombre}
                className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 text-xs text-slate-700 shadow-sm hover:bg-blue-50"
              >
                <FileText size={12} />
                {evidencia.nombre}
              </a>
            ) : (
              <a key={evidencia.url} href={evidencia.url} target="_blank" rel="noopener noreferrer">
                <img src={evidencia.url} alt={evidencia.nombre} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
