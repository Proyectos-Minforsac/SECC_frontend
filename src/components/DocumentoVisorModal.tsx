import { useEffect } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { formatearFechaHora, tipoEvidencia, type EvidenciaVisita } from '../services/visitas';

interface DocumentoVisorModalProps {
  documento: EvidenciaVisita | null;
  onClose: () => void;
}

// Visualiza un documento dentro de la página (imágenes y PDF); el resto solo se puede descargar.
export default function DocumentoVisorModal({ documento, onClose }: DocumentoVisorModalProps) {
  useEffect(() => {
    if (!documento) return;
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [documento, onClose]);

  if (!documento) return null;

  const tipo = tipoEvidencia(documento);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={documento.nombre}
        className="flex flex-col w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{documento.nombre}</p>
            <p className="text-sm text-slate-500">Subido el {formatearFechaHora(documento.subidoEn)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={documento.url}
              download={documento.nombre}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm"
            >
              <Download size={14} />
              Descargar
            </a>
            <button onClick={onClose} aria-label="Cerrar visor" className="p-1 text-slate-500 hover:text-black cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-slate-100 flex items-center justify-center">
          {tipo === 'imagen' && (
            <img src={documento.url} alt={documento.nombre} className="max-w-full max-h-full object-contain" />
          )}
          {tipo === 'pdf' && <iframe src={documento.url} title={documento.nombre} className="w-full h-full border-0" />}
          {tipo === 'otro' && (
            <div className="flex flex-col items-center gap-2 text-slate-500 text-sm text-center px-6">
              <FileText size={40} />
              <p>Este tipo de archivo no se puede visualizar en la página. Descárgalo para abrirlo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
