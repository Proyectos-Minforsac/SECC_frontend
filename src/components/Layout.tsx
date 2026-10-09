import { Outlet } from "react-router-dom"
import SideBarComponent from "./SideBar"
import NavBar from "./NavBar"
import { useRecordatoriosMantenimiento } from "../hooks/useRecordatoriosMantenimiento"
import { useSincronizarNotificaciones } from "../hooks/useNotificaciones"

export default function Layout() {
  useSincronizarNotificaciones();
  useRecordatoriosMantenimiento();

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased">
      <SideBarComponent />
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar />
        <Outlet />
      </div>
    </div>
  )
}
