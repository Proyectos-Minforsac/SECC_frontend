import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CotizacionData } from '../types/types';

interface CotizacionDocumentProps {
  data: CotizacionData;
}

// Definición de estilos
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  // Encabezado
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 10,
  },
  companyDetails: {
    width: '60%',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1A365D',
  },
  quoteTitleBox: {
    width: '35%',
    borderWidth: 1,
    borderColor: '#1A365D',
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    justifyContent: 'center',
  },
  quoteTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  
  // Información del Cliente
  sectionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 4,
  },
  column: {
    width: '48%',
  },
  rowDetail: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: '30%',
    color: '#4A5568',
  },
  value: {
    width: '70%',
  },

  // Tabla
  table: {
    width: 'auto',
    marginTop: 10,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 20,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#1A365D',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  colItems: { width: '10%', textAlign: 'center' },
  colName: {width: '20%', textAlign: 'center'},
  colDesc: { width: '50%', paddingLeft: 5 },
  colQty: { width: '12%', textAlign: 'center' },
  colUnitPrice: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right', paddingRight: 5 },

  // Totales
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#1A365D',
    fontWeight: 'bold',
  },

  // Términos y Contacto
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  termsColumn: {
    width: '60%',
  },
  contactColumn: {
    width: '35%',
    backgroundColor: '#EDF2F7',
    padding: 8,
    borderRadius: 4,
  },
  sectionSubtitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1A365D',
  },
  termItem: {
    marginBottom: 3,
  }
});

export const CotizacionDocument = ({ data } : CotizacionDocumentProps) => {
  const items = data?.items || [
    { item: '1', descripcion: 'Ejemplo de producto o servicio', cantidad: 1, precioUnitario: 100.00 }
  ];

  const subtotal = items.reduce(
      (acc, item) => acc + item.total,
      0
  );

  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>Multiversicios Informáticos S.A.C</Text>
            <Text>R.U.C. : 20508243490</Text>
            <Text>DIRECCIÓN: JR. LAS CALÉNDULAS 688 LAS FLORES - S.J.L.</Text>
            <Text>TELÉFONO: 376 - 0122</Text>
          </View>
          <View style={styles.quoteTitleBox}>
            <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
            <Text style={{ fontSize: 11, marginTop: 4 }}>N° 5010</Text>
          </View>
        </View>

        {/* Datos del Cliente y Cotización */}
        <View style={styles.sectionGrid}>
          <View style={styles.column}>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>CLIENTE:</Text>
              <Text style={styles.value}>{data?.cliente || '-'}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>TIPO PERSONA:</Text>
              <Text style={styles.value}>{data?.tipo_persona || '-'}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>DIRECCIÓN:</Text>
              <Text style={styles.value}>{data?.direccion || '-'}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>FECHA:</Text>
              <Text style={styles.value}>{data?.fecha || '2025-11-17'}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>SOLICITANTE:</Text>
              <Text style={styles.value}>{data?.solicitante || 'Empleado N°3'}</Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.label}>MONEDA:</Text>
              <Text style={styles.value}>{data?.moneda || 'SOLES'}</Text>
            </View>
          </View>
        </View>

        {/* Tabla de Productos/Servicios */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colItems}>ÍTEMS</Text>
            <Text style={styles.colName}>NOMBRE</Text>
            <Text style={styles.colDesc}>DESCRIPCIÓN</Text>
            <Text style={styles.colQty}>CANTIDAD</Text>
            <Text style={styles.colUnitPrice}>PRECIO UNIT.</Text>
            <Text style={styles.colTotal}>TOTAL</Text>
          </View>

          {items.map((row, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.colItems}>{index + 1}</Text>
              <Text style={styles.colName}>{row.nombre}</Text>
              <Text style={styles.colDesc}>{row.descripcion}</Text>
              <Text style={styles.colQty}>{row.cantidad}</Text>
              <Text style={styles.colUnitPrice}>{row.precio.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{(row.cantidad * row.precio).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Sub-total, IGV y Total */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: 'bold' }}>SUB-TOTAL:</Text>
              <Text>{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: 'bold' }}>IGV (18%):</Text>
              <Text>{igv.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRowBold}>
              <Text>TOTAL:</Text>
              <Text>{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Términos y Contacto */}
        <View style={styles.footerSection}>
          <View style={styles.termsColumn}>
            <Text style={styles.sectionSubtitle}>TÉRMINOS Y CONDICIONES</Text>
            <Text style={styles.termItem}>1. FORMA DE PAGO: 15 DÍAS</Text>
            <Text style={styles.termItem}>2. TIEMPO DE ENTREGA: DESPUÉS DE LA ORDEN DE COMPRA</Text>
            <Text style={styles.termItem}>3. VALIDEZ DE LA OFERTA: 15 DÍAS</Text>
            <Text style={styles.termItem}>4. GARANTÍA POR EQUIPO: 12 MESES</Text>
          </View>

          <View style={styles.contactColumn}>
            <Text style={styles.sectionSubtitle}>CONTACTO</Text>
            <Text style={styles.termItem}>CELULAR: 989725259</Text>
            <Text style={styles.termItem}>E-MAIL: javiles@minforsac.com.pe</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default CotizacionDocument;