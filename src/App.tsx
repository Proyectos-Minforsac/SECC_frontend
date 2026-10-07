import './App.css'
import CotizacionPdfScreen from './pages/CotizacionPDFScreen';
import ClientesScreen from './pages/ClientesScreen'
import CotizacionesScreen from './pages/CotizacionesScreen'
import LoginScreen from './pages/InicioSesionScreen'
import {Routes, Route, Navigate} from 'react-router-dom';
import TecnicosScreen from './pages/TecnicosScreen';
import ServiciosScreen from './pages/ServiciosScreen';
import VisitasTecnicasScreen from './pages/VisitasTecnicasScreen';
import NuevaCotizacionScreen from './pages/NuevaCotizacionScreen';
import MantenimientosScreen from './pages/MantenimientosScreen';
import NotificacionesScreen from './pages/NotificacionesScreen';
import SolicitudesServicioScreen from './pages/SolicitudesServicioScreen';
import SolicitudesTecnicoScreen from './pages/SolicitudesTecnicoScreen';
import VisitasTecnicoScreen from './pages/VisitasTecnicoScreen';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';

function App() {

  return (
    <>
      <Routes>
        {/* Pantalla inicial (Login) */}
        <Route path="/" element={<LoginScreen />} />

        {/* Rutas del empleado */}
        <Route element={<RutaProtegida rol="empleado" />}>
          <Route element={<Layout />}>
            <Route path="/clientes" element={<ClientesScreen />} />
            <Route path='/tecnicos' element={<TecnicosScreen />}/>
            <Route path='/solicitudes-servicio' element={<SolicitudesServicioScreen />} />
            <Route path='/servicios' element={<ServiciosScreen />} />
            <Route path="/cotizaciones" element={<CotizacionesScreen />} />
            <Route path="/cotizaciones/nueva" element={<NuevaCotizacionScreen />} />
            <Route path="/cotizacion-pdf" element={<CotizacionPdfScreen/>}/>
            <Route path="/visitas-tecnicas" element={<VisitasTecnicasScreen />}/>
            <Route path="/mantenimientos" element={<MantenimientosScreen />} />
          </Route>
        </Route>

        {/* Rutas del técnico */}
        <Route element={<RutaProtegida rol="tecnico" />}>
          <Route element={<Layout />}>
            <Route path="/solicitudes-tecnico" element={<SolicitudesTecnicoScreen />} />
            <Route path="/visitas-tecnico" element={<VisitasTecnicoScreen />} />
          </Route>
        </Route>

        {/* Rutas compartidas (empleado y técnico) */}
        <Route element={<RutaProtegida rol={["empleado", "tecnico"]} />}>
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
