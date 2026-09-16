import { useState } from "react";
import SideBarComponent from "../components/SideBar";
import AgregarEditarModal from "../components/Modal";
import { ChevronDown } from "lucide-react";

export default function VisitasTecnicasScreen() {
  
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cerrarModal = () => {
    setIsModalOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased select-none">

      {/* 1. SIDEBAR (Menú Lateral) */}
      <SideBarComponent />

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Cabecera: Título */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Visitas Técnicas</h1>
          <button
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
            Agregar
          </button>
        </div>

        <AgregarEditarModal
          isOpen={isModalOpen}
          onClose={cerrarModal}
          title={'Editar técnico'}
        >
          <form
          >
            <div className="my-3">
              <input
                type="text"
                placeholder="Nombre o razón social"
                maxLength={256}
                className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
              />
            </div>

            <div className="flex gap-3 my-3">
              {/* Contenedor 1: select con icono */}
              <div className="relative flex-1 mt-3">
                <select
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
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
                />
              </div>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="Ubicación"
                maxLength={256}
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
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
                />
              </div>
              <div className="flex-1 relative mt-3">
                <select
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
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm mt-3"
                />
              </div>

              <div className="flex-1 relative mt-3">
                <select
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
              </button>
            </div>
          </form>
        </ AgregarEditarModal>
      </main>
    </div>
  );
}