import './App.css'
import CotizacionPdfScreen from './pages/CotizacionPDFScreen';
import CotizacionPDFPruebaScreen from './pages/CotizacionPDFPruebaScreen';
import ConformidadPDFPruebaScreen from './pages/ConformidadPDFPruebaScreen';
import ReporteServicioPDFPruebaScreen from './pages/ReporteServicioPDFPruebaScreen';
import ClientesScreen from './pages/ClientesScreen'
import CotizacionesScreen from './pages/CotizacionesScreen'
import LoginScreen from './pages/InicioSesionScreen'
import {Routes, Route, Navigate} from 'react-router-dom';
import TecnicosScreen from './pages/TecnicosScreen';
import ServiciosScreen from './pages/ServiciosScreen';
import VisitasTecnicasScreen from './pages/VisitasTecnicasScreen';
import NuevaCotizacionScreen from './pages/NuevaCotizacionScreen';
import NotificacionesScreen from './pages/NotificacionesScreen';
import SolicitudesServicioScreen from './pages/SolicitudesServicioScreen';
import SolicitudesTecnicoScreen from './pages/SolicitudesTecnicoScreen';
import VisitasTecnicoScreen from './pages/VisitasTecnicoScreen';
import TarifarioScreen from './pages/TarifarioScreen';
import ValidacionesScreen from './pages/ValidacionesScreen';
import ValidacionDetalleScreen from './pages/ValidacionDetalleScreen';
import RentabilidadScreen from './pages/RentabilidadScreen';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';

function App() {

  return (
    <>
      <Routes>
        {/* Pantalla inicial (Login) */}
        <Route path="/" element={<LoginScreen />} />

        {/* Rutas del trabajador (el jefe hace el mismo trabajo) */}
        <Route element={<RutaProtegida rol={["trabajador", "jefe"]} />}>
          <Route element={<Layout />}>
            <Route path="/clientes" element={<ClientesScreen />} />
            <Route path='/tecnicos' element={<TecnicosScreen />}/>
            <Route path='/solicitudes-servicio' element={<SolicitudesServicioScreen />} />
            <Route path='/servicios' element={<ServiciosScreen />} />
            <Route path="/cotizaciones" element={<CotizacionesScreen />} />
            <Route path="/cotizaciones/nueva" element={<NuevaCotizacionScreen key="nueva" />} />
            <Route path="/cotizaciones/:cotizacionId/editar" element={<NuevaCotizacionScreen key="editar" />} />
            <Route path="/cotizaciones/:cotizacionId/pdf" element={<CotizacionPdfScreen/>}/>
            <Route path="/cotizacion-pdf/prueba" element={<CotizacionPDFPruebaScreen />} />
            <Route path="/conformidad-pdf/prueba" element={<ConformidadPDFPruebaScreen />} />
            <Route path="/reporte-servicio-pdf/prueba" element={<ReporteServicioPDFPruebaScreen />} />
            <Route path="/visitas-tecnicas" element={<VisitasTecnicasScreen />}/>
          </Route>
        </Route>

        {/* Rutas solo del jefe */}
        <Route element={<RutaProtegida rol="jefe" />}>
          <Route element={<Layout />}>
            <Route path="/tarifario" element={<TarifarioScreen />} />
            <Route path="/validaciones" element={<ValidacionesScreen />} />
            <Route path="/validaciones/:cotizacionId" element={<ValidacionDetalleScreen />} />
            <Route path="/rentabilidad" element={<RentabilidadScreen />} />
          </Route>
        </Route>

        {/* Rutas del técnico */}
        <Route element={<RutaProtegida rol="tecnico" />}>
          <Route element={<Layout />}>
            <Route path="/solicitudes-tecnico" element={<SolicitudesTecnicoScreen />} />
            <Route path="/visitas-tecnico" element={<VisitasTecnicoScreen />} />
          </Route>
        </Route>

        {/* Rutas compartidas (trabajador, jefe y técnico) */}
        <Route element={<RutaProtegida rol={["trabajador", "jefe", "tecnico"]} />}>
          <Route element={<Layout />}>
            <Route path="/notificaciones" element={<NotificacionesScreen />} />
          </Route>
        </Route>

        {/* Redirección automática si escriben una ruta que no existe */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
