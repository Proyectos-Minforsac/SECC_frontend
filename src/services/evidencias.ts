import { pedir } from './http';
import type { EvidenciaVisita } from './visitas';

// Evidencias que el técnico adjunta al diagnóstico o al avance de una visita: imágenes, PDF y documentos Word, hasta 8 MB cada
// uno y 10 por diagnóstico o visita. Las imágenes se reducen en el navegador antes de subirlas (las fotos de celular pesan mucho).
// El servidor vuelve a comprobar todo esto: aquí es para avisar al instante.

export const MAX_BYTES = 8 * 1024 * 1024;
export const MAX_ARCHIVOS = 10;

// Lado más largo y calidad con que se reduce una imagen
const LADO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;
// Una imagen que ya es liviana y chica se sube tal cual
const PESO_SIN_REDUCIR = 1024 * 1024;

const EXTENSIONES_IMAGEN = ['.jpg', '.jpeg', '.png', '.webp'];
const EXTENSIONES_DOCUMENTO = ['.pdf', '.doc', '.docx'];

// Para el atributo accept del selector de archivos
export const ACEPTAR_ARCHIVOS = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx';

// El tipo que se envía sale de la extensión: algunos sistemas no informan el tipo de los documentos Word
const TIPO_POR_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const extensionDe = (nombre: string) => (nombre.includes('.') ? nombre.slice(nombre.lastIndexOf('.')).toLowerCase() : '');

export const esImagenPorNombre = (nombre: string) => EXTENSIONES_IMAGEN.includes(extensionDe(nombre));

// Mensaje de por qué el archivo no sirve, o null si sirve.
export const motivoDeRechazo = (nombre: string, bytes: number, esImagen: boolean): string | null => {
  const extension = extensionDe(nombre);
  if (![...EXTENSIONES_IMAGEN, ...EXTENSIONES_DOCUMENTO].includes(extension)) {
    return `«${nombre}»: solo se aceptan imágenes (JPG, PNG o WEBP), PDF y documentos Word (DOC o DOCX).`;
  }
  // Las imágenes se reducen antes de subir, así que su peso original no es un problema; los documentos no se reducen
  if (!esImagen && bytes > MAX_BYTES) return `«${nombre}» pesa más de 8 MB.`;
  return null;
};

// Tamaño al que se reduce una imagen: el lado más largo no pasa del máximo y se conserva la proporción.
export const dimensionesReducidas = (ancho: number, alto: number, maximo = LADO_MAXIMO) => {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maximo) return { ancho, alto, reducida: false };
  const factor = maximo / mayor;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor), reducida: true };
};

// Si el navegador no logra abrir la imagen en este tiempo, se sube la original
const ESPERA_IMAGEN_MS = 8000;

const cargarImagen = (archivo: File) =>
  new Promise<HTMLImageElement>((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    const limpiar = () => {
      clearTimeout(espera);
      URL.revokeObjectURL(url);
    };
    const espera = setTimeout(() => {
      limpiar();
      rechazar(new Error(`No se pudo leer la imagen «${archivo.name}».`));
    }, ESPERA_IMAGEN_MS);
    imagen.onload = () => {
      limpiar();
      resolver(imagen);
    };
    imagen.onerror = () => {
      limpiar();
      rechazar(new Error(`No se pudo leer la imagen «${archivo.name}».`));
    };
    imagen.src = url;
  });

// Reduce una imagen (lado más largo de 1600 px, JPEG al 80 %). Si ya es chica y liviana, o si el navegador no puede reducirla,
// se devuelve la original.
export const reducirImagen = async (archivo: File): Promise<File> => {
  try {
    const imagen = await cargarImagen(archivo);
    const { ancho, alto, reducida } = dimensionesReducidas(imagen.naturalWidth, imagen.naturalHeight);
    if (!reducida && archivo.size <= PESO_SIN_REDUCIR) return archivo;

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) return archivo;
    // El JPEG no tiene transparencia: se pinta sobre blanco
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD_JPEG));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return archivo;
  }
};

// Valida y deja listo un archivo para subir (las imágenes se reducen). Lanza un Error con el motivo si no sirve.
export const prepararArchivo = async (archivo: File): Promise<File> => {
  const esImagen = esImagenPorNombre(archivo.name);
  const rechazo = motivoDeRechazo(archivo.name, archivo.size, esImagen);
  if (rechazo) throw new Error(rechazo);

  const listo = esImagen ? await reducirImagen(archivo) : archivo;
  if (listo.size > MAX_BYTES) throw new Error(`«${archivo.name}» pesa más de 8 MB incluso reducida.`);
  return listo;
};

const aBase64 = (archivo: File) =>
  new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => rechazar(new Error(`No se pudo leer «${archivo.name}».`));
    lector.readAsDataURL(archivo);
  });

// Diagnóstico de un servicio (solo visitaId) o una de sus visitas programadas (visitaId y visitaProgramadaId)
export interface DestinoEvidencia {
  visitaId: number;
  visitaProgramadaId?: number;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

// La URL que devuelve el servidor es relativa a la API
export const conUrlCompleta = (evidencia: EvidenciaVisita): EvidenciaVisita =>
  evidencia.url.startsWith('/') ? { ...evidencia, url: `${apiBaseUrl}${evidencia.url}` } : evidencia;

export const subirEvidencia = async (destino: DestinoEvidencia, archivo: File): Promise<EvidenciaVisita> => {
  const listo = await prepararArchivo(archivo);
  const guardada = await pedir<EvidenciaVisita>(
    '/evidencias',
    'POST',
    {
      ...destino,
      nombre: listo.name,
      tipo: TIPO_POR_EXTENSION[extensionDe(listo.name)] ?? listo.type,
      contenidoBase64: await aBase64(listo),
    },
    `No se pudo subir «${archivo.name}».`
  );
  return conUrlCompleta(guardada);
};

export const quitarEvidencia = (evidenciaId: number) =>
  pedir<{ evidenciaId: number }>(`/evidencias/${evidenciaId}`, 'DELETE', undefined, 'No se pudo quitar el archivo.');
