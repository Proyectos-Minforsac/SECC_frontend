import type { Cliente } from './clientes';
import type { DetalleVisita } from './detalleVisita';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

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
  const esEmpresa = cliente.tipoPersona.toLowerCase().startsWith('jur');
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

// Convierte el PDF generado a base64 (sin el prefijo "data:...;base64,") para enviarlo en JSON.
const blobABase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => reject(new Error('No se pudo leer el PDF generado'));
    lector.readAsDataURL(blob);
  });

// Envía el PDF al correo registrado del cliente; el cliente puede responder ese mismo correo.
export async function enviarConformidad(datos: DatosConformidad, pdf: Blob): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/conformidad/enviar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correoDestino: datos.clienteCorreo,
      clienteNombre: datos.clienteNombre,
      nombreVisita: datos.nombreVisita,
      nombreArchivo: nombreArchivoConformidad(datos),
      pdfBase64: await blobABase64(pdf),
    }),
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null);
    throw new Error(cuerpo?.message ?? 'No se pudo enviar el documento de conformidad');
  }
}

export interface ConformidadEnviada {
  enviadaEn: string;
  correo: string;
  nombreArchivo: string;
  // Se conserva para archivarlo en Drive al cerrar el servicio.
  pdf: Blob;
}

// Temporal: se recuerda en memoria qué visitas ya recibieron su conformidad, mientras no exista el endpoint.
const enviadas = new Map<string, ConformidadEnviada>();
const listeners = new Set<() => void>();
let instantanea: ReadonlyMap<string, ConformidadEnviada> = new Map();

export const claveVisitaConformidad = (visitaId: number, visitaProgramadaId?: number) =>
  `${visitaId}-${visitaProgramadaId ?? 'diagnostico'}`;

export const registrarConformidadEnviada = (clave: string, conformidad: Omit<ConformidadEnviada, 'enviadaEn'>) => {
  enviadas.set(clave, { ...conformidad, enviadaEn: new Date().toLocaleString('es-PE') });
  instantanea = new Map(enviadas);
  listeners.forEach((listener) => listener());
};

export const obtenerConformidadesEnviadas = () => instantanea;

export const suscribirseAConformidades = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
