import { FACTOR_RUBRO, RUBROS, NOMBRE_ACTIVIDAD, pluralizar, unidadesDe, type Actividad, type DetalleActividad, type ResultadoEstimacion, type Valor } from '../services/calculoCostos';
import { formatearMonto } from '../services/solicitudes';

interface Campo {
  campo: string;
  etiqueta: string;
}

const CAMPOS_INSTALACION: Campo[] = [
  { campo: 'nTecnicos', etiqueta: 'Técnicos' },
  { campo: 'dias', etiqueta: 'Días' },
  { campo: 'noches', etiqueta: 'Noches' },
  { campo: 'viajes', etiqueta: 'Viajes' },
];

const CAMPOS_VISITAS: Campo[] = [
  { campo: 'nTecnicos', etiqueta: 'Técnicos' },
  { campo: 'visitas', etiqueta: 'Visitas' },
  { campo: 'diasPorVisita', etiqueta: 'Días/visita' },
  { campo: 'nochesPorVisita', etiqueta: 'Noches/visita' },
];

const AYUDA: Record<Actividad, string> = {
  INSTALACION: 'Técnicos que viajan, días y noches fuera, y viajes (1 si es uno solo). Un viaje adicional es un imprevisto.',
  MANTENIMIENTO: 'Visitas preventivas que se prevén dentro de la garantía; cada visita es un viaje.',
  SOPORTE: 'Es por falla: déjalo en 0 visitas y lo cubre la provisión de imprevistos.',
};

interface ActividadCostosProps {
  etapa: Actividad;
  datos: Record<string, Valor>;
  detalle: DetalleActividad;
  tarifasUsadas: ResultadoEstimacion['tarifasUsadas'];
  onCambiar: (campo: string, valor: Valor) => void;
}

// Una actividad de la hoja de costos: lo que ingresa el trabajador y, debajo, cómo se calcula cada rubro con la tarifa
// que se usó, para que el costo se pueda revisar de un vistazo.
export default function ActividadCostos({ etapa, datos, detalle, tarifasUsadas, onCambiar }: ActividadCostosProps) {
  const campos = etapa === 'INSTALACION' ? CAMPOS_INSTALACION : CAMPOS_VISITAS;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-white">{NOMBRE_ACTIVIDAD[etapa]}</span>
        <span className="text-sm font-bold text-white">{formatearMonto(detalle.subtotal)}</span>
      </div>
      <p className="text-sm text-slate-300">{AYUDA[etapa]}</p>

      <div className="grid grid-cols-4 gap-2">
        {campos.map(({ campo, etiqueta }) => (
          <label key={campo} className="flex flex-col gap-1 text-sm text-slate-300">
            {etiqueta}
            <input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={datos[campo] ?? ''}
              onChange={(e) => onCambiar(campo, e.target.value === '' ? '' : Number(e.target.value))}
              className="h-9 w-full bg-white rounded-full px-2 text-black text-center text-sm outline-none shadow-sm"
            />
          </label>
        ))}
      </div>

      {detalle.activa && (
        <ul className="text-sm text-slate-300 space-y-0.5 pt-1">
          {RUBROS.map((rubro) => {
            const unidades = unidadesDe(rubro.campo, detalle);
            if (unidades === 0) return null;

            const tarifa = tarifasUsadas[rubro.inductor];
            const factor = FACTOR_RUBRO[rubro.campo];
            return (
              <li key={rubro.campo} className="flex justify-between gap-3">
                <span>
                  {`${rubro.etiqueta}: ${pluralizar(detalle.nTecnicos, 'técnico')} × ${pluralizar(factor.cantidad(detalle), factor.unidad)}`}
                  {tarifa ? (
                    <>
                      {' '}× {formatearMonto(tarifa.monto)}
                      <span className="text-slate-400">
                        {' '}({tarifa.heredada || tarifa.destino === 'GENERAL' ? 'tarifa general' : `tarifa de ${tarifa.destino}`})
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-300"> · sin tarifa</span>
                  )}
                </span>
                <span className="text-white">{formatearMonto(detalle[rubro.campo])}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
