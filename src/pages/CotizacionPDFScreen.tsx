import { useLocation } from "react-router-dom";
import { PDFViewer } from "@react-pdf/renderer";
import CotizacionDocument from "../components/CotizacionReporte";
import SideBarComponent from "../components/SideBar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CotizacionPdfScreen() {
     const { state } = useLocation();
     const navigate = useNavigate();

     const regresarCotizacionesScreen = () =>{
          navigate('/cotizaciones');
     }

     return (
          <>
          <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased text-white select-none">

               {/* 1. SIDEBAR (Menú Lateral) */}
               <SideBarComponent />

               {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
               <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">
                    
                    <div className="flex flex-col items-start justify-between mb-8">
                         <h1 className="text-4xl font-bold text-black tracking-tight">Cotización creada exitosamente</h1>
                         <h2 className="text-2xl font-bold text-black tracking-tight">N° 5010</h2>
                    </div>
                    
                    <PDFViewer style={{ width: "100%", height: "70vh" }}>
                         <CotizacionDocument data={state.data} />
                    </PDFViewer>

                    <div className="pt-2 flex justify-end">
                         <button
                         type="button"
                         onClick={regresarCotizacionesScreen}
                         className="flex items-center gap-2 px-6 py-2.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] active:scale-95 transition-all shadow-md border border-white"
                         >
                         <ArrowLeft className="w-4 h-4" />
                              Regresar a Cotizaciones
                         </button>
                    </div>
               </main>
          </div>

          
          </>
          
          
          
          
     );
}