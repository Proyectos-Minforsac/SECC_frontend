import { useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import type { EvidenciaVisita } from '../services/visitas';
import { ACEPTAR_ARCHIVOS, MAX_ARCHIVOS, quitarEvidencia, subirEvidencia, type DestinoEvidencia } from '../services/evidencias';

interface SelectorEvidenciasProps {
  // Diagnóstico o visita a la que se adjuntan los archivos
  destino: DestinoEvidencia;
  // Archivos que ya se subieron (los guarda quien usa el selector, para poder quitarlos si se cancela)
  evidencias: EvidenciaVisita[];
  onCambio: (evidencias: EvidenciaVisita[]) => void;
  deshabilitado?: boolean;
}

// Selector de imágenes, PDF y documentos Word: cada archivo se sube al servidor apenas se elige (las imágenes se reducen antes),
// así que al guardar el diagnóstico o el avance solo falta el texto. Hasta 10 archivos de 8 MB.
export default function SelectorEvidencias({ destino, evidencias, onCambio, deshabilitado = false }: SelectorEvidenciasProps) {
  const [subiendo, setSubiendo] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);

  const agregar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const elegidos = Array.from(e.target.files ?? []);
    // Permite volver a elegir el mismo archivo después de quitarlo
    e.target.value = '';
    if (elegidos.length === 0) return;

    const nuevosErrores: string[] = [];
    const cupo = MAX_ARCHIVOS - evidencias.length;
    if (elegidos.length > cupo) {
      nuevosErrores.push(cupo > 0 ? `Solo caben ${cupo} archivo(s) más: cada visita admite hasta ${MAX_ARCHIVOS}.` : `Cada visita admite hasta ${MAX_ARCHIVOS} archivos.`);
    }

    let actuales = evidencias;
    setSubiendo((n) => n + 1);
    // Uno a uno: cada archivo pesa hasta 8 MB y así un fallo no pierde a los demás
    for (const archivo of elegidos.slice(0, Math.max(cupo, 0))) {
      try {
        actuales = [...actuales, await subirEvidencia(destino, archivo)];
        onCambio(actuales);
      } catch (error) {
        nuevosErrores.push(error instanceof Error ? error.message : `No se pudo subir «${archivo.name}».`);
      }
    }
    setSubiendo((n) => n - 1);
    setErrores(nuevosErrores);
  };

  const quitar = async (evidencia: EvidenciaVisita) => {
    setErrores([]);
    try {
      if (evidencia.evidenciaId !== undefined) await quitarEvidencia(evidencia.evidenciaId);
      onCambio(evidencias.filter((e) => e.url !== evidencia.url));
    } catch (error) {
      setErrores([error instanceof Error ? error.message : `No se pudo quitar «${evidencia.nombre}».`]);
    }
  };

  const ocupado = subiendo > 0;

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept={ACEPTAR_ARCHIVOS}
        multiple
        disabled={deshabilitado || ocupado || evidencias.length >= MAX_ARCHIVOS}
        onChange={agregar}
        aria-label="Agregar imágenes y documentos"
        className="w-full bg-white rounded-full text-sm text-gray-800 shadow-sm cursor-pointer outline-none
             file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0
             file:text-sm file:font-semibold file:bg-gray-900 file:text-white
             hover:file:bg-black file:cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <p className="text-sm text-slate-300">
        Imágenes, PDF o Word de hasta 8 MB, máximo {MAX_ARCHIVOS} archivos ({evidencias.length}/{MAX_ARCHIVOS}). Las imágenes se reducen antes de subirlas.
      </p>

      {ocupado && (
        <p className="flex items-center gap-2 text-sm text-white" role="status">
          <Loader2 size={14} className="animate-spin" /> Subiendo archivos…
        </p>
      )}

      {evidencias.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {evidencias.map((evidencia) => (
            <div key={evidencia.url} className="relative">
              {evidencia.esImagen === false ? (
                <div className="w-full h-20 flex flex-col items-center justify-center gap-1 px-2 rounded-xl shadow-sm bg-white text-gray-700">
                  <FileText size={20} />
                  <span className="w-full text-sm text-center truncate">{evidencia.nombre}</span>
                </div>
              ) : (
                <img src={evidencia.url} alt={evidencia.nombre} className="w-full h-20 object-cover rounded-xl shadow-sm bg-white" />
              )}
              <button
                type="button"
                aria-label={`Quitar ${evidencia.nombre}`}
                disabled={ocupado}
                onClick={() => quitar(evidencia)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 cursor-pointer hover:bg-black disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {errores.length > 0 && (
        <ul className="text-sm text-red-300 list-disc pl-5" role="alert">
          {errores.map((mensaje) => (
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
