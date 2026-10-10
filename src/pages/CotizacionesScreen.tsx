import { useEffect, useState } from 'react';
import CotizacionesTable from '../components/CotizacionesTable';
import PaginacionComponente from '../components/Paginacion';
import LoadingSpinner from '../components/LoadingSpinner';
import RechazarCotizacionModal from '../components/RechazarCotizacionModal';
import Toast from '../components/Toast';
import {
  obtenerCotizaciones,
  actualizarEstadoCotizacion,
  type CotizacionListada,
} from '../services/cotizaciones';
import { activarVisitaPorSolicitud, cancelarVisitaPorSolicitud } from '../services/visitas';
import { agregarNotificacion } from '../services/notificaciones';

export const CotizacionesScreen = () => {
  // Tabla general de cotizaciones (pendientes, aceptadas y rechazadas)
  const [cotizaciones, setCotizaciones] = useState<CotizacionListada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [actualizandoEstadoId, setActualizandoEstadoId] = useState<number | null>(null);
  // Cotización cuyo rechazo se está confirmando en el modal del motivo
  const [cotizacionARechazar, setCotizacionARechazar] = useState<CotizacionListada | null>(null);
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; title?: string; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  const cargarCotizaciones = async (pagina: number = paginaActual) => {
    setCargando(true);
    try {
      const data = await obtenerCotizaciones(pagina, 10);
      setCotizaciones(data.cotizaciones);
      setTotalPaginas(data.totalPages);
    } catch (error) {
      console.error('Error al cargar cotizaciones', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCotizaciones(paginaActual);
  }, [paginaActual]);

  const mostrarToastError = (error: unknown, porDefecto: string) =>
    setToast({ show: true, type: 'error', message: error instanceof Error ? error.message : porDefecto });

  const handleAceptarCotizacion = async (cotizacionId: number) => {
    const numero = cotizaciones.find((c) => c.cotizacionId === cotizacionId)?.numeroCotizacion ?? '';

    setActualizandoEstadoId(cotizacionId);
    try {
      const cotizacion = await actualizarEstadoCotizacion(cotizacionId, 'ACEPTADA');

      // Si la cotización nació de una visita técnica, se activa el servicio:
      // desbloquea las etapas siguientes para el técnico.
      let tecnicoAvisado = false;
      if (cotizacion.solicitudId) {
        const visita = await activarVisitaPorSolicitud(Number(cotizacion.solicitudId));
        if (visita) {
          agregarNotificacion({
            rolDestino: 'tecnico',
            tecnicoDestino: visita.tecnicoNombre,
            solicitudId: visita.solicitudId,
            mensaje: `El cliente ${visita.clienteNombre} aceptó la cotización. El servicio ya está activo, puedes continuar con la instalación.`,
          });
          tecnicoAvisado = true;
        }
      }

      setToast({
        show: true,
        type: 'success',
        title: 'Cotización aceptada',
        message: tecnicoAvisado ? `${numero} fue aceptada y se avisó al técnico.` : `${numero} fue aceptada.`,
      });
      await cargarCotizaciones(paginaActual);
    } catch (error) {
      mostrarToastError(error, 'No se pudo aceptar la cotización.');
    } finally {
      setActualizandoEstadoId(null);
    }
  };

  // Al rechazar, el servicio se cancela porque no hubo acuerdo con el cliente: se avisa al técnico con el motivo.
  const handleRechazarCotizacion = async (motivo: string) => {
    if (!cotizacionARechazar) return;
    const { cotizacionId, numeroCotizacion } = cotizacionARechazar;

    setActualizandoEstadoId(cotizacionId);
    try {
      const cotizacion = await actualizarEstadoCotizacion(cotizacionId, 'RECHAZADA', motivo);

      let tecnicoAvisado = false;
      if (cotizacion.solicitudId) {
        const visita = await cancelarVisitaPorSolicitud(Number(cotizacion.solicitudId), motivo);
        if (visita) {
          agregarNotificacion({
            rolDestino: 'tecnico',
            tecnicoDestino: visita.tecnicoNombre,
            solicitudId: visita.solicitudId,
            mensaje: `El cliente ${visita.clienteNombre} rechazó la cotización y el servicio fue cancelado. Motivo: ${motivo}`,
          });
          tecnicoAvisado = true;
        }
      }

      setToast({
        show: true,
        type: 'error',
        title: 'Cotización rechazada',
        message: tecnicoAvisado
          ? `${numeroCotizacion} fue rechazada. El servicio se canceló y se avisó al técnico.`
          : `${numeroCotizacion} fue rechazada.`,
      });
    } catch (error) {
      mostrarToastError(error, 'No se pudo rechazar la cotización.');
    } finally {
      setCotizacionARechazar(null);
      setActualizandoEstadoId(null);
      // Se recarga también si falló: el rechazo pudo haberse guardado antes del error.
      await cargarCotizaciones(paginaActual);
    }
  };

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Cabecera: Título y botón Agregar */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Cotizaciones</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cargando ? (
            <div className="flex flex-col justify-center items-center h-40">
              <LoadingSpinner />
              <p className="text-sm text-gray-600 mt-2">Cargando cotizaciones...</p>
            </div>
          ) : (
            <CotizacionesTable
              cotizaciones={cotizaciones}
              actualizandoId={actualizandoEstadoId}
              onAceptar={handleAceptarCotizacion}
              onRechazar={(id) => setCotizacionARechazar(cotizaciones.find((c) => c.cotizacionId === id) ?? null)}
            />
          )}
        </div>

        <PaginacionComponente
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
        />

        <RechazarCotizacionModal
          isOpen={cotizacionARechazar !== null}
          numeroCotizacion={cotizacionARechazar?.numeroCotizacion ?? ''}
          clienteNombre={cotizacionARechazar?.clienteNombre ?? ''}
          guardando={actualizandoEstadoId !== null}
          onClose={() => setCotizacionARechazar(null)}
          onConfirmar={handleRechazarCotizacion}
        />

        <Toast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
};

export default CotizacionesScreen;
