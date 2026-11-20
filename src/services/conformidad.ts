import type { Cliente } from './clientes';
import type { DetalleVisita } from './detalleVisita';

export interface PreguntaConformidad {
  pregunta: string;
  // Cada pregunta se responde marcando una de estas opciones.
  opciones: string[];
}

// Datos que viajan al PDF: lo que se hizo en la visita y las preguntas para el cliente.
export interface DatosConformidad {
  numeroVisita: number;
  nombreVisita: string;
  etapa: string;
  clienteNombre: string;
  clienteRuc: string;
  clienteDireccion: string;
  clienteCorreo: string;
  tecnicoNombre: string;
  fechaVisita: string;
  actividadesProgramadas: string;
  accionesRealizadas: string;
  documentosAdjuntos: string[];
  fechaEmision: string;
  preguntas: PreguntaConformidad[];
}

const ESCALA_SATISFACCION = ['Muy satisfecho', 'Satisfecho', 'Poco satisfecho', 'Insatisfecho'];
const SI_NO = ['Sí', 'Parcialmente', 'No'];

// Las preguntas se redactan según el tipo de cliente (empresa o persona natural)
// y la etapa del servicio a la que pertenece la visita.
export const construirPreguntas = (detalle: DetalleVisita, cliente: Cliente): PreguntaConformidad[] => {
  // En Perú el RUC de una empresa (persona jurídica) empieza con 20; el de una persona natural, con 10.
  const esEmpresa = cliente.ruc.trim().startsWith('20');
  const sujeto = esEmpresa ? cliente.nombre : 'usted';
  const personal = esEmpresa ? 'su personal' : 'usted';

  const preguntas: PreguntaConformidad[] = [
    {
      pregunta: `¿Las actividades indicadas en este documento se ejecutaron según lo acordado con ${sujeto}?`,
      opciones: SI_NO,
    },
    {
      pregunta: `¿El técnico ${detalle.tecnicoNombre} llegó en el horario o fecha coordinada?`,
      opciones: ['Sí', 'Con retraso leve', 'Con retraso considerable'],
    },
    {
      pregunta: `¿Cómo calificaría el trato y la comunicación del técnico con ${personal}?`,
      opciones: ESCALA_SATISFACCION,
    },
  ];

  if (detalle.etapa === 'Instalación') {
    preguntas.push({
      pregunta: 'Tras la instalación realizada en esta visita, ¿los equipos o sistemas intervenidos funcionan correctamente?',
      opciones: SI_NO,
    });
  }

  preguntas.push(
    {
      pregunta: 'Al terminar, ¿el lugar de trabajo quedó limpio y ordenado?',
      opciones: SI_NO,
    },
    {
      pregunta: `En general, ¿qué tan satisfecho está ${esEmpresa ? 'su empresa' : 'usted'} con esta visita?`,
      opciones: ESCALA_SATISFACCION,
    },
  );

  return preguntas;
};

export const armarDatosConformidad = (
  detalle: DetalleVisita,
  cliente: Cliente,
  numeroVisita: number,
): DatosConformidad => ({
  numeroVisita,
  nombreVisita: detalle.nombre,
  etapa: detalle.etapa,
  clienteNombre: cliente.nombre,
  clienteRuc: cliente.ruc,
  clienteDireccion: cliente.direccion,
  clienteCorreo: cliente.correoElectronico,
  tecnicoNombre: detalle.tecnicoNombre,
  fechaVisita: detalle.fechas.map((f) => f.valor).join(' / '),
  actividadesProgramadas: detalle.descripcion,
  accionesRealizadas: detalle.notasTecnico.map((n) => `${n.etiqueta}: ${n.valor}`).join('\n'),
  documentosAdjuntos: detalle.documentos.map((d) => d.nombre),
  fechaEmision: new Date().toLocaleDateString('es-PE'),
  preguntas: construirPreguntas(detalle, cliente),
});

export const nombreArchivoConformidad = (datos: DatosConformidad) =>
  `Conformidad-visita-${datos.numeroVisita}-${datos.clienteNombre.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;

// Descarga el PDF en el equipo de quien lo genera; el envío al cliente se hace fuera del sistema.
export function descargarConformidad(pdf: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(pdf);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface ConformidadGenerada {
  generadaEn: string;
  nombreArchivo: string;
  // Se conserva para archivarlo en Drive al cerrar el servicio.
  pdf: Blob;
}

// Temporal: se recuerda en memoria qué visitas ya tienen su conformidad generada, mientras no exista el endpoint.
const generadas = new Map<string, ConformidadGenerada>();
const listeners = new Set<() => void>();
let instantanea: ReadonlyMap<string, ConformidadGenerada> = new Map();

export const claveVisitaConformidad = (visitaId: number, visitaProgramadaId?: number) =>
  `${visitaId}-${visitaProgramadaId ?? 'diagnostico'}`;

export const registrarConformidadGenerada = (clave: string, conformidad: Omit<ConformidadGenerada, 'generadaEn'>) => {
  generadas.set(clave, { ...conformidad, generadaEn: new Date().toLocaleString('es-PE') });
  instantanea = new Map(generadas);
  listeners.forEach((listener) => listener());
};

export const obtenerConformidadesGeneradas = () => instantanea;

export const suscribirseAConformidades = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
