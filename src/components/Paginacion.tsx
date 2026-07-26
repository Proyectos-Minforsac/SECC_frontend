interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
}

export default function PaginacionComponente({paginaActual, totalPaginas, onCambiarPagina}: PaginacionProps) {
  
  const obtenerPaginas = (
    paginaActual: number,
    totalPaginas: number
  ): (number | string)[] => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    const paginas: (number | string)[] = [];

    paginas.push(1);

    if (paginaActual > 4) {
      paginas.push("...");
    }

    const inicio = Math.max(2, paginaActual - 2);
    const fin = Math.min(totalPaginas - 1, paginaActual + 2);

    for (let i = inicio; i <= fin; i++) {
      if (i > 1 && i < totalPaginas) {
        paginas.push(i);
      }
    }

    if (paginaActual < totalPaginas - 3) {
      paginas.push("...");
    }

    paginas.push(totalPaginas);

    return paginas;
  }

  const paginas = obtenerPaginas(paginaActual, totalPaginas);
  
  return (
    <>
      <div className="flex justify-center items-center gap-2 mt-8">
        {paginas.map((pagina, index) => {
          const key = pagina === "..." ? `ellipsis-${index}` : `page-${pagina}`;
          return pagina === "..." ? (
            <span
              key={key}
              className="w-9 h-9 flex items-center justify-center"
            >
              ...
            </span>
          ) : (
            <button
              key={key}
              onClick={() => onCambiarPagina(Number(pagina))}
              className={`w-9 h-9 rounded-full transition
                ${
                  paginaActual === pagina
                    ? "bg-[#2A317A] text-white shadow-sm"
                    : "bg-white hover:bg-gray-200 shadow-sm cursor-pointer"
                }`
              }
            >
              {pagina}
            </button>
          );
        })}
      </div>
    </>
  )
}