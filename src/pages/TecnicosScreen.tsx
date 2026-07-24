import { useState } from "react"
import SideBarComponent from "../components/SideBar"
import SearchBar from "../components/SearchBar";
import { obtenerTecnicos, type Tecnico } from "../services/tecnicos";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TecnicosScreen() {
  
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  
  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased text-white select-none">

      {/* 1. SIDEBAR (Menú Lateral) */}
      <SideBarComponent />

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">

        {/* Cabecera: Título */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Técnicos</h1>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <SearchBar />

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-gray-600">Cargando técnicos...</p>
          </div>
        ) : tecnicos.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500 italic">
              No hay clientes registrados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
            {tecnicos.map((tecnico) => (
              <div key={tecnico.cliente_id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">

                <div className="bg-[#222861] p-4 flex justify-end gap-2">
                  <button className="bg-[#E2E4E9] text-gray-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition-colors">
                    Editar
                  </button>

                  <button className="bg-[#E2E4E9] text-gray-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition-colors">
                    Eliminar
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-5 flex flex-col gap-2 text-black">
                  <h2 className="text-xl font-bold">{tecnico.nombre}</h2>

                  <p>
                    <span className="font-semibold">Correo:</span>{" "}
                    {tecnico.correo_electronico}
                  </p>

                  <p>
                    <span className="font-semibold">Dirección:</span>{" "}
                    {tecnico.direccion}
                  </p>

                  <p>
                    <span className="font-semibold">Tipo Persona:</span>{" "}
                    {tecnico.tipo_persona}
                  </p>

                  <button className="mt-4 w-full bg-[#343C8F] text-white py-3 rounded-xl hover:bg-[#222861] transition-all">
                    Agregar solicitud
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}


      </main>
    </div>
  )
}