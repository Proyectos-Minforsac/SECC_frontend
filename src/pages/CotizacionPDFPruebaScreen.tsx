import { useMemo, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import CotizacionDocument from '../components/CotizacionReporte';
import type { CotizacionData, CotizacionItem } from '../services/cotizaciones';

// Pantalla de pruebas para ajustar el diseño del PDF sin recorrer todo el flujo de cotización.
// Usa el mismo componente que el PDF real (components/CotizacionReporte.tsx): cualquier cambio
// de estilo ahí se ve aquí al guardar el archivo. Los datos son ficticios y no se guardan.

let idSeq = 0;
const item = (
  tipo: string,
  nombre: string,
  descripcion: string,
  cantidad: number,
  precio: number,
  extra: Partial<CotizacionItem> = {}
): CotizacionItem => ({
  id: ++idSeq,
  tipo,
  nombre,
  descripcion,
  cantidad,
  precio,
  total: tipo === 'Título' ? 0 : Number((cantidad * precio).toFixed(2)),
  ...extra,
});

const titulo = (nombre: string) => item('Título', nombre, '', 0, 0);

const impresora = item(
  'Impresora',
  'Mantenimiento preventivo de impresora',
  'Limpieza general, cambio de rodillos y calibración.',
  1,
  180,
  {
    detalleImpresora: {
      fecha: '2026-10-09',
      tienda: 'Tienda San Juan de Lurigancho',
      cargo: 'Jefe de sistemas',
      marca: 'HP',
      modelo: 'LaserJet Pro M404dn',
      numeroSerie: 'PHBNN12345',
      casoHD: 'HD-004521',
    },
  }
);

type Escenario = 'basico' | 'impresora' | 'largo';

const ESCENARIOS: Record<Escenario, { etiqueta: string; items: () => CotizacionItem[] }> = {
  basico: {
    etiqueta: 'Básico',
    items: () => [
      titulo('Equipos de cómputo'),
      item('Producto', 'Laptop Lenovo ThinkPad E14', 'Intel Core i5, 16 GB RAM, SSD 512 GB.', 2, 3200),
      item('Producto', 'Monitor 24"', 'Full HD, HDMI y VGA.', 2, 480),
      titulo('Servicios'),
      item('Servicio', 'Instalación y configuración', 'Incluye traslado de información.', 1, 250),
    ],
  },
  impresora: {
    etiqueta: 'Con impresora',
    items: () => [
      titulo('Mantenimiento'),
      impresora,
      item('Servicio', 'Visita técnica', 'Diagnóstico en sitio.', 1, 120),
    ],
  },
  largo: {
    etiqueta: 'Muchos ítems (varias páginas)',
    items: () =>
      Array.from({ length: 30 }, (_, i) =>
        item('Producto', `Producto de ejemplo ${i + 1}`, 'Descripción de ejemplo del producto cotizado.', i + 1, 45.5)
      ),
  },
};

const armarData = (items: CotizacionItem[], moneda: string): CotizacionData => {
  const subtotal = Number(items.reduce((acc, i) => acc + i.total, 0).toFixed(2));
  const igv = Number((subtotal * 0.18).toFixed(2));
  return {
    cliente: 'Cliente de Ejemplo S.A.C.',
    ruc: '20123456789',
    direccion: 'Av. Los Olivos 123, Lima',
    correo: 'cliente@ejemplo.com',
    fecha: new Date().toISOString().split('T')[0],
    solicitante: 'Juan Pérez',
    moneda,
    numeroCotizacion: 'COT-2026-0001',
    subtotal,
    igv,
    total: Number((subtotal + igv).toFixed(2)),
    items,
  };
};

export default function CotizacionPDFPruebaScreen() {
  const [escenario, setEscenario] = useState<Escenario>('basico');
  const [moneda, setMoneda] = useState('SOLES');

  const data = useMemo(() => armarData(ESCENARIOS[escenario].items(), moneda), [escenario, moneda]);

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased text-white select-none">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight">Vista previa del PDF de cotización</h1>
          <p className="text-black text-sm mt-1">
            Datos de ejemplo para ajustar el diseño. Edita <b>src/components/CotizacionReporte.tsx</b> y la vista se
            actualiza al guardar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-2">
            {(Object.keys(ESCENARIOS) as Escenario[]).map((clave) => (
              <button
                key={clave}
                type="button"
                onClick={() => setEscenario(clave)}
                className={`px-5 py-2 rounded-full text-sm font-medium shadow-sm cursor-pointer transition-all ${
                  escenario === clave ? 'bg-[#2A317A] text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {ESCENARIOS[clave].etiqueta}
              </button>
            ))}
          </div>

          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="h-10 bg-white rounded-full px-4 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
          >
            <option value="SOLES">SOLES</option>
            <option value="DÓLARES">DÓLARES</option>
          </select>
        </div>

        <PDFViewer style={{ width: '100%', height: '75vh' }}>
          <CotizacionDocument data={data} />
        </PDFViewer>
      </main>
    </div>
  );
}
