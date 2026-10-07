import { createContext, useContext, useState, type ReactNode } from "react"

export type Rol = "empleado" | "tecnico"

export interface Usuario {
  nombre: string
  rol: Rol
}

interface AuthContextValue {
  usuario: Usuario | null
  iniciarSesion: (usuario: Usuario) => void
  cerrarSesion: () => void
}

const STORAGE_KEY = "secc_usuario"

export const RUTA_INICIO: Record<Rol, string> = {
  empleado: "/solicitudes-servicio",
  tecnico: "/solicitudes-tecnico",
}

const AuthContext = createContext<AuthContextValue | null>(null)

const leerUsuarioGuardado = (): Usuario | null => {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    return guardado ? (JSON.parse(guardado) as Usuario) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuarioGuardado)

  const iniciarSesion = (nuevoUsuario: Usuario) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoUsuario))
    setUsuario(nuevoUsuario)
  }

  const cerrarSesion = () => {
    localStorage.removeItem(STORAGE_KEY)
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
