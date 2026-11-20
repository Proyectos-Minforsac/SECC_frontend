import { useState } from 'react';
import { CheckCircle2, Download, Eye, FileText, X } from 'lucide-react';
import DocumentoVisorModal from './DocumentoVisorModal';
import Toast from './Toast';
import { useConformidades } from '../hooks/useConformidades';
import {
  armarDatosConformidad,
  descargarConformidad,
  nombreArchivoConformidad,
  registrarConformidadGenerada,
} from '../services/conformidad';
import type { Cliente } from '../services/clientes';
import { formatearFechaHora, tipoEvidencia, type EvidenciaVisita } from '../services/visitas';
import type { DetalleVisita } from '../services/detalleVisita';

interface DetalleVisitaPanelProps {
  detalle: DetalleVisita;
  // Cliente del servicio; sus datos van en el documento de conformidad.
  cliente: Cliente | null;
  onCerrar: () => void;
}

// Panel con los datos de una visita y los documentos que el técnico subió para ella.
export default function DetalleVisitaPanel({ detalle, cliente, onCerrar }: DetalleVisitaPanelProps) {
  const [documentoAbierto, setDocumentoAbierto] = useState<EvidenciaVisita | null>(null);
  const [generando, setGenerando] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });
  const conformidadesGeneradas = useConformidades();
  const conformidadGenerada = conformidadesGeneradas.get(detalle.claveConformidad);

  const puedeGenerar = detalle.reporteEnviado && cliente !== null && !generando;

  // Genera el PDF y lo descarga; el envío al cliente se hace fuera del sistema.
  const handleGenerarConformidad = async () => {
    if (!cliente || !puedeGenerar) return;
    setGenerando(true);
    try {
      const datos = armarDatosConformidad(detalle, cliente, detalle.numeroVisita);
      const { generarPdfConformidad } = await import('./generarConformidadPdf');
      const archivo = await generarPdfConformidad(datos);
      const nombreArchivo = nombreArchivoConformidad(datos);
      descargarConformidad(archivo, nombreArchivo);
      registrarConformidadGenerada(detalle.claveConformidad, { nombreArchivo, pdf: archivo });
      setToast({ show: true, type: 'success', message: 'Documento de conformidad generado y descargado' });
    } catch (error) {
      setToast({
        show: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo generar el documento de conformidad',
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <aside className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">{detalle.etapa}</p>
          <h2 className="text-xl font-bold text-slate-800">{detalle.nombre}</h2>
          <p className="text-sm text-slate-500">
            {detalle.clienteNombre} · Técnico: {detalle.tecnicoNombre}
          </p>
        </div>
        <button onClick={onCerrar} aria-label="Cerrar detalle" className="text-slate-400 hover:text-black cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        {detalle.fechas.map(({ etiqueta, valor }) => (
          <div key={etiqueta}>
            <dt className="font-medium text-slate-700">{etiqueta}</dt>
            <dd className="text-slate-600">{valor}</dd>
          </div>
        ))}
        <div>
          <dt className="font-medium text-slate-700">Descripción</dt>
          <dd className="text-slate-600">{detalle.descripcion}</dd>
        </div>
        {detalle.notasTecnico.map(({ etiqueta, valor }) => (
          <div key={etiqueta}>
            <dt className="font-medium text-slate-700">{etiqueta}</dt>
            <dd className="text-slate-600">{valor}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="font-medium text-slate-700 text-sm mb-2">Documentos enviados por el técnico</h3>
        {detalle.documentos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {detalle.documentos.map((documento) => {
              const esImagen = tipoEvidencia(documento) === 'imagen';
              const visualizable = tipoEvidencia(documento) !== 'otro';

              return (
                <li key={documento.url} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                  {esImagen ? (
                    <img src={documento.url} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                  ) : (
                    <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-slate-500 shrink-0">
                      <FileText size={18} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{documento.nombre}</p>
                    <p className="text-sm text-slate-500">{formatearFechaHora(documento.subidoEn)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {visualizable && (
                      <button
                        onClick={() => setDocumentoAbierto(documento)}
                        aria-label={`Ver ${documento.nombre}`}
                        title="Ver"
                        className="p-1.5 rounded-full text-slate-600 hover:bg-blue-100 cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <a
                      href={documento.url}
                      download={documento.nombre}
                      aria-label={`Descargar ${documento.nombre}`}
                      title="Descargar"
                      className="p-1.5 rounded-full text-slate-600 hover:bg-blue-100"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">El técnico aún no ha subido documentos para esta visita.</p>
        )}
      </div>

      {detalle.requiereConformidad && (
      <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
        <h3 className="font-medium text-slate-700 text-sm">Conformidad del cliente</h3>
        <button
          onClick={handleGenerarConformidad}
          disabled={!puedeGenerar}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {generando ? 'Generando…' : conformidadGenerada ? 'Volver a descargar la conformidad' : 'Generar documento de conformidad'}
        </button>
        {!detalle.reporteEnviado && (
          <p className="text-sm text-slate-500">Se habilita cuando el técnico envíe el reporte de esta visita.</p>
        )}
        {detalle.reporteEnviado && !conformidadGenerada && (
          <p className="text-sm text-slate-500">
            Se descarga el PDF para que lo envíes al cliente{cliente?.correoElectronico ? ` (${cliente.correoElectronico})` : ''} por tu correo.
          </p>
        )}
        {conformidadGenerada && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 size={14} />
            Generada el {conformidadGenerada.generadaEn}
          </p>
        )}
      </div>
      )}

      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      <DocumentoVisorModal documento={documentoAbierto} onClose={() => setDocumentoAbierto(null)} />
    </aside>
  );
}
