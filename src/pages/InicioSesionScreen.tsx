import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RUTA_INICIO, useAuth } from '../context/AuthContext';
import { login } from '../services/auth';
import MinforSacImage from './../assets/logo_minforsac.jpg';

export const LoginScreen = () => {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();

  if (usuario) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const autenticado = await login(nombre.trim(), password);
      iniciarSesion({ nombre: autenticado.nombre, rol: autenticado.rol });
      navigate(RUTA_INICIO[autenticado.rol], { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
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
          {/* Campo Usuario */}
          <div>
            <input
              type="text"
              placeholder="Usuario"
              autoComplete="username"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6BA4E8] transition-all text-base"
              required
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6BA4E8] transition-all text-base"
              required
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p role="alert" className="text-sm text-red-300 text-center">
              {error}
            </p>
          )}

          {/* Botón Ingresar */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={cargando}
              className="px-10 py-2.5 bg-[#E2E4E9] text-gray-900 font-medium rounded-2xl hover:bg-white active:scale-95 transition-all text-base shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default LoginScreen;