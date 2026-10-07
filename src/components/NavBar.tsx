import { useEffect, useRef, useState } from "react"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth, type Rol } from "../context/AuthContext"
import { useNotificaciones } from "../hooks/useNotificaciones"

const ETIQUETA_ROL: Record<Rol, string> = {
  empleado: "Empleado",
  tecnico: "Técnico",
}

export default function NavBar() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notificaciones = useNotificaciones()
  const noLeidas = notificaciones.filter((n) => !n.leida).length

  useEffect(() => {
    const manejarClicFuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false)
      }
    }

    document.addEventListener("mousedown", manejarClicFuera)
    return () => document.removeEventListener("mousedown", manejarClicFuera)
  }, [])

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate("/", { replace: true })
  }

  return (
    <header className="h-14 shrink-0 bg-[#2A317A] shadow-sm flex items-center justify-end gap-3 px-8">
      <button
        onClick={() => navigate("/notificaciones")}
        aria-label="Notificaciones"
        className={`relative p-2 rounded-full transition-colors cursor-pointer hover:bg-white/10 ${
          location.pathname === "/notificaciones" ? "bg-white/15" : ""
        }`}
      >
        <Bell size={20} className="text-white" />
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#2A317A]" />
        )}
      </button>

      <div className="flex flex-col items-end leading-tight">
        <span className="text-sm font-medium text-white">{usuario?.nombre}</span>
        <span className="text-sm text-gray-200">{usuario && ETIQUETA_ROL[usuario.rol]}</span>
      </div>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label="Menú de usuario"
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronDown
            size={18}
            className={`text-gray-200 transition-transform ${menuAbierto ? "rotate-180" : ""}`}
          />
        </button>

        {menuAbierto && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
            <button
              onClick={handleCerrarSesion}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
