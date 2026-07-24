interface ClienteModalsProps {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: React.ReactNode,
}

function ClienteAgregarEditarModal({isOpen, onClose, title, children}: ClienteModalsProps) {
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md p-6 bg-[#222861] rounded-xl shadow-xl">
          <button onClick={onClose} className="absolute top-4 right-4">X</button>
          {title && <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>}
          {children}
        </div>
      </div>
    </>
  );
}

function ClienteEliminarModal(){
  return(
    <>
      <div>

      </div>
    </>
  )
}

export default ClienteAgregarEditarModal; ClienteEliminarModal;