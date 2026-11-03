import { useState } from "react"
import { Outlet } from "react-router-dom"
import SideBarComponent from "./SideBar"
import NavBar from "./NavBar"
import { useRecordatoriosMantenimiento } from "../hooks/useRecordatoriosMantenimiento"
import { useSincronizarNotificaciones } from "../hooks/useNotificaciones"
import { useAvisosGarantia } from "../hooks/useAvisosGarantia"

// Cada persona deja el menú como lo prefiere. Si el navegador no deja guardar (ventana privada, datos bloqueados), el menú
// funciona igual y empieza expandido.
const CLAVE_MENU = "secc_menu_contraido"

const leerMenuContraido = () => {
  try {
    return localStorage.getItem(CLAVE_MENU) === "1"
  } catch {
    return false
  }
}

export default function Layout() {
  useSincronizarNotificaciones();
  useRecordatoriosMantenimiento();
  useAvisosGarantia();

  const [menuContraido, setMenuContraido] = useState(leerMenuContraido)

  const alternarMenu = () => {
    setMenuContraido((contraido) => {
      try {
        localStorage.setItem(CLAVE_MENU, contraido ? "0" : "1")
      } catch {
        // No se pudo guardar la preferencia: el cambio de esta sesión igual se aplica
      }
      return !contraido
    })
  }

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased">
      <SideBarComponent contraido={menuContraido} />
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar menuContraido={menuContraido} onAlternarMenu={alternarMenu} />
        <Outlet />
      </div>
    </div>
  )
}
