import { useNavigate } from "react-router-dom"
import { useNotificaciones } from "../hooks/useNotificaciones"
import { useSolicitudes } from "../hooks/useSolicitudes"
import { marcarComoLeida, type Notificacion } from "../services/notificaciones"
import { formatearFechaHora } from "../services/visitas"

export default function NotificacionesScreen() {
  const notificaciones = useNotificaciones();
  const solicitudes = useSolicitudes();
  const navigate = useNavigate();

  // Desde la notificación de diagnóstico completado, el empleado pasa directo
  // al formulario de cotización con los datos del cliente ya colocados.
  const irACotizacion = (notificacion: Notificacion) => {
    marcarComoLeida(notificacion.notificacionId);
    const solicitud = solicitudes.find((s) => s.solicitudId === notificacion.solicitudId);
    navigate('/cotizaciones/nueva', {
      state: {
        clientePrefill: solicitud?.cliente,
        solicitudId: notificacion.solicitudId,
      },
    });
  };

  return (
    <main className="flex-1 p-8 md:p-12 overflow-y-auto">
      <h1 className="text-4xl font-bold text-black tracking-tight mb-8">Notificaciones</h1>

      <div className="flex flex-col gap-2">
        {notificaciones.length > 0 ? (
          notificaciones.map((notificacion) => (
            <div
              key={notificacion.notificacionId}
              className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5 shadow-sm transition-colors ${
                notificacion.leida ? "bg-white/60 text-slate-500" : "bg-white text-slate-800"
              }`}
            >
              <button
                onClick={() => marcarComoLeida(notificacion.notificacionId)}
                className="flex-1 text-left cursor-pointer"
              >
                <p className={`text-sm ${notificacion.leida ? "" : "font-semibold"}`}>{notificacion.mensaje}</p>
                <p className="text-xs text-slate-400 mt-1">{formatearFechaHora(notificacion.fecha)}</p>
              </button>

              {notificacion.tipo === 'DIAGNOSTICO_COMPLETADO' && (
                <button
                  onClick={() => irACotizacion(notificacion)}
                  className="shrink-0 px-4 py-1.5 bg-[#2A317A] text-white text-xs font-medium rounded-full hover:bg-[#1C2257] transition-colors cursor-pointer"
                >
                  Crear cotización
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-400">No tienes notificaciones.</p>
        )}
      </div>
    </main>
  )
}
