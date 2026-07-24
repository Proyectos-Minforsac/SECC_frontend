import { useState, useEffect } from 'react';
import SideBarComponent from '../components/SideBar';
import SearchBar from '../components/SearchBar';
import { obtenerClientes, type Cliente } from '../services/clientes';
import LoadingSpinner from "../components/LoadingSpinner";
import ClienteCard from '../components/ClienteCard';
import ClienteAgregarEditarModal from '../components/ClienteModals';

export const ClientesScreen = () => {
  // Lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteRuc, setClienteRuc] = useState("");
  const [clienteCorreo, setClienteCorreo] = useState("");

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
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
            Agregar
          </button>

          <ClienteAgregarEditarModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title='Nuevo cliente'
          >
            <p className='text-white'>Nuevo contenido</p>
            <div>
              <input
                type="text"
                placeholder="Nombre o razón social"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Dirección"
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="R.U.C"
                value={clienteRuc}
                onChange={(e) => setClienteRuc(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Correo electrónico"
                value={clienteCorreo}
                onChange={(e) => setClienteCorreo(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
              />
            </div>
          </ClienteAgregarEditarModal>
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
                <ClienteCard
                  key={cliente.cliente_id}
                  nombre={cliente.nombre}
                  correo_electronico={cliente.correo_electronico}
                  direccion={cliente.direccion}
                  tipo_persona={cliente.tipo_persona}
                />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default ClientesScreen;