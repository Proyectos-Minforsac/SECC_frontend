import { useEffect, useState } from 'react';
import AgregarEditarModal from './Modal';
import { FACTOR_RUBRO, RUBROS, pluralizar } from '../services/calculoCostos';
import {
  aPayloadLiquidacion,
  costoDeEtapa,
  editableDe,
  problemasDeEtapa,
  type CategoriaCosto,
  type EtapaEditable,
  type EtapaPayload,
  type PropuestaConTabla,
  type PropuestaEtapa,
} from '../services/costosReales';
import { formatearMonto } from '../services/solicitudes';
import { aceptarMontoNumero } from '../services/montos';

interface LiquidacionCostosModalProps {
  isOpen: boolean;
  titulo: string;
  textoConfirmar: string;
  clienteNombre: string;
  // Texto bajo el encabezado (qué se habilita, qué se cierra...)
  nota?: string;
  // Aviso que no impide confirmar (por ejemplo, que la garantía aún no vence)
  advertencia?: string;
  // La tabla de costos reales; null cuando solo hay que confirmar (servicio anterior al control, o ya liquidado)
  propuesta: PropuestaConTabla | null;
  // Mientras se guarda en el servidor se bloquean los botones.
  guardando: boolean;
  onClose: () => void;
  onConfirmar: (etapas: EtapaPayload[]) => void;
}

const ESTILO_CAMPO =
  'h-8 w-full bg-slate-50 border border-slate-300 rounded-full px-2 text-center text-sm text-black outline-none focus:border-[#2A317A]';

const desviacion = (valor: number) => {
  const redondeado = Math.round((valor + Number.EPSILON) * 100) / 100;
  const signo = redondeado > 0 ? '+' : redondeado < 0 ? '−' : '';
  const color = redondeado > 0 ? 'text-rose-600' : redondeado < 0 ? 'text-emerald-700' : 'text-slate-500';
  return <span className={`font-medium whitespace-nowrap ${color}`}>{signo}{formatearMonto(Math.abs(redondeado))}</span>;
};

interface CampoNumeroProps {
  etiqueta: string;
  valor: number | '';
  onCambiar: (valor: number | '') => void;
}

function CampoNumero({ etiqueta, valor, onCambiar }: CampoNumeroProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-500">
      {etiqueta}
      <input
        type="number"
        min={0}
        step={1}
        value={valor}
        onChange={(e) => onCambiar(e.target.value === '' ? '' : Number(e.target.value))}
        className={ESTILO_CAMPO}
      />
    </label>
  );
}

interface TarjetaEtapaProps {
  propuesta: PropuestaEtapa;
  editable: EtapaEditable;
  onCambiar: (editable: EtapaEditable) => void;
}

// Una etapa de la liquidación: lo que se hizo (técnicos, días, noches, viajes), el precio de cada rubro y, rubro por
// rubro, lo real frente a lo planificado.
function TarjetaEtapa({ propuesta, editable, onCambiar }: TarjetaEtapaProps) {
  const real = costoDeEtapa(propuesta, editable);

  if (propuesta.etapa === 'DIAGNOSTICO') {
    return (
      <div className="bg-white rounded-2xl px-5 py-3 text-sm text-slate-700 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-slate-800">{propuesta.nombre}</span>
          <span className="font-semibold text-slate-800">{formatearMonto(real.subtotal)}</span>
        </div>
        <p className="text-sm text-slate-400 mt-0.5">Lo que costó la oferta aceptada: ya está pagado y no se modifica.</p>
      </div>
    );
  }

  const cambiar = (campo: 'nTecnicos' | 'dias' | 'noches' | 'viajes') => (valor: number | '') => onCambiar({ ...editable, [campo]: valor });
  const entradas = { nTecnicos: Number(editable.nTecnicos) || 0, dias: Number(editable.dias) || 0, noches: Number(editable.noches) || 0, viajes: Number(editable.viajes) || 0 };

  return (
    <div className="bg-white rounded-2xl px-5 py-4 text-sm text-slate-700 shadow-sm space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-800">{propuesta.nombre}</span>
        <span className="text-sm text-slate-400">
          Ejecutado: {propuesta.ejecutado.visitas} {propuesta.ejecutado.visitas === 1 ? 'visita completada' : 'visitas completadas'} ·{' '}
          {pluralizar(propuesta.ejecutado.dias, 'día')} con visita
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <CampoNumero etiqueta="Técnicos" valor={editable.nTecnicos} onCambiar={cambiar('nTecnicos')} />
        <CampoNumero etiqueta="Días" valor={editable.dias} onCambiar={cambiar('dias')} />
        <CampoNumero etiqueta="Noches" valor={editable.noches} onCambiar={cambiar('noches')} />
        <CampoNumero etiqueta="Viajes" valor={editable.viajes} onCambiar={cambiar('viajes')} />
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-sm uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <th className="py-1.5 pr-2 font-semibold">Rubro</th>
            <th className="py-1.5 px-2 font-semibold w-28">Precio (S/)</th>
            <th className="py-1.5 px-2 font-semibold text-right">Real</th>
            <th className="py-1.5 px-2 font-semibold text-right">Planificado</th>
            <th className="py-1.5 pl-2 font-semibold text-right">Desviación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {real.rubros.map((rubro) => {
            const definicion = RUBROS.find((r) => r.categoria === rubro.categoria)!;
            const factor = FACTOR_RUBRO[definicion.campo];
            const planificado = propuesta.planificado.rubros[rubro.categoria] ?? 0;

            return (
              <tr key={rubro.categoria}>
                <td className="py-1.5 pr-2">
                  <span className="text-slate-800">{rubro.etiqueta}</span>
                  <span className="block text-sm text-slate-400">
                    {pluralizar(entradas.nTecnicos, 'técnico')} × {pluralizar(factor.cantidad(entradas), factor.unidad)}
                  </span>
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-label={`Precio de ${rubro.etiqueta.toLowerCase()}`}
                    value={editable.precios[rubro.categoria as CategoriaCosto]}
                    onChange={(e) =>
                      aceptarMontoNumero(e.target.value, (valor) =>
                        onCambiar({ ...editable, precios: { ...editable.precios, [rubro.categoria]: valor } })
                      )
                    }
                    className={ESTILO_CAMPO}
                  />
                </td>
                <td className="py-1.5 px-2 text-right text-slate-800">{formatearMonto(rubro.subtotal)}</td>
                <td className="py-1.5 px-2 text-right text-slate-500">{formatearMonto(planificado)}</td>
                <td className="py-1.5 pl-2 text-right">{desviacion(rubro.subtotal - planificado)}</td>
              </tr>
            );
          })}

          {propuesta.etapa === 'INSTALACION' && (
            <tr>
              <td className="py-1.5 pr-2">
                <span className="text-slate-800">Materiales</span>
                <span className="block text-sm text-slate-400">Costo real de compra</span>
              </td>
              <td className="py-1.5 px-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  aria-label="Costo real de los materiales"
                  value={editable.materiales}
                  onChange={(e) => aceptarMontoNumero(e.target.value, (valor) => onCambiar({ ...editable, materiales: valor }))}
                  className={ESTILO_CAMPO}
                />
              </td>
              <td className="py-1.5 px-2 text-right text-slate-800">{formatearMonto(real.materiales)}</td>
              <td className="py-1.5 px-2 text-right text-slate-500">{formatearMonto(propuesta.planificado.materiales ?? 0)}</td>
              <td className="py-1.5 pl-2 text-right">{desviacion(real.materiales - (propuesta.planificado.materiales ?? 0))}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-300 font-semibold text-slate-800">
            <td className="py-1.5 pr-2" colSpan={2}>Total de la etapa</td>
            <td className="py-1.5 px-2 text-right">{formatearMonto(real.subtotal)}</td>
            <td className="py-1.5 px-2 text-right text-slate-500">{formatearMonto(propuesta.planificado.subtotal)}</td>
            <td className="py-1.5 pl-2 text-right">{desviacion(real.subtotal - propuesta.planificado.subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// La liquidación de costos reales (HU-28, HU-29): una tabla ya llena con lo planificado y lo ejecutado que el trabajador
// confirma o corrige, con la desviación a la vista. Sin tabla (`propuesta` null) solo pide confirmar, con el aviso si lo hay.
export default function LiquidacionCostosModal({
  isOpen,
  titulo,
  textoConfirmar,
  clienteNombre,
  nota,
  advertencia,
  propuesta,
  guardando,
  onClose,
  onConfirmar,
}: LiquidacionCostosModalProps) {
  const [editables, setEditables] = useState<Record<string, EtapaEditable>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEditables(propuesta ? Object.fromEntries(propuesta.etapas.map((p) => [p.etapa, editableDe(p)])) : {});
      setError('');
    }
  }, [isOpen, propuesta]);

  const etapas = propuesta?.etapas ?? [];
  const calculos = etapas.map((p) => ({ p, real: costoDeEtapa(p, editables[p.etapa] ?? editableDe(p)) }));
  const planificado = etapas.reduce((total, p) => total + p.planificado.subtotal, 0);
  const realDirectos = calculos.reduce((total, c) => total + c.real.subtotal, 0);
  const imprevistos = (propuesta?.imprevistos ?? []).reduce((total, i) => total + (i.estado === 'REGISTRADO' ? i.subtotal ?? 0 : 0), 0);
  const problemas = etapas.flatMap((p) => problemasDeEtapa(p, editables[p.etapa] ?? editableDe(p)));
  const sinMonto = propuesta?.pendientes ?? 0;

  const confirmar = () => {
    if (guardando) return;
    if (sinMonto > 0) return setError('Hay imprevistos avisados por el técnico sin monto: regístralos o descártalos antes de liquidar.');
    if (problemas.length > 0) return setError(problemas[0]);

    onConfirmar(propuesta ? aPayloadLiquidacion(etapas, editables) : []);
  };

  return (
    <AgregarEditarModal
      isOpen={isOpen}
      onClose={guardando ? () => undefined : onClose}
      title={titulo}
      ancho={propuesta ? 'w-full max-w-4xl' : undefined}
    >
      <div className="flex flex-col gap-3 my-3">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{clienteNombre}</p>
          {nota && <p className="text-gray-600">{nota}</p>}
        </div>

        {propuesta && (
          <>
            <p className="text-sm text-white">
              Confirma los costos reales. La tabla parte de lo planificado y de lo que se ejecutó; corrige lo que haga falta.
            </p>

            {calculos.map(({ p }) => (
              <TarjetaEtapa
                key={p.etapa}
                propuesta={p}
                editable={editables[p.etapa] ?? editableDe(p)}
                onCambiar={(editable) => setEditables((actual) => ({ ...actual, [p.etapa]: editable }))}
              />
            ))}

            <div className="bg-white rounded-2xl px-5 py-4 text-sm text-slate-700 shadow-sm space-y-1">
              <div className="flex justify-between gap-3">
                <span>Costos directos: planificado</span>
                <span>{formatearMonto(planificado)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Costos directos: real</span>
                <span className="font-semibold text-slate-900">{formatearMonto(realDirectos)}</span>
              </div>
              <div className="flex justify-between gap-3 font-semibold border-t border-slate-200 pt-1">
                <span>Desviación parcial de costos directos</span>
                {desviacion(realDirectos - planificado)}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-200">
                <p className="font-semibold text-slate-800">Imprevistos de estas etapas: {formatearMonto(imprevistos)}</p>
                {propuesta.imprevistos.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                    {propuesta.imprevistos.map((i) => (
                      <li key={i.costoRealId} className="flex justify-between gap-3">
                        <span>
                          {i.etiqueta} · {i.motivo}
                          {i.estado === 'PENDIENTE' && <span className="ml-1 font-semibold text-amber-700">(avisado por el técnico, sin monto)</span>}
                        </span>
                        <span>{i.subtotal === null ? '—' : formatearMonto(i.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No se registraron imprevistos en estas etapas.</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Provisión de imprevistos calculada al cotizar: {formatearMonto(propuesta.provision)} · usada en todo el servicio: {formatearMonto(propuesta.imprevistosServicio)}
                </p>
              </div>
            </div>

            {sinMonto > 0 && (
              <p className="text-sm text-amber-300">
                Hay {sinMonto} imprevisto(s) avisado(s) por el técnico sin monto. Regístralos o descártalos en «Imprevistos» antes de liquidar.
              </p>
            )}
          </>
        )}

        {advertencia && (
          <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">{advertencia}</p>
        )}

        {error && <p className="text-sm text-red-300 text-center">{error}</p>}

        <div className="flex flex-row justify-center items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando || sinMonto > 0}
            className="px-5 py-1.5 bg-[#22C55E] text-black text-sm font-medium rounded-full hover:bg-[#16A34A] transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </AgregarEditarModal>
  );
}
