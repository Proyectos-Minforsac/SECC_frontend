import { pdf } from '@react-pdf/renderer';
import CotizacionDocument from './CotizacionReporte';
import ReporteServicioDocumento from './ReporteServicioDocumento';
import type { CotizacionData } from '../services/cotizaciones';
import type { DatosReporteServicio } from '../services/cierreServicio';

export const generarPdfCotizacion = (datos: CotizacionData) => pdf(<CotizacionDocument data={datos} />).toBlob();

export const generarPdfReporteServicio = (datos: DatosReporteServicio) =>
  pdf(<ReporteServicioDocumento datos={datos} />).toBlob();
