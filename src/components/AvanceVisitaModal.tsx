import { useEffect, useState } from 'react';
import AgregarEditarModal from './Modal';
import SelectorEvidencias from './SelectorEvidencias';
import type { EvidenciaVisita } from '../services/visitas';
import type { NuevoAvance } from '../services/visitasProgramadas';
import { quitarEvidencia } from '../services/evidencias';
import { CONCEPTOS_IMPREVISTO, type ConceptoImprevisto } from '../services/costosReales';

interface AvanceVisitaModalProps {
  isOpen: boolean;
  clienteNombre: string;
  // Fecha y horario de la visita que se está completando, ya formateados.
  resumenVisita: string;
  // Servicio y visita a los que se adjuntan las evidencias del avance
  visitaId: number | null;
  visitaProgramadaId: number | null;
  onClose: () => void;
  onGuardar: (avance: NuevoAvance) => void;
  guardando?: boolean;
}

export default function AvanceVisitaModal({ isOpen, clienteNombre, resumenVisita, visitaId, visitaProgramadaId, onClose, onGuardar, guardando = false }: AvanceVisitaModalProps) {
  const [descripcion, setDescripcion] = useState('');
  const [evidencias, setEvidencias] = useState<EvidenciaVisita[]>([]);
  const [error, setError] = useState('');
  // Aviso de imprevisto (opcional): qué pasó; el monto lo registra después el trabajador
  const [hayImprevisto, setHayImprevisto] = useState(false);
  const [concepto, setConcepto] = useState<ConceptoImprevisto>('DOBLE_PASAJE');
  const [descripcionImprevisto, setDescripcionImprevisto] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescripcion('');
      setEvidencias([]);
      setError('');
      setHayImprevisto(false);
      setConcepto('DOBLE_PASAJE');
      setDescripcionImprevisto('');
    }
  }, [isOpen]);

  // Los archivos ya se subieron al elegirlos: al cancelar se quitan del servidor; al guardar quedan con el avance.
  const cerrar = () => {
    evidencias.forEach((e) => {
      if (e.evidenciaId !== undefined) quitarEvidencia(e.evidenciaId).catch(() => undefined);
    });
    onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!descripcion.trim()) return setError('Ingresa la descripción del avance del servicio.');
    if (hayImprevisto && descripcionImprevisto.trim().length < 10) {
      return setError('Cuenta qué pasó con el imprevisto (al menos 10 caracteres).');
    }

    onGuardar({
      descripcion: descripcion.trim(),
      ...(hayImprevisto ? { imprevisto: { concepto, descripcion: descripcionImprevisto.trim() } } : {}),
    });
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

        <label className="text-white">Imágenes y documentación (imágenes, PDF o Word)</label>
        {visitaProgramadaId !== null && visitaId !== null && (
          <SelectorEvidencias destino={{ visitaId, visitaProgramadaId }} evidencias={evidencias} onCambio={setEvidencias} deshabilitado={guardando} />
        )}

        <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hayImprevisto}
            onChange={(e) => setHayImprevisto(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          Hubo un imprevisto en esta visita
        </label>
        {hayImprevisto && (
          <div className="flex flex-col gap-2 rounded-2xl border border-white/20 p-3">
            <select
              value={concepto}
              onChange={(e) => setConcepto(e.target.value as ConceptoImprevisto)}
              aria-label="Tipo de imprevisto"
              className="w-full h-10 bg-white rounded-full px-4 text-sm text-black shadow-sm outline-none cursor-pointer"
            >
              {CONCEPTOS_IMPREVISTO.map((c) => (
                <option key={c.clave} value={c.clave}>{c.etiqueta}</option>
              ))}
            </select>
            <textarea
              placeholder="Qué ocurrió. El trabajador registrará el monto."
              value={descripcionImprevisto}
              onChange={(e) => setDescripcionImprevisto(e.target.value)}
              className="w-full h-20 bg-white rounded-2xl p-3 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
            />
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
