import SideBarComponent from "../components/SideBar"

export default function ServiciosScreen() {
     return (
          <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased text-white select-none">

               {/* 1. SIDEBAR (Menú Lateral) */}
               <SideBarComponent />

               {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
               <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">

                    {/* Cabecera: Título */}
                    <div className="flex items-center justify-between mb-8">
                         <h1 className="text-4xl font-bold text-black tracking-tight">Servicios</h1>
                    </div>


               </main>
          </div>
     )
}