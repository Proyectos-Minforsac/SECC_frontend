import { X, Pencil } from 'lucide-react';

export default function CardItem({ id_item, nombre, tipo, cantidad, total, enEdicion = false, onEdit, onDelete }: { id_item: number, nombre: string, tipo: string, cantidad: GLfloat, total: GLfloat, enEdicion?: boolean, onEdit: (id: number) => void, onDelete: (id: number) => void }) {
  return (
    <>
      <div key={id_item} className={`bg-white rounded-xl p-3 flex items-center justify-between text-black shadow-sm ${enEdicion ? 'ring-2 ring-[#4F46E5]' : ''}`}>
        {/* Letra identificadora/Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#DCE4F3] flex items-center justify-center font-bold text-gray-700 rounded-sm">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">{nombre}</span>
            <span className="text-[11px] text-gray-500">{tipo}</span>
          </div>
        </div>

        {/* Datos de Cantidad y Subtotal */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-gray-400 font-medium">Cantidad:</span>
            <span className="text-xs font-bold leading-none">{cantidad}</span>
          </div>
          <div className="flex flex-col items-start min-w-[50px]">
            <span className="text-[10px] text-gray-400 font-medium">Subtotal:</span>
            <span className="text-xs font-bold leading-none">{total.toFixed(2)}</span>
          </div>

          {/* Acciones de fila */}
          <div className="flex items-center gap-2 text-gray-700 ml-2">
            <button
              type="button"
              onClick={() => onEdit(id_item)}
              aria-label="Editar ítem"
              className="hover:text-black cursor-pointer">
              <Pencil className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(id_item)}
              aria-label="Eliminar ítem"
              className="hover:text-red-600 cursor-pointer">
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}