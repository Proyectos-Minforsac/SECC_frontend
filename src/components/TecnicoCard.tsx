import type { PrecioAire } from "../services/tecnicos"

interface TecnicoProps {
  nombre: string,
  numero_documento: string,
  telefono: string,
  ubicacion: string,
  servicio: string,
  area: string,
  calificacion: string,
  precios: PrecioAire[],
  on_edit: () => void,
  on_delete: () => void,
}

function TablaAireCondicionado({ precios }: { precios: PrecioAire[] }) {
  return (
    <>
      <p className="font-semibold">
        Precios por capacidad:
      </p>
      
      {precios.length === 0 ? (
        <p className="italic text-gray-500">
          No disponible
        </p>
      ) : (
        <div className="overflow-x-auto mt-2 flex justify-center">
        <table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm text-sm">
          <thead className="bg-[#343C8F] text-white">
            <tr>
              {precios.map((precio) => (
                <th key={precio.precio_aire_id} className="px-4 py-3 text-center font-semibold border-r border-[#4B54B2] last:border-r-0">
                  {precio.tipo_aire}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr className="hover:bg-gray-50">
              {precios.map((precio) => (
                <td key={precio.precio_aire_id} className="px-4 py-3 text-center border-t border-r border-gray-200 last:border-r-0 font-medium text-gray-700">
                  S/ {precio.precio}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      )}
      
      
    </>
  )
}

export default function TecnicoCard({ nombre, numero_documento, telefono, ubicacion, servicio, area, calificacion, precios, on_edit, on_delete }: TecnicoProps) {
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

          {servicio === 'Aire Condicionado' ? (
            <TablaAireCondicionado precios={precios} />
          ) : null}

          <button className="mt-2 w-full bg-[#343C8F] text-white py-3 rounded-xl hover:bg-[#222861] transition-all cursor-pointer">
            Agregar solicitud
          </button>
        </div>

      </div>
    </>
  )
}