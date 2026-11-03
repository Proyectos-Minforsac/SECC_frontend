// Exportación a CSV para abrir en Excel (HU-39). Separado por comas, con comillas donde hacen falta, saltos de línea de
// Windows y marca UTF-8 al inicio para que Excel respete las tildes. Los decimales llevan punto, como en Perú.

export interface ColumnaCSV<T> {
  encabezado: string;
  valor: (fila: T) => string | number | null | undefined;
}

// Un texto que empieza con = + - @ lo trataría Excel como fórmula: se antepone una comilla para que se vea tal cual.
const celda = (valor: string | number | null | undefined) => {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : '';

  const texto = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
};

export function aCSV<T>(columnas: ColumnaCSV<T>[], filas: T[]): string {
  const lineas = [columnas.map((c) => celda(c.encabezado)).join(',')];
  for (const fila of filas) lineas.push(columnas.map((c) => celda(c.valor(fila))).join(','));
  return lineas.join('\r\n');
}

export function descargarCSV(nombreArchivo: string, contenido: string) {
  const blob = new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
