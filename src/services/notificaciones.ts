import type { Rol } from "../context/AuthContext";
import { pedir } from "./http";

// Notificaciones que además de mostrarse, habilitan una acción rápida en la pantalla
// (p.ej. "Crear cotización" cuando el técnico completa el diagnóstico inicial).
export type TipoNotificacion = 'DIAGNOSTICO_COMPLETADO';

export interface Notificacion {
  notificacionId: number;
  rolDestino: Rol;
  // Si se indica, solo el técnico con este nombre ve la notificación (además del rol).
  tecnicoDestino?: string;
  tipo?: TipoNotificacion;
  mensaje: string;
  // Instante de creación (ISO), guardado por el servidor.
  fecha: string;
  leida: boolean;
  solicitudId: number;
}

export type NuevaNotificacion = Omit<Notificacion, "notificacionId" | "fecha" | "leida"> & {
  // Con clave, el servidor no crea una segunda notificación igual (p.ej. si dos sesiones disparan el mismo aviso).
  clave?: string;
};

// Las notificaciones viven en el servidor, así le llegan a quien corresponde aunque esté en otra sesión.
// Aquí se guarda la última versión recibida de cada destinatario (rol + nombre) para compartirla entre pantallas.
const SIN_NOTIFICACIONES: Notificacion[] = [];
const porDestino = new Map<string, Notificacion[]>();
const destinosCargados = new Map<string, { rol: Rol; nombre: string }>();
const listeners = new Set<() => void>();

const claveDestino = (rol: Rol, nombre: string) => `${rol}:${nombre}`;

const emitirCambio = () => listeners.forEach((listener) => listener());

const guardar = (clave: string, recibidas: Notificacion[]) => {
  // useSyncExternalStore necesita la misma referencia mientras nada cambie: si el servidor devuelve lo mismo, no se reemplaza.
  if (JSON.stringify(porDestino.get(clave) ?? SIN_NOTIFICACIONES) === JSON.stringify(recibidas)) return;
  porDestino.set(clave, recibidas);
  emitirCambio();
}

// Si varias pantallas piden la carga a la vez, comparten la misma petición.
const cargasEnCurso = new Map<string, Promise<void>>();

export const cargarNotificaciones = (rol: Rol, nombre: string) => {
  const clave = claveDestino(rol, nombre);
  destinosCargados.set(clave, { rol, nombre });

  let carga = cargasEnCurso.get(clave);
  if (!carga) {
    carga = pedir<Notificacion[]>(
      `/notificaciones?rol=${rol}&nombre=${encodeURIComponent(nombre)}`,
      'GET',
      undefined,
      'No se pudieron cargar las notificaciones'
    )
      .then((recibidas) => guardar(clave, recibidas))
      .finally(() => {
        cargasEnCurso.delete(clave);
      });
    cargasEnCurso.set(clave, carga);
  }
  return carga;
}

const recargarCargados = () =>
  Promise.all([...destinosCargados.values()].map(({ rol, nombre }) => cargarNotificaciones(rol, nombre)));

// Un fallo al avisar no debe interrumpir la acción que lo originó (autorizar, completar una visita...), por eso solo se registra.
export const agregarNotificacion = async (datos: NuevaNotificacion) => {
  try {
    await pedir('/notificaciones', 'POST', datos, 'No se pudo crear la notificación');
    await recargarCargados();
  } catch (error) {
    console.error('Error al crear la notificación', error);
  }
}

export const marcarComoLeida = async (notificacionId: number) => {
  // Se marca de inmediato en pantalla; si el servidor falla se vuelve a su versión.
  for (const [clave, lista] of porDestino) {
    if (lista.some((n) => n.notificacionId === notificacionId && !n.leida)) {
      porDestino.set(clave, lista.map((n) => (n.notificacionId === notificacionId ? { ...n, leida: true } : n)));
    }
  }
  emitirCambio();

  try {
    await pedir(`/notificaciones/${notificacionId}/leida`, 'PUT', {}, 'No se pudo marcar la notificación como leída');
  } catch (error) {
    console.error('Error al marcar la notificación como leída', error);
    await recargarCargados().catch(() => undefined);
  }
}

export const obtenerNotificaciones = (rol: Rol, nombreUsuario?: string) =>
  porDestino.get(claveDestino(rol, nombreUsuario ?? '')) ?? SIN_NOTIFICACIONES;

export const suscribirseANotificaciones = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
