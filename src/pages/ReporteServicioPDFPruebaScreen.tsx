import { useMemo, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import ReporteServicioDocumento from '../components/ReporteServicioDocumento';
import type { DatosReporteServicio, SeccionReporte } from '../services/cierreServicio';

// Pantalla de pruebas para ajustar el diseño del reporte del servicio sin cerrar un servicio de verdad (liquidar costos,
// subir archivos a Drive). Usa el mismo componente que el PDF real (components/ReporteServicioDocumento.tsx) y la misma
// forma de datos que arma services/cierreServicio.ts: cualquier cambio ahí se ve aquí al guardar el archivo. Los datos son
// ficticios y no se guardan ni se suben.

type Escenario = 'completo' | 'sinRegistros' | 'largo';

const cabecera = {
  numeroServicio: 12,
  clienteNombre: 'Cliente de Ejemplo S.A.C.',
  tecnicoNombre: 'Carlos Ramírez',
  fechaCierre: '20/11/2026',
};

const diagnostico: SeccionReporte = {
  titulo: 'Diagnóstico inicial · Visita de diagnóstico',
  filas: [
    { etiqueta: 'Fecha', valor: '02/10/2026 · 09:30' },
    { etiqueta: 'Descripción', valor: 'El cliente necesita renovar la red de su oficina y reubicar 6 puntos de red.' },
    { etiqueta: 'Componentes', valor: 'Switch de 24 puertos; Cable UTP Cat 6; Patch panel' },
  ],
  documentos: ['Diagnóstico - sitio-1.jpg', 'Diagnóstico - sitio-2.jpg'],
};

const instalacion: SeccionReporte = {
  titulo: 'Instalación · Visita 1 de instalación',
  filas: [
    { etiqueta: 'Programada', valor: '09/10/2026 · 09:00 - 13:00' },
    { etiqueta: 'Descripción', valor: 'Instalación del switch y tendido de cableado estructurado en el área administrativa.' },
    { etiqueta: 'Avance', valor: 'Se instalaron y probaron los 6 puntos de red; se etiquetó el patch panel.' },
    { etiqueta: 'Conformidad del cliente', valor: 'Enviada el 09/10/2026 12:50 a cliente@ejemplo.com' },
  ],
  documentos: ['instalacion-equipo-1.jpg', 'acta-entrega.pdf'],
};

const mantenimiento: SeccionReporte = {
  titulo: 'Mantenimiento preventivo · Visita 1 de mantenimiento preventivo',
  filas: [
    { etiqueta: 'Programada', valor: '15/04/2027 · 10:00 - 12:00' },
    { etiqueta: 'Descripción', valor: 'Revisión del cableado, limpieza del rack y actualización del firmware del switch.' },
    { etiqueta: 'Avance', valor: 'Sin novedades. Se actualizó el firmware a la última versión estable.' },
    { etiqueta: 'Conformidad del cliente', valor: 'No se envió desde el sistema' },
  ],
  documentos: [],
};

const soporte: SeccionReporte = {
  titulo: 'Soporte técnico · Visita 1 de soporte técnico',
  filas: [
    { etiqueta: 'Programada', valor: '03/06/2027 · 15:00 - 16:30' },
    { etiqueta: 'Descripción', valor: 'El cliente reporta que dos puntos de red dejaron de responder.' },
    { etiqueta: 'Avance', valor: 'Se reemplazaron dos conectores dañados y se verificó la conectividad.' },
  ],
  documentos: ['conector-reemplazado.jpg'],
};

const cotizaciones: SeccionReporte = {
  titulo: 'Cotizaciones',
  filas: [
    { etiqueta: 'COT-2026-0007', valor: 'ACEPTADA · S/ 5,310.00' },
    { etiqueta: 'COT-2026-0011', valor: 'RECHAZADA · S/ 1,180.00' },
  ],
  documentos: [],
};

const ESCENARIOS: Record<Escenario, { etiqueta: string; datos: () => DatosReporteServicio }> = {
  completo: {
    etiqueta: 'Servicio completo',
    datos: () => ({ ...cabecera, secciones: [diagnostico, instalacion, mantenimiento, soporte, cotizaciones] }),
  },
  sinRegistros: {
    etiqueta: 'Sin visitas ni cotizaciones',
    datos: () => ({
      ...cabecera,
      secciones: [{ ...diagnostico, documentos: [] }, { titulo: 'Cotizaciones', filas: [], documentos: [] }],
    }),
  },
  largo: {
    etiqueta: 'Texto largo (varias páginas)',
    datos: () => ({
      ...cabecera,
      secciones: [
        diagnostico,
        ...Array.from({ length: 9 }, (_, i) => ({
          titulo: `Instalación · Visita ${i + 1} de instalación`,
          filas: [
            { etiqueta: 'Programada', valor: `${String(i + 1).padStart(2, '0')}/10/2026 · 08:00 - 18:00` },
            { etiqueta: 'Descripción', valor: 'Cableado estructurado, configuración de switches y pruebas de conectividad. '.repeat(3) },
            { etiqueta: 'Avance', valor: 'Se completó el trabajo previsto, se probaron los puntos de red y se dejó constancia fotográfica. '.repeat(3) },
          ],
          documentos: Array.from({ length: 10 }, (_, j) => `Visita ${i + 1} - evidencia-${j + 1}.jpg`),
        })),
        cotizaciones,
      ],
    }),
  },
};

export default function ReporteServicioPDFPruebaScreen() {
  const [escenario, setEscenario] = useState<Escenario>('completo');
  const datos = useMemo(() => ESCENARIOS[escenario].datos(), [escenario]);

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased text-white select-none">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight">Vista previa del reporte del servicio</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
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

        <PDFViewer style={{ width: '100%', height: '75vh' }}>
          <ReporteServicioDocumento datos={datos} />
        </PDFViewer>
      </main>
    </div>
  );
}
