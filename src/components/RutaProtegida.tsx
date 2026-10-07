import { Navigate, Outlet } from "react-router-dom"
import { RUTA_INICIO, useAuth, type Rol } from "../context/AuthContext"

export default function RutaProtegida({ rol }: { rol: Rol | Rol[] }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/" replace />

  const rolesPermitidos = Array.isArray(rol) ? rol : [rol]
  if (!rolesPermitidos.includes(usuario.rol)) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />

  return <Outlet />
}
