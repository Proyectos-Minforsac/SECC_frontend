import { useEffect, useState } from "react"
import { useSearchParams } from 'react-router-dom';
import SideBarComponent from "../components/SideBar"
import SearchBar from "../components/SearchBar";
import { obtenerTecnicos, type Tecnico } from "../services/tecnicos";
import LoadingSpinner from "../components/LoadingSpinner";
import TecnicoCard from "../components/TecnicoCard";
import AgregarEditarModal from "../components/Modal";
import PaginacionComponente from "../components/Paginacion";

export default function TecnicosScreen() {

  // Lista de técnicos
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  // Componentes
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Datos del técnico
  const [tecnicoNombre, setTecnicoNombre] = useState("");
  const [tecnicoEditando, setTecnicoEditando] = useState<Tecnico | null>(null);
  const [tecnicoTipoDocumento, setTecnicoTipoDocumento] = useState("");
  const [tecnicoNumDocumento, setTecnicoNumDocumento] = useState("");
  const [tecnicoTelefono, setTecnicoTelefono] = useState("");
  const [tecnicoUbicacion, setTecnicoUbicacion] = useState("");
  const [tecnicoServicio, setTecnicoServicio] = useState("");
  const [tecnicoArea, setTecnicoArea] = useState("");
  const [tecnicoCalificacion, setTecnicoCalificacion] = useState("");

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

  const cargarTecnicos = async () => {
    try {
      const data = await obtenerTecnicos(paginaActual, 9, busqueda);
      setTecnicos(data.tecnicos);
      setTotalPaginas(data.totalPages);
    } catch (error) {
      console.error('Error al cargar técnicos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTecnicos();
  }, [paginaActual, busqueda]);

  const handleAgregarTecnico = () => {

  }

  const handleEditarTecnico = () => {

  }

  const handleEliminarTecnico = async (id: string) => {
    alert("¿Está seguro de que quiere eliminar el técnico?");

    console.log(id);

    try {
      // await eliminarCliente(id);
      // await cargarClientes();
      console.log('Técnico eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar técnico', error);
    }
  }

  const cerrarModal = () => {
    setIsModalOpen(false);
    setTecnicoEditando(null);

    setTecnicoNombre("");
    setTecnicoNumDocumento("");
    setTecnicoTelefono("");
    setTecnicoUbicacion("");
    setTecnicoServicio("");
    setTecnicoArea("");
    setTecnicoCalificacion("");
  }

  // console.log(tecnicos);

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased select-none">

      {/* 1. SIDEBAR (Menú Lateral) */}
      <SideBarComponent />

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Cabecera: Título */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Técnicos</h1>
          <button
            onClick={() => {
              setTecnicoEditando(null);

              setTecnicoNombre("");
              setTecnicoNumDocumento("");
              setTecnicoTelefono("");
              setTecnicoUbicacion("");
              setTecnicoServicio("");
              setTecnicoArea("");
              setTecnicoCalificacion("");

              setIsModalOpen(true);
            }}
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
            Agregar
          </button>
        </div>

        <AgregarEditarModal
          isOpen={isModalOpen}
          onClose={cerrarModal}
          title={tecnicoEditando ? 'Editar técnico' : 'Nuevo técnico'}
        >
          <form
            onSubmit={
              tecnicoEditando
                ? handleEditarTecnico
                : handleAgregarTecnico
            }
          >
            <div>
              <input
                type="text"
                placeholder="Nombre o razón social"
                maxLength={256}
                value={tecnicoNombre}
                onChange={(e) => setTecnicoNombre(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
              />
            </div>

            <div className="flex gap-3 my-3">
              <div>
                <select
                  value={tecnicoTipoDocumento}
                  onChange={(e) => setTecnicoTipoDocumento(e.target.value)}
                  className="w-full my-3 appearance-none bg-white rounded-full px-5 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.8rem_center] bg-no-repeat"
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option value="D.N.I">D.N.I</option>
                  <option value="R.U.C">R.U.C</option>
                </select>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Número Documento"
                  maxLength={11}
                  value={tecnicoNumDocumento}
                  onChange={(e) => setTecnicoNumDocumento(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Ubicación"
                maxLength={256}
                value={tecnicoUbicacion}
                onChange={(e) => setTecnicoUbicacion(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
              />
            </div>

            <div className="flex gap-3 my-3">
              <div>
                <input
                  type="text"
                  placeholder="Teléfono"
                  maxLength={11}
                  inputMode='numeric'
                  pattern='[0-9]{9}'
                  value={tecnicoTelefono}
                  onChange={(e) => setTecnicoTelefono(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Servicio"
                  maxLength={256}
                  value={tecnicoServicio}
                  onChange={(e) => setTecnicoServicio(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>
            </div>

            <div className="flex gap-3 my-3">
              <div>
                <input
                  type="text"
                  placeholder="Área"
                  maxLength={256}
                  value={tecnicoArea}
                  onChange={(e) => setTecnicoArea(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Calificación"
                  maxLength={256}
                  value={tecnicoCalificacion}
                  onChange={(e) => setTecnicoCalificacion(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm my-3"
                />
              </div>
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
                {tecnicoEditando ? "Guardar técnico" : "Agregar técnico"}
              </button>
            </div>
          </form>
        </ AgregarEditarModal>

        {/* Barra de Búsqueda y Filtros */}
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
            <p className="text-lg text-gray-600">Cargando técnicos...</p>
          </div>
        ) : tecnicos.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500 italic">
              {tecnicos.length === 0 ? "No hay técnicos registrados." : "No se encontraron técnicos en la búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
            {tecnicos.map((tecnico) => (
              <div key={tecnico.tecnico_id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <TecnicoCard
                  nombre={tecnico.nombre}
                  numero_documento={tecnico.numero_documento}
                  telefono={tecnico.telefono}
                  ubicacion={tecnico.ubicacion}
                  servicio={tecnico.servicio}
                  area={tecnico.area}
                  calificacion={tecnico.calificacion}
                  precios={tecnico.precios}
                  on_edit={() => {
                    setTecnicoEditando(tecnico);

                    setTecnicoNombre(tecnico.nombre);
                    setTecnicoNumDocumento(tecnico.numero_documento);
                    setTecnicoTelefono(tecnico.telefono);
                    setTecnicoUbicacion(tecnico.ubicacion);
                    setTecnicoServicio(tecnico.servicio);
                    setTecnicoArea(tecnico.area);
                    setTecnicoCalificacion(tecnico.calificacion);

                    setIsModalOpen(true);
                  }}
                  on_delete={() => handleEliminarTecnico(tecnico.tecnico_id.toString())}
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
  )
}