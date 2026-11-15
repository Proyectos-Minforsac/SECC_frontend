import { ETIQUETA_SEMAFORO, formatearPorcentaje, semaforoMargen, type ResultadoEstimacion } from '../services/calculoCostos';
import { formatearMonto } from '../services/solicitudes';

interface ResumenCostosProps {
  resultado: ResultadoEstimacion;
  // Lo que impide guardar (falta una tarifa, un costo de compra...). No se muestran mientras se cargan las tarifas.
  problemas: string[];
  cargando: boolean;
  moneda: string;
  // Margen mínimo que fijó el jefe, o null si aún no lo definió.
  margenMinimo: number | null;
  errorParametros: string;
}

// Lo que el trabajador necesita ver al cotizar, siempre a la vista: cuánto suman los viáticos, cuánto cuesta todo y
// qué margen queda frente a lo que se va a cobrar.
export default function ResumenCostos({ resultado: r, problemas, cargando, moneda, margenMinimo, errorParametros }: ResumenCostosProps) {
  const semaforo = semaforoMargen(r.margen, margenMinimo);
  const enDolares = moneda === 'DÓLARES';

  const fila = (etiqueta: string, valor: number, detalle?: string) => (
    <div className="flex justify-between gap-3">
      <span className="text-slate-300">
        {etiqueta}
        {detalle && <span className="text-slate-400"> {detalle}</span>}
      </span>
      <span className="text-white">{formatearMonto(valor)}</span>
    </div>
  );

  return (
    <div className="bg-[#1C204E] rounded-2xl p-4 space-y-2 border border-[#343C8F] text-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">Costo estimado (uso interno)</p>

      <div className="space-y-1">
        {fila('Viáticos', r.viaticos, '(transporte, hospedaje y alimentación)')}
        {fila('Mano de obra', r.manoObra)}
        {fila('Materiales', r.materiales)}
        {fila('Diagnóstico', r.diagnostico, '(oferta aceptada)')}
        {fila('Imprevistos', r.imprevistos, r.sinTasaImprevistos ? '(sin tasa definida)' : `(${r.tasaImprevistos} %)`)}
      </div>

      <div className="flex justify-between gap-3 pt-2 border-t border-[#343C8F] font-bold text-white">
        <span>Costo total</span>
        <span>{formatearMonto(r.costoTotal)}</span>
      </div>

      <div className="flex justify-between gap-3 text-slate-300">
        <span>Venta sin IGV{enDolares ? ' (US$)' : ''}</span>
        <span className="text-white">
          {enDolares ? `US$ ${r.ventaSinIGV.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : formatearMonto(r.ventaSinIGV)}
        </span>
      </div>
      {enDolares && fila('Venta en soles', r.ventaSoles)}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#343C8F]">
        <div>
          <p className="font-bold text-white">
            Margen estimado: {r.margen === null ? '—' : formatearPorcentaje(r.margen)}
          </p>
          <p className="text-sm text-slate-400">
            {margenMinimo === null ? 'El jefe aún no definió el margen mínimo' : `Mínimo: ${formatearPorcentaje(margenMinimo)}`}
          </p>
        </div>
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border whitespace-nowrap ${ETIQUETA_SEMAFORO[semaforo].estilo}`}>
          {ETIQUETA_SEMAFORO[semaforo].texto}
        </span>
      </div>

      {!cargando && r.sinTasaImprevistos && (
        <p className="text-sm text-amber-300">
          {errorParametros
            ? 'No se pudieron cargar los parámetros del jefe: no se aplica provisión de imprevistos.'
            : 'El jefe aún no definió la tasa de imprevistos: no se aplica provisión.'}
        </p>
      )}
      {!cargando && problemas.length > 0 && (
        <ul className="text-sm text-amber-300 space-y-0.5 list-disc pl-4">
          {problemas.map((problema) => (
            <li key={problema}>{problema}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
