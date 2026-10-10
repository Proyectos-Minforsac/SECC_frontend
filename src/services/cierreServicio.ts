import { aDatosCotizacion, obtenerCotizacionesDeSolicitud, type CotizacionDeSolicitud } from './cotizaciones';
import type { ConformidadEnviada } from './conformidad';
import { detalleVisitaDiagnostico, detalleVisitaProgramada, type DetalleVisita } from './detalleVisita';
import { formatearMonto, type SolicitudServicio } from './solicitudes';
import type { EvidenciaVisita, VisitaTecnica } from './visitas';
import { ordenarPorFechaHora, type VisitaProgramada } from './visitasProgramadas';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export interface ArchivoCierre {
  nombre: string;
  contenido: Blob;
}

export interface SeccionReporte {
  titulo: string;
  filas: { etiqueta: string; valor: string }[];
  documentos: string[];
}

// Resumen en PDF de todo lo ocurrido en el servicio; es el primer archivo de la carpeta.
export interface DatosReporteServicio {
  numeroServicio: number;
  clienteNombre: string;
  tecnicoNombre: string;
  fechaCierre: string;
  secciones: SeccionReporte[];
}

export interface DatosCierre {
  visita: VisitaTecnica;
  solicitud: SolicitudServicio | undefined;
  programadas: VisitaProgramada[];
  conformidades: ReadonlyMap<string, ConformidadEnviada>;
}

const sinSeparadores = (nombre: string) => nombre.replace(/[\\/]+/g, '-');

// Dos archivos con el mismo nombre se pisarían en Drive; se agrega un número al repetido.
const conNombresUnicos = (archivos: ArchivoCierre[]): ArchivoCierre[] => {
  const usados = new Map<string, number>();
  return archivos.map((archivo) => {
    const repeticiones = usados.get(archivo.nombre) ?? 0;
    usados.set(archivo.nombre, repeticiones + 1);
    if (repeticiones === 0) return archivo;

    const punto = archivo.nombre.lastIndexOf('.');
    const base = punto > 0 ? archivo.nombre.slice(0, punto) : archivo.nombre;
    const extension = punto > 0 ? archivo.nombre.slice(punto) : '';
    return { ...archivo, nombre: `${base} (${repeticiones + 1})${extension}` };
  });
};

// Los archivos que subió el técnico viven como URL de blob en el navegador.
const leerArchivo = async (nombre: string, url: string): Promise<ArchivoCierre> => {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`No se pudo leer el archivo "${nombre}"`);
  return { nombre: sinSeparadores(nombre), contenido: await respuesta.blob() };
};

const leerEvidencias = (prefijo: string, evidencias: EvidenciaVisita[]) =>
  Promise.all(evidencias.map((e) => leerArchivo(`${prefijo} - ${e.nombre}`, e.url)));

const textoConformidad = (conformidad: ConformidadEnviada | undefined) =>
  conformidad ? `Enviada el ${conformidad.enviadaEn} a ${conformidad.correo}` : 'No se envió desde el sistema';

const construirReporte = (
  visita: VisitaTecnica,
  detalles: DetalleVisita[],
  cotizaciones: CotizacionDeSolicitud[],
  conformidades: ReadonlyMap<string, ConformidadEnviada>,
): DatosReporteServicio => ({
  numeroServicio: visita.visitaId,
  clienteNombre: visita.clienteNombre,
  tecnicoNombre: visita.tecnicoNombre,
  fechaCierre: new Date().toLocaleDateString('es-PE'),
  secciones: [
    ...detalles.map((detalle) => ({
      titulo: `${detalle.etapa} · ${detalle.nombre}`,
      filas: [
        ...detalle.fechas,
        { etiqueta: 'Descripción', valor: detalle.descripcion },
        ...detalle.notasTecnico,
        ...(detalle.requiereConformidad
          ? [{ etiqueta: 'Conformidad del cliente', valor: textoConformidad(conformidades.get(detalle.claveConformidad)) }]
          : []),
      ],
      documentos: detalle.documentos.map((d) => d.nombre),
    })),
    {
      titulo: 'Cotizaciones',
      filas: cotizaciones.map((c) => ({
        etiqueta: c.numeroCotizacion,
        valor: `${c.estado} · ${formatearMonto(c.total)}`,
      })),
      documentos: [],
    },
  ],
});

// Reúne todos los archivos del servicio: reporte resumen, evidencias del diagnóstico y de cada visita,
// cotizaciones y documentos de conformidad. La oferta del técnico no va aquí: al aceptarla el backend
// ya la movió a la carpeta del servicio.
export const reunirArchivosDelServicio = async (datos: DatosCierre): Promise<ArchivoCierre[]> => {
  const { visita, solicitud, programadas, conformidades } = datos;
  const ordenadas = ordenarPorFechaHora(programadas);

  const detalles = [
    ...(visita.diagnostico ? [detalleVisitaDiagnostico(visita)] : []),
    ...ordenadas.map((vp) => detalleVisitaProgramada(visita, vp, programadas)),
  ];

  const cotizaciones = solicitud ? await obtenerCotizacionesDeSolicitud(solicitud.solicitudId) : [];
  const { generarPdfCotizacion, generarPdfReporteServicio } = await import('../components/generarPdfsCierre');

  const evidencias = [
    ...(visita.diagnostico ? await leerEvidencias('Diagnóstico', visita.diagnostico.evidencias) : []),
    ...(
      await Promise.all(
        ordenadas.map((vp) =>
          leerEvidencias(detalleVisitaProgramada(visita, vp, programadas).nombre, vp.avance?.evidencias ?? [])
        )
      )
    ).flat(),
  ];

  const archivosCotizacion = await Promise.all(
    cotizaciones.map(async (c) => ({
      nombre: sinSeparadores(`Cotización ${c.numeroCotizacion}.pdf`),
      contenido: await generarPdfCotizacion(aDatosCotizacion(c)),
    }))
  );

  const archivosConformidad = detalles.filter((d) => d.requiereConformidad).flatMap((detalle) => {
    const conformidad = conformidades.get(detalle.claveConformidad);
    return conformidad ? [{ nombre: sinSeparadores(conformidad.nombreArchivo), contenido: conformidad.pdf }] : [];
  });

  const reporte = {
    nombre: 'Reporte del servicio.pdf',
    contenido: await generarPdfReporteServicio(construirReporte(visita, detalles, cotizaciones, conformidades)),
  };

  return conNombresUnicos([reporte, ...evidencias, ...archivosCotizacion, ...archivosConformidad]);
};

const leerError = async (respuesta: Response, porDefecto: string) => {
  const cuerpo = await respuesta.json().catch(() => null);
  return new Error(cuerpo?.message ?? porDefecto);
};

const subir = async (carpetaId: string, archivo: ArchivoCierre) => {
  const params = new URLSearchParams({
    nombre: archivo.nombre,
    tipo: archivo.contenido.type || 'application/octet-stream',
  });
  // Siempre octet-stream: el backend lee el cuerpo sin interpretarlo y el tipo real viaja en la query.
  const respuesta = await fetch(`${apiBaseUrl}/drive/carpetas/${carpetaId}/archivos?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: archivo.contenido,
  });
  if (!respuesta.ok) throw await leerError(respuesta, `No se pudo subir "${archivo.nombre}" a Google Drive`);
};

// Cierra el servicio: sube sus archivos a la carpeta del servicio en Drive (Clientes/<cliente>/Servicio N° ...,
// la misma donde ya está la oferta aceptada) y devuelve el enlace. Si algo falla a la mitad,
// reintentar reutiliza la misma carpeta y reemplaza los archivos ya subidos.
export async function cerrarServicioEnDrive(
  datos: DatosCierre,
  alProgresar: (mensaje: string) => void,
): Promise<string> {
  alProgresar('Reuniendo los archivos del servicio…');
  const archivos = await reunirArchivosDelServicio(datos);

  const respuesta = await fetch(`${apiBaseUrl}/solicitudes/${datos.visita.solicitudId}/carpeta-servicio`, {
    method: 'POST',
  });
  if (!respuesta.ok) throw await leerError(respuesta, 'No se pudo crear la carpeta en Google Drive');
  const { carpetaId, url } = (await respuesta.json()) as { carpetaId: string; url: string };

  for (const [indice, archivo] of archivos.entries()) {
    alProgresar(`Subiendo archivos a Drive (${indice + 1}/${archivos.length})…`);
    await subir(carpetaId, archivo);
  }

  return url;
}
