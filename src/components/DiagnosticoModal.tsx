import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AgregarEditarModal from './Modal';
import SelectorEvidencias from './SelectorEvidencias';
import type { EvidenciaVisita, NuevoDiagnostico } from '../services/visitas';
import { quitarEvidencia } from '../services/evidencias';

interface DiagnosticoModalProps {
  isOpen: boolean;
  clienteNombre: string;
  // Servicio al que se adjuntan las evidencias del diagnóstico
  visitaId: number | null;
  onClose: () => void;
  onGuardar: (diagnostico: NuevoDiagnostico) => void;
  guardando?: boolean;
}

export default function DiagnosticoModal({ isOpen, clienteNombre, visitaId, onClose, onGuardar, guardando = false }: DiagnosticoModalProps) {
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

  // Los archivos ya se subieron al elegirlos: al cancelar se quitan del servidor; al guardar quedan con el diagnóstico.
  const cerrar = () => {
    evidencias.forEach((e) => {
      if (e.evidenciaId !== undefined) quitarEvidencia(e.evidenciaId).catch(() => undefined);
    });
    onClose();
  }

  const agregarComponente = () => {
    const nombre = componente.trim();
    if (!nombre) return;
    setComponentes((prev) => [...prev, nombre]);
    setComponente('');
    setError('');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!descripcion.trim()) return setError('Ingresa la descripción del diagnóstico.');

    // Si dejó un componente escrito sin añadirlo, se incluye
    const pendiente = componente.trim();
    const listaComponentes = pendiente ? [...componentes, pendiente] : componentes;
    if (listaComponentes.length === 0) return setError('Ingresa al menos un componente necesario.');

    onGuardar({ descripcion: descripcion.trim(), componentes: listaComponentes });
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
                className="flex items-center gap-1.5 bg-white rounded-full pl-3 pr-2 py-1 text-sm text-black shadow-sm"
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

        <label className="text-white">Evidencias (imágenes, PDF o Word)</label>
        {visitaId !== null && <SelectorEvidencias destino={{ visitaId }} evidencias={evidencias} onCambio={setEvidencias} deshabilitado={guardando} />}

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
            {guardando ? 'Guardando diagnóstico...' : 'Guardar'}
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
