import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BitacoraValidacion from '../components/BitacoraValidacion';
import DecisionValidacion from '../components/DecisionValidacion';
import DesgloseEstimacion from '../components/DesgloseEstimacion';
import PanelAnaloga from '../components/PanelAnaloga';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { ESTILO_ESTADO_VALIDACION } from '../services/cotizaciones';
import { sugerirCosto } from '../services/analoga';
import {
  ajustarEstimacion,
  devolverEstimacion,
  obtenerDetalleEstimacion,
  validarEstimacion,
  type DetalleEstimacion,
  type ResultadoDecision,
} from '../services/estimaciones';
import { formatearFechaHora } from '../services/visitas';

const mensajeDe = (error: unknown, porDefecto: string) => (error instanceof Error ? error.message : porDefecto);

// Revisión de una cotización por el jefe: de dónde sale cada costo, qué margen deja y su decisión. Tras decidir vuelve a
// la bandeja para seguir con la siguiente.
export default function ValidacionDetalleScreen() {
  const { cotizacionId: cotizacionIdRuta } = useParams();
  const cotizacionId = Number(cotizacionIdRuta);
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState<DetalleEstimacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      setDetalle(await obtenerDetalleEstimacion(cotizacionId));
    } catch (error) {
      setErrorCarga(mensajeDe(error, 'No se pudo cargar la estimación.'));
    } finally {
      setCargando(false);
    }
  }, [cotizacionId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const volver = () => navigate('/validaciones');

  // Ejecuta la decisión y vuelve a la bandeja. Si falla (por ejemplo, otra sesión ya la decidió) se queda aquí, muestra
  // el motivo y recarga la estimación para ver cómo está ahora.
  const decidir = async (accion: () => Promise<ResultadoDecision>, titulo: string, texto: string) => {
    if (guardando || !detalle) return;

    setGuardando(true);
    try {
      await accion();
      navigate('/validaciones', {
        state: { aviso: { title: titulo, message: `${detalle.cotizacion.numeroCotizacion} ${texto}` } },
      });
    } catch (error) {
      setToast({ show: true, message: mensajeDe(error, 'No se pudo registrar la decisión.') });
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const estimacion = detalle?.estimacion;

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={volver}
            className="p-2 rounded-full bg-white text-black hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
            aria-label="Volver a Validaciones"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-bold text-black tracking-tight">
            {detalle ? `Validar ${detalle.cotizacion.numeroCotizacion}` : 'Validar cotización'}
          </h1>
          {estimacion && (
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border whitespace-nowrap ${ESTILO_ESTADO_VALIDACION[estimacion.estado]}`}>
              {estimacion.estado}
            </span>
          )}
        </div>

        {cargando && !detalle ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-gray-600">Cargando estimación...</p>
          </div>
        ) : errorCarga || !detalle || !estimacion ? (
          <div className="flex flex-col items-center gap-4 h-64 justify-center">
            <p className="text-slate-600">{errorCarga || 'No se pudo cargar la estimación.'}</p>
            <button
              onClick={cargar}
              className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-5xl">
            <section className="bg-white rounded-2xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ['Cliente', detalle.cotizacion.clienteNombre],
                ['Solicitante', detalle.cotizacion.solicitante],
                ['Servicio', estimacion.tipoServicio || '—'],
                ['Garantía', detalle.cotizacion.garantiaMeses ? `${detalle.cotizacion.garantiaMeses} meses` : '—'],
                ['Enviada por', estimacion.creadaPor],
                ['Enviada', formatearFechaHora(estimacion.enviadaEn || estimacion.creadaEn)],
                ['Versión', `${estimacion.version}${estimacion.version > 1 ? ' (corregida)' : ''}`],
                ['Total (+ IGV)', `${detalle.cotizacion.moneda === 'DÓLARES' ? 'US$' : 'S/'} ${detalle.cotizacion.total.toFixed(2)}`],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta}>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{etiqueta}</p>
                  <p className="font-semibold text-slate-800">{valor}</p>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold text-black tracking-tight">Decisión</h2>
              <PanelAnaloga
                tema="claro"
                analoga={detalle.analoga}
                costoParametrico={estimacion.costoParametrico ?? 0}
                ventaSoles={estimacion.ventaSoles ?? 0}
              />
              <DecisionValidacion
                detalle={detalle}
                costoSugerido={sugerirCosto(detalle.analoga, estimacion.costoParametrico ?? 0, estimacion.ventaSoles ?? 0)?.costo ?? null}
                guardando={guardando}
                onValidar={(justificacion) =>
                  decidir(() => validarEstimacion(estimacion.estimacionId, justificacion), 'Cotización validada', 'fue validada. El trabajador ya puede descargar su PDF.')
                }
                onAjustar={(costoFinal, justificacion) =>
                  decidir(
                    () => ajustarEstimacion(estimacion.estimacionId, costoFinal, justificacion),
                    'Cotización validada con ajuste',
                    'fue validada con tu ajuste de costo.'
                  )
                }
                onDevolver={(motivo) =>
                  decidir(() => devolverEstimacion(estimacion.estimacionId, motivo), 'Cotización devuelta', 'fue devuelta al trabajador con tu motivo.')
                }
              />
            </section>

            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold text-black tracking-tight">Estimación de costos</h2>
              <DesgloseEstimacion detalle={detalle} />
            </section>

            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Bitácora</h2>
                <p className="text-sm text-slate-500">Cada envío y cada decisión quedan registrados; nunca se modifican.</p>
              </div>
              <BitacoraValidacion anotaciones={detalle.bitacora} />
            </section>
          </div>
        )}

        <Toast
          show={toast.show}
          type="error"
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
}
