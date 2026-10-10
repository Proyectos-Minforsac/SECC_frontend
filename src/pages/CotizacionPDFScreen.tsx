import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import CotizacionDocument from "../components/CotizacionReporte";
import type { CotizacionData } from "../services/cotizaciones";
import { ArrowLeft, Download, Mail } from "lucide-react";

export default function CotizacionPdfScreen() {
     const { state } = useLocation();
     const navigate = useNavigate();
     const data = state?.data as CotizacionData | undefined;

     // NuevaCotizacionScreen avisa con este indicador que la cotización se acaba de guardar
     const [toast, setToast] = useState({ show: Boolean(state?.cotizacionCreada) });

     const regresarCotizacionesScreen = () =>{
          navigate('/cotizaciones');
     }

     if (!data) {
          return (
               <div className="flex flex-1 items-center justify-center bg-[#DCE4F3] font-sans antialiased">
                    <div className="text-center">
                         <p className="text-black mb-4">No hay una cotización para mostrar.</p>
                         <button
                         type="button"
                         onClick={regresarCotizacionesScreen}
                         className="px-6 py-2.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-md cursor-pointer"
                         >
                         Regresar a Cotizaciones
                         </button>
                    </div>
               </div>
          );
     }

     const nombreArchivo = `Cotizacion-${data.numeroCotizacion ?? 'documento'}.pdf`;
     const asuntoCorreo = encodeURIComponent(`Cotización N° ${data.numeroCotizacion ?? ''} - Multiservicios Informáticos S.A.C`);
     const mailtoHref = `mailto:${data.correo ?? ''}?subject=${asuntoCorreo}`;

     return (
          <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased text-white select-none">

               {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
               <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">

                    <div className="flex flex-col items-start justify-between mb-8">
                         <h1 className="text-4xl font-bold text-black tracking-tight">Cotización creada exitosamente</h1>
                         <h2 className="text-2xl font-bold text-black tracking-tight">N° {data.numeroCotizacion ?? '—'}</h2>
                    </div>

                    <PDFViewer style={{ width: "100%", height: "70vh" }}>
                         <CotizacionDocument data={data} />
                    </PDFViewer>

                    <div className="pt-4 flex flex-col gap-3">
                         <p className="text-black text-sm">
                              Descarga el PDF y envíalo al cliente por tu correo{data.correo ? ` (${data.correo})` : ''}, con el mensaje que consideres conveniente.
                         </p>

                         <div className="flex flex-wrap justify-end items-center gap-3">
                              <PDFDownloadLink document={<CotizacionDocument data={data} />} fileName={nombreArchivo}>
                                   {({ loading }) => (
                                        <span className="flex items-center gap-2 px-6 py-2.5 bg-[#22C55E] text-black text-sm font-medium rounded-full hover:bg-[#16A34A] active:scale-95 transition-all shadow-md cursor-pointer">
                                             <Download className="w-4 h-4" />
                                             {loading ? 'Generando PDF…' : 'Descargar PDF'}
                                        </span>
                                   )}
                              </PDFDownloadLink>

                              <a
                              href={mailtoHref}
                              className={`flex items-center gap-2 px-6 py-2.5 text-white text-sm font-medium rounded-full transition-all shadow-md border border-white ${data.correo ? 'bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 cursor-pointer' : 'bg-gray-400 pointer-events-none opacity-60'}`}
                              >
                              <Mail className="w-4 h-4" />
                                   Enviar por correo
                              </a>

                              <button
                              type="button"
                              onClick={regresarCotizacionesScreen}
                              className="flex items-center gap-2 px-6 py-2.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] active:scale-95 transition-all shadow-md border border-white cursor-pointer"
                              >
                              <ArrowLeft className="w-4 h-4" />
                                   Regresar a Cotizaciones
                              </button>
                         </div>
                    </div>

                    <Toast
                         show={toast.show}
                         type="success"
                         message={`Cotización ${data.numeroCotizacion ?? ''} guardada correctamente`}
                         onClose={() => setToast({ show: false })}
                    />
               </main>
          </div>
     );
}