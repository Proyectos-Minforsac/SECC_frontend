import { useCallback, useEffect, useState } from 'react';
import AgregarEditarModal from './Modal';
import {
  CONCEPTOS_IMPREVISTO,
  NOMBRE_ETAPA_COSTO,
  completarImprevisto,
  eliminarImprevisto,
  obtenerCostosDelServicio,
  registrarImprevisto,
  type ConceptoImprevisto,
  type CostosServicio,
  type EtapaCosto,
} from '../services/costosReales';
import { formatearMonto } from '../services/solicitudes';
import { aceptarMonto } from '../services/montos';
import { formatearFechaHora, type VisitaTecnica } from '../services/visitas';

interface ImprevistoModalProps {
  isOpen: boolean;
  visita: VisitaTecnica | null;
  onClose: () => void;
}

const ETAPAS: EtapaCosto[] = ['DIAGNOSTICO', 'INSTALACION', 'MANTENIMIENTO', 'SOPORTE'];

const ESTILO_CAMPO =
  'h-9 w-full bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm';

const mensajeDe = (error: unknown, porDefecto: string) => (error instanceof Error ? error.message : porDefecto);

// Los imprevistos de un servicio (HU-27): doble pasaje, traslado de material, material faltante... Se registran con su monto y
// motivo mientras la etapa siga abierta y suman al costo real. Los que avisa el técnico en su reporte llegan sin monto: aquí
// el trabajador se lo pone o los descarta.
export default function ImprevistoModal({ isOpen, visita, onClose }: ImprevistoModalProps) {
  const [costos, setCostos] = useState<CostosServicio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  const [etapa, setEtapa] = useState<EtapaCosto>('INSTALACION');
  const [concepto, setConcepto] = useState<ConceptoImprevisto>('DOBLE_PASAJE');
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  // Monto que se está escribiendo para cada aviso del técnico, por id
  const [montos, setMontos] = useState<Record<number, string>>({});

  const visitaId = visita?.visitaId;
  // El mantenimiento y el soporte existen desde que se finaliza la instalación; las etapas liquidadas ya no admiten cambios
  const etapasAbiertas = ETAPAS.filter(
    (e) => costos && !costos.etapasLiquidadas[e] && (e === 'DIAGNOSTICO' || e === 'INSTALACION' || (visita?.etapasFinalizadas ?? 0) >= 1)
  );

  // Si lo elegido ya no está disponible (se liquidó) se propone la etapa en curso: la instalación hasta que se finaliza
  const etapaElegida = etapasAbiertas.includes(etapa)
    ? etapa
    : etapasAbiertas.includes('INSTALACION')
      ? 'INSTALACION'
      : etapasAbiertas[0];

  const cargar = useCallback(async () => {
    if (visitaId === undefined) return;
    setCargando(true);
    try {
      setCostos(await obtenerCostosDelServicio(visitaId));
      setError('');
    } catch (e) {
      setError(mensajeDe(e, 'No se pudieron cargar los imprevistos.'));
    } finally {
      setCargando(false);
    }
  }, [visitaId]);

  useEffect(() => {
    if (!isOpen) return;
    setCostos(null);
    setError('');
    setMonto('');
    setMotivo('');
    setMontos({});
    setConcepto('DOBLE_PASAJE');
    cargar();
  }, [isOpen, cargar]);

  // Ejecuta una operación y vuelve a cargar la lista; los errores se muestran aquí mismo.
  const ejecutar = async (operacion: () => Promise<unknown>, alTerminar?: () => void) => {
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    try {
      await operacion();
      alTerminar?.();
      await cargar();
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo completar la operación.'));
    } finally {
      setTrabajando(false);
    }
  };

  const agregar = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (visitaId === undefined) return;
    if (monto.trim() === '' || Number(monto) <= 0) return setError('Ingresa el monto del imprevisto (mayor que cero).');
    if (motivo.trim().length < 10) return setError('Cuenta qué pasó (al menos 10 caracteres).');

    ejecutar(
      () => registrarImprevisto(visitaId, { etapa: etapaElegida, concepto, monto: Number(monto), motivo: motivo.trim() }),
      () => {
        setMonto('');
        setMotivo('');
      }
    );
  };

  return (
    <AgregarEditarModal isOpen={isOpen} onClose={onClose} title="Imprevistos del servicio" ancho="w-full max-w-2xl">
      <div className="flex flex-col gap-3 my-3">
        <div className="bg-white rounded-2xl px-5 py-3 text-sm text-black shadow-sm">
          <p className="font-semibold">{visita?.clienteNombre}</p>
          <p className="text-gray-600">
            Doble pasaje, material faltante, traslado de material… Suman al costo real del servicio y no se pueden agregar a una etapa ya liquidada.
          </p>
        </div>

        {cargando && !costos && <p className="text-sm text-slate-300">Cargando imprevistos…</p>}

        {costos && (
          <>
            {costos.imprevistos.length === 0 ? (
              <p className="text-sm text-slate-300">Todavía no hay imprevistos registrados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {costos.imprevistos.map((i) => (
                  <li key={i.costoRealId} className="bg-white rounded-2xl px-5 py-3 text-sm text-slate-700 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {i.etiqueta} <span className="font-normal text-slate-400">· {NOMBRE_ETAPA_COSTO[i.etapa]}</span>
                        </p>
                        <p className="text-slate-600">{i.motivo}</p>
                        <p className="text-sm text-slate-400">
                          {i.registradoPor} · {formatearFechaHora(i.registradoEn)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {i.estado === 'REGISTRADO' ? (
                          <p className="font-semibold text-slate-900">{formatearMonto(i.subtotal ?? 0)}</p>
                        ) : (
                          <p className="text-sm font-bold tracking-wider text-amber-700">SIN MONTO</p>
                        )}
                        {i.liquidada && <p className="text-sm text-slate-400">Liquidado</p>}
                      </div>
                    </div>

                    {!i.liquidada && (
                      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                        {i.estado === 'PENDIENTE' && (
                          <>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              aria-label="Monto del imprevisto avisado"
                              placeholder="Monto (S/)"
                              value={montos[i.costoRealId] ?? ''}
                              onChange={(e) => aceptarMonto(e.target.value, (valor) => setMontos((actual) => ({ ...actual, [i.costoRealId]: valor })))}
                              className="h-8 w-32 bg-slate-50 border border-slate-300 rounded-full px-3 text-sm text-black outline-none"
                            />
                            <button
                              type="button"
                              disabled={trabajando}
                              onClick={() => ejecutar(() => completarImprevisto(i.costoRealId, Number(montos[i.costoRealId] ?? '')))}
                              className="px-4 py-1 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Registrar monto
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={trabajando}
                          onClick={() => ejecutar(() => eliminarImprevisto(i.costoRealId))}
                          className="px-4 py-1 bg-rose-100 text-rose-700 text-sm font-medium rounded-full hover:bg-rose-200 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Descartar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-sm text-white">
              Total de imprevistos: <strong>{formatearMonto(costos.totales.imprevistos)}</strong>
              <span className="text-slate-300"> · provisión calculada al cotizar: {formatearMonto(costos.provision)}</span>
            </p>

            {etapasAbiertas.length > 0 ? (
              <form onSubmit={agregar} className="flex flex-col gap-3 border-t border-white/20 pt-3">
                <p className="text-sm font-semibold text-white">Registrar un imprevisto</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Etapa
                    <select value={etapaElegida} onChange={(e) => setEtapa(e.target.value as EtapaCosto)} className={ESTILO_CAMPO}>
                      {etapasAbiertas.map((e) => (
                        <option key={e} value={e}>{NOMBRE_ETAPA_COSTO[e]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Tipo
                    <select value={concepto} onChange={(e) => setConcepto(e.target.value as ConceptoImprevisto)} className={ESTILO_CAMPO}>
                      {CONCEPTOS_IMPREVISTO.map((c) => (
                        <option key={c.clave} value={c.clave}>{c.etiqueta}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Monto (S/)
                    <input type="number" min={0} step="0.01" value={monto} onChange={(e) => aceptarMonto(e.target.value, setMonto)} className={ESTILO_CAMPO} />
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  Motivo
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Qué pasó y por qué hubo que gastar de más"
                    className="w-full h-20 bg-white rounded-2xl p-3 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={trabajando}
                    className="px-5 py-1.5 bg-[#22C55E] text-black text-sm font-medium rounded-full hover:bg-[#16A34A] transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {trabajando ? 'Guardando…' : 'Registrar imprevisto'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-300 border-t border-white/20 pt-3">
                Todas las etapas disponibles ya fueron liquidadas: no se admiten más imprevistos.
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-300 text-center">{error}</p>}

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors shadow-sm cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </AgregarEditarModal>
  );
}
