import { useEffect, useState } from 'react';
import AgregarEditarModal from './Modal';
import { formatearFechaISO, type NuevaVisitaProgramada, type VisitaProgramada } from '../services/visitasProgramadas';
import { nombreDeTipo, type TipoVisita } from '../services/visitas';

// El servicio (visitaId) y la etapa (tipo) los aporta la pantalla que abre el modal.
export type DatosVisitaProgramada = Omit<NuevaVisitaProgramada, 'visitaId' | 'tipo'>;

interface VisitaProgramadaModalProps {
  isOpen: boolean;
  clienteNombre: string;
  // Etapa a la que pertenece la visita; se muestra en el título.
  tipo: TipoVisita;
  // Último día de la garantía del servicio: si se indica, la visita no puede programarse después.
  garantiaFin?: string;
  // Si viene con datos, el modal edita esa visita (reprogramación); si no, crea una nueva.
  visitaProgramada?: VisitaProgramada | null;
  onClose: () => void;
  onGuardar: (datos: DatosVisitaProgramada) => void;
  guardando?: boolean;
}

const vacio = { fecha: '', horaInicio: '', horaFin: '', descripcionTareas: '' };

export default function VisitaProgramadaModal({
  isOpen,
  clienteNombre,
  tipo,
  garantiaFin,
  visitaProgramada,
  onClose,
  onGuardar,
  guardando = false,
}: VisitaProgramadaModalProps) {
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [descripcionTareas, setDescripcionTareas] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const datos = visitaProgramada ?? vacio;
    setFecha(datos.fecha);
    setHoraInicio(datos.horaInicio);
    setHoraFin(datos.horaFin);
    setDescripcionTareas(datos.descripcionTareas);
    setError('');
  }, [isOpen, visitaProgramada]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    if (!fecha) return setError('Selecciona la fecha de la visita.');
    if (garantiaFin && fecha > garantiaFin) {
      return setError(`La visita debe estar dentro de la garantía (hasta el ${formatearFechaISO(garantiaFin)}).`);
    }
    if (!horaInicio || !horaFin) return setError('Ingresa la hora de inicio y de fin.');
    if (horaFin <= horaInicio) return setError('La hora de fin debe ser posterior a la hora de inicio.');
    if (!descripcionTareas.trim()) return setError('Describe las tareas que debe ejecutar el técnico.');

    onGuardar({ fecha, horaInicio, horaFin, descripcionTareas: descripcionTareas.trim() });
  }

  return (
    <AgregarEditarModal
      isOpen={isOpen}
      onClose={onClose}
      title={visitaProgramada ? 'Reprogramar visita' : 'Programar visita técnica'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{clienteNombre}</p>
          <p className="text-gray-600">{nombreDeTipo(tipo)}</p>
          {garantiaFin && <p className="text-gray-600">Garantía hasta el {formatearFechaISO(garantiaFin)}</p>}
        </div>

        <label className="text-white">Fecha de la visita</label>
        <input
          type="date"
          max={garantiaFin}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white">Hora de inicio</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full h-10 mt-2 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="text-white">Hora de fin</label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full h-10 mt-2 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>
        </div>

        <label className="text-white">Tareas que debe ejecutar el técnico</label>
        <textarea
          placeholder="Describe las tareas de la visita"
          value={descripcionTareas}
          onChange={(e) => setDescripcionTareas(e.target.value)}
          className="w-full h-28 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
        />

        {error && <p className="text-sm text-red-300 text-center">{error}</p>}

        <div className="flex flex-row justify-center items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}
          >
            {guardando ? 'Guardando visita...' : 'Guardar'}
          </button>
        </div>
      </form>
    </AgregarEditarModal>
  );
}
