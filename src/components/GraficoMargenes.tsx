import { useState } from 'react';
import { formatearPorcentaje } from '../services/calculoCostos';
import { fechaDeCierre, type ServicioRentabilidad } from '../services/rentabilidad';

// Colores del gráfico: un solo tono (azul) en dos pasos, validados como rampa ordinal contra la superficie blanca. El claro
// es lo estimado y el oscuro lo real; el resto es tinta y hairlines recesivos.
const COLOR_ESTIMADO = '#6da7ec';
const COLOR_REAL = '#184f95';
const SUPERFICIE = '#ffffff';
const TINTA = { primaria: '#0b0b0b', secundaria: '#52514e', apagada: '#898781' };
const GRILLA = '#e1e0d9';
const EJE = '#c3c2b7';

const ANCHO = 760;
const MARGEN_IZQ = 210;
const MARGEN_DER = 70;
const MARGEN_SUP = 30;
const ALTO_FILA = 30;
const PIE = 30;
const MAXIMO_SERVICIOS = 12;
const RADIO = 5;

interface GraficoMargenesProps {
  // Servicios ya filtrados, del más reciente al más antiguo
  servicios: ServicioRentabilidad[];
  margenMinimo: number | null;
}

interface Fila {
  servicio: ServicioRentabilidad;
  estimado: number;
  real: number;
  desviacion: number;
}

const conSigno = (valor: number) => `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${Math.abs(valor).toFixed(2)}`;
const recortar = (texto: string, largo: number) => (texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto);

// Compara, servicio por servicio, el margen que se estimó con el que dejó en la realidad (HU-37). Un dumbbell: cada fila une
// el punto estimado con el real, así la distancia es la desviación. Muestra los más recientes (hasta 12); la tabla de abajo
// y la vista «como tabla» tienen todos.
export default function GraficoMargenes({ servicios, margenMinimo }: GraficoMargenesProps) {
  const [comoTabla, setComoTabla] = useState(false);
  const [activo, setActivo] = useState<{ indice: number; x: number; y: number } | null>(null);

  const filas: Fila[] = servicios
    .filter((s) => s.margenEstimado !== null && s.margenReal !== null)
    .slice(0, MAXIMO_SERVICIOS)
    .map((servicio) => ({
      servicio,
      estimado: servicio.margenEstimado as number,
      real: servicio.margenReal as number,
      desviacion: (servicio.margenReal as number) - (servicio.margenEstimado as number),
    }));

  if (filas.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aún no hay servicios con margen estimado y real para comparar. Aparecen cuando se cierra un servicio cotizado con el sistema, o al cargar un histórico que traiga el costo estimado.
      </p>
    );
  }

  // Escala: de 0 (o del margen más bajo) al más alto, en múltiplos de 10
  const valores = [...filas.flatMap((f) => [f.estimado, f.real]), ...(margenMinimo === null ? [] : [margenMinimo]), 0];
  const minimo = Math.floor(Math.min(...valores) / 10) * 10;
  const maximo = Math.max(Math.ceil(Math.max(...valores) / 10) * 10, minimo + 10);
  const paso = maximo - minimo > 60 ? 20 : 10;
  const marcas: number[] = [];
  for (let marca = minimo; marca <= maximo; marca += paso) marcas.push(marca);

  const anchoPlano = ANCHO - MARGEN_IZQ - MARGEN_DER;
  const x = (valor: number) => MARGEN_IZQ + ((valor - minimo) / (maximo - minimo)) * anchoPlano;
  const yFila = (indice: number) => MARGEN_SUP + indice * ALTO_FILA + ALTO_FILA / 2;
  const alto = MARGEN_SUP + filas.length * ALTO_FILA + PIE;

  // Solo se rotula la fila donde más se equivocó el cálculo: el resto se lee en el eje, el tooltip o la tabla
  const extremo = filas.reduce((mayor, f, indice) => (Math.abs(f.desviacion) > Math.abs(filas[mayor].desviacion) ? indice : mayor), 0);

  const resumenAccesible = `Margen estimado y real de ${filas.length} servicios. ${filas
    .map((f) => `${f.servicio.referencia || 'Servicio'}: estimado ${f.estimado.toFixed(2)} por ciento, real ${f.real.toFixed(2)} por ciento`)
    .join('; ')}.`;

  const mostrar = (indice: number, evento: { clientX: number; clientY: number; currentTarget: Element }) => {
    const contenedor = evento.currentTarget.closest('[data-grafico]')?.getBoundingClientRect();
    if (!contenedor) return;
    setActivo({ indice, x: evento.clientX - contenedor.left, y: evento.clientY - contenedor.top });
  };

  const fila = activo ? filas[activo.indice] : null;

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" style={{ color: TINTA.secundaria }}>
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill={COLOR_ESTIMADO} /></svg>
            Margen estimado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill={COLOR_REAL} /></svg>
            Margen real
          </span>
          {margenMinimo !== null && (
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="12" aria-hidden="true"><line x1="7" y1="0" x2="7" y2="12" stroke={TINTA.secundaria} strokeWidth="1.5" /></svg>
              Mínimo {formatearPorcentaje(margenMinimo)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setComoTabla((valor) => !valor)}
          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
        >
          {comoTabla ? 'Ver gráfico' : 'Ver como tabla'}
        </button>
      </div>

      {comoTabla ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="text-sm uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Servicio</th>
                <th className="py-2 px-3 font-semibold text-right">Margen estimado</th>
                <th className="py-2 px-3 font-semibold text-right">Margen real</th>
                <th className="py-2 pl-3 font-semibold text-right">Desviación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f, indice) => (
                <tr key={`${f.servicio.referencia}-${indice}`}>
                  <td className="py-1.5 pr-3 text-slate-800">{f.servicio.referencia || 'Sin referencia'}</td>
                  <td className="py-1.5 px-3 text-right">{formatearPorcentaje(f.estimado)}</td>
                  <td className="py-1.5 px-3 text-right">{formatearPorcentaje(f.real)}</td>
                  <td className="py-1.5 pl-3 text-right">{conSigno(f.desviacion)} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div data-grafico className="relative" onPointerLeave={() => setActivo(null)}>
          <svg viewBox={`0 0 ${ANCHO} ${alto}`} className="w-full h-auto block" role="img" aria-label={resumenAccesible}>
            {/* Cuadrícula y eje horizontal */}
            {marcas.map((marca) => (
              <g key={marca}>
                <line x1={x(marca)} x2={x(marca)} y1={MARGEN_SUP - 6} y2={alto - PIE + 4} stroke={marca === 0 ? EJE : GRILLA} strokeWidth="1" />
                <text x={x(marca)} y={alto - 10} textAnchor="middle" fontSize="13" fill={TINTA.apagada} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {marca} %
                </text>
              </g>
            ))}

            {/* Margen mínimo del jefe */}
            {margenMinimo !== null && (
              <g>
                <line x1={x(margenMinimo)} x2={x(margenMinimo)} y1={MARGEN_SUP - 6} y2={alto - PIE + 4} stroke={TINTA.secundaria} strokeWidth="1.5" />
                <text x={x(margenMinimo)} y={MARGEN_SUP - 12} textAnchor="middle" fontSize="13" fill={TINTA.secundaria}>
                  Mínimo {margenMinimo} %
                </text>
              </g>
            )}

            {filas.map((f, indice) => {
              const y = yFila(indice);
              const resaltada = activo?.indice === indice;
              const izquierda = Math.min(x(f.estimado), x(f.real));
              const derecha = Math.max(x(f.estimado), x(f.real));
              const rotuloALaDerecha = derecha + 14 + 62 <= ANCHO;

              return (
                <g
                  key={`${f.servicio.referencia}-${indice}`}
                  tabIndex={0}
                  role="group"
                  aria-label={`${f.servicio.referencia || 'Servicio'}: estimado ${f.estimado.toFixed(2)} por ciento, real ${f.real.toFixed(2)} por ciento, desviación ${conSigno(f.desviacion)} puntos`}
                  onPointerMove={(e) => mostrar(indice, e)}
                  onFocus={(e) => {
                    const caja = e.currentTarget.getBoundingClientRect();
                    mostrar(indice, { clientX: caja.left + caja.width / 2, clientY: caja.top, currentTarget: e.currentTarget });
                  }}
                  onBlur={() => setActivo(null)}
                  className="outline-none"
                >
                  {/* Zona sensible: la fila entera, mucho más grande que los puntos */}
                  <rect x={0} y={y - ALTO_FILA / 2} width={ANCHO} height={ALTO_FILA} fill={resaltada ? '#f2f1ee' : 'transparent'} />

                  <text x={MARGEN_IZQ - 14} y={y + 4} textAnchor="end" fontSize="13" fill={TINTA.secundaria}>
                    <title>{f.servicio.referencia}</title>
                    {recortar(f.servicio.referencia || 'Sin referencia', 28)}
                  </text>

                  <line x1={izquierda} x2={derecha} y1={y} y2={y} stroke={EJE} strokeWidth="2" strokeLinecap="round" />
                  <circle cx={x(f.estimado)} cy={y} r={RADIO} fill={COLOR_ESTIMADO} stroke={SUPERFICIE} strokeWidth="2" />
                  <circle cx={x(f.real)} cy={y} r={RADIO} fill={COLOR_REAL} stroke={SUPERFICIE} strokeWidth="2" />

                  {indice === extremo && (
                    <text
                      x={rotuloALaDerecha ? derecha + 14 : izquierda - 14}
                      y={y + 4}
                      textAnchor={rotuloALaDerecha ? 'start' : 'end'}
                      fontSize="13"
                      fontWeight="600"
                      fill={TINTA.primaria}
                    >
                      {conSigno(f.desviacion)} pts
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {activo && fila && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md"
              style={{ left: Math.min(Math.max(activo.x + 14, 0), 520), top: Math.max(activo.y - 8, 0) }}
            >
              <p className="font-semibold text-slate-900">{fila.servicio.referencia || 'Sin referencia'}</p>
              <p className="text-slate-500">{fila.servicio.tipoServicio} · {fechaDeCierre(fila.servicio.cerradoEn)}</p>
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-2">
                  <svg width="12" height="8" aria-hidden="true"><line x1="0" y1="4" x2="12" y2="4" stroke={COLOR_ESTIMADO} strokeWidth="3" strokeLinecap="round" /></svg>
                  <strong className="text-slate-900">{formatearPorcentaje(fila.estimado)}</strong>
                  <span className="text-slate-500">estimado</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg width="12" height="8" aria-hidden="true"><line x1="0" y1="4" x2="12" y2="4" stroke={COLOR_REAL} strokeWidth="3" strokeLinecap="round" /></svg>
                  <strong className="text-slate-900">{formatearPorcentaje(fila.real)}</strong>
                  <span className="text-slate-500">real</span>
                </p>
                <p className="pt-0.5 text-slate-700">
                  <strong>{conSigno(fila.desviacion)} pts</strong> de desviación
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      <figcaption className="mt-2 text-sm text-slate-400">
        {filas.length === MAXIMO_SERVICIOS ? `Los ${MAXIMO_SERVICIOS} servicios más recientes. ` : ''}
        Margen sobre la venta sin IGV. La distancia entre los dos puntos es la desviación.
      </figcaption>
    </figure>
  );
}
