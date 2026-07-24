import { useState, useEffect } from 'react';
import SideBarComponent from '../components/SideBar';
import SearchBar from '../components/SearchBar';
import { obtenerClientes, type Cliente } from '../services/clientes';
import LoadingSpinner from "../components/LoadingSpinner";

export const ClientesScreen = () => {
  // Lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const data = await obtenerClientes();
        setClientes(data);
        setClientesFiltrados(data);
      } catch (error) {
        console.error('Error al cargar clientes', error);
      } finally {
        setLoading(false);
      }
    };

    cargarClientes();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased">

      <SideBarComponent />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Cabecera: Título y Botón Agregar */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Clientes</h1>
          <button className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm">
            Agregar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
          <SearchBar
            items={clientes}
            searchKey="nombre"
            onFiltrar={setClientesFiltrados}
          />
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-gray-600">Cargando clientes...</p>
          </div>
        ) : (clientesFiltrados.length === 0) ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500 italic">
              {clientes.length === 0 ? "No hay clientes registrados." : "No se encontraron clientes en la búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
            {clientesFiltrados.map((cliente) => (
              <div key={cliente.cliente_id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">

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
                  <h2 className="text-xl font-bold">{cliente.nombre}</h2>

                  <p>
                    <span className="font-semibold">Correo:</span>{" "}
                    {cliente.correo_electronico}
                  </p>

                  <p>
                    <span className="font-semibold">Dirección:</span>{" "}
                    {cliente.direccion}
                  </p>

                  <p>
                    <span className="font-semibold">Tipo Persona:</span>{" "}
                    {cliente.tipo_persona}
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
  );
};

export default ClientesScreen;