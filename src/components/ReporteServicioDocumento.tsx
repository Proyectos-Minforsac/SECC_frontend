import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DatosReporteServicio } from '../services/cierreServicio';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', color: '#333333' },
  header: { borderBottomWidth: 1, borderBottomColor: '#CCCCCC', paddingBottom: 10, marginBottom: 14 },
  companyName: { fontSize: 12, fontWeight: 'bold', color: '#1A365D', marginBottom: 2 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1A365D', marginTop: 8, marginBottom: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#1A365D', padding: 4, marginBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: '28%', fontWeight: 'bold', color: '#4A5568' },
  value: { width: '72%', lineHeight: 1.3 },
});

// Resumen del servicio cerrado: datos generales y, por etapa, lo que registró el técnico.
export default function ReporteServicioDocumento({ datos }: { datos: DatosReporteServicio }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>Multiservicios Informáticos S.A.C</Text>
          <Text style={styles.title}>Reporte del servicio N° {datos.numeroServicio}</Text>
          <Text>Cliente: {datos.clienteNombre} · Técnico: {datos.tecnicoNombre} · Cierre: {datos.fechaCierre}</Text>
        </View>

        {datos.secciones.map((seccion) => (
          <View key={seccion.titulo} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{seccion.titulo}</Text>
            {seccion.filas.length === 0 && <Text>Sin registros.</Text>}
            {seccion.filas.map(({ etiqueta, valor }) => (
              <View key={`${etiqueta}-${valor}`} style={styles.row}>
                <Text style={styles.label}>{etiqueta}</Text>
                <Text style={styles.value}>{valor}</Text>
              </View>
            ))}
            {seccion.documentos.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Documentos</Text>
                <Text style={styles.value}>{seccion.documentos.join(', ')}</Text>
              </View>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}
