interface TecnicoProps {
  nombre: string,
  // tipo_documento: string,
  numero_documento: string,
  telefono: string,
  ubicacion: string,
  servicio: string,
  area: string,
  calificacion: string,
  on_edit: () => void,
  on_delete: () => void,
}

export default function TecnicoCard({ nombre, numero_documento, telefono, ubicacion, servicio, area, calificacion, on_edit , on_delete }: TecnicoProps) {
  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col">
        <div className="bg-[#222861] p-4 flex justify-end gap-2">
          <button
            onClick={on_edit}
            className="bg-[#E2E4E9] text-gray-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition-colors cursor-pointer">
            Editar
          </button>

          <button
            onClick={on_delete}
            className="bg-[#E2E4E9] text-gray-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition-colors cursor-pointer">
            Eliminar
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 flex flex-col gap-2 text-black">
          <h2 className="text-xl font-bold">{nombre}</h2>

          <p>
            <span className="font-semibold">Núm. Documento:</span>{" "}
            {numero_documento}
          </p>

          <p>
            <span className="font-semibold">Teléfono:</span>{" "}
            {telefono}
          </p>

          <p>
            <span className="font-semibold">Ubicación:</span>{" "}
            {ubicacion}
          </p>

          <p>
            <span className="font-semibold">Servicio:</span>{" "}
            {servicio}
          </p>

          <p>
            <span className="font-semibold">Área:</span>{" "}
            {area}
          </p>

          <p>
            <span className="font-semibold">Calificación:</span>{" "}
            {calificacion}
          </p>

          <button className="mt-4 w-full bg-[#343C8F] text-white py-3 rounded-xl hover:bg-[#222861] transition-all cursor-pointer">
            Agregar solicitud
          </button>
        </div>

      </div>
    </>
  )
}