import { X } from "lucide-react"

interface ModalsProps {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: React.ReactNode,
}

function AgregarEditarModal({isOpen, onClose, title, children}: ModalsProps) {
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-100 max-w-md p-6 bg-[#222861] rounded-xl shadow-xl">
          <button onClick={onClose} className="absolute top-4 right-4 cursor-pointer">
            <X className="w-5 h-5 stroke-[2.5] text-white" />
          </button>
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {children}
        </div>
      </div>
    </>
  );
}

function EliminarModal(){
  return(
    <>
      <div>

      </div>
    </>
  )
}

export default AgregarEditarModal; EliminarModal;