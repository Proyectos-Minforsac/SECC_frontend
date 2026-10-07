import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RUTA_INICIO, useAuth, type Rol } from '../context/AuthContext';
import MinforSacImage from './../assets/logo_minforsac.jpg';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Temporal: mientras no exista autenticación en el backend, el rol se elige aquí.
  const [rol, setRol] = useState<Rol>('empleado');

  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();

  if (usuario) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    iniciarSesion({ nombre: email.split('@')[0], rol });
    navigate(RUTA_INICIO[rol], { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#DCE4F3] flex flex-col md:flex-row items-center justify-center gap-12 p-6 font-sans">

      {/* Sección Izquierda: Logo y Título */}
      <div className="flex flex-col items-center max-w-sm text-center">
        {/* Contenedor del Logo imitando el recuadro blanco de la imagen */}
        <div className="bg-white p-4 shadow-sm rounded-sm mb-4 w-52 h-44 flex flex-col items-center justify-center">
          {/* Logo Geométrico (Simulado con CSS/SVG) */}
          <img src={MinforSacImage} alt="Logo Minforsac" />
        </div>

        {/* Subtítulo */}
        <h1 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">
          Gestión de Servicios Técnicos
        </h1>
      </div>

      {/* Sección Derecha: Formulario de Inicio de Sesión */}
      <div className="w-full max-w-115 bg-[#222861] rounded-2xl p-8 md:p-10 shadow-lg text-white">
        <h2 className="text-xl md:text-2xl font-normal mb-6 text-left">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Correo Electrónico */}
          <div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6BA4E8] transition-all text-base"
              required
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6BA4E8] transition-all text-base"
              required
            />
          </div>

          {/* Rol (temporal) */}
          <div>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="w-full px-5 py-3.5 rounded-full bg-white text-gray-900 outline-none focus:ring-2 focus:ring-[#6BA4E8] transition-all text-base cursor-pointer"
            >
              <option value="empleado">Empleado</option>
              <option value="tecnico">Técnico</option>
            </select>
          </div>

          {/* Botón Ingresar */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              className="px-10 py-2.5 bg-[#E2E4E9] text-gray-900 font-medium rounded-2xl hover:bg-white active:scale-95 transition-all text-base shadow-sm cursor-pointer"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default LoginScreen;