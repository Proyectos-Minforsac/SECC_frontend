import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { DatosConformidad } from '../services/conformidad';
import CotizacionMinfoLogo from '../assets/cotizacion_logo_minforsac.png';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', color: '#333333' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 10,
  },
  companyDetails: { width: '60%' },
  companyName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#1A365D' },
  titleBox: {
    width: '35%',
    borderWidth: 1,
    borderColor: '#1A365D',
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1A365D' },
  sectionTitle: { fontWeight: 'bold', color: '#1A365D', marginBottom: 5, fontSize: 10 },
  section: { marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 4,
  },
  logo: {
    width: 160,
    marginBottom: 6,
  },
  column: { width: '48%' },
  rowDetail: { flexDirection: 'row', marginBottom: 4 },
  label: { fontWeight: 'bold', width: '32%', color: '#4A5568' },
  value: { width: '68%' },
  paragraph: { lineHeight: 1.4 },
  question: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  option: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  checkbox: { width: 8, height: 8, borderWidth: 1, borderColor: '#1A365D', marginRight: 4 },
  signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signature: { width: '45%', borderTopWidth: 1, borderTopColor: '#333333', paddingTop: 4, textAlign: 'center' },
  note: { marginTop: 12, fontSize: 8, color: '#718096' },
});

// Documento de conformidad: resumen de la visita + preguntas de satisfacción para el cliente.
export default function ConformidadDocumento({ datos }: { datos: DatosConformidad }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={styles.companyDetails}>
            <Image src={CotizacionMinfoLogo} style={styles.logo} />
            <Text>RUC. : 20508243490</Text>
            <Text>DIRECCIÓN: JR. LAS CALÉNDULAS 688 LAS FLORES - S.J.L.</Text>
            <Text>TELÉFONO: 376 - 0122</Text>
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.title}>DOCUMENTO DE CONFORMIDAD</Text>
            <Text style={{ fontSize: 10, marginTop: 4 }}>Visita N° {datos.numeroVisita}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.column}>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>CLIENTE:</Text>
              <Text style={styles.value}>{datos.clienteNombre}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>RUC:</Text>
              <Text style={styles.value}>{datos.clienteRuc}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>DIRECCIÓN:</Text>
              <Text style={styles.value}>{datos.clienteDireccion}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>SERVICIO:</Text>
              <Text style={styles.value}>{datos.nombreVisita} ({datos.etapa})</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>FECHA VISITA:</Text>
              <Text style={styles.value}>{datos.fechaVisita}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>TÉCNICO:</Text>
              <Text style={styles.value}>{datos.tecnicoNombre}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>EMISIÓN:</Text>
              <Text style={styles.value}>{datos.fechaEmision}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVIDADES PROGRAMADAS</Text>
          <Text style={styles.paragraph}>{datos.actividadesProgramadas || '-'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCIONES REALIZADAS (REPORTE DEL TÉCNICO)</Text>
          <Text style={styles.paragraph}>{datos.accionesRealizadas || '-'}</Text>
          {datos.documentosAdjuntos.length > 0 && (
            <Text style={[styles.paragraph, { marginTop: 4 }]}>
              Evidencias adjuntas: {datos.documentosAdjuntos.join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENCUESTA DE SATISFACCIÓN</Text>
          {datos.preguntas.map(({ pregunta, opciones }, indice) => (
            <View key={pregunta} style={styles.question} wrap={false}>
              <Text>{indice + 1}. {pregunta}</Text>
              <View style={styles.options}>
                {opciones.map((opcion) => (
                  <View key={opcion} style={styles.option}>
                    <View style={styles.checkbox} />
                    <Text>{opcion}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Text style={{ marginTop: 4 }}>Comentarios u observaciones: ______________________________________________</Text>
        </View>

        <View style={styles.signatures} wrap={false}>
          <Text style={styles.signature}>Firma y sello del cliente — {datos.clienteNombre}</Text>
          <Text style={styles.signature}>Técnico — {datos.tecnicoNombre}</Text>
        </View>

        <Text style={styles.note}>
          Puede completar este documento y responder al correo en el que lo recibió para dar su conformidad.
        </Text>
      </Page>
    </Document>
  );
}
