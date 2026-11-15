import { formatearPorcentaje } from '../services/calculoCostos';
import { sugerirCosto, type Analoga, type EntradasEstimacion } from '../services/analoga';
import { formatearFechaISO, formatearMonto } from '../services/solicitudes';

type Tema = 'oscuro' | 'claro';

// Colores del panel según dónde se muestre: el formulario de cotización es oscuro y la revisión del jefe, clara.
const TEMAS: Record<Tema, { caja: string; titulo: string; texto: string; suave: string; destacado: string; linea: string; fila: string; aviso: string }> = {
  oscuro: {
    caja: 'bg-[#1C204E] rounded-2xl p-4 space-y-2 border border-[#343C8F] text-sm',
    titulo: 'text-slate-300',
    texto: 'text-white',
    suave: 'text-slate-300',
    destacado: 'text-white',
    linea: 'border-[#343C8F]',
    fila: 'bg-[#222861]',
    aviso: 'text-amber-300',
  },
  claro: {
    caja: 'rounded-2xl border border-slate-200 p-4 space-y-2 text-sm',
    titulo: 'text-slate-500',
    texto: 'text-slate-800',
    suave: 'text-slate-500',
    destacado: 'text-slate-900',
    linea: 'border-slate-200',
    fila: 'bg-slate-50',
    aviso: 'text-amber-700',
  },
};

interface PanelAnalogaProps {
  // null mientras se carga o si no se pudo cargar
  analoga: Analoga | null;
  cargando?: boolean;
  error?: string;
  // Lo que se está estimando, para mostrar el costo corregido con la desviación histórica
  costoParametrico: number;
  ventaSoles: number;
  tema: Tema;
  // Copia los parámetros con los que se estimó un servicio parecido (HU-36); sin él no se ofrece
  onCopiar?: (entradas: EntradasEstimacion) => void;
}

const rango = (min: number | null, max: number | null, formato: (n: number) => string) =>
  min === null || max === null ? '' : min === max ? '' : ` (${formato(min)} a ${formato(max)})`;

// Los servicios parecidos a esta cotización (HU-34, HU-35): cuántos hay, cuánto costaron y qué margen dejaron en la realidad,
// y cuánto se equivocó en ellos el cálculo paramétrico. Con menos servicios que el mínimo del jefe no promedia ni sugiere
// nada: «sin datos suficientes».
export default function PanelAnaloga({ analoga, cargando = false, error = '', costoParametrico, ventaSoles, tema, onCopiar }: PanelAnalogaProps) {
  const t = TEMAS[tema];
  const sugerencia = sugerirCosto(analoga, costoParametrico, ventaSoles);

  return (
    <div className={t.caja}>
      <p className={`text-sm font-semibold uppercase tracking-wider ${t.titulo}`}>Servicios similares (estimación por analogía)</p>

      {cargando && !analoga && <p className={t.suave}>Buscando servicios similares…</p>}
      {error && <p className={t.aviso}>{error}</p>}

      {analoga && (
        <>
          <p className={`text-sm ${t.suave}`}>
            {analoga.tipoServicio
              ? `${analoga.tipoServicio}${analoga.criterio === 'TIPO_Y_DESTINO' ? ` · destino ${analoga.destino}` : ' · todos los destinos'}`
              : 'Sin tipo de servicio'}
          </p>

          {analoga.suficiente ? (
            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className={t.suave}>Servicios similares</span>
                <span className={t.texto}>{analoga.n}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className={t.suave}>Costo real promedio</span>
                <span className={t.texto}>
                  {formatearMonto(analoga.costoReal.promedio ?? 0)}
                  <span className={t.suave}>{rango(analoga.costoReal.min, analoga.costoReal.max, formatearMonto)}</span>
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className={t.suave}>Margen real promedio</span>
                <span className={t.texto}>
                  {analoga.margenReal.promedio === null ? '—' : formatearPorcentaje(analoga.margenReal.promedio)}
                  <span className={t.suave}>{rango(analoga.margenReal.min, analoga.margenReal.max, formatearPorcentaje)}</span>
                </span>
              </div>
              {analoga.desviacion.relativaPromedio !== null && (
                <div className="flex justify-between gap-3">
                  <span className={t.suave}>Costo real frente al calculado ({analoga.desviacion.casos} servicios)</span>
                  <span className={t.texto}>
                    {analoga.desviacion.relativaPromedio > 0 ? '+' : ''}
                    {formatearPorcentaje(analoga.desviacion.relativaPromedio)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className={`font-semibold ${t.aviso}`}>Sin datos suficientes</p>
          )}
          {analoga.motivo && <p className={`text-sm ${analoga.suficiente ? t.aviso : t.suave}`}>{analoga.motivo}</p>}

          {sugerencia && (
            <div className={`flex items-center justify-between gap-3 pt-2 border-t ${t.linea}`}>
              <div>
                <p className={`font-bold ${t.destacado}`}>Costo sugerido: {formatearMonto(sugerencia.costo)}</p>
                <p className={`text-sm ${t.suave}`}>
                  El paramétrico {sugerencia.desviacionPorcentaje >= 0 ? 'más' : 'menos'} {formatearPorcentaje(Math.abs(sugerencia.desviacionPorcentaje))}, como en servicios parecidos
                </p>
              </div>
              <span className={`text-right font-bold ${t.destacado}`}>
                {sugerencia.margen === null ? '—' : `Margen ${formatearPorcentaje(sugerencia.margen)}`}
              </span>
            </div>
          )}

          {analoga.recientes.length > 0 && (
            <div className={`pt-2 border-t ${t.linea} space-y-1`}>
              <p className={`text-sm ${t.suave}`}>Más recientes</p>
              <ul className="space-y-1">
                {analoga.recientes.map((caso, indice) => (
                  <li key={`${caso.referencia}-${indice}`} className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 ${t.fila}`}>
                    <span className={`min-w-0 ${t.texto}`}>
                      <span className="block truncate">{caso.referencia || 'Sin referencia'}</span>
                      <span className={`block text-sm ${t.suave}`}>
                        {caso.origen === 'HISTORICO' ? 'Histórico' : 'Sistema'} · {formatearFechaISO(caso.cerradoEn.slice(0, 10))} ·{' '}
                        {caso.costoReal === null ? '—' : formatearMonto(caso.costoReal)}
                        {caso.margenReal === null ? '' : ` · ${formatearPorcentaje(caso.margenReal)}`}
                      </span>
                    </span>
                    {onCopiar && caso.entradas && (
                      <button
                        type="button"
                        onClick={() => onCopiar(caso.entradas as EntradasEstimacion)}
                        title="Copia los técnicos, días, noches y viajes de este servicio a la hoja de costos"
                        className="shrink-0 px-3 py-1 bg-white/90 text-[#2A317A] text-sm font-medium rounded-full hover:bg-white transition-colors cursor-pointer"
                      >
                        Copiar parámetros
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
