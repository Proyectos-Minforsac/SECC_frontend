import { useEffect, useState } from "react"
import { useSearchParams } from 'react-router-dom';
import SideBarComponent from "../components/SideBar"
import SearchBar from "../components/SearchBar";
import { obtenerTecnicos, crearTecnico, editarTecnico, eliminarTecnico, type NuevoTecnico, type Tecnico } from "../services/tecnicos";
import LoadingSpinner from "../components/LoadingSpinner";
import TecnicoCard from "../components/TecnicoCard";
import AgregarEditarModal from "../components/Modal";
import PaginacionComponente from "../components/Paginacion";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Toast from "../components/Toast";
import { ChevronDown } from "lucide-react";

const CAPACIDADES_AIRE = ["12K", "18K", "24K", "36K", "48K"] as const;

const preciosAireIniciales = (): Record<string, number> =>
  Object.fromEntries(CAPACIDADES_AIRE.map((c) => [c, 0]));

export default function TecnicosScreen() {

  // Lista de técnicos
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  // Componentes
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tecnicoEliminar, setTecnicoEliminar] = useState<Tecnico | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  const mostrarToast = (type: 'success' | 'error', message: string) =>
    setToast({ show: true, type, message });

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
  const [preciosAire, setPreciosAire] = useState<Record<string, number>>(preciosAireIniciales);

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

      console.log(data);
    } catch (error) {
      console.error('Error al cargar técnicos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTecnicos();
  }, [paginaActual, busqueda]);

  // Valida el formulario y arma el cuerpo de la petición. Devuelve { error } o { payload }.
  const construirPayloadTecnico = (): { error?: string; payload?: NuevoTecnico } => {
    if (!tecnicoNombre || !tecnicoTipoDocumento || !tecnicoNumDocumento || !tecnicoTelefono || !tecnicoUbicacion || !tecnicoServicio || !tecnicoArea || !tecnicoCalificacion) {
      return { error: "Faltan datos en el formulario" };
    }

    if (tecnicoTelefono.length !== 9) {
      return { error: "El teléfono debe tener 9 dígitos." };
    }

    const esAire = tecnicoServicio === "Aire Condicionado";

    if (esAire && CAPACIDADES_AIRE.some((cap) => Number.isNaN(preciosAire[cap]) || preciosAire[cap] < 0)) {
      return { error: "Los precios de aire condicionado no son válidos." };
    }

    // Un precio en 0 no se registra: solo se envían los mayores a 0.
    const precios = esAire
      ? CAPACIDADES_AIRE
        .map((cap) => ({ tipoAire: cap, precio: preciosAire[cap] }))
        .filter((p) => p.precio > 0)
      : [];

    if (esAire && precios.length === 0) {
      return { error: "Ingrese al menos un precio de aire condicionado mayor a 0." };
    }

    return {
      payload: {
        nombre: tecnicoNombre,
        tipoDocumento: tecnicoTipoDocumento,
        numeroDocumento: tecnicoNumDocumento,
        telefono: tecnicoTelefono,
        ubicacion: tecnicoUbicacion,
        servicio: tecnicoServicio,
        area: tecnicoArea,
        calificacion: tecnicoCalificacion,
        precios,
      },
    };
  }

  const handleAgregarTecnico = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error, payload } = construirPayloadTecnico();
    if (error || !payload) {
      alert(error);
      return;
    }

    setGuardando(true);

    try {
      await crearTecnico(payload);
      await cargarTecnicos();
      cerrarModal();
      mostrarToast('success', 'Técnico agregado correctamente');
    } catch (error) {
      console.error("Error al agregar técnico", error);
      mostrarToast('error', 'No se pudo agregar el técnico');
    } finally {
      setGuardando(false);
    }
  }

  const handleEditarTecnico = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tecnicoEditando) return;

    const { error, payload } = construirPayloadTecnico();
    if (error || !payload) {
      alert(error);
      return;
    }

    setGuardando(true);

    try {
      await editarTecnico(tecnicoEditando.tecnicoId.toString(), payload);
      await cargarTecnicos();
      cerrarModal();
      mostrarToast('success', 'Técnico actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar técnico", error);
      mostrarToast('error', 'No se pudo actualizar el técnico');
    } finally {
      setGuardando(false);
    }
  }

  const confirmarEliminarTecnico = async () => {
    if (!tecnicoEliminar) return;

    setEliminando(true);
    try {
      await eliminarTecnico(tecnicoEliminar.tecnicoId.toString());
      setTecnicoEliminar(null);
      await cargarTecnicos();

      setIsModalOpen(false);
      mostrarToast('success', 'Técnico eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar técnico', error);
      mostrarToast('error', 'No se pudo eliminar el técnico');
    } finally {
      setEliminando(false);
    }
  }

  const cerrarModal = () => {
    setIsModalOpen(false);
    setTecnicoEditando(null);

    setTecnicoNombre("");
    setTecnicoTipoDocumento("");
    setTecnicoNumDocumento("");
    setTecnicoTelefono("");
    setTecnicoUbicacion("");
    setTecnicoServicio("");
    setTecnicoArea("");
    setTecnicoCalificacion("");
    setPreciosAire(preciosAireIniciales());
  }

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
              setTecnicoTipoDocumento("");
              setTecnicoNumDocumento("");
              setTecnicoTelefono("");
              setTecnicoUbicacion("");
              setTecnicoServicio("");
              setTecnicoArea("");
              setTecnicoCalificacion("");
              setPreciosAire(preciosAireIniciales());

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
            <div className="my-3">
              <input
                type="text"
                placeholder="Nombre o razón social"
                maxLength={256}
                value={tecnicoNombre}
                onChange={(e) => setTecnicoNombre(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
              />
            </div>

            <div className="flex gap-3 my-3">
              {/* Contenedor 1: select con icono */}
              <div className="relative flex-1 mt-3">
                <select
                  value={tecnicoTipoDocumento}
                  onChange={(e) => setTecnicoTipoDocumento(e.target.value)}
                  className="w-full appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                >
                  <option value="" disabled>
                    Tipo de documento
                  </option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>

              {/* Contenedor 2: input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Número de documento"
                  maxLength={tecnicoTipoDocumento === 'DNI' ? 8 : 11}
                  value={tecnicoNumDocumento}
                  onChange={(e) => setTecnicoNumDocumento(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
                />
              </div>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="Ubicación"
                maxLength={256}
                value={tecnicoUbicacion}
                onChange={(e) => setTecnicoUbicacion(e.target.value)}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
              />
            </div>

            <div className="flex gap-3 my-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Teléfono"
                  maxLength={9}
                  inputMode='numeric'
                  pattern='[0-9]{9}'
                  value={tecnicoTelefono}
                  onChange={(e) => setTecnicoTelefono(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
                />
              </div>
              <div className="flex-1 relative mt-3">
                <select
                  value={tecnicoServicio}
                  onChange={(e) => setTecnicoServicio(e.target.value)}
                  className="w-full appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                >
                  <option value="" disabled>
                    Servicio
                  </option>
                  <option value="Aire Condicionado">Aire Condicionado</option>
                  <option value="Cableado estructurado">Cableado estructurado</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 my-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Área"
                  maxLength={256}
                  value={tecnicoArea}
                  onChange={(e) => setTecnicoArea(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
                />
              </div>

              <div className="flex-1 relative mt-3">
                <select
                  value={tecnicoCalificacion}
                  onChange={(e) => setTecnicoCalificacion(e.target.value)}
                  className="w-full appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                >
                  <option value="" disabled>
                    Calificación
                  </option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Mala">Mala</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {tecnicoServicio === 'Aire Condicionado' && (
              <div className="my-3">
                <span className="text-white block font-medium">Precios de aire condicionado</span>
                <div className="grid grid-cols-3 gap-3">
                  {CAPACIDADES_AIRE.map((cap) => (
                    <div key={cap} className="flex items-center gap-2 mt-3">
                      <label className="text-white text-sm w-9 shrink-0">{cap}: </label>
                      <input
                        type="number"
                        min={0}
                        value={preciosAire[cap]}
                        onChange={(e) =>
                          setPreciosAire((prev) => ({
                            ...prev,
                            [cap]: e.target.value === "" ? 0 : Number(e.target.value),
                          }))
                        }
                        className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className='flex flex-row justify-center items-center gap-3 pt-2'>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className='px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors items-center gap-1 shadow-sm cursor-pointer'>
                Cancelar
              </button>

              <button
                type='submit'
                disabled={guardando}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors items-center gap-1 shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}>
                {guardando ? (
                  tecnicoEditando ? "Guardando técnico..." : "Agregando técnico..."
                ) : (
                  tecnicoEditando ? "Guardar técnico" : "Agregar técnico"
                )}
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
              <div key={tecnico.tecnicoId} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <TecnicoCard
                  nombre={tecnico.nombre}
                  numeroDocumento={tecnico.numeroDocumento}
                  telefono={tecnico.telefono}
                  ubicacion={tecnico.ubicacion}
                  servicio={tecnico.servicio}
                  area={tecnico.area}
                  calificacion={tecnico.calificacion}
                  precios={tecnico.precios}
                  on_edit={() => {
                    setTecnicoEditando(tecnico);

                    setTecnicoNombre(tecnico.nombre);
                    setTecnicoNumDocumento(tecnico.numeroDocumento);
                    setTecnicoTelefono(tecnico.telefono);
                    setTecnicoUbicacion(tecnico.ubicacion);
                    setTecnicoServicio(tecnico.servicio);
                    setTecnicoArea(tecnico.area);
                    setTecnicoCalificacion(tecnico.calificacion);

                    setPreciosAire({
                      ...preciosAireIniciales(),
                      ...Object.fromEntries(
                        (tecnico.precios ?? []).map((p) => [p.tipoAire, p.precio])
                      ),
                    });
                    setTecnicoTipoDocumento(tecnico.tipoDocumento);

                    setIsModalOpen(true);
                  }}
                  on_delete={() => setTecnicoEliminar(tecnico)}
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
          open={tecnicoEliminar !== null}
          title="Eliminar técnico"
          message={
            <>
              ¿Está seguro de que quiere eliminar a{' '}
              <span className="font-semibold">{tecnicoEliminar?.nombre}</span>? Esta acción no se puede deshacer.
            </>
          }
          deleting={eliminando}
          onCancel={() => setTecnicoEliminar(null)}
          onConfirm={confirmarEliminarTecnico}
        />

        <Toast
          show={toast.show}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  )
}