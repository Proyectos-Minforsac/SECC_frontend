import { useState } from "react"
import { ChevronDown } from "lucide-react"
import HistorialServicios from "../components/HistorialServiciosTable"
import LiquidacionCostosModal from "../components/LiquidacionCostosModal"
import Toast from "../components/Toast"
import { useVisitas } from "../hooks/useVisitas"
import { useVisitasProgramadas } from "../hooks/useVisitasProgramadas"
import { useSolicitudes } from "../hooks/useSolicitudes"
import { useConformidades } from "../hooks/useConformidades"
import { useResumenCostos } from "../hooks/useResumenCostos"
import { cerrarServicioEnDrive } from "../services/cierreServicio"
import { anioDeFecha, esServicioDelHistorial, estadoServicio, type EstadoServicio } from "../services/servicios"
import { registrarCierreServicio, type VisitaTecnica } from "../services/visitas"
import { garantiaDelServicio, garantiaVigente } from "../services/mantenimientos"
import { formatearFechaISO } from "../services/visitasProgramadas"
import {
  cargarResumenCostos,
  liquidarFinal,
  obtenerLiquidacion,
  type EtapaPayload,
  type PropuestaConTabla,
} from "../services/costosReales"

const ESTILO_FILTRO =
  "w-full h-10 appearance-none bg-white rounded-full px-5 pr-11 py-2.5 text-sm text-black shadow-sm cursor-pointer focus:outline-none"

export default function ServiciosScreen() {
  const visitas = useVisitas()
  const visitasProgramadas = useVisitasProgramadas()
  const solicitudes = useSolicitudes()
  const conformidades = useConformidades()
  const costos = useResumenCostos()

  const [empresa, setEmpresa] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [estado, setEstado] = useState<EstadoServicio | "">("")

  const [cerrandoId, setCerrandoId] = useState<number | null>(null)
  const [progreso, setProgreso] = useState("")
  // Servicio cuya liquidación de costos se está preparando antes de cerrarlo
  const [preparandoId, setPreparandoId] = useState<number | null>(null)
  // Cierre pendiente de confirmar: con la tabla de costos reales (servicios con control de costos) y/o un aviso
  const [cierre, setCierre] = useState<{ servicio: VisitaTecnica; propuesta: PropuestaConTabla | null; advertencia?: string } | null>(null)
  const [liquidando, setLiquidando] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>({
    show: false,
    type: "success",
    message: "",
  })

  const servicios = visitas.filter(esServicioDelHistorial)
  const empresas = [...new Set(servicios.map((s) => s.clienteNombre))].sort()
  const periodos = [...new Set(servicios.map((s) => anioDeFecha(s.fecha)))].sort().reverse()

  const filtrados = servicios.filter(
    (s) =>
      (!empresa || s.clienteNombre === empresa) &&
      (!periodo || anioDeFecha(s.fecha) === periodo) &&
      (!estado || estadoServicio(s) === estado)
  )

  // Reúne los archivos del servicio en Drive y registra el cierre (al registrarlo, el servidor guarda el resumen de costos)
  const cerrarEnDrive = async (servicio: VisitaTecnica) => {
    setCerrandoId(servicio.visitaId)
    try {
      const carpetaUrl = await cerrarServicioEnDrive(
        {
          visita: servicio,
          solicitud: solicitudes.find((s) => s.solicitudId === servicio.solicitudId),
          programadas: visitasProgramadas.filter((v) => v.visitaId === servicio.visitaId),
          conformidades,
        },
        setProgreso
      )
      await registrarCierreServicio(servicio.visitaId, carpetaUrl)
      setToast({ show: true, type: "success", message: "Servicio cerrado: sus archivos están en Google Drive" })
    } catch (error) {
      setToast({
        show: true,
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo cerrar el servicio",
      })
    } finally {
      setCerrandoId(null)
      setProgreso("")
      // Al cerrar se conocen el margen real y la desviación
      cargarResumenCostos().catch(() => undefined)
    }
  }

  const mostrarError = (error: unknown, porDefecto: string) =>
    setToast({ show: true, type: "error", message: error instanceof Error ? error.message : porDefecto })

  // Cerrar el servicio liquida los costos de mantenimiento y soporte (y avisa si la garantía aún no vence). Solo hace falta
  // confirmar cuando hay algo que confirmar; si no, se cierra directo como siempre.
  const handleCerrarServicio = async (servicio: VisitaTecnica) => {
    if (cerrandoId !== null || preparandoId !== null) return

    let pendiente: { servicio: VisitaTecnica; propuesta: PropuestaConTabla | null; advertencia?: string } | null = null
    setPreparandoId(servicio.visitaId)
    try {
      const propuesta = await obtenerLiquidacion(servicio.visitaId, "FINAL")
      const garantia = garantiaDelServicio(visitasProgramadas.filter((v) => v.visitaId === servicio.visitaId), servicio.garantiaMeses)
      const advertencia =
        garantia && garantiaVigente(garantia)
          ? `La garantía de este servicio vence el ${formatearFechaISO(garantia.fin)}. Si lo cierras ahora, ya no podrás programar mantenimientos ni visitas de soporte.`
          : undefined
      const conTabla = propuesta.aplica && !propuesta.yaLiquidada ? propuesta : null
      if (conTabla || advertencia) pendiente = { servicio, propuesta: conTabla, advertencia }
    } catch (error) {
      return mostrarError(error, "No se pudo preparar el cierre del servicio")
    } finally {
      setPreparandoId(null)
    }

    if (pendiente) setCierre(pendiente)
    else await cerrarEnDrive(servicio)
  }

  const confirmarCierre = async (etapas: EtapaPayload[]) => {
    if (!cierre || liquidando) return
    const { servicio, propuesta } = cierre

    // Primero se confirman los costos: un error de números se ve de inmediato y la tabla sigue abierta para corregirlo
    if (propuesta) {
      setLiquidando(true)
      try {
        await liquidarFinal(servicio.visitaId, etapas)
      } catch (error) {
        return mostrarError(error, "No se pudo registrar la liquidación de costos")
      } finally {
        setLiquidando(false)
      }
    }

    setCierre(null)
    await cerrarEnDrive(servicio)
  }

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Historial de Servicios</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl">
          <div className="relative h-10">
            <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={ESTILO_FILTRO}>
              <option value="">Nombre o razón social</option>
              {empresas.map((nombre) => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          <div className="relative h-10">
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={ESTILO_FILTRO}>
              <option value="">Periodo</option>
              {periodos.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          <div className="relative h-10">
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoServicio | "")} className={ESTILO_FILTRO}>
              <option value="">Estado</option>
              <option value="EN CURSO">EN CURSO</option>
              <option value="CERRADO">CERRADO</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>
        {/* Tabla del Historial de Servicios */}
        <div className="my-5">
          <HistorialServicios
            servicios={filtrados}
            visitasProgramadas={visitasProgramadas}
            costos={costos}
            preparandoId={preparandoId}
            cerrandoId={cerrandoId}
            progreso={progreso}
            onCerrarServicio={handleCerrarServicio}
          />
        </div>

        <LiquidacionCostosModal
          isOpen={cierre !== null}
          titulo="Cerrar servicio"
          textoConfirmar={cierre?.propuesta ? "Confirmar costos y cerrar servicio" : "Cerrar servicio"}
          clienteNombre={cierre?.servicio.clienteNombre ?? ""}
          nota="Se reúnen los archivos del servicio en una carpeta de Google Drive y se registra el cierre."
          advertencia={cierre?.advertencia}
          propuesta={cierre?.propuesta ?? null}
          guardando={liquidando}
          onClose={() => setCierre(null)}
          onConfirmar={confirmarCierre}
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
