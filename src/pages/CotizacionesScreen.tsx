import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CotizacionesTable from '../components/CotizacionesTable';
import PaginacionComponente from '../components/Paginacion';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  obtenerCotizaciones,
  actualizarEstadoCotizacion,
  type CotizacionListada,
  type EstadoCotizacion,
} from '../services/cotizaciones';
import { activarVisitaPorSolicitud } from '../services/visitas';
import { agregarNotificacion } from '../services/notificaciones';

export const CotizacionesScreen = () => {
  const navigate = useNavigate();

  // Tabla general de cotizaciones (pendientes, aceptadas y rechazadas)
  const [cotizaciones, setCotizaciones] = useState<CotizacionListada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [actualizandoEstadoId, setActualizandoEstadoId] = useState<number | null>(null);

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

  const handleCambiarEstadoCotizacion = async (cotizacionId: number, estado: EstadoCotizacion) => {
    setActualizandoEstadoId(cotizacionId);
    try {
      const cotizacion = await actualizarEstadoCotizacion(cotizacionId, estado);

      // Si el cliente aceptó y la cotización nació de una visita técnica, se activa
      // el servicio: desbloquea la etapa de Instalación para el técnico.
      if (estado === 'ACEPTADA' && cotizacion.solicitudId) {
        const visita = await activarVisitaPorSolicitud(Number(cotizacion.solicitudId));
        if (visita) {
          agregarNotificacion({
            rolDestino: 'tecnico',
            tecnicoDestino: visita.tecnicoNombre,
            solicitudId: visita.solicitudId,
            mensaje: `El cliente ${visita.clienteNombre} aceptó la cotización. El servicio ya está activo, puedes continuar con la instalación.`,
          });
        }
      }

      await cargarCotizaciones(paginaActual);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo actualizar la cotización.');
    } finally {
      setActualizandoEstadoId(null);
    }
  };

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Cabecera: Título y botón Agregar */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Cotizaciones</h1>
          <button
            onClick={() => navigate('/cotizaciones/nueva')}
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
            Agregar
          </button>
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
              onAceptar={(id) => handleCambiarEstadoCotizacion(id, 'ACEPTADA')}
              onRechazar={(id) => handleCambiarEstadoCotizacion(id, 'RECHAZADA')}
            />
          )}
        </div>

        <PaginacionComponente
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
        />
      </main>
    </div>
  );
};

export default CotizacionesScreen;
