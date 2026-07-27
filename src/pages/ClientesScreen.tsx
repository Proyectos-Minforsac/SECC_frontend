import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SideBarComponent from '../components/SideBar';
import SearchBar from '../components/SearchBar';
import { obtenerClientes, crearCliente, editarCliente, eliminarCliente, type Cliente } from '../services/clientes';
import LoadingSpinner from "../components/LoadingSpinner";
import ClienteCard from '../components/ClienteCard';
import ClienteAgregarEditarModal from '../components/ClienteModals';
import PaginacionComponente from '../components/Paginacion';

export const ClientesScreen = () => {

  // Lista total de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Componentes
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Datos del cliente
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteRuc, setClienteRuc] = useState("");
  const [clienteCorreo, setClienteCorreo] = useState("");
  const [clienteTipo, setClienteTipo] = useState("");

  // Paginación
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [paginaActual, setPaginaActual] = useState(
    Number(searchParams.get("page")) || 1
  );

  useEffect(() => {
    setSearchParams({
      page: paginaActual.toString(),
      limit: "9",
      search: busqueda,
    })
  }, [paginaActual, busqueda, setSearchParams]);

  const cargarClientes = async () => {
    try {
      const data = await obtenerClientes(paginaActual, 9, busqueda);
      setClientes(data.clientes);
      setTotalPaginas(data.totalPages);
    } catch (error) {
      console.error('Error al cargar clientes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [paginaActual, busqueda]);

  const handleAgregarCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNombre || !clienteDireccion || !clienteRuc || !clienteCorreo || !clienteTipo) {
      alert("Faltan datos en el formulario")
      return;
    }

    if (clienteNombre.length > 256) {
      alert("El nombre no puede superar los 256 caracteres.");
      return;
    }

    if (clienteDireccion.length > 512) {
      alert("La dirección no puede superar los 512 caracteres.");
      return;
    }

    if (clienteRuc.length !== 11) {
      alert("El RUC debe tener 11 dígitos.");
      return;
    }

    if (clienteCorreo.length > 256) {
      alert("El correo electrónico no puede superar los 256 caracteres.");
      return;
    }

    try {
      await crearCliente({
        nombre: clienteNombre,
        direccion: clienteDireccion,
        ruc: clienteRuc,
        correo_electronico: clienteCorreo,
        tipo_persona: clienteTipo
      });

      setIsModalOpen(false);

      setClienteNombre("");
      setClienteDireccion("");
      setClienteRuc("");
      setClienteCorreo("");
      setClienteTipo("");

      await cargarClientes();

      console.log('Cliente agregado correctamente');
    } catch (error) {
      console.error('Error al crear cliente', error);
    }
  }

  const handleEditarCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteEditando) return;

    const sinCambios =
      clienteNombre === clienteEditando.nombre &&
      clienteDireccion === clienteEditando.direccion &&
      clienteRuc === clienteEditando.ruc &&
      clienteCorreo === clienteEditando.correo_electronico &&
      clienteTipo === clienteEditando.tipo_persona;

    if (sinCambios) {
      alert("Debe editar al menos un dato del cliente.");
      return;
    }

    try {
      await editarCliente(clienteEditando.cliente_id.toString(), {
        nombre: clienteNombre,
        direccion: clienteDireccion,
        ruc: clienteRuc,
        correo_electronico: clienteCorreo,
        tipo_persona: clienteTipo
      });

      setIsModalOpen(false);
      setClienteEditando(null);

      await cargarClientes();

      console.log("Cliente actualizado");
    } catch (error) {
      console.error(error)
    }
  }

  const handleEliminarCliente = async (id:string) => {
    alert("¿Está seguro de que quiere eliminar el cliente?");

    try{
      await eliminarCliente(id);
      await cargarClientes();
      console.log('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar cliente', error);
    }
  }

  const cerrarModal = () => {
    setIsModalOpen(false);
    setClienteEditando(null);

    setClienteNombre("");
    setClienteDireccion("");
    setClienteRuc("");
    setClienteCorreo("");
    setClienteTipo("");
  }

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased">

      <SideBarComponent />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Cabecera: Título y Botón Agregar */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Clientes</h1>
          <button
            onClick={() => {
              setClienteEditando(null);

              setClienteNombre("");
              setClienteDireccion("");
              setClienteRuc("");
              setClienteCorreo("");
              setClienteTipo("");
              
              setIsModalOpen(true);
            }}
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
            Agregar
          </button>

          <ClienteAgregarEditarModal
            isOpen={isModalOpen}
            onClose={cerrarModal}
            title={clienteEditando ? 'Editar cliente' : 'Nuevo cliente'}
          >
            <form
              onSubmit={
                clienteEditando
                  ? handleEditarCliente
                  : handleAgregarCliente
                }
            >
              <div>
                <input
                  type="text"
                  placeholder="Nombre o razón social"
                  maxLength={256}
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Dirección"
                  maxLength={512}
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="R.U.C"
                  maxLength={11}
                  inputMode='numeric'
                  pattern='[0-9]{11}'
                  value={clienteRuc}
                  onChange={(e) => setClienteRuc(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Correo electrónico"
                  maxLength={256}
                  value={clienteCorreo}
                  onChange={(e) => setClienteCorreo(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>

              <div>
                <select
                  value={clienteTipo}
                  onChange={(e) => setClienteTipo(e.target.value)}
                  className="w-full my-3 appearance-none bg-white rounded-full px-5 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.8rem_center] bg-no-repeat"
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option value="Cliente">Cliente</option>
                  <option value="Proveedor">Proveedor</option>
                  <option value="Cliente-Proveedor">Cliente-Proveedor</option>
                  <option value="Trabajador">Trabajador</option>
                </select>
              </div>

              <div className='flex flex-row justify-center items-center gap-3 my-3'>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className='px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors items-center gap-1 shadow-sm cursor-pointer'>
                  Cancelar
                </button>

                <button
                  type='submit'
                  className='px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors items-center gap-1 shadow-sm cursor-pointer'>
                  {clienteEditando ? "Guardar" : "Agregar cliente"}
                </button>
              </div>
            </form>
          </ClienteAgregarEditarModal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
          <SearchBar
            onBuscar={(texto) => {
              setBusqueda(texto);
              setPaginaActual(1);
            }}
          />
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-gray-600">Cargando clientes...</p>
          </div>
        ) : (clientes.length === 0) ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500 italic">
              {busqueda.trim() ? "No hay clientes registrados." : "No se encontraron clientes en la búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
            {clientes.map((cliente) => (
              <div key={cliente.cliente_id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <ClienteCard
                  key={cliente.cliente_id}
                  nombre={cliente.nombre}
                  direccion={cliente.direccion}
                  ruc={cliente.ruc}
                  correo_electronico={cliente.correo_electronico}
                  tipo_persona={cliente.tipo_persona}
                  on_edit={() => {
                    setClienteEditando(cliente);

                    setClienteNombre(cliente.nombre);
                    setClienteDireccion(cliente.direccion);
                    setClienteRuc(cliente.ruc);
                    setClienteCorreo(cliente.correo_electronico);
                    setClienteTipo(cliente.tipo_persona);
                    
                    setIsModalOpen(true);
                  }}
                  on_delete={() => handleEliminarCliente(cliente.cliente_id.toString())}
                />
              </div>
            ))}
          </div>
        )}
        <PaginacionComponente
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
        />
      </main>
    </div>
  );
};

export default ClientesScreen;