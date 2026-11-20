import { FileText } from 'lucide-react';
import type { EvidenciaVisita } from '../services/visitas';

// Archivos que el técnico adjuntó: las imágenes como miniatura (se abren en otra pestaña) y los documentos como enlace.
export default function ListaEvidencias({ evidencias }: { evidencias: EvidenciaVisita[] }) {
  if (evidencias.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {evidencias.map((evidencia) =>
        evidencia.esImagen === false ? (
          <a
            key={evidencia.url}
            href={evidencia.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 text-sm text-slate-700 shadow-sm hover:bg-blue-50"
          >
            <FileText size={14} />
            {evidencia.nombre}
          </a>
        ) : (
          <a key={evidencia.url} href={evidencia.url} target="_blank" rel="noopener noreferrer">
            <img src={evidencia.url} alt={evidencia.nombre} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
          </a>
        )
      )}
    </div>
  );
}
