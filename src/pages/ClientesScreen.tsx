import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SideBarComponent from '../components/SideBar';
import SearchBar from '../components/SearchBar';
import { obtenerClientes, crearCliente, editarCliente, eliminarCliente, type Cliente } from '../services/clientes';
import LoadingSpinner from "../components/LoadingSpinner";
import ClienteCard from '../components/ClienteCard';
import AgregarEditarModal from '../components/Modal';
import PaginacionComponente from '../components/Paginacion';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Toast from '../components/Toast';
import { ChevronDown } from 'lucide-react';

export const ClientesScreen = () => {

  // Lista total de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Componentes
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEliminar, setClienteEliminar] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  const mostrarToast = (type: 'success' | 'error', message: string) =>
    setToast({ show: true, type, message });

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
    setLoading(true);
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
      alert("Faltan datos en el formulario");
      return;
    }

    if (clienteRuc.length !== 11) {
      alert("El RUC debe tener 11 dígitos.");
      return;
    }

    setGuardando(true);
    try {
      await crearCliente({
        nombre: clienteNombre,
        direccion: clienteDireccion,
        ruc: clienteRuc,
        correoElectronico: clienteCorreo,
        tipoPersona: clienteTipo
      });

      setIsModalOpen(false);

      setClienteNombre("");
      setClienteDireccion("");
      setClienteRuc("");
      setClienteCorreo("");
      setClienteTipo("");

      await cargarClientes();

      mostrarToast('success', 'Cliente agregado correctamente');
    } catch (error) {
      console.error('Error al crear cliente', error);
      mostrarToast('error', 'No se pudo agregar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  const handleEditarCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteEditando) return;

    const sinCambios =
      clienteNombre === clienteEditando.nombre &&
      clienteDireccion === clienteEditando.direccion &&
      clienteRuc === clienteEditando.ruc &&
      clienteCorreo === clienteEditando.correoElectronico &&
      clienteTipo === clienteEditando.tipoPersona;

    if (sinCambios) {
      alert("Debe editar al menos un dato del cliente.");
      return;
    }

    setGuardando(true);
    try {
      await editarCliente(clienteEditando.clienteId.toString(), {
        nombre: clienteNombre,
        direccion: clienteDireccion,
        ruc: clienteRuc,
        correoElectronico: clienteCorreo,
        tipoPersona: clienteTipo
      });

      setIsModalOpen(false);
      setClienteEditando(null);

      await cargarClientes();

      mostrarToast('success', 'Cliente actualizado correctamente');
    } catch (error) {
      console.error(error)
      mostrarToast('error', 'No se pudo actualizar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  const confirmarEliminarCliente = async () => {
    if (!clienteEliminar) return;

    setEliminando(true);
    try {
      await eliminarCliente(clienteEliminar.clienteId.toString());
      setClienteEliminar(null);
      await cargarClientes();

      setIsModalOpen(false);
      mostrarToast('success', 'Cliente eliminado correctamente');
    } catch (error) {
      console.error(error);
      mostrarToast('error', 'No se pudo eliminar el cliente');
    } finally {
      setEliminando(false);
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

          <AgregarEditarModal
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
              className='flex flex-col gap-3 my-3'
            >
              <div className='mt-3'>
                <input
                  type="text"
                  placeholder="Nombre o razón social"
                  maxLength={256}
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
                />
              </div>

              <div className='mt-3'>
                <input
                  type="text"
                  placeholder="Dirección"
                  maxLength={512}
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
                />
              </div>

              <div className='mt-3'>
                <input
                  type="text"
                  placeholder="RUC"
                  maxLength={11}
                  inputMode='numeric'
                  pattern='[0-9]{11}'
                  value={clienteRuc}
                  onChange={(e) => setClienteRuc(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
                />
              </div>

              <div className='mt-3'>
                <input
                  type="text"
                  placeholder="Correo electrónico"
                  maxLength={256}
                  value={clienteCorreo}
                  onChange={(e) => setClienteCorreo(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
                />
              </div>

              <div className="relative mt-3">
                <select
                  value={clienteTipo}
                  onChange={(e) => setClienteTipo(e.target.value)}
                  className="w-full appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                >
                  <option value="" disabled>
                    Tipo de persona
                  </option>
                  <option value="Cliente">Cliente</option>
                  <option value="Proveedor">Proveedor</option>
                  <option value="Cliente-Proveedor">Cliente-Proveedor</option>
                  <option value="Trabajador">Trabajador</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>

              <div className='flex flex-row justify-center items-center gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors items-center gap-1 shadow-sm cursor-pointer'>
                  Cancelar
                </button>

                <button
                  type='submit'
                  disabled={guardando}
                  className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors items-center gap-1 shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}>
                  {guardando ? (
                    clienteEditando ? "Guardando cliente..." : "Agregando cliente..."
                  ) : (
                    clienteEditando ? "Guardar cliente" : "Agregar cliente"
                  )}
                </button>
              </div>
            </form>
          </ AgregarEditarModal>
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
              <div key={cliente.clienteId} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <ClienteCard
                  key={cliente.clienteId}
                  nombre={cliente.nombre}
                  direccion={cliente.direccion}
                  ruc={cliente.ruc}
                  correo_electronico={cliente.correoElectronico}
                  tipo_persona={cliente.tipoPersona}
                  on_edit={() => {
                    setClienteEditando(cliente);

                    setClienteNombre(cliente.nombre);
                    setClienteDireccion(cliente.direccion);
                    setClienteRuc(cliente.ruc);
                    setClienteCorreo(cliente.correoElectronico);
                    setClienteTipo(cliente.tipoPersona);

                    setIsModalOpen(true);
                  }}
                  on_delete={() => setClienteEliminar(cliente)}
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

        <ConfirmDeleteModal
          open={clienteEliminar !== null}
          title="Eliminar cliente"
          message={
            <>
              ¿Está seguro de que quiere eliminar a{' '}
              <span className="font-semibold">{clienteEliminar?.nombre}</span>? Esta acción no se puede deshacer.
            </>
          }
          deleting={eliminando}
          onCancel={() => setClienteEliminar(null)}
          onConfirm={confirmarEliminarCliente}
        />

        <Toast
          show={toast.show}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
};

export default ClientesScreen;