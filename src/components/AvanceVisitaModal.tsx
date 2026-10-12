import { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import AgregarEditarModal from './Modal';
import type { EvidenciaVisita } from '../services/visitas';
import type { AvanceVisita } from '../services/visitasProgramadas';

interface AvanceVisitaModalProps {
  isOpen: boolean;
  clienteNombre: string;
  // Fecha y horario de la visita que se está completando, ya formateados.
  resumenVisita: string;
  onClose: () => void;
  onGuardar: (avance: AvanceVisita) => void;
  guardando?: boolean;
}

export default function AvanceVisitaModal({ isOpen, clienteNombre, resumenVisita, onClose, onGuardar, guardando = false }: AvanceVisitaModalProps) {
  const [descripcion, setDescripcion] = useState('');
  const [evidencias, setEvidencias] = useState<EvidenciaVisita[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescripcion('');
      setEvidencias([]);
      setError('');
    }
  }, [isOpen]);

  // Al cancelar se liberan los archivos; al guardar pasan a la visita y se conservan.
  const cerrar = () => {
    evidencias.forEach((e) => URL.revokeObjectURL(e.url));
    onClose();
  }

  const agregarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    setEvidencias((prev) => [
      ...prev,
      ...archivos.map((archivo) => ({
        nombre: archivo.name,
        url: URL.createObjectURL(archivo),
        esImagen: archivo.type.startsWith('image/'),
        subidoEn: new Date().toISOString(),
      })),
    ]);
    // Permite volver a elegir el mismo archivo después de quitarlo
    e.target.value = '';
  }

  const quitarArchivo = (indice: number) => {
    URL.revokeObjectURL(evidencias[indice].url);
    setEvidencias((prev) => prev.filter((_, i) => i !== indice));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!descripcion.trim()) return setError('Ingresa la descripción del avance del servicio.');

    onGuardar({ descripcion: descripcion.trim(), evidencias });
  }

  return (
    <AgregarEditarModal isOpen={isOpen} onClose={cerrar} title="Avance de la visita">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3 max-h-[75vh] overflow-y-auto pr-1">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{clienteNombre}</p>
          <p className="text-gray-600">{resumenVisita}</p>
        </div>

        <label className="text-white">Descripción del avance del servicio</label>
        <textarea
          placeholder="Trabajos realizados durante la visita"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full h-28 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
        />

        <label className="text-white">Imágenes y documentación</label>
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          multiple
          onChange={agregarArchivos}
          className="w-full bg-white rounded-full text-sm text-gray-800 shadow-sm cursor-pointer outline-none
             file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0
             file:text-xs file:font-semibold file:bg-gray-900 file:text-white
             hover:file:bg-black file:cursor-pointer transition-colors"
        />
        {evidencias.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {evidencias.map((evidencia, indice) => (
              <div key={evidencia.url} className="relative">
                {evidencia.esImagen ? (
                  <img
                    src={evidencia.url}
                    alt={evidencia.nombre}
                    className="w-full h-20 object-cover rounded-xl shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-full h-20 flex flex-col items-center justify-center gap-1 px-2 rounded-xl shadow-sm bg-white text-gray-700">
                    <FileText size={20} />
                    <span className="w-full text-[10px] text-center truncate">{evidencia.nombre}</span>
                  </div>
                )}
                <button
                  type="button"
                  aria-label={`Quitar ${evidencia.nombre}`}
                  onClick={() => quitarArchivo(indice)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 cursor-pointer hover:bg-black"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-300 text-center">{error}</p>}

        <div className="flex flex-row justify-center items-center gap-3 pt-2">
          <button
            type="button"
            onClick={cerrar}
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}
          >
            {guardando ? 'Guardando avance...' : 'Guardar'}
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
