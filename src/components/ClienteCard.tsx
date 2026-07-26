interface ClienteProps {
  nombre: string,
  direccion: string,
  ruc: string,
  correo_electronico: string,
  tipo_persona: string
}

export default function ClienteCard({ nombre, direccion, ruc, correo_electronico, tipo_persona }: ClienteProps) {
  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col">
        <div className="bg-[#222861] p-4 flex justify-end gap-2">
          <button className="bg-[#E2E4E9] text-gray-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition-colors cursor-pointer">
            Editar
          </button>

          <button className="bg-[#E2E4E9] text-gray-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition-colors cursor-pointer">
            Eliminar
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 flex flex-col gap-2 text-black">
          <h2 className="text-xl font-bold">{nombre}</h2>

          <p>
            <span className="font-semibold">Correo:</span>{" "}
            {correo_electronico}
          </p>

          <p>
            <span className="font-semibold">Dirección:</span>{" "}
            {direccion}
          </p>

          <p>
            <span className="font-semibold">R.U.C:</span>{" "}
            {ruc}
          </p>

          <p>
            <span className="font-semibold">Tipo Persona:</span>{" "}
            {tipo_persona}
          </p>

          <button className="mt-4 w-full bg-[#343C8F] text-white py-3 rounded-xl hover:bg-[#222861] transition-all cursor-pointer">
            Agregar solicitud
          </button>
        </div>

      </div>
    </>
  )
}