import { ArrowRight } from 'lucide-react';
import Minforsac from './../assets/logo_minforsac.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type Rol } from '../context/AuthContext';

const MENU_POR_ROL: Record<Rol, { name: string; route: string }[]> = {
  empleado: [
    { name: 'Solicitudes de Servicios', route: '/solicitudes-servicio' },
    { name: 'Historial de Servicios', route: '/servicios' },
    { name: 'Clientes', route: '/clientes' },
    { name: 'Técnicos', route: '/tecnicos' },
    { name: 'Cotizaciones', route: '/cotizaciones' },
    { name: 'Visitas Técnicas', route: '/visitas-tecnicas' },
    { name: 'Mantenimientos', route: '/mantenimientos' },
  ],
  tecnico: [
    { name: 'Solicitudes de Servicios', route: '/solicitudes-tecnico' },
    { name: 'Visitas Técnicas', route: '/visitas-tecnico' },
  ],
};

export default function SideBarComponent() {

  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();

  const menuItems = usuario ? MENU_POR_ROL[usuario.rol] : [];

  const accederPagina = (route: string) => {
    navigate(route);
  }

  return (
    <>
      {/* 1. SIDEBAR (Menú Lateral) */}
      <aside className="w-64 bg-[#222861] flex flex-col shrink-0 shadow-xl">
        {/* Contenedor del Logo */}
        <div className="p-6 flex justify-center border-b border-white/10">
          <img src={Minforsac} alt="Minforsac" />
        </div>

        {/* Opciones del Menú */}
        {/* Opciones del Menú */}
        <nav className="flex-1 mt-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              // 4. Determina si el elemento está activo comparando las rutas
              const isActive = location.pathname === item.route;

              return (
                <li key={item.name}>
                  <button
                    onClick={() => accederPagina(item.route)}
                    className={`w-full h-10 flex items-center justify-between px-6 py-4 text-base font-medium transition-colors text-white cursor-pointer
                                   ${isActive ? 'bg-[#2E3577] border-l-4 border-[#6BA4E8]' : 'hover:bg-[#2E3577]/50'}`}
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="w-4 h-4 opacity-80" />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}