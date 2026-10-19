import { pdf } from '@react-pdf/renderer';
import ConformidadDocumento from './ConformidadDocumento';
import type { DatosConformidad } from '../services/conformidad';

export const generarPdfConformidad = (datos: DatosConformidad) => pdf(<ConformidadDocumento datos={datos} />).toBlob();
