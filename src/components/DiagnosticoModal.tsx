import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AgregarEditarModal from './Modal';
import type { DiagnosticoVisita, EvidenciaVisita } from '../services/visitas';

interface DiagnosticoModalProps {
  isOpen: boolean;
  clienteNombre: string;
  onClose: () => void;
  onGuardar: (diagnostico: DiagnosticoVisita) => void;
}

export default function DiagnosticoModal({ isOpen, clienteNombre, onClose, onGuardar }: DiagnosticoModalProps) {
  const [descripcion, setDescripcion] = useState('');
  const [componente, setComponente] = useState('');
  const [componentes, setComponentes] = useState<string[]>([]);
  const [evidencias, setEvidencias] = useState<EvidenciaVisita[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescripcion('');
      setComponente('');
      setComponentes([]);
      setEvidencias([]);
      setError('');
    }
  }, [isOpen]);

  // Al cancelar se liberan las imágenes; al guardar pasan a la visita y se conservan.
  const cerrar = () => {
    evidencias.forEach((e) => URL.revokeObjectURL(e.url));
    onClose();
  }

  const agregarComponente = () => {
    const nombre = componente.trim();
    if (!nombre) return;
    setComponentes((prev) => [...prev, nombre]);
    setComponente('');
    setError('');
  }

  const agregarImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    setEvidencias((prev) => [
      ...prev,
      ...archivos.map((archivo) => ({
        nombre: archivo.name,
        url: URL.createObjectURL(archivo),
        subidoEn: new Date().toISOString(),
      })),
    ]);
    // Permite volver a elegir el mismo archivo después de quitarlo
    e.target.value = '';
  }

  const quitarImagen = (indice: number) => {
    URL.revokeObjectURL(evidencias[indice].url);
    setEvidencias((prev) => prev.filter((_, i) => i !== indice));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return setError('Ingresa la descripción del diagnóstico.');

    // Si dejó un componente escrito sin añadirlo, se incluye
    const pendiente = componente.trim();
    const listaComponentes = pendiente ? [...componentes, pendiente] : componentes;
    if (listaComponentes.length === 0) return setError('Ingresa al menos un componente necesario.');

    onGuardar({ descripcion: descripcion.trim(), componentes: listaComponentes, evidencias });
  }

  return (
    <AgregarEditarModal isOpen={isOpen} onClose={cerrar} title="Diagnóstico inicial">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3 max-h-[75vh] overflow-y-auto pr-1">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{clienteNombre}</p>
        </div>

        <label className="text-white">Descripción del diagnóstico</label>
        <textarea
          placeholder="Análisis de la empresa y del problema encontrado"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full h-28 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
        />

        <label className="text-white">Componentes necesarios</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ej. Fuente de poder 500W"
            value={componente}
            onChange={(e) => setComponente(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                agregarComponente();
              }
            }}
            className="flex-1 min-w-0 bg-white rounded-full px-5 py-2 text-sm text-black placeholder-gray-500 outline-none shadow-sm"
          />
          <button
            type="button"
            onClick={agregarComponente}
            className="px-4 py-2 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Añadir
          </button>
        </div>
        {componentes.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {componentes.map((nombre, indice) => (
              <li
                key={`${nombre}-${indice}`}
                className="flex items-center gap-1.5 bg-white rounded-full pl-3 pr-2 py-1 text-xs text-black shadow-sm"
              >
                {nombre}
                <button
                  type="button"
                  aria-label={`Quitar ${nombre}`}
                  onClick={() => setComponentes((prev) => prev.filter((_, i) => i !== indice))}
                  className="cursor-pointer text-gray-500 hover:text-black"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="text-white">Evidencias (imágenes)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={agregarImagenes}
          className="w-full bg-white rounded-full text-sm text-gray-800 shadow-sm cursor-pointer outline-none
             file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0
             file:text-xs file:font-semibold file:bg-gray-900 file:text-white
             hover:file:bg-black file:cursor-pointer transition-colors"
        />
        {evidencias.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {evidencias.map((evidencia, indice) => (
              <div key={evidencia.url} className="relative">
                <img
                  src={evidencia.url}
                  alt={evidencia.nombre}
                  className="w-full h-20 object-cover rounded-xl shadow-sm bg-white"
                />
                <button
                  type="button"
                  aria-label={`Quitar ${evidencia.nombre}`}
                  onClick={() => quitarImagen(indice)}
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
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Guardar
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
