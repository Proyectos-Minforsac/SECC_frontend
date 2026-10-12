import { useMemo, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import ConformidadDocumento from '../components/ConformidadDocumento';
import { armarDatosConformidad } from '../services/conformidad';
import type { DetalleVisita } from '../services/detalleVisita';
import type { Cliente } from '../services/clientes';

// Pantalla de pruebas para ajustar el diseño del documento de conformidad sin recorrer todo el flujo
// (servicio activo, visita completada, envío por correo). Usa el mismo componente y la misma construcción
// de datos que el PDF real (components/ConformidadDocumento.tsx y services/conformidad.ts): cualquier cambio
// ahí se ve aquí al guardar el archivo. Los datos son ficticios y no se guardan ni se envían.

type Escenario = 'instalacion' | 'mantenimiento' | 'soporte' | 'largo';
type TipoCliente = 'empresa' | 'persona';

const base = {
  clienteNombre: 'Cliente de Ejemplo S.A.C.',
  tecnicoNombre: 'Carlos Ramírez',
  claveConformidad: '1-1',
  reporteEnviado: true,
  requiereConformidad: true,
};

const ESCENARIOS: Record<Escenario, { etiqueta: string; detalle: () => DetalleVisita }> = {
  instalacion: {
    etiqueta: 'Instalación',
    detalle: () => ({
      ...base,
      nombre: 'Visita 1 de instalación',
      etapa: 'Instalación',
      numeroVisita: 1,
      fechas: [{ etiqueta: 'Programada', valor: '09/10/2026 · 09:00 - 13:00' }],
      descripcion: 'Instalación de 2 laptops y 2 monitores en el área administrativa, con configuración de red y correo.',
      notasTecnico: [
        {
          etiqueta: 'Avance',
          valor: 'Se instalaron y configuraron los equipos, se migró la información de los usuarios y se verificó la conexión a la red.',
        },
      ],
      documentos: [
        { nombre: 'instalacion-equipo-1.jpg', url: '', subidoEn: '2026-10-09T10:15:00.000Z' },
        { nombre: 'acta-entrega.pdf', url: '', esImagen: false, subidoEn: '2026-10-09T12:40:00.000Z' },
      ],
    }),
  },
  mantenimiento: {
    etiqueta: 'Mantenimiento preventivo',
    detalle: () => ({
      ...base,
      nombre: 'Visita 2 de mantenimiento preventivo',
      etapa: 'Mantenimiento preventivo',
      numeroVisita: 2,
      fechas: [{ etiqueta: 'Programada', valor: '15/04/2027 · 10:00 - 12:00' }],
      descripcion: 'Limpieza general de equipos, revisión de ventiladores y actualización de antivirus.',
      notasTecnico: [{ etiqueta: 'Avance', valor: 'Se realizó la limpieza interna de 8 equipos y se actualizó el antivirus. Sin novedades.' }],
      documentos: [],
    }),
  },
  soporte: {
    etiqueta: 'Soporte técnico',
    detalle: () => ({
      ...base,
      nombre: 'Visita 1 de soporte técnico',
      etapa: 'Soporte técnico',
      numeroVisita: 1,
      fechas: [{ etiqueta: 'Programada', valor: '03/06/2027 · 15:00 - 16:30' }],
      descripcion: 'El cliente reporta que una impresora dejó de imprimir y un equipo no enciende.',
      notasTecnico: [{ etiqueta: 'Avance', valor: 'Se reemplazó la fuente de poder del equipo y se reinstaló el controlador de la impresora.' }],
      documentos: [{ nombre: 'fuente-reemplazada.jpg', url: '', subidoEn: '2026-06-03T15:45:00.000Z' }],
    }),
  },
  largo: {
    etiqueta: 'Texto largo (varias páginas)',
    detalle: () => ({
      ...base,
      nombre: 'Visita 3 de instalación',
      etapa: 'Instalación',
      numeroVisita: 3,
      fechas: [{ etiqueta: 'Programada', valor: '20/10/2026 · 08:00 - 18:00' }],
      descripcion: Array.from({ length: 6 }, (_, i) => `Actividad ${i + 1}: cableado estructurado, configuración de switches y pruebas de conectividad en el piso ${i + 1}.`).join('\n'),
      notasTecnico: Array.from({ length: 8 }, (_, i) => ({
        etiqueta: `Avance ${i + 1}`,
        valor: 'Se completó el trabajo previsto, se probaron los puntos de red y se dejó constancia fotográfica. '.repeat(3),
      })),
      documentos: Array.from({ length: 12 }, (_, i) => ({
        nombre: `evidencia-${i + 1}.jpg`,
        url: '',
        subidoEn: `2026-10-20T${String(9 + (i % 9)).padStart(2, '0')}:00:00.000Z`,
      })),
    }),
  },
};

const CLIENTES: Record<TipoCliente, Cliente> = {
  empresa: {
    clienteId: 1,
    nombre: 'Cliente de Ejemplo S.A.C.',
    direccion: 'Av. Los Olivos 123, Lima',
    ruc: '20123456789',
    correoElectronico: 'cliente@ejemplo.com',
    tipoPersona: 'Cliente',
  },
  persona: {
    clienteId: 2,
    nombre: 'María Torres Quispe',
    direccion: 'Jr. Las Flores 456, San Juan de Lurigancho',
    ruc: '10456789012',
    correoElectronico: 'maria@ejemplo.com',
    tipoPersona: 'Cliente',
  },
};

export default function ConformidadPDFPruebaScreen() {
  const [escenario, setEscenario] = useState<Escenario>('instalacion');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('empresa');

  const datos = useMemo(() => {
    const cliente = CLIENTES[tipoCliente];
    const detalle = { ...ESCENARIOS[escenario].detalle(), clienteNombre: cliente.nombre };
    return armarDatosConformidad(detalle, cliente, detalle.numeroVisita);
  }, [escenario, tipoCliente]);

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased text-white select-none">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight">Vista previa del documento de conformidad</h1>
          <p className="text-black text-sm mt-1">
            Datos de ejemplo para ajustar el diseño. Edita <b>src/components/ConformidadDocumento.tsx</b> (diseño) o{' '}
            <b>src/services/conformidad.ts</b> (preguntas y datos) y la vista se actualiza al guardar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
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
            value={tipoCliente}
            onChange={(e) => setTipoCliente(e.target.value as TipoCliente)}
            className="h-10 bg-white rounded-full px-4 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
          >
            <option value="empresa">Cliente empresa (RUC 20…)</option>
            <option value="persona">Cliente persona natural (RUC 10…)</option>
          </select>
        </div>

        <PDFViewer style={{ width: '100%', height: '75vh' }}>
          <ConformidadDocumento datos={datos} />
        </PDFViewer>
      </main>
    </div>
  );
}
