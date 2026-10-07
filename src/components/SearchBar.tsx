interface SearchBarProps {
  onBuscar: (texto: string) => void;
  className?: string;
}

export default function SearchBar({ onBuscar, className = "mb-10" }: SearchBarProps) {
  const manejarBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBuscar(e.target.value);
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 max-w-4xl ${className}`}>
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Buscar por nombre o razón social"
          onChange={manejarBusqueda}
          className="w-full bg-white px-5 py-3 rounded-2xl text-gray-800 placeholder-gray-500 shadow-sm outline-none focus:ring-2 focus:ring-[#222861]/30 transition-all text-sm"
        />
      </div>
    </div>
  )
}