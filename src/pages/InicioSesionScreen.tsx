import { useState } from 'react';
import { Link } from 'react-router-dom';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando sesión con:', { email, password });
  };

  return (
    <div className="min-h-screen w-full bg-[#DCE4F3] flex flex-col md:flex-row items-center justify-center gap-12 p-6 font-sans">

      {/* Sección Izquierda: Logo y Título */}
      <div className="flex flex-col items-center max-w-sm text-center">
        {/* Contenedor del Logo imitando el recuadro blanco de la imagen */}
        <div className="bg-white p-4 shadow-sm rounded-sm mb-4 w-52 h-44 flex flex-col items-center justify-center">
          {/* Logo Geométrico (Simulado con CSS/SVG) */}
          <div className="relative w-20 h-20 mb-2">
            {/* Prisma superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-12 bg-gradient-to-b from-[#6BA4E8] to-[#1E56A0] clip-path-prisma"></div>
            {/* Líneas/Estructura inferior */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-6 border-b-2 border-l-2 border-r-2 border-[#1E56A0] opacity-60 flex flex-col justify-between p-0.5">
              <div className="w-full h-[1px] bg-[#1E56A0] opacity-40"></div>
              <div className="w-full h-[1px] bg-[#1E56A0] opacity-40"></div>
            </div>
          </div>
          {/* Texto 'minforsac' */}
          <div className="text-3xl font-bold tracking-tight text-black">
            <span className="text-[#6BA4E8]">m</span>
            <span>inforsac</span>
          </div>
        </div>

        {/* Subtítulo */}
        <h1 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">
          Gestión de Servicios Técnicos
        </h1>
      </div>

      {/* Sección Derecha: Formulario de Inicio de Sesión */}
      <div className="w-full max-w-[460px] bg-[#222861] rounded-2xl p-8 md:p-10 shadow-lg text-white">
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

          {/* Botón Ingresar */}
          <div className="pt-2 flex justify-center">
            <Link
              to="/clientes"
              type="submit"
              className="px-10 py-2.5 bg-[#E2E4E9] text-gray-900 font-medium rounded-2xl hover:bg-white active:scale-95 transition-all text-base shadow-sm"
            >
              Ingresar
            </Link>
          </div>
        </form>
      </div>

    </div>
  );
};

export default LoginScreen;