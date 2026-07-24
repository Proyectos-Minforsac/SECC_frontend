import { X, MoreHorizontal, Pencil } from 'lucide-react';

export default function CardItem({id_item, nombre, tipo, cantidad, total, onDelete}:{id_item:number, nombre:string, tipo:string, cantidad:GLfloat, total:GLfloat, onDelete: (id:number) => void}) {
     return(
          <>
               <div key={id_item} className="bg-white rounded-xl p-3 flex items-center justify-between text-black shadow-sm">
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
                    <span className="text-[10px] text-gray-400 font-medium">Total:</span>
                    <span className="text-xs font-bold leading-none">{total.toFixed(2)}</span>
                    </div>
                    
                    {/* Acciones de fila */}
                    <div className="flex items-center gap-2 text-gray-700 ml-2">
                    <button className="hover:text-black">
                         <Pencil className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <button
                    onClick={() => onDelete(id_item)}
                    className="hover:text-red-600">
                         <X className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    </div>
               </div>
               </div>
          </>
     )
}