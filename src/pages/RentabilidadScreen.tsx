import { useEffect, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import ComparacionMetodos from '../components/ComparacionMetodos';
import GraficoMargenes from '../components/GraficoMargenes';
import LoadingSpinner from '../components/LoadingSpinner';
import TablaAgrupada from '../components/TablaAgrupada';
import TablaServiciosRentabilidad from '../components/TablaServiciosRentabilidad';
import { ETIQUETA_SEMAFORO, formatearPorcentaje, semaforoMargen } from '../services/calculoCostos';
import { aCSV, descargarCSV, type ColumnaCSV } from '../services/exportacion';
import {
  ETIQUETA_ORIGEN,
  etiquetaPeriodo,
  obtenerRentabilidad,
  type ExactitudMetodo,
  type FiltrosRentabilidad,
  type Rentabilidad,
  type ServicioRentabilidad,
} from '../services/rentabilidad';
import { formatearMonto } from '../services/solicitudes';
import { formatearFechaHora } from '../services/visitas';

const ESTILO_FILTRO =
  'w-full h-10 appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none';

const conSigno = (valor: number) => `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${Math.abs(valor).toFixed(2)}`;

interface CifraProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  // La primera cifra del tablero lleva el protagonismo (una sola por vista)
  destacada?: boolean;
  insignia?: { texto: string; estilo: string };
}

// Una cifra del tablero: etiqueta, valor y, debajo, el dato que lo explica.
function Cifra({ etiqueta, valor, detalle, destacada = false, insignia }: CifraProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-1 ${destacada ? 'lg:col-span-2' : ''}`}>
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className={`font-semibold text-slate-900 ${destacada ? 'text-5xl' : 'text-2xl'}`}>{valor}</p>
      {insignia && (
        <span className={`self-start inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border whitespace-nowrap ${insignia.estilo}`}>
          {insignia.texto}
        </span>
      )}
      {detalle && <p className="text-sm text-slate-400">{detalle}</p>}
    </div>
  );
}

const COLUMNAS_SERVICIOS: ColumnaCSV<ServicioRentabilidad>[] = [
  { encabezado: 'Referencia', valor: (s) => s.referencia },
  { encabezado: 'Origen', valor: (s) => ETIQUETA_ORIGEN[s.origen] },
  { encabezado: 'Tipo de servicio', valor: (s) => s.tipoServicio },
  { encabezado: 'Destino', valor: (s) => s.destino },
  { encabezado: 'Fecha de cierre', valor: (s) => s.cerradoEn.slice(0, 10) },
  { encabezado: 'Venta sin IGV (S/)', valor: (s) => s.ventaSoles },
  { encabezado: 'Costo paramétrico (S/)', valor: (s) => s.costoParametrico },
  { encabezado: 'Costo análogo (S/)', valor: (s) => s.costoAnalogo },
  { encabezado: 'Costo estimado final (S/)', valor: (s) => s.costoEstimado },
  { encabezado: 'Costo real (S/)', valor: (s) => s.costoReal },
  { encabezado: 'Provisión de imprevistos (S/)', valor: (s) => s.imprevistosProvision },
  { encabezado: 'Imprevistos reales (S/)', valor: (s) => s.imprevistosReal },
  { encabezado: 'Margen estimado (%)', valor: (s) => s.margenEstimado },
  { encabezado: 'Margen real (%)', valor: (s) => s.margenReal },
  { encabezado: 'Desviación del costo (S/)', valor: (s) => s.desviacionCosto },
  { encabezado: 'Desviación del costo (%)', valor: (s) => s.desviacionCostoPorcentaje },
  { encabezado: 'Desviación del margen (puntos)', valor: (s) => s.desviacionMargen },
  { encabezado: 'Cumple el margen mínimo', valor: (s) => (s.cumpleMargenMinimo === null ? '' : s.cumpleMargenMinimo ? 'Sí' : 'No') },
  { encabezado: 'Dentro de la tolerancia', valor: (s) => (s.dentroTolerancia === null ? '' : s.dentroTolerancia ? 'Sí' : 'No') },
];

interface FilaMetodo extends ExactitudMetodo {
  base: string;
}

const COLUMNAS_METODOS: ColumnaCSV<FilaMetodo>[] = [
  { encabezado: 'Base de la comparación', valor: (m) => m.base },
  { encabezado: 'Método', valor: (m) => m.etiqueta },
  { encabezado: 'Servicios', valor: (m) => m.n },
  { encabezado: 'Error medio (S/)', valor: (m) => m.errorMedioAbsoluto },
  { encabezado: 'Error medio (%)', valor: (m) => m.errorPorcentualMedio },
  { encabezado: 'Sesgo (%)', valor: (m) => m.sesgoPorcentual },
  { encabezado: 'Dentro de la tolerancia (%)', valor: (m) => m.dentroTolerancia },
];

// Pantalla del jefe: el indicador «Margen de rentabilidad por proceso» (HU-37), la exactitud de los tres métodos de estimación
// (HU-38) y la exportación a CSV para la tesis (HU-39). Todo se calcula en el servidor con los filtros de arriba.
export default function RentabilidadScreen() {
  const [filtros, setFiltros] = useState<FiltrosRentabilidad>({ tipoServicio: '', anio: '', origen: '' });
  const [datos, setDatos] = useState<Rentabilidad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');

    obtenerRentabilidad(filtros)
      .then((recibidos) => vigente && setDatos(recibidos))
      .catch((e) => vigente && setError(e instanceof Error ? e.message : 'No se pudo cargar el tablero de rentabilidad.'))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [filtros]);

  const exportarServicios = () => {
    if (!datos) return;
    descargarCSV(`rentabilidad-servicios-${new Date().toISOString().slice(0, 10)}.csv`, aCSV(COLUMNAS_SERVICIOS, datos.servicios));
  };

  const exportarMetodos = () => {
    if (!datos) return;
    const { metodos, comunes } = datos.comparacion;
    const filas: FilaMetodo[] = [
      ...metodos.map((m) => ({ ...m, base: 'Todos los servicios que tienen ese método' })),
      ...comunes.metodos.map((m) => ({ ...m, base: `Solo los ${comunes.n} servicios con los tres estimados` })),
    ];
    descargarCSV(`rentabilidad-metodos-${new Date().toISOString().slice(0, 10)}.csv`, aCSV(COLUMNAS_METODOS, filas));
  };

  const resumen = datos?.resumen;
  const margenMinimo = datos?.parametros.margenMinimo ?? null;
  const semaforo = semaforoMargen(resumen?.margenReal ?? null, margenMinimo);

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight">Rentabilidad</h1>
          {/* <p className="text-sm text-slate-600 mt-1">Margen de rentabilidad por proceso: lo estimado frente a lo que ocurrió, con la venta sin IGV.</p> */}
        </div>

        {/* Filtros y exportación: una sola fila sobre todo lo que cambian */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl flex-1 min-w-[280px]">
            {([
              ['tipoServicio', 'Todos los tipos de servicio', datos?.filtros.tipos ?? [], (valor: string) => valor],
              ['anio', 'Todos los años', datos?.filtros.anios ?? [], (valor: string) => valor],
              ['origen', 'Sistema e histórico', datos?.filtros.origenes ?? [], (valor: string) => ETIQUETA_ORIGEN[valor as 'SISTEMA' | 'HISTORICO']],
            ] as const).map(([campo, vacio, opciones, etiqueta]) => (
              <div key={campo} className="relative h-10">
                <select
                  aria-label={vacio}
                  value={filtros[campo]}
                  onChange={(e) => setFiltros((actuales) => ({ ...actuales, [campo]: e.target.value }))}
                  className={ESTILO_FILTRO}
                >
                  <option value="">{vacio}</option>
                  {opciones.map((opcion) => (
                    <option key={opcion} value={opcion}>{etiqueta(opcion)}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportarServicios}
              disabled={!datos || datos.servicios.length === 0}
              className="flex items-center gap-2 px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              Exportar servicios (CSV)
            </button>
            <button
              type="button"
              onClick={exportarMetodos}
              disabled={!datos || !datos.comparacion.metodos.some((m) => m.n > 0)}
              className="flex items-center gap-2 px-5 py-1.5 bg-white text-[#2A317A] text-sm font-medium rounded-full hover:bg-slate-100 transition-colors shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              Exportar comparación de métodos (CSV)
            </button>
          </div>
        </div>

        {!datos && cargando ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-gray-600">Cargando rentabilidad...</p>
          </div>
        ) : error && !datos ? (
          <div className="flex flex-col items-center gap-4 h-64 justify-center">
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => setFiltros({ ...filtros })}
              className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : (
          datos &&
          resumen && (
            // Al cambiar un filtro se conserva lo anterior, atenuado, mientras llega lo nuevo
            <div className={`flex flex-col gap-6 max-w-6xl transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
              {error && <p className="text-sm text-rose-700">{error}</p>}

              {datos.parametros.margenMinimo === null && (
                <p className="text-sm text-slate-600">
                  Aún no definiste el margen mínimo: sin él no hay semáforo de margen. Puedes fijarlo en el Tarifario.
                </p>
              )}

              {/* Cifras principales */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Cifras principales">
                <Cifra
                  destacada
                  etiqueta="Margen real"
                  valor={resumen.margenReal === null ? '—' : formatearPorcentaje(resumen.margenReal)}
                  detalle={`${resumen.servicios} servicio${resumen.servicios === 1 ? '' : 's'} cerrado${resumen.servicios === 1 ? '' : 's'} · ${resumen.sistema} del sistema, ${resumen.historicos} del histórico`}
                  insignia={margenMinimo === null ? undefined : ETIQUETA_SEMAFORO[semaforo]}
                />
                <Cifra
                  etiqueta="Margen estimado"
                  valor={resumen.margenEstimado === null ? '—' : formatearPorcentaje(resumen.margenEstimado)}
                  detalle={
                    resumen.desviacionMargen === null
                      ? 'Sin servicios con costo estimado'
                      : `Real ${conSigno(resumen.desviacionMargen)} pts frente a lo estimado (${resumen.comparables} servicios)`
                  }
                />
                <Cifra etiqueta="Venta total sin IGV" valor={formatearMonto(resumen.ventaSoles)} detalle={`Costo real ${formatearMonto(resumen.costoReal)}`} />
                <Cifra
                  etiqueta="Costo real frente al estimado"
                  valor={resumen.desviacionCostoPorcentaje === null ? '—' : `${conSigno(resumen.desviacionCostoPorcentaje)} %`}
                  detalle={resumen.desviacionCostoPorcentaje === null ? undefined : 'Positivo: costó más de lo estimado'}
                />
                <Cifra
                  etiqueta="Imprevistos sobre los costos directos"
                  valor={resumen.imprevistos.porcentajeDeDirectos === null ? '—' : formatearPorcentaje(resumen.imprevistos.porcentajeDeDirectos)}
                  detalle={
                    resumen.imprevistos.serviciosConProvision > 0
                      ? `Real ${formatearMonto(resumen.imprevistos.realConProvision)} frente a ${formatearMonto(resumen.imprevistos.provision)} provisionados`
                      : `Imprevistos reales ${formatearMonto(resumen.imprevistos.real)}`
                  }
                />
              </section>

              {/* Estimado frente a real, servicio por servicio */}
              <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-black tracking-tight">Margen estimado frente al real</h2>
                  {/* <p className="text-sm text-slate-500">Cada fila une lo que se esperaba con lo que dejó el servicio.</p> */}
                </div>
                <GraficoMargenes servicios={datos.servicios} margenMinimo={margenMinimo} />
              </section>

              {/* Por tipo y por periodo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
                  <h2 className="text-xl font-bold text-black tracking-tight">Por tipo de servicio</h2>
                  <TablaAgrupada encabezado="Tipo" grupos={datos.porTipo} />
                </section>
                <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
                  <h2 className="text-xl font-bold text-black tracking-tight">Por periodo</h2>
                  <TablaAgrupada encabezado="Mes de cierre" grupos={datos.porPeriodo} etiqueta={etiquetaPeriodo} />
                </section>
              </div>

              {/* Exactitud de los tres métodos */}
              <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
                <div>
                  <h2 className="text-xl font-bold text-black tracking-tight">Exactitud de los métodos de estimación</h2>
                  <p className="text-sm text-slate-500">Paramétrico, análogo y el final que validó el jefe, medidos contra el costo real.</p>
                </div>
                <ComparacionMetodos comparacion={datos.comparacion} tolerancia={datos.parametros.tolerancia} />
              </section>

              {/* Servicios cerrados */}
              <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 pb-3">
                  <h2 className="text-xl font-bold text-black tracking-tight">Servicios cerrados</h2>
                  <p className="text-sm text-slate-500">
                    El margen mínimo es {margenMinimo === null ? 'aún sin definir' : formatearPorcentaje(margenMinimo)}; la tolerancia de desviación del costo,{' '}
                    {datos.parametros.tolerancia === null ? 'aún sin definir' : formatearPorcentaje(datos.parametros.tolerancia)}.
                  </p>
                </div>
                <TablaServiciosRentabilidad servicios={datos.servicios} margenMinimo={margenMinimo} />
              </section>

              {/* Diagnósticos que se pagaron y no se recuperaron */}
              <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
                <div>
                  <h2 className="text-xl font-bold text-black tracking-tight">Diagnósticos de servicios cancelados</h2>
                  <p className="text-sm text-slate-500">El cliente rechazó la cotización: la visita de diagnóstico ya se había pagado.</p>
                </div>
                {datos.cancelados.cantidad === 0 ? (
                  <p className="text-sm text-slate-400">No hay servicios cancelados con estos filtros.</p>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatearMonto(datos.cancelados.costoDiagnosticos)}
                      <span className="text-sm font-normal text-slate-500"> en {datos.cancelados.cantidad} servicio{datos.cancelados.cantidad === 1 ? '' : 's'}</span>
                    </p>
                    <ul className="divide-y divide-slate-100 text-sm text-slate-600">
                      {datos.cancelados.servicios.map((servicio) => (
                        <li key={servicio.visitaId} className="py-2 flex flex-wrap items-baseline justify-between gap-x-4">
                          <span>
                            <span className="font-semibold text-slate-800">{servicio.clienteNombre || `Servicio ${servicio.visitaId}`}</span>
                            <span className="text-slate-400"> · {servicio.tipoServicio || 'Sin tipo'} · {formatearFechaHora(servicio.canceladaEn)}</span>
                            {servicio.motivo && <span className="block text-sm text-slate-500">{servicio.motivo}</span>}
                          </span>
                          <span className="font-medium text-slate-800">{formatearMonto(servicio.monto)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              <p className="text-sm text-slate-400">
                Las cifras de lo real y lo estimado vienen de los servicios cerrados. Los históricos cargados desde Excel cuentan en lo real y, si traen
                el costo estimado, también en la comparación.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
