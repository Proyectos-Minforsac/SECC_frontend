import { createContext, useContext, useState, type ReactNode } from "react"
import { borrarSesion, guardarSesion, leerSesion } from "../services/sesion"

// El jefe hace el mismo trabajo que el trabajador y, además, administra las tarifas y valida las estimaciones de costos.
export type Rol = "trabajador" | "jefe" | "tecnico"

export interface Usuario {
  usuarioId: number
  nombre: string
  rol: Rol
}

interface AuthContextValue {
  usuario: Usuario | null
  iniciarSesion: (usuario: Usuario) => void
  cerrarSesion: () => void
}

export const RUTA_INICIO: Record<Rol, string> = {
  trabajador: "/solicitudes-servicio",
  jefe: "/solicitudes-servicio",
  tecnico: "/solicitudes-tecnico",
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerSesion)

  const iniciarSesion = (nuevoUsuario: Usuario) => {
    guardarSesion(nuevoUsuario)
    setUsuario(nuevoUsuario)
  }

  const cerrarSesion = () => {
    borrarSesion()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return contexto
}
