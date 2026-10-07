import { useState, useEffect } from "react"
import { obtenerClientes, type Cliente } from "../services/clientes"
import { obtenerTecnicos, type Tecnico } from "../services/tecnicos"
import {
  aceptarOferta,
  autorizarViaje,
  crearSolicitud,
  editarSolicitud,
  eliminarSolicitud,
  formatearFechaISO,
  rechazarOferta,
  type AutorizacionViaje,
  type SolicitudServicio,
} from "../services/solicitudes"
import { useSolicitudes } from "../hooks/useSolicitudes"
import SolicitudesServicioTable from "../components/SolicitudesServicioTable"
import AgregarEditarModal from "../components/Modal"
import { ChevronDown } from "lucide-react"
import SearchBar from "../components/SearchBar"
import { agregarNotificacion } from "../services/notificaciones"
import { cargarVisitas } from "../services/visitas"
import AutorizarViajeModal from "../components/AutorizarViajeModal"
import Toast from "../components/Toast"
import ConfirmDeleteModal from "../components/ConfirmDeleteModal"

export default function SolicitudesServicioScreen() {

  const [guardando, setGuardando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const solicitudes = useSolicitudes();

  const mostrarError = (e: unknown, porDefecto: string) =>
    setToast({ show: true, message: e instanceof Error ? e.message : porDefecto });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [descripcion, setDescripcion] = useState('');

  // Ubicación seleccionada y técnicos que pertenecen a ella
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState<string[]>([]);
  const [tecnicoUbicacion, setTecnicoUbicacion] = useState("");
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState<Tecnico[]>([]);
  const [todosLosTecnicos, setTodosLosTecnicos] = useState<Tecnico[]>([]);

  // Solicitud que se está editando (null = el modal crea una nueva) y la que se pide confirmar para eliminar.
  const [solicitudEditando, setSolicitudEditando] = useState<SolicitudServicio | null>(null);
  const [solicitudAEliminar, setSolicitudAEliminar] = useState<SolicitudServicio | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Con ofertas ya enviadas no se puede cambiar el cliente ni quitar a quien ofertó.
  const tieneOfertas = (solicitudEditando?.ofertas.length ?? 0) > 0;
  const yaOferto = (tecnico: Tecnico) =>
    solicitudEditando?.ofertas.some((o) => o.tecnicoNombre === tecnico.nombre) ?? false;

  // Oferta recién aceptada, a la espera de que el empleado autorice el viaje del técnico.
  const [viajePorAutorizar, setViajePorAutorizar] = useState<{
    solicitudId: number;
    clienteNombre: string;
    tecnicoNombre: string;
  } | null>(null);

  const cargarClientes = async () => {
    try {
      const data = await obtenerClientes(1, 9, busqueda);
      setClientes(data.clientes);
    } catch (error) {
      console.error('Error al cargar clientes', error);
    }
  }

  // Espera a que el usuario deje de escribir para no consultar con cada tecla.
  useEffect(() => {
    const temporizador = setTimeout(cargarClientes, 400);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  // Carga las ubicaciones disponibles una sola vez para llenar el select
  useEffect(() => {
    obtenerTecnicos(1, 1000, "")
      .then((data) => {
        setTodosLosTecnicos(data.tecnicos);
        setUbicacionesDisponibles([...new Set(data.tecnicos.map((tecnico) => tecnico.ubicacion))]);
      })
      .catch((error) => console.error('Error al cargar ubicaciones', error));
  }, []);

  // Carga los técnicos que pertenecen a la ubicación elegida
  useEffect(() => {
    if (!tecnicoUbicacion) {
      setTecnicos([]);
      return;
    }

    obtenerTecnicos(1, 100, "", tecnicoUbicacion)
      .then((data) => setTecnicos(data.tecnicos))
      .catch((error) => console.error('Error al cargar técnicos', error));
  }, [tecnicoUbicacion]);

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setBusqueda(cliente.nombre);
  }

  const alternarTecnico = (tecnico: Tecnico) => {
    if (yaOferto(tecnico)) return;
    setTecnicosSeleccionados((prev) =>
      prev.some((t) => t.tecnicoId === tecnico.tecnicoId)
        ? prev.filter((t) => t.tecnicoId !== tecnico.tecnicoId)
        : [...prev, tecnico]
    );
  }

  const abrirEdicion = (solicitud: SolicitudServicio) => {
    setSolicitudEditando(solicitud);
    setDescripcion(solicitud.descripcion);
    setClienteSeleccionado(solicitud.cliente ?? null);
    setBusqueda(solicitud.cliente?.nombre ?? "");
    setTecnicosSeleccionados(todosLosTecnicos.filter((t) => solicitud.tecnicoIds.includes(t.tecnicoId)));
    setIsModalOpen(true);
  }

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSolicitudEditando(null);
    setError("");
    setDescripcion("");
    setBusqueda("");
    setClienteSeleccionado(null);
    setTecnicoUbicacion("");
    setTecnicosSeleccionados([]);
    setTecnicos([]);
  }

  const handleGuardarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim()) return setError("Ingresa una descripción.");
    if (!clienteSeleccionado) return setError("Selecciona un cliente.");
    if (tecnicosSeleccionados.length === 0) return setError("Selecciona al menos un técnico.");

    setGuardando(true);
    try {
      const datos = {
        clienteId: clienteSeleccionado.clienteId,
        descripcion: descripcion.trim(),
        tecnicoIds: tecnicosSeleccionados.map((t) => t.tecnicoId),
      };
      if (solicitudEditando) {
        await editarSolicitud(solicitudEditando.solicitudId, datos);
      } else {
        await crearSolicitud(datos);
      }
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la solicitud.");
    } finally {
      setGuardando(false);
    }
  }

  const handleEliminarSolicitud = async () => {
    if (!solicitudAEliminar) return;

    setEliminando(true);
    try {
      await eliminarSolicitud(solicitudAEliminar.solicitudId);
    } catch (e) {
      mostrarError(e, "No se pudo eliminar la solicitud.");
    } finally {
      setEliminando(false);
      setSolicitudAEliminar(null);
    }
  }

  const handleAceptarOferta = async (solicitudId: number, ofertaId: number) => {
    const solicitud = solicitudes.find((s) => s.solicitudId === solicitudId);
    const oferta = solicitud?.ofertas.find((o) => o.ofertaId === ofertaId);
    if (!solicitud || !oferta) return;

    try {
      await aceptarOferta(solicitudId, ofertaId);
    } catch (e) {
      return mostrarError(e, "No se pudo aceptar la oferta.");
    }

    setViajePorAutorizar({
      solicitudId,
      clienteNombre: solicitud.clienteNombre,
      tecnicoNombre: oferta.tecnicoNombre,
    });
  }

  const handleAutorizarViaje = async (autorizacion: AutorizacionViaje) => {
    if (!viajePorAutorizar) return;
    const { solicitudId, clienteNombre, tecnicoNombre } = viajePorAutorizar;

    try {
      await autorizarViaje(solicitudId, autorizacion);
    } catch (e) {
      return mostrarError(e, "No se pudo autorizar el viaje.");
    }

    // El backend crea la visita técnica al autorizar el viaje; aquí solo se trae para verla en las demás pantallas.
    cargarVisitas().catch((e) => console.error('Error al cargar las visitas técnicas', e));

    agregarNotificacion({
      rolDestino: 'tecnico',
      tecnicoDestino: tecnicoNombre,
      solicitudId,
      mensaje: `Se autorizó tu viaje a ${clienteNombre} entre el ${formatearFechaISO(autorizacion.fechaInicio)} y el ${formatearFechaISO(autorizacion.fechaFin)}. Revisa los detalles en Solicitudes de Servicios.`,
    });

    setViajePorAutorizar(null);
  }

  const handleRechazarOferta = async (solicitudId: number, ofertaId: number) => {
    const solicitud = solicitudes.find((s) => s.solicitudId === solicitudId);
    const oferta = solicitud?.ofertas.find((o) => o.ofertaId === ofertaId);
    if (!solicitud || !oferta) return;

    try {
      await rechazarOferta(solicitudId, ofertaId);
    } catch (e) {
      return mostrarError(e, "No se pudo rechazar la oferta.");
    }

    agregarNotificacion({
      rolDestino: 'tecnico',
      tecnicoDestino: oferta.tecnicoNombre,
      solicitudId,
      mensaje: `Tu oferta para la solicitud de ${solicitud.clienteNombre} no fue aceptada.`,
    });
  }

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Solicitudes de Servicios</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
            Agregar
          </button>

          <AgregarEditarModal
            isOpen={isModalOpen}
            onClose={cerrarModal}
            title={solicitudEditando ? `Editar solicitud N° ${solicitudEditando.solicitudId}` : "Nueva solicitud de servicio"}
          >
            <form
              onSubmit={handleGuardarSolicitud}
              className="flex flex-col gap-3 my-3"
            >
              {/* Cuadro de Descripción */}
              <div className="col-span-5">
                <textarea
                  placeholder="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full h-20 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
                />
              </div>

              <label className="text-white">{tieneOfertas ? "Cliente" : "Seleccionar cliente"}</label>
              {tieneOfertas ? (
                <p className="text-xs text-white/80 px-1">
                  El cliente no se puede cambiar porque la solicitud ya tiene ofertas.
                </p>
              ) : (
                <SearchBar
                  className=""
                  onBuscar={(texto) => {
                    setClienteSeleccionado(null);
                    setBusqueda(texto);
                  }}
                />
              )}

              {busqueda.trim() && !clienteSeleccionado && (
                <div className="max-h-30 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-600">Nombre o Razón Social</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.length > 0 ? (
                        clientes.map((cliente) => (
                          <tr
                            key={cliente.clienteId || cliente.nombre}
                            onClick={() => seleccionarCliente(cliente)}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <td className="px-4 py-2 text-black">{cliente.nombre}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2 text-gray-500 italic">No se encontraron clientes</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {clienteSeleccionado && (
                <div className="bg-white rounded-full px-5 py-2 text-sm text-black shadow-sm">
                  Cliente seleccionado: <span className="font-semibold">{clienteSeleccionado.nombre}</span>
                </div>
              )}

              <label className="text-white">Enviar a técnicos</label>

              <div className="relative h-10">
                <select
                  value={tecnicoUbicacion}
                  onChange={(e) => setTecnicoUbicacion(e.target.value)}
                  className="w-full h-10 appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                >
                  <option value="">Ubicación del técnico</option>
                  {ubicacionesDisponibles.map((ubicacion) => (
                    <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>

              {tecnicoUbicacion && (
                <div className="max-h-30 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-600">Técnico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tecnicos.length > 0 ? (
                        tecnicos.map((tecnico) => (
                          <tr
                            key={tecnico.tecnicoId}
                            onClick={() => alternarTecnico(tecnico)}
                            className={`cursor-pointer hover:bg-gray-100 ${tecnicosSeleccionados.some((t) => t.tecnicoId === tecnico.tecnicoId) ? 'bg-gray-200' : ''}`}
                          >
                            <td className="px-4 py-2 text-black">
                              {tecnico.nombre}
                              {yaOferto(tecnico) && <span className="text-xs text-gray-500"> · ya envió su oferta</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2 text-gray-500 italic">No hay técnicos en esta ubicación</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tecnicosSeleccionados.length > 0 && (
                <div className="bg-white rounded-2xl px-5 py-2 text-sm text-black shadow-sm">
                  {tecnicosSeleccionados.length === 1 ? 'Técnico seleccionado' : 'Técnicos seleccionados'}:{' '}
                  <span className="font-semibold">{tecnicosSeleccionados.map((t) => t.nombre).join(', ')}</span>
                </div>
              )}

              {error && <p className="text-sm text-red-300 text-center">{error}</p>}

              <div className='flex flex-row justify-center items-center gap-3 pt-2'>
                <button
                  type='button'
                  onClick={cerrarModal}
                  className='px-5 py-1.5 bg-[#E2E4E9] text-gray-800 text-sm font-medium rounded-full hover:bg-white transition-colors items-center gap-1 shadow-sm cursor-pointer'>
                  Cancelar
                </button>

                <button
                  type='submit'
                  disabled={guardando}
                  className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors items-center gap-1 shadow-sm ${guardando ? 'bg-[#C7CAD1] text-gray-500 cursor-not-allowed' : 'bg-[#E2E4E9] text-gray-800 hover:bg-white cursor-pointer'}`}>
                  {solicitudEditando
                    ? (guardando ? "Guardando cambios..." : "Guardar cambios")
                    : (guardando ? "Enviando solicitud..." : "Enviar solicitud")}
                </button>
              </div>
            </form>
          </AgregarEditarModal>
        </div>

        <div className="my-5">
          <SolicitudesServicioTable
            solicitudes={solicitudes}
            onAceptarOferta={handleAceptarOferta}
            onRechazarOferta={handleRechazarOferta}
            onEditar={abrirEdicion}
            onEliminar={setSolicitudAEliminar}
          />
        </div>

        <AutorizarViajeModal
          isOpen={viajePorAutorizar !== null}
          clienteNombre={viajePorAutorizar?.clienteNombre ?? ''}
          tecnicoNombre={viajePorAutorizar?.tecnicoNombre ?? ''}
          onClose={() => setViajePorAutorizar(null)}
          onAutorizar={handleAutorizarViaje}
        />

        <ConfirmDeleteModal
          open={solicitudAEliminar !== null}
          title="Eliminar solicitud"
          message={
            <>
              ¿Está seguro de que quiere eliminar la solicitud N° {solicitudAEliminar?.solicitudId} de{' '}
              <span className="font-semibold">{solicitudAEliminar?.clienteNombre}</span>?
              {(solicitudAEliminar?.ofertas.length ?? 0) > 0 &&
                ' Se eliminarán también las ofertas recibidas y sus archivos.'}
            </>
          }
          deleting={eliminando}
          onCancel={() => setSolicitudAEliminar(null)}
          onConfirm={handleEliminarSolicitud}
        />

        <Toast
          show={toast.show}
          type="error"
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  )
}
