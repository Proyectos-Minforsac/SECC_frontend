import { useEffect, useState } from 'react';
import { formatearFechaHora } from '../services/visitas';
import type { DefinicionParametro, ParametrosCosto } from '../services/parametrosCosto';

interface ParametrosCostoFormProps {
  parametros: ParametrosCosto;
  guardando?: boolean;
  onGuardar: (valores: Record<string, number | null>) => void;
}

// Lo ingresado se guarda como texto para poder dejar un campo vacío (= sin definir).
const textosIniciales = ({ definiciones, valores }: ParametrosCosto): Record<string, string> =>
  Object.fromEntries(
    definiciones.map((d) => {
      const { valor, definido } = valores[d.clave];
      return [d.clave, definido && valor !== null ? String(valor) : ''];
    })
  );

const placeholderDe = (definicion: DefinicionParametro) =>
  definicion.defecto !== null ? `Por defecto: ${definicion.defecto}` : 'Sin definir';

export default function ParametrosCostoForm({ parametros, guardando = false, onGuardar }: ParametrosCostoFormProps) {
  const [textos, setTextos] = useState<Record<string, string>>(() => textosIniciales(parametros));
  const [error, setError] = useState('');

  // Cuando el servidor devuelve lo guardado, el formulario vuelve a reflejarlo.
  useEffect(() => {
    setTextos(textosIniciales(parametros));
    setError('');
  }, [parametros]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    const valores: Record<string, number | null> = {};
    for (const definicion of parametros.definiciones) {
      const texto = (textos[definicion.clave] ?? '').trim().replace(',', '.');
      if (texto === '') {
        valores[definicion.clave] = null;
        continue;
      }

      const numero = Number(texto);
      if (!Number.isFinite(numero) || numero < definicion.min || numero > definicion.max) {
        return setError(`${definicion.etiqueta} debe ser un número entre ${definicion.min} y ${definicion.max}.`);
      }
      if (definicion.entero && !Number.isInteger(numero)) {
        return setError(`${definicion.etiqueta} debe ser un número entero.`);
      }
      valores[definicion.clave] = numero;
    }

    setError('');
    onGuardar(valores);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        {parametros.definiciones.map((definicion) => {
          const { definido, actualizadoPor, actualizadoEn } = parametros.valores[definicion.clave];
          return (
            <div key={definicion.clave} className="flex flex-col gap-1">
              <label htmlFor={definicion.clave} className="text-sm font-semibold text-slate-800">
                {definicion.etiqueta}
              </label>
              <div className="relative">
                <input
                  id={definicion.clave}
                  type="number"
                  inputMode={definicion.entero ? 'numeric' : 'decimal'}
                  min={definicion.min}
                  max={definicion.max}
                  step={definicion.entero ? 1 : 0.01}
                  placeholder={placeholderDe(definicion)}
                  value={textos[definicion.clave] ?? ''}
                  onChange={(e) => setTextos((prev) => ({ ...prev, [definicion.clave]: e.target.value }))}
                  className="w-full bg-[#F1F4FA] border border-slate-200 rounded-full pl-5 pr-24 py-2.5 text-sm text-black placeholder-gray-400 outline-none focus:border-[#2A317A]"
                />
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  {definicion.unidad}
                </span>
              </div>
              <p className="text-sm text-slate-500">{definicion.ayuda}</p>
              {definido && actualizadoPor && (
                <p className="text-[11px] text-slate-400">
                  Actualizado por {actualizadoPor}
                  {actualizadoEn ? ` el ${formatearFechaHora(actualizadoEn)}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={guardando}
          className={`px-6 py-2 text-sm font-medium rounded-full shadow-sm transition-colors ${guardando ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#2A317A] text-white hover:bg-[#1C2257] cursor-pointer'}`}
        >
          {guardando ? 'Guardando parámetros...' : 'Guardar parámetros'}
        </button>
      </div>
    </form>
  );
}
