import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { ETIQUETA_SEMAFORO, formatearPorcentaje, semaforoMargen } from '../services/calculoCostos';
import { ETIQUETA_ACCION, obtenerBandeja, type Bandeja } from '../services/estimaciones';
import { formatearMonto } from '../services/solicitudes';
import { formatearFechaHora } from '../services/visitas';

type Pestana = 'pendientes' | 'historial';

// Aviso que puede traer la navegación al volver de decidir una cotización (se muestra una sola vez).
interface ValidacionesState {
  aviso?: { title: string; message: string };
}

const ENCABEZADO = 'py-3 px-3.5 uppercase text-[11px] font-semibold tracking-wider';

// Pantalla del jefe: las estimaciones que esperan su decisión (las más antiguas primero) y el historial de lo que decidió.
export default function ValidacionesScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const aviso = (location.state as ValidacionesState | null)?.aviso;

  const [bandeja, setBandeja] = useState<Bandeja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [pestana, setPestana] = useState<Pestana>('pendientes');
  const [toast, setToast] = useState({ show: Boolean(aviso), title: aviso?.title, message: aviso?.message ?? '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      setBandeja(await obtenerBandeja());
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : 'No se pudieron cargar las validaciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const margenMinimo = bandeja?.margenMinimo ?? null;

  const celdaMargen = (margen: number | null) => {
    const semaforo = semaforoMargen(margen, margenMinimo);
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="whitespace-nowrap">{margen === null ? '—' : formatearPorcentaje(margen)}</span>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border whitespace-nowrap ${ETIQUETA_SEMAFORO[semaforo].estilo}`}>
          {ETIQUETA_SEMAFORO[semaforo].texto}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight">Validaciones</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {([
            ['pendientes', `Pendientes${bandeja ? ` (${bandeja.pendientes.length})` : ''}`],
            ['historial', 'Historial'],
          ] as const).map(([clave, texto]) => (
            <button
              key={clave}
              onClick={() => setPestana(clave)}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors shadow-sm cursor-pointer ${
                pestana === clave ? 'bg-[#2A317A] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cargando ? (
            <div className="flex flex-col justify-center items-center h-40">
              <LoadingSpinner />
              <p className="text-sm text-gray-600 mt-2">Cargando validaciones...</p>
            </div>
          ) : errorCarga || !bandeja ? (
            <div className="flex flex-col items-center gap-4 h-40 justify-center">
              <p className="text-slate-600">{errorCarga || 'No se pudieron cargar las validaciones.'}</p>
              <button
                onClick={cargar}
                className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : pestana === 'pendientes' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-[#1e295d] text-white select-none">
                    <th className={ENCABEZADO}>N° Cotización</th>
                    <th className={ENCABEZADO}>Cliente</th>
                    <th className={ENCABEZADO}>Servicio</th>
                    <th className={ENCABEZADO}>Enviada por</th>
                    <th className={`${ENCABEZADO} text-center`}>Enviada</th>
                    <th className={`${ENCABEZADO} text-right`}>Venta (S/)</th>
                    <th className={`${ENCABEZADO} text-right`}>Costo</th>
                    <th className={`${ENCABEZADO} text-right`}>Margen</th>
                    <th className={`${ENCABEZADO} text-center`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bandeja.pendientes.length > 0 ? (
                    bandeja.pendientes.map((p) => (
                      <tr key={p.estimacionId} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40">
                        <td className="py-2.5 px-3.5 font-medium text-slate-500 whitespace-nowrap">
                          {p.numeroCotizacion}
                          {p.version > 1 && <span className="ml-2 text-[10px] font-bold text-amber-700">CORREGIDA</span>}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800">{p.clienteNombre}</td>
                        <td className="py-2.5 px-3.5">{p.tipoServicio || '—'}</td>
                        <td className="py-2.5 px-3.5">{p.creadaPor}</td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{formatearFechaHora(p.enviadaEn)}</td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">{formatearMonto(p.ventaSoles ?? 0)}</td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">{formatearMonto(p.costoFinal ?? 0)}</td>
                        <td className="py-2.5 px-3.5">{celdaMargen(p.margenFinal)}</td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => navigate(`/validaciones/${p.cotizacionId}`)}
                            className="px-3 py-1 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors cursor-pointer"
                          >
                            Revisar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        No hay cotizaciones esperando tu validación.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-[#1e295d] text-white select-none">
                    <th className={`${ENCABEZADO} text-center`}>Fecha</th>
                    <th className={ENCABEZADO}>N° Cotización</th>
                    <th className={ENCABEZADO}>Cliente</th>
                    <th className={`${ENCABEZADO} text-center`}>Decisión</th>
                    <th className={ENCABEZADO}>Por</th>
                    <th className={`${ENCABEZADO} text-right`}>Costo</th>
                    <th className={`${ENCABEZADO} text-right`}>Margen</th>
                    <th className={ENCABEZADO}>Justificación</th>
                    <th className={`${ENCABEZADO} text-center`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bandeja.historial.length > 0 ? (
                    bandeja.historial.map((d) => (
                      <tr key={d.ajusteId} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40">
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{formatearFechaHora(d.fecha)}</td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-500 whitespace-nowrap">{d.numeroCotizacion}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800">{d.clienteNombre}</td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">{ETIQUETA_ACCION[d.accion]}</td>
                        <td className="py-2.5 px-3.5">{d.usuario}</td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          {d.costoDespues === null ? '—' : formatearMonto(d.costoDespues)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          {d.margenDespues === null ? '—' : formatearPorcentaje(d.margenDespues)}
                        </td>
                        <td className="py-2.5 px-3.5 max-w-xs truncate" title={d.justificacion}>{d.justificacion || '—'}</td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => navigate(`/validaciones/${d.cotizacionId}`)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Todavía no has decidido ninguna cotización.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {bandeja && margenMinimo === null && (
          <p className="mt-3 text-sm text-slate-600">
            Aún no definiste el margen mínimo: sin él no se avisa cuando una estimación queda baja. Puedes fijarlo en el Tarifario.
          </p>
        )}

        <Toast
          show={toast.show}
          type="success"
          title={toast.title}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
}
