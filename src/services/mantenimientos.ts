import type { VisitaProgramada } from './visitasProgramadas';

// Vigencia de la garantía que ofrece la empresa, contada desde la última visita de
// instalación completada del servicio.
export const GARANTIA_MESES = 12;

// Una visita de mantenimiento se considera "cercana" cuando faltan hoy o hasta estos días.
export const DIAS_AVISO = 1;

export interface Garantia {
  inicio: string; // YYYY-MM-DD
  fin: string; // YYYY-MM-DD
}

const aISO = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

const partesISO = (fecha: string) => fecha.split('-').map(Number);

// Fecha local de hoy (no UTC) en formato YYYY-MM-DD.
export const hoyISO = () => aISO(new Date());

// Días de calendario entre dos fechas YYYY-MM-DD (negativo si `hasta` es anterior).
export const diasEntre = (desde: string, hasta: string) => {
  const [a1, m1, d1] = partesISO(desde);
  const [a2, m2, d2] = partesISO(hasta);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

// La garantía arranca con la última visita de instalación completada. Sin ninguna
// completada, el servicio aún no está instalado y no tiene garantía.
export const garantiaDelServicio = (visitasDelServicio: VisitaProgramada[]): Garantia | null => {
  const completadas = visitasDelServicio.filter((v) => v.tipo === 'INSTALACION' && v.avance).map((v) => v.fecha);
  if (completadas.length === 0) return null;

  const inicio = completadas.reduce((a, b) => (a > b ? a : b));
  const [anio, mes, dia] = partesISO(inicio);
  return { inicio, fin: aISO(new Date(anio, mes - 1 + GARANTIA_MESES, dia)) };
}

export const garantiaVigente = (garantia: Garantia) => hoyISO() <= garantia.fin;

// Evita avisar más de una vez la misma visita mientras la pestaña siga abierta. Se guarda la fecha avisada:
// si la visita se reprograma, deja de coincidir y se vuelve a avisar.
const visitasAvisadas = new Map<number, string>();

export const marcarRecordatorioEnviado = (visita: VisitaProgramada) => {
  visitasAvisadas.set(visita.visitaProgramadaId, visita.fecha);
}

// Visitas de mantenimiento pendientes cuya fecha está cerca y aún no se avisó.
export const mantenimientosPorAvisar = (lista: VisitaProgramada[]) => {
  const hoy = hoyISO();
  return lista.filter((v) => {
    if (v.tipo !== 'MANTENIMIENTO' || v.avance) return false;
    if (visitasAvisadas.get(v.visitaProgramadaId) === v.fecha) return false;
    const dias = diasEntre(hoy, v.fecha);
    return dias >= 0 && dias <= DIAS_AVISO;
  });
}

export const describirCercania = (fecha: string) => (diasEntre(hoyISO(), fecha) === 0 ? 'hoy' : 'mañana');
