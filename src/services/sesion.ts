import type { Rol, Usuario } from "../context/AuthContext"

const STORAGE_KEY = "secc_usuario"
const ROLES: readonly string[] = ["trabajador", "jefe", "tecnico"]

// Sesión guardada en el navegador, o null si no hay una válida. Está aquí y no en AuthContext para que
// también la lean los servicios (http.ts) sin depender de React.
export const leerSesion = (): Usuario | null => {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (!guardado) return null

    const datos = JSON.parse(guardado)
    // El rol del trabajador se llamaba "empleado": las sesiones abiertas con ese nombre siguen valiendo.
    const rol = datos?.rol === "empleado" ? "trabajador" : datos?.rol
    // Las sesiones anteriores no guardaban el usuarioId, con el que el servidor identifica a quien le escribe:
    // esas personas deben iniciar sesión otra vez.
    if (!ROLES.includes(rol) || !Number.isInteger(datos?.usuarioId)) return null

    // Las sesiones anteriores no guardaban el nombre completo: se muestra el nombre de usuario.
    const nombre = String(datos.nombre ?? "")
    return { usuarioId: datos.usuarioId, nombre, nombreCompleto: String(datos.nombreCompleto ?? "") || nombre, rol: rol as Rol }
  } catch {
    return null
  }
}

export const guardarSesion = (usuario: Usuario) => localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))

export const borrarSesion = () => localStorage.removeItem(STORAGE_KEY)
