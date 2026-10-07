import type { Rol } from "../context/AuthContext";

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
  fecha: string;
  leida: boolean;
  solicitudId: number;
}

// Temporal: las notificaciones viven en memoria hasta que exista el endpoint en el backend.
let notificaciones: Notificacion[] = [];
const listeners = new Set<() => void>();
// useSyncExternalStore exige que getSnapshot devuelva la misma referencia
// mientras los datos no cambien; por eso cacheamos el filtrado por rol + técnico.
const cachePorDestino = new Map<string, Notificacion[]>();

const emitirCambio = () => {
  cachePorDestino.clear();
  listeners.forEach((listener) => listener());
}

export const agregarNotificacion = (datos: Omit<Notificacion, "notificacionId" | "fecha" | "leida">) => {
  notificaciones = [
    {
      ...datos,
      notificacionId: Math.max(0, ...notificaciones.map((n) => n.notificacionId)) + 1,
      fecha: new Date().toLocaleString('es-PE'),
      leida: false,
    },
    ...notificaciones,
  ];
  emitirCambio();
}

export const marcarComoLeida = (notificacionId: number) => {
  notificaciones = notificaciones.map((n) =>
    n.notificacionId === notificacionId ? { ...n, leida: true } : n
  );
  emitirCambio();
}

export const obtenerNotificaciones = (rol: Rol, nombreUsuario?: string) => {
  const clave = `${rol}:${nombreUsuario ?? ''}`;
  const cacheada = cachePorDestino.get(clave);
  if (cacheada) return cacheada;

  const filtradas = notificaciones.filter(
    (n) => n.rolDestino === rol && (!n.tecnicoDestino || n.tecnicoDestino === nombreUsuario)
  );
  cachePorDestino.set(clave, filtradas);
  return filtradas;
}

export const suscribirseANotificaciones = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
