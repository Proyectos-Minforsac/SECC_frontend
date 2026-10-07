import { ESTILO_ESTADO_OFERTA, formatearMonto, type OfertaVisita } from '../services/solicitudes';

interface OfertaFilaProps {
  oferta: OfertaVisita;
  puedeDecidir: boolean;
  onAceptar: () => void;
  onRechazar: () => void;
}

export default function OfertaFila({ oferta, puedeDecidir, onAceptar, onRechazar }: OfertaFilaProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 shadow-sm px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 whitespace-nowrap">
          {oferta.tecnicoNombre}
          {oferta.tecnicoUbicacion && (
            <span className="font-normal text-slate-500"> · {oferta.tecnicoUbicacion}</span>
          )}
        </p>
        <p className="font-medium text-slate-700">{formatearMonto(oferta.montoVisita)}</p>
        {oferta.archivoUrl ? (
          <a
            href={oferta.archivoUrl}
            download={oferta.archivoNombre}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-xs"
          >
            {oferta.archivoNombre || 'Ver cotización'}
          </a>
        ) : (
          <span className="text-slate-400 italic text-xs">Sin archivo</span>
        )}
      </div>

      {oferta.estado === 'PENDIENTE' && puedeDecidir ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAceptar}
            className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Aceptar
          </button>
          <button
            onClick={onRechazar}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Rechazar
          </button>
        </div>
      ) : (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border shrink-0 ${ESTILO_ESTADO_OFERTA[oferta.estado]}`}
        >
          {oferta.estado}
        </span>
      )}
    </div>
  );
}
