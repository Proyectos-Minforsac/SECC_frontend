import { useState } from 'react';
import { formatearPorcentaje } from '../services/calculoCostos';
import { formatearMonto } from '../services/solicitudes';
import { aceptarMonto } from '../services/montos';
import { formatearFechaHora } from '../services/visitas';
import { margenBajoMinimo, margenConCosto, type DetalleEstimacion } from '../services/estimaciones';

// Mismo mínimo que exige el servidor (JUSTIFICACION_MINIMA).
const MINIMO_CARACTERES = 10;

type Modo = 'validar' | 'ajustar' | 'devolver';

interface DecisionValidacionProps {
  detalle: DetalleEstimacion;
  // Costo que sugiere la analogía (null si no hay servicios similares suficientes): se ofrece al ajustar
  costoSugerido?: number | null;
  // Mientras se guarda en el servidor se bloquean los botones.
  guardando: boolean;
  onValidar: (justificacion?: string) => void;
  onAjustar: (costoFinal: number, justificacion: string) => void;
  onDevolver: (motivo: string) => void;
}

const ESTILO_TEXTO =
  'w-full h-24 bg-white border border-slate-300 rounded-2xl p-3 text-black placeholder-gray-400 text-sm outline-none resize-none select-text focus:border-[#2A317A]';

// La decisión del jefe sobre una estimación en revisión (HU-19, HU-20, HU-21): validar con un clic, validar con
// ajuste de costo o devolver con el motivo. Si la estimación ya se decidió, solo muestra cómo quedó.
export default function DecisionValidacion({ detalle, costoSugerido = null, guardando, onValidar, onAjustar, onDevolver }: DecisionValidacionProps) {
  const { estimacion: e, margenMinimo } = detalle;
  const [modo, setModo] = useState<Modo | null>(null);
  const [texto, setTexto] = useState('');
  const [costo, setCosto] = useState('');
  const [error, setError] = useState('');

  if (e.estado !== 'EN REVISIÓN') {
    return (
      <p className="text-sm text-slate-600">
        {e.estado === 'VALIDADA'
          ? `Validada por ${e.validadaPor} el ${formatearFechaHora(e.validadaEn)}.`
          : 'Devuelta al trabajador. Cuando la corrija y la reenvíe, aparecerá otra vez en las pendientes.'}
      </p>
    );
  }

  const exigeJustificacion = margenBajoMinimo(e.margenFinal, margenMinimo);
  const costoNuevo = costo.trim() === '' ? null : Number(costo);
  const margenNuevo = costoNuevo !== null && Number.isFinite(costoNuevo) && costoNuevo > 0 && e.ventaSoles
    ? margenConCosto(e.ventaSoles, costoNuevo)
    : null;

  const abrir = (siguiente: Modo) => {
    setModo(siguiente);
    setTexto('');
    setCosto(siguiente === 'ajustar' && e.costoFinal !== null ? String(e.costoFinal) : '');
    setError('');
  };

  const cerrar = () => {
    setModo(null);
    setError('');
  };

  const clicEnValidar = () => {
    // Con el margen en rango se valida con un clic; bajo el mínimo hace falta dejar por qué
    if (exigeJustificacion) abrir('validar');
    else onValidar();
  };

  const confirmar = () => {
    const justificacion = texto.trim();
    if (justificacion.length < MINIMO_CARACTERES) {
      return setError(`Escribe al menos ${MINIMO_CARACTERES} caracteres.`);
    }

    if (modo === 'validar') return onValidar(justificacion);
    if (modo === 'devolver') return onDevolver(justificacion);

    if (costoNuevo === null || !Number.isFinite(costoNuevo) || costoNuevo <= 0) {
      return setError('Ingresa el costo total ajustado (un monto mayor que cero).');
    }
    if (costoNuevo === e.costoFinal) {
      return setError('El costo ajustado es igual al estimado: usa Validar si estás de acuerdo.');
    }
    onAjustar(costoNuevo, justificacion);
  };

  if (modo === null) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={clicEnValidar}
            disabled={guardando}
            className="px-6 py-2 bg-[#22C55E] text-black text-sm font-medium rounded-full hover:bg-[#16A34A] transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? 'Validando…' : 'Validar'}
          </button>
          <button
            onClick={() => abrir('ajustar')}
            disabled={guardando}
            className="px-6 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-full hover:bg-amber-200 transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Ajustar costo
          </button>
          <button
            onClick={() => abrir('devolver')}
            disabled={guardando}
            className="px-6 py-2 bg-rose-100 text-rose-700 text-sm font-medium rounded-full hover:bg-rose-200 transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Devolver
          </button>
        </div>
        {exigeJustificacion && (
          <p className="text-sm text-rose-700">
            El margen queda bajo el mínimo: para validarla tendrás que dejar tu justificación.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-800">
        {modo === 'validar' && 'Validar con el margen bajo el mínimo'}
        {modo === 'ajustar' && 'Ajustar el costo y validar'}
        {modo === 'devolver' && 'Devolver al trabajador'}
      </p>

      {modo === 'ajustar' && (
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Costo total ajustado (S/)
            <input
              type="number"
              min={0}
              step="0.01"
              value={costo}
              onChange={(ev) => aceptarMonto(ev.target.value, setCosto)}
              className="h-10 w-44 bg-white border border-slate-300 rounded-full px-4 text-black text-sm outline-none focus:border-[#2A317A]"
            />
          </label>
          {costoSugerido !== null && (
            <button
              type="button"
              onClick={() => setCosto(String(costoSugerido))}
              className="mb-2 px-4 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Usar el costo sugerido ({formatearMonto(costoSugerido)})
            </button>
          )}
          <p className="text-sm text-slate-600 pb-2">
            Estimado: {formatearMonto(e.costoFinal ?? 0)} → margen{' '}
            <strong className="text-slate-900">{margenNuevo === null ? '—' : formatearPorcentaje(margenNuevo)}</strong>
            {margenMinimo !== null && margenNuevo !== null && margenNuevo < margenMinimo && (
              <span className="text-rose-700"> (bajo el mínimo)</span>
            )}
          </p>
        </div>
      )}

      <label className="text-sm text-slate-600" htmlFor="texto-decision">
        {modo === 'devolver' ? 'Motivo (lo verá el trabajador)' : 'Justificación (queda en la bitácora)'}
      </label>
      <textarea
        id="texto-decision"
        placeholder={
          modo === 'devolver'
            ? 'Qué debe corregir el trabajador'
            : modo === 'ajustar'
              ? 'Por qué cambia el costo estimado'
              : 'Por qué aceptas este margen'
        }
        value={texto}
        onChange={(ev) => setTexto(ev.target.value)}
        className={ESTILO_TEXTO}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={cerrar}
          disabled={guardando}
          className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-slate-300 transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={guardando}
          className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            modo === 'devolver'
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-[#22C55E] text-black hover:bg-[#16A34A]'
          }`}
        >
          {guardando
            ? 'Guardando…'
            : modo === 'devolver'
              ? 'Devolver cotización'
              : modo === 'ajustar'
                ? 'Ajustar y validar'
                : 'Validar'}
        </button>
      </div>
    </div>
  );
}
