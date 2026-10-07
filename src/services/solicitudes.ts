import type { Cliente } from './clientes';

export type EstadoSolicitud = 'PENDIENTE' | 'CON OFERTAS' | 'ASIGNADA' | 'AUTORIZADO' | 'CANCELADA';
export type EstadoOferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface OfertaVisita {
  ofertaId: number;
  solicitudId: number;
  tecnicoNombre: string;
  tecnicoUbicacion: string;
  montoVisita: number;
  // Cotización de oferta adjuntada por el técnico (doc, docx o pdf). La URL apunta al backend.
  archivoNombre: string;
  archivoUrl: string;
  estado: EstadoOferta;
}

// Autorización del viaje que el empleado envía al técnico elegido.
export interface AutorizacionViaje {
  instrucciones: string;
  // Fechas tentativas de la visita, en formato YYYY-MM-DD
  fechaInicio: string;
  fechaFin: string;
}

export interface SolicitudServicio {
  solicitudId: number;
  clienteNombre: string;
  // Datos del cliente (incluye la ubicación de la empresa)
  cliente?: Cliente;
  autorizacion?: AutorizacionViaje;
  descripcion: string;
  fecha: string;
  // Técnicos a quienes se envió la solicitud (nombres e ids, en el mismo orden)
  tecnicos: string[];
  tecnicoIds: number[];
  estado: EstadoSolicitud;
  ofertas: OfertaVisita[];
}

export interface NuevaSolicitudServicio {
  clienteId: number;
  descripcion: string;
  tecnicoIds: number[];
}

export interface NuevaOferta {
  tecnicoNombre: string;
  montoVisita: number;
  // Obligatorio en la primera oferta; al editarla, sin archivo se conserva el anterior.
  archivo: File | null;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

// Las solicitudes se cargan del backend y se guardan aquí para compartirlas entre las pantallas
// del empleado y del técnico. Cada operación devuelve la solicitud actualizada y la reemplaza en el store.
let solicitudes: SolicitudServicio[] = [];
const listeners = new Set<() => void>();

const emitirCambio = () => listeners.forEach((listener) => listener());

export const obtenerSolicitudes = () => solicitudes;

export const suscribirseASolicitudes = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const leerError = async (respuesta: Response, porDefecto: string) => {
  const cuerpo = await respuesta.json().catch(() => null);
  return new Error(cuerpo?.message ?? porDefecto);
};

// El backend devuelve la ruta del archivo relativa a la API; aquí se completa para poder abrirla.
const conUrlCompleta = (solicitud: SolicitudServicio): SolicitudServicio => ({
  ...solicitud,
  ofertas: solicitud.ofertas.map((oferta) => ({
    ...oferta,
    archivoUrl: oferta.archivoUrl ? `${apiBaseUrl}${oferta.archivoUrl}` : '',
  })),
});

const guardarSolicitud = (recibida: SolicitudServicio) => {
  const solicitud = conUrlCompleta(recibida);
  solicitudes = solicitudes.some((s) => s.solicitudId === solicitud.solicitudId)
    ? solicitudes.map((s) => (s.solicitudId === solicitud.solicitudId ? solicitud : s))
    : [solicitud, ...solicitudes];
  emitirCambio();
  return solicitud;
}

const enviar = async (ruta: string, metodo: 'POST' | 'PUT', cuerpo: unknown, porDefecto: string) => {
  const respuesta = await fetch(`${apiBaseUrl}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo ?? {}),
  });
  if (!respuesta.ok) throw await leerError(respuesta, porDefecto);
  return guardarSolicitud(await respuesta.json());
};

const aBase64 = (archivo: File) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });

// Si varios componentes piden la carga a la vez, comparten la misma petición.
let cargaEnCurso: Promise<void> | null = null;

export const cargarSolicitudes = () => {
  if (!cargaEnCurso) {
    cargaEnCurso = fetch(`${apiBaseUrl}/solicitudes`)
      .then(async (respuesta) => {
        if (!respuesta.ok) throw await leerError(respuesta, 'No se pudieron cargar las solicitudes');
        solicitudes = ((await respuesta.json()) as SolicitudServicio[]).map(conUrlCompleta);
        emitirCambio();
      })
      .finally(() => {
        cargaEnCurso = null;
      });
  }
  return cargaEnCurso;
}

export const crearSolicitud = (datos: NuevaSolicitudServicio) =>
  enviar('/solicitudes', 'POST', datos, 'No se pudo crear la solicitud');

export const editarSolicitud = (solicitudId: number, datos: NuevaSolicitudServicio) =>
  enviar(`/solicitudes/${solicitudId}`, 'PUT', datos, 'No se pudo actualizar la solicitud');

export const eliminarSolicitud = async (solicitudId: number) => {
  const respuesta = await fetch(`${apiBaseUrl}/solicitudes/${solicitudId}`, { method: 'DELETE' });
  if (!respuesta.ok) throw await leerError(respuesta, 'No se pudo eliminar la solicitud');

  solicitudes = solicitudes.filter((s) => s.solicitudId !== solicitudId);
  emitirCambio();
}

export const enviarOferta = async (solicitudId: number, { tecnicoNombre, montoVisita, archivo }: NuevaOferta) =>
  enviar(
    `/solicitudes/${solicitudId}/ofertas`,
    'PUT',
    {
      tecnicoNombre,
      montoVisita,
      ...(archivo && {
        archivoNombre: archivo.name,
        archivoTipo: archivo.type,
        archivoBase64: await aBase64(archivo),
      }),
    },
    'No se pudo enviar la oferta'
  );

export const aceptarOferta = (solicitudId: number, ofertaId: number) =>
  enviar(`/solicitudes/${solicitudId}/ofertas/${ofertaId}/aceptar`, 'POST', null, 'No se pudo aceptar la oferta');

export const rechazarOferta = (solicitudId: number, ofertaId: number) =>
  enviar(`/solicitudes/${solicitudId}/ofertas/${ofertaId}/rechazar`, 'POST', null, 'No se pudo rechazar la oferta');

export const autorizarViaje = (solicitudId: number, autorizacion: AutorizacionViaje) =>
  enviar(`/solicitudes/${solicitudId}/autorizar`, 'POST', autorizacion, 'No se pudo autorizar el viaje');

// Solo se decide sobre las ofertas mientras la solicitud no haya sido asignada.
export const admiteDecisionDeOfertas = (estado: EstadoSolicitud) =>
  estado === 'PENDIENTE' || estado === 'CON OFERTAS';

// "2026-10-05" -> "05/10/2026"
export const formatearFechaISO = (fecha: string) => fecha.split('-').reverse().join('/');

export const formatearMonto = (monto: number) =>
  `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ESTILO_ESTADO: Record<EstadoSolicitud, string> = {
  'PENDIENTE': 'bg-amber-100 text-amber-700 border-amber-300/60',
  'CON OFERTAS': 'bg-blue-100 text-blue-700 border-blue-300/60',
  'ASIGNADA': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
  'AUTORIZADO': 'bg-indigo-100 text-indigo-700 border-indigo-300/60',
  'CANCELADA': 'bg-slate-100 text-slate-600 border-slate-300/60',
};

export const ESTILO_ESTADO_OFERTA: Record<EstadoOferta, string> = {
  'PENDIENTE': 'bg-amber-100 text-amber-700 border-amber-300/60',
  'ACEPTADA': 'bg-emerald-100 text-emerald-700 border-emerald-300/60',
  'RECHAZADA': 'bg-rose-100 text-rose-700 border-rose-300/60',
};
