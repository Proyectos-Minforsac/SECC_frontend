import {
  CalendarCheck,
  ClipboardList,
  FileText,
  History,
  ShieldCheck,
  Tags,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Minforsac from './../assets/logo_minforsac.jpg';
import IconoMinforsac from './../assets/ico_minforsac.ico';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type Rol } from '../context/AuthContext';

interface OpcionMenu {
  name: string;
  route: string;
  icono: LucideIcon;
}

const MENU_TRABAJADOR: OpcionMenu[] = [
  { name: 'Solicitudes de Servicios', route: '/solicitudes-servicio', icono: ClipboardList },
  { name: 'Visitas Técnicas', route: '/visitas-tecnicas', icono: CalendarCheck },
  { name: 'Cotizaciones', route: '/cotizaciones', icono: FileText },
  { name: 'Historial de Servicios', route: '/servicios', icono: History },
  { name: 'Clientes', route: '/clientes', icono: Users },
  { name: 'Técnicos', route: '/tecnicos', icono: Wrench },
];

const MENU_POR_ROL: Record<Rol, OpcionMenu[]> = {
  trabajador: MENU_TRABAJADOR,
  // El jefe hace el mismo trabajo y además administra los costos: valida las estimaciones, fija las tarifas y sigue la rentabilidad.
  jefe: [
    ...MENU_TRABAJADOR,
    { name: 'Validaciones', route: '/validaciones', icono: ShieldCheck },
    { name: 'Rentabilidad', route: '/rentabilidad', icono: TrendingUp },
    { name: 'Tarifario', route: '/tarifario', icono: Tags },
  ],
  tecnico: [
    { name: 'Solicitudes de Servicios', route: '/solicitudes-tecnico', icono: ClipboardList },
    { name: 'Visitas Técnicas', route: '/visitas-tecnico', icono: CalendarCheck },
  ],
};

interface SideBarProps {
  // Contraído, solo se ven los íconos (el nombre de cada opción aparece al dejar el puntero encima)
  contraido: boolean;
}

export default function SideBarComponent({ contraido }: SideBarProps) {

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
      <aside
        className={`${contraido ? 'w-[72px]' : 'w-64'} bg-[#222861] flex flex-col shrink-0 shadow-xl overflow-hidden transition-[width] duration-200`}
      >
        {/* Contenedor del Logo */}
        <div className={`flex justify-center border-b border-white/10 ${contraido ? 'p-3 h-[72px] items-center' : 'p-6'}`}>
          {contraido ? (
            <img src={IconoMinforsac} alt="Minforsac" className="w-9 h-9 object-contain" />
          ) : (
            <img src={Minforsac} alt="Minforsac" />
          )}
        </div>

        {/* Opciones del Menú */}
        <nav className="flex-1 mt-6" aria-label="Menú principal">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              // 4. Determina si el elemento está activo comparando las rutas
              const isActive = location.pathname === item.route;
              const Icono = item.icono;

              return (
                <li key={item.name}>
                  <button
                    onClick={() => accederPagina(item.route)}
                    title={contraido ? item.name : undefined}
                    aria-label={item.name}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full h-10 flex items-center gap-3 text-base font-medium transition-colors text-white cursor-pointer
                                   ${contraido ? 'justify-center px-0' : 'px-6'}
                                   ${isActive ? 'bg-[#2E3577] border-l-4 border-[#6BA4E8]' : 'hover:bg-[#2E3577]/50'}`}
                  >
                    <Icono className={`shrink-0 w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-80'} ${isActive && !contraido ? '-ml-1' : ''}`} />
                    {!contraido && <span className="truncate">{item.name}</span>}
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
