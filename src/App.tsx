import './App.css'
import CotizacionPdfScreen from './pages/CotizacionPDFScreen';
import ClientesScreen from './pages/ClientesScreen'
import CotizacionesScreen from './pages/CotizacionesScreen'
import LoginScreen from './pages/InicioSesionScreen'
import {Routes, Route, Navigate} from 'react-router-dom';
import TecnicosScreen from './pages/TecnicosScreen';
import ServiciosScreen from './pages/ServiciosScreen';

function App() {

  return (
    <>
      <Routes>
        {/* Pantalla inicial (Login) */}
        <Route path="/" element={<LoginScreen />} />
        
        {/* Resto de pantallas de tu app */}
        <Route path="/clientes" element={<ClientesScreen />} />
        <Route path='/tecnicos' element={<TecnicosScreen />}/>
        <Route path='/servicios' element={<ServiciosScreen />} />
        <Route path="/cotizaciones" element={<CotizacionesScreen />} />
        <Route path="/cotizacion-pdf" element={<CotizacionPdfScreen/>}/>

        {/* Redirección automática si escriben una ruta que no existe */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
