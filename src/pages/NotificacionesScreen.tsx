import { useNavigate } from "react-router-dom"
import { useNotificaciones } from "../hooks/useNotificaciones"
import { useSolicitudes } from "../hooks/useSolicitudes"
import { marcarComoLeida, type Notificacion, type TipoNotificacion } from "../services/notificaciones"
import { formatearFechaHora } from "../services/visitas"

// Avisos con una acción rápida. Los de la validación llevan a la cotización (el jefe a revisarla, el trabajador a corregirla
// o a su PDF); los demás, a la pantalla donde se atienden.
const ACCIONES: Partial<Record<TipoNotificacion, { texto: string; ruta: (notificacion: Notificacion) => string | null }>> = {
  VALIDACION_PENDIENTE: { texto: 'Revisar', ruta: (n) => (n.cotizacionId ? `/validaciones/${n.cotizacionId}` : null) },
  COTIZACION_DEVUELTA: { texto: 'Corregir', ruta: (n) => (n.cotizacionId ? `/cotizaciones/${n.cotizacionId}/editar` : null) },
  COTIZACION_VALIDADA: { texto: 'Ver PDF', ruta: (n) => (n.cotizacionId ? `/cotizaciones/${n.cotizacionId}/pdf` : null) },
  IMPREVISTO_AVISADO: { texto: 'Registrar monto', ruta: () => '/visitas-tecnicas' },
  GARANTIA_VENCIDA: { texto: 'Ir al historial', ruta: () => '/servicios' },
};

const accionRapida = (notificacion: Notificacion) => {
  const accion = notificacion.tipo ? ACCIONES[notificacion.tipo] : undefined;
  const ruta = accion?.ruta(notificacion);
  return accion && ruta ? { texto: accion.texto, ruta } : null;
};

export default function NotificacionesScreen() {
  const notificaciones = useNotificaciones();
  const solicitudes = useSolicitudes();
  const navigate = useNavigate();

  // Desde la notificación de diagnóstico completado, el trabajador pasa directo
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

  const irA = (notificacion: Notificacion, ruta: string) => {
    marcarComoLeida(notificacion.notificacionId);
    navigate(ruta);
  };

  return (
    <main className="flex-1 p-8 md:p-12 overflow-y-auto">
      <h1 className="text-4xl font-bold text-black tracking-tight mb-8">Notificaciones</h1>

      <div className="flex flex-col gap-2">
        {notificaciones.length > 0 ? (
          notificaciones.map((notificacion) => {
            const accion = accionRapida(notificacion);

            return (
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
                  <p className="text-sm text-slate-400 mt-1">{formatearFechaHora(notificacion.fecha)}</p>
                </button>

                {notificacion.tipo === 'DIAGNOSTICO_COMPLETADO' && (
                  <button
                    onClick={() => irACotizacion(notificacion)}
                    className="shrink-0 px-4 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors cursor-pointer"
                  >
                    Crear cotización
                  </button>
                )}

                {accion && (
                  <button
                    onClick={() => irA(notificacion, accion.ruta)}
                    className="shrink-0 px-4 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors cursor-pointer"
                  >
                    {accion.texto}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-slate-400">No tienes notificaciones.</p>
        )}
      </div>
    </main>
  )
}
