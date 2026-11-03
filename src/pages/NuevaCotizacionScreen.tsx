import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Check, ChevronDown, List, ArrowLeft } from 'lucide-react';
import CardItem from '../components/CotizacionItem';
import HojaCostos from '../components/HojaCostos';
import ResumenCostos from '../components/ResumenCostos';
import PanelAnaloga from '../components/PanelAnaloga';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { obtenerClientes, type Cliente } from '../services/clientes';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  crearCotizacion,
  corregirCotizacion,
  obtenerCotizacionParaEdicion,
  type CotizacionItem,
  type CotizacionParaEdicion,
  type DetalleImpresora,
  type CorregirCotizacionPayload,
} from '../services/cotizaciones';
import { GARANTIA_MESES_DEFECTO, GARANTIA_MESES_OPCIONES } from '../services/mantenimientos';
import { margenBajoMinimo } from '../services/estimaciones';
import { obtenerAnaloga, type Analoga, type EntradasEstimacion } from '../services/analoga';
import { formatearFechaHora } from '../services/visitas';
import { useAuth } from '../context/AuthContext';
import {
  COSTO_OBLIGATORIO,
  TIPOS_CON_COSTO,
  actividadesVacias,
  aPayloadEstimacion,
  calcularEstimacion,
  type Actividades,
  type Valor,
} from '../services/calculoCostos';
import { DESTINO_GENERAL } from '../services/tarifario';
import { useDatosDeCosto } from '../hooks/useDatosDeCosto';
import { useSolicitudes } from '../hooks/useSolicitudes';

// Datos que puede traer la navegación al llegar desde otra pantalla
// (p.ej. una notificación de diagnóstico inicial completado).
interface NuevaCotizacionState {
  clientePrefill?: Cliente;
  solicitudId?: number;
}

// Justificación mínima que exige el servidor cuando el jefe acepta un margen bajo el mínimo.
const JUSTIFICACION_MINIMA = 10;

const detalleImpresoraVacio: DetalleImpresora = {
  fecha: '',
  tienda: '',
  cargo: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  casoHD: '',
};

const DetalleItemImpresora = ({
  value,
  onChange,
}: {
  value: DetalleImpresora;
  onChange: (campo: keyof DetalleImpresora, valor: string) => void;
}) => {
  return (
    <>
      <div className="bg-[#1C204E] rounded-2xl p-4 space-y-3 border border-[#343C8F] transition-all duration-300">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1 ">Fecha</label>
            <input
              type="date"
              value={value.fecha}
              onChange={(e) => onChange('fecha', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Tienda</label>
            <input
              type="text"
              placeholder="Escriba la tienda"
              value={value.tienda}
              onChange={(e) => onChange('tienda', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Cargo</label>
            <input
              type="text"
              placeholder="Escriba el cargo"
              value={value.cargo}
              onChange={(e) => onChange('cargo', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Marca</label>
            <input
              type="text"
              placeholder="Escriba la marca"
              value={value.marca}
              onChange={(e) => onChange('marca', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Modelo</label>
            <input
              type="text"
              placeholder="Escriba el modelo"
              value={value.modelo}
              onChange={(e) => onChange('modelo', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Número de serie</label>
            <input
              type="text"
              placeholder="Escriba el número de serie"
              value={value.numeroSerie}
              onChange={(e) => onChange('numeroSerie', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Caso HD</label>
            <input
              type="text"
              placeholder="Escriba el caso HD"
              value={value.casoHD}
              onChange={(e) => onChange('casoHD', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-sm outline-none shadow-sm"
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Esta pantalla sirve para dos cosas: crear una cotización nueva y corregir una que el jefe devolvió
// (ruta /cotizaciones/:cotizacionId/editar). Al corregir, el cliente y la solicitud no cambian.
export const NuevaCotizacionScreen = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';
  const { cotizacionId: cotizacionIdRuta } = useParams();
  const cotizacionId = cotizacionIdRuta ? Number(cotizacionIdRuta) : null;
  const modoEdicion = cotizacionId !== null;
  const clientePrefill = (location.state as NuevaCotizacionState | null)?.clientePrefill;

  // La cotización devuelta que se está corrigiendo, ya cargada del servidor
  const [edicion, setEdicion] = useState<CotizacionParaEdicion | null>(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(modoEdicion);
  const [errorEdicion, setErrorEdicion] = useState('');
  const solicitudId = modoEdicion
    ? edicion?.solicitudId ?? undefined
    : (location.state as NuevaCotizacionState | null)?.solicitudId;

  // Estados globales para los datos del cliente
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(clientePrefill ?? null);
  const [clienteNombre, setClienteNombre] = useState(clientePrefill?.nombre ?? '');
  const [clienteDireccion, setClienteDireccion] = useState(clientePrefill?.direccion ?? '');
  const [sugerencias, setSugerencias] = useState<Cliente[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const contenedorClienteRef = useRef<HTMLDivElement>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [clienteRuc, setClienteRuc] = useState(clientePrefill?.ruc ?? '');
  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [divisa, setDivisa] = useState('SOLES');
  // Garantía del servicio (mantenimiento y soporte): el servicio la hereda cuando se acepta la cotización.
  // Mientras el trabajador no elija una, se propone la garantía por defecto que fijó el jefe.
  const [garantiaElegida, setGarantiaElegida] = useState<number | null>(null);

  // Tarifas y parámetros del jefe, con los que se calcula la estimación de costos.
  const { cargando: cargandoCostos, tarifario, parametros, errorTarifario, errorParametros } = useDatosDeCosto();
  const garantiaMeses = garantiaElegida ?? parametros?.valores.GARANTIA_MESES_DEFECTO?.valor ?? GARANTIA_MESES_DEFECTO;
  const tasaImprevistos = parametros?.valores.TASA_IMPREVISTOS?.valor ?? null;
  const margenMinimo = parametros?.valores.MARGEN_MINIMO?.valor ?? null;

  // El diagnóstico ya se pagó: su costo es el monto de la oferta que se aceptó para esta solicitud.
  const solicitudes = useSolicitudes();
  const costoDiagnostico = solicitudId
    ? solicitudes.find((s) => s.solicitudId === solicitudId)?.ofertas.find((o) => o.estado === 'ACEPTADA')?.montoVisita ?? 0
    : 0;

  // Estados del formulario para agregar un ítem
  const [tipo, setTipo] = useState('');
  const [nombreItem, setNombreItem] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [precio, setPrecio] = useState<number | ''>('');
  // Costo de compra por unidad (uso interno): solo para productos, impresoras y alquileres
  const [costoCompra, setCostoCompra] = useState<number | ''>('');

  // Detalles específicos cuando el ítem es de tipo "Impresora"
  const [detalleImpresora, setDetalleImpresora] = useState<DetalleImpresora>(detalleImpresoraVacio);

  const actualizarDetalleImpresora = (campo: keyof DetalleImpresora, valor: string) => {
    setDetalleImpresora((prev) => ({ ...prev, [campo]: valor }));
  };

  // Estado de ejemplo para los ítems agregados
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'error',
    message: '',
  });
  const mostrarToastError = (message: string) => setToast({ show: true, type: 'error', message });

  // Id del ítem que se está editando (null = el formulario agrega un ítem nuevo)
  const [itemEditandoId, setItemEditandoId] = useState<number | null>(null);

  // Estimación de costos (uso interno, obligatoria): lo que ingresa el trabajador. El resultado se calcula más abajo.
  const [destino, setDestino] = useState(DESTINO_GENERAL);
  const [tipoCambio, setTipoCambio] = useState<Valor>('');
  const [actividades, setActividades] = useState<Actividades>(actividadesVacias());

  // Si el jefe crea o corrige la cotización, queda validada al guardar: con el margen bajo el mínimo debe explicar por qué.
  const [justificacion, setJustificacion] = useState('');

  // Servicios cerrados parecidos a este (mismo tipo de servicio y destino): se buscan al cambiar cualquiera de los dos
  const tipoServicio = solicitudId ? solicitudes.find((s) => s.solicitudId === solicitudId)?.tipoServicio ?? '' : '';
  const [analoga, setAnaloga] = useState<Analoga | null>(null);
  const [errorAnaloga, setErrorAnaloga] = useState('');

  useEffect(() => {
    let vigente = true;
    setErrorAnaloga('');

    obtenerAnaloga(tipoServicio, destino)
      .then((recibida) => vigente && setAnaloga(recibida))
      .catch((error) => {
        if (!vigente) return;
        setAnaloga(null);
        setErrorAnaloga(error instanceof Error ? error.message : 'No se pudieron cargar los servicios similares.');
      });

    return () => {
      vigente = false;
    };
  }, [tipoServicio, destino]);

  // Copia los parámetros de un servicio parecido a la hoja de costos (los ítems y los precios no se tocan)
  const copiarParametros = (entradas: EntradasEstimacion) => {
    if (tarifario?.destinos.includes(entradas.destino)) setDestino(entradas.destino);
    setActividades(entradas.actividades);
  };

  // Al corregir, el formulario arranca con lo que tenía la cotización devuelta
  useEffect(() => {
    if (cotizacionId === null) return;

    let vigente = true;
    setCargandoEdicion(true);
    setErrorEdicion('');

    obtenerCotizacionParaEdicion(cotizacionId)
      .then((c) => {
        if (!vigente) return;

        setEdicion(c);
        if (c.cliente) {
          setClienteSeleccionado(c.cliente);
          setClienteNombre(c.cliente.nombre);
          setClienteDireccion(c.cliente.direccion);
          setClienteRuc(c.cliente.ruc);
        }
        setSolicitanteNombre(c.solicitante);
        setDivisa(c.moneda);
        setGarantiaElegida(c.garantiaMeses);
        setItems(
          c.items.map((item, indice) => ({
            id: Date.now() + indice,
            nombre: item.nombre,
            descripcion: item.descripcion,
            tipo: item.tipo,
            cantidad: item.cantidad,
            precio: item.precioUnitario,
            total: item.tipo === 'Título' ? 0 : item.cantidad * item.precioUnitario,
            ...(item.costoUnitario !== null ? { costoUnitario: item.costoUnitario } : {}),
            ...(item.detalleImpresora ? { detalleImpresora: item.detalleImpresora } : {}),
          }))
        );

        const entradas = c.estimacion.entradas;
        if (entradas) {
          setDestino(entradas.destino);
          // En soles el tipo de cambio es 1 y no se pide
          setTipoCambio(c.moneda === 'DÓLARES' ? entradas.tipoCambio : '');
          setActividades(entradas.actividades);
        }
      })
      .catch((error) => vigente && setErrorEdicion(error instanceof Error ? error.message : 'No se pudo cargar la cotización.'))
      .finally(() => vigente && setCargandoEdicion(false));

    return () => {
      vigente = false;
    };
  }, [cotizacionId]);

  useEffect(() => {
    const cargarSugerencias = async () => {
      if (!clienteNombre.trim()) {
        setClienteDireccion("");
        setClienteRuc("");
        setSugerencias([]);
        setMostrarSugerencias(false);
        return;
      }

      if (clienteSeleccionado && clienteNombre === clienteSeleccionado.nombre) return;

      try {
        const data = await obtenerClientes(1, 6, clienteNombre);
        setSugerencias(data.clientes);
        setMostrarSugerencias(data.clientes.length > 0);
      } catch (error) {
        console.error('Error al cargar clientes', error);
      }
    };

    cargarSugerencias();
  }, [clienteNombre]);

  useEffect(() => {
    const manejarClicFuera = (event: MouseEvent) => {
      if (
        contenedorClienteRef.current &&
        !contenedorClienteRef.current.contains(event.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', manejarClicFuera);
    return () => document.removeEventListener('mousedown', manejarClicFuera);
  }, []);

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setClienteNombre(cliente.nombre);
    setClienteDireccion(cliente.direccion);
    setClienteRuc(cliente.ruc);
    setMostrarSugerencias(false);
  };

  // Cálculo automático del total del ítem actual
  const totalItemActual = (Number(cantidad) || 0) * (Number(precio) || 0);

  // Función para agregar un nuevo ítem a la columna derecha
  const handleAddItem = () => {
    if (!nombreItem.trim()) {
      mostrarToastError("Ingrese el nombre del ítem");
      return;
    }

    // Si precio y cantidad son 0, es un título
    const esTitulo = Number(cantidad) === 0 && Number(precio) === 0;

    if (cantidad === '' && precio === '') {
      mostrarToastError("Complete cantidad y precio, o coloque ambos en 0 si el ítem es un título.");
      return;
    }

    // Los productos, impresoras y alquileres llevan costo de compra; los servicios no (su costo es la mano de obra).
    const itemLlevaCosto = !esTitulo && TIPOS_CON_COSTO.includes(tipo);
    if (itemLlevaCosto && COSTO_OBLIGATORIO.includes(tipo) && costoCompra === '') {
      mostrarToastError("Ingrese el costo de compra del ítem.");
      return;
    }

    const newItem: CotizacionItem = {
      id: itemEditandoId ?? Date.now(),
      nombre: nombreItem,
      descripcion: descripcion,
      tipo: esTitulo ? "Título" : tipo,
      cantidad: Number(cantidad),
      precio: Number(precio),
      total: esTitulo ? 0 : totalItemActual,
      ...(itemLlevaCosto && costoCompra !== '' ? { costoUnitario: Number(costoCompra) } : {}),
      ...(tipo === 'Impresora' ? { detalleImpresora } : {}),
    };

    if (itemEditandoId !== null) {
      // Reemplaza el ítem en su misma posición para no alterar el orden
      setItems(items.map((item) => (item.id === itemEditandoId ? newItem : item)));
    } else {
      setItems([...items, newItem]);
    }

    limpiarFormularioItem();
  };

  const limpiarFormularioItem = () => {
    setItemEditandoId(null);
    setNombreItem('');
    setTipo('');
    setDescripcion('');
    setCantidad('');
    setPrecio('');
    setCostoCompra('');
    setDetalleImpresora(detalleImpresoraVacio);
    setIsDetailsOpen(false);
  };

  // Carga un ítem de la lista en el formulario para modificarlo
  const handleEditItem = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItemEditandoId(item.id);
    setNombreItem(item.nombre);
    setDescripcion(item.descripcion);
    // Un título se guardó con tipo "Título" (no es una opción del selector): vuelve a quedar sin tipo
    setTipo(item.tipo === 'Título' ? '' : item.tipo);
    setCantidad(item.cantidad);
    setPrecio(item.precio);
    setCostoCompra(item.costoUnitario ?? '');
    setDetalleImpresora(item.detalleImpresora ?? detalleImpresoraVacio);
    setIsDetailsOpen(item.tipo === 'Impresora');
  };

  // Cálculo del total acumulado general
  const totalGeneral = items.reduce((acc, curr) => (acc + curr.total), 0);
  const subtotal = totalGeneral;
  const igv = subtotal * 0.18;
  const totalConIGV = subtotal + igv;

  // Estimación de costos con las tarifas del jefe. La venta es el subtotal, sin IGV; el servidor la recalcula al guardar.
  const { resultado, problemas } = useMemo(
    () =>
      calcularEstimacion({
        actividades,
        tarifas: tarifario?.vigentes[destino],
        destino,
        items,
        costoDiagnostico,
        tasaImprevistos,
        ventaSinIGV: subtotal,
        moneda: divisa,
        tipoCambio,
      }),
    [actividades, tarifario, destino, items, costoDiagnostico, tasaImprevistos, subtotal, divisa, tipoCambio]
  );

  // Eliminar un item de la lista
  const handleDeleteItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    // Si se elimina el ítem que se estaba editando, se descarta la edición
    if (id === itemEditandoId) limpiarFormularioItem();
  };

  const cancelarCotizacion = () => {
    navigate('/cotizaciones');
  };

  // El jefe valida al guardar: si el margen queda bajo el mínimo (o no se puede calcular), tiene que explicar por qué.
  const exigeJustificacion = esJefe && margenBajoMinimo(resultado.margen, margenMinimo);

  // Guarda la cotización en el backend. Si queda validada (la guardó el jefe) abre su PDF; si no, vuelve a la lista:
  // la estimación espera la decisión del jefe antes de poder enviarse al cliente.
  const guardarCotizacion = async () => {
    if (!modoEdicion && !clienteSeleccionado) {
      mostrarToastError('Selecciona un cliente de la lista de sugerencias.');
      return;
    }
    if (!solicitanteNombre.trim()) {
      mostrarToastError('Ingresa el nombre del solicitante.');
      return;
    }
    if (items.length === 0) {
      mostrarToastError('Agrega al menos un ítem a la cotización.');
      return;
    }
    if (cargandoCostos) {
      mostrarToastError('Espera a que terminen de cargar las tarifas.');
      return;
    }
    // La estimación de costos es obligatoria: sin ella no se guarda la cotización.
    if (problemas.length > 0) {
      mostrarToastError(problemas[0]);
      return;
    }
    if (exigeJustificacion && justificacion.trim().length < JUSTIFICACION_MINIMA) {
      mostrarToastError(`Explica por qué aceptas un margen bajo el mínimo (al menos ${JUSTIFICACION_MINIMA} caracteres).`);
      return;
    }

    const datos: CorregirCotizacionPayload = {
      solicitante: solicitanteNombre,
      moneda: divisa,
      garantiaMeses,
      items: items.map((item, indice) => ({
        tipo: item.tipo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        ...(item.costoUnitario !== undefined ? { costoUnitario: item.costoUnitario } : {}),
        orden: indice,
        ...(item.tipo === 'Impresora' && item.detalleImpresora
          ? { detalleImpresora: item.detalleImpresora }
          : {}),
      })),
      estimacion: aPayloadEstimacion(destino, tipoCambio, actividades),
      ...(exigeJustificacion ? { justificacion: justificacion.trim() } : {}),
    };

    const enviar = async () => {
      if (cotizacionId !== null) return corregirCotizacion(cotizacionId, datos);
      if (!clienteSeleccionado) throw new Error('Selecciona un cliente de la lista de sugerencias.');

      return crearCotizacion({
        ...datos,
        clienteId: clienteSeleccionado.clienteId,
        fecha: new Date().toISOString().split("T")[0],
        ...(solicitudId ? { solicitudId } : {}),
      });
    };

    setGuardando(true);
    try {
      const cotizacion = await enviar();

      if (cotizacion.estimacion.estado === 'VALIDADA') {
        // El aviso de éxito se muestra como toast en la pantalla del PDF (esta pantalla se desmonta al navegar)
        navigate(`/cotizaciones/${cotizacion.cotizacionId}/pdf`, { state: { cotizacionCreada: true } });
      } else {
        navigate('/cotizaciones', {
          state: {
            aviso: {
              title: modoEdicion ? 'Cotización reenviada' : 'Cotización enviada a validación',
              message: `${cotizacion.numeroCotizacion} espera la decisión del jefe. Podrás descargar el PDF cuando la valide.`,
            },
          },
        });
      }
    } catch (error) {
      mostrarToastError(error instanceof Error ? error.message : 'No se pudo guardar la cotización.');
    } finally {
      setGuardando(false);
    }
  }

  // Al corregir, el formulario espera a tener la cotización devuelta (o muestra por qué no se puede corregir)
  if (modoEdicion && (cargandoEdicion || errorEdicion)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#DCE4F3] font-sans antialiased">
        {cargandoEdicion ? (
          <>
            <LoadingSpinner />
            <p className="text-sm text-gray-600">Cargando cotización...</p>
          </>
        ) : (
          <>
            <p className="text-black">{errorEdicion}</p>
            <button
              type="button"
              onClick={cancelarCotizacion}
              className="px-6 py-2.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all shadow-md cursor-pointer"
            >
              Regresar a Cotizaciones
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased text-white select-none">

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">

        {/* Cabecera: Título */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={cancelarCotizacion}
            className="p-2 rounded-full bg-white text-black hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
            aria-label="Volver a Cotizaciones"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-bold text-black tracking-tight">
            {modoEdicion ? `Corregir cotización ${edicion?.numeroCotizacion ?? ''}` : 'Nueva cotización'}
          </h1>
        </div>

        {/* Por qué el jefe la devolvió */}
        {modoEdicion && edicion?.devolucion && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900 shadow-sm select-text">
            <p className="font-semibold">
              Devuelta por {edicion.devolucion.usuario} el {formatearFechaHora(edicion.devolucion.fecha)}
            </p>
            <p className="mt-1">{edicion.devolucion.motivo}</p>
          </div>
        )}

        {/* Contenedor del Formulario Principal */}
        <div className="w-full bg-[#222861] rounded-2xl p-8 shadow-lg flex-1 flex flex-col justify-between">

          {/* Grid central de dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* COLUMNA IZQUIERDA: Formulario de entrada de ítem */}
            <div className="lg:col-span-7 space-y-4">

              {/* SECCIÓN DATOS DEL CLIENTE EN 1 FILA */}
              <div className="space-y-2">
                <label className="block text-s font-normal text-white mb-2">Datos del cliente</label>

                {/* Grid de 3 inputs en la misma fila */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Nombre / Razón Social */}
                  <div
                    ref={contenedorClienteRef}
                    className="md:col-span-5 relative"
                  >
                    <input
                      type="text"
                      placeholder="Nombre/Razón Social"
                      value={clienteNombre}
                      onChange={(e) => {
                        setClienteSeleccionado(null);
                        setClienteNombre(e.target.value);
                      }}
                      onFocus={() => clienteNombre.trim() && setMostrarSugerencias(true)}
                      readOnly={modoEdicion}
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-sm md:text-sm outline-none shadow-sm"
                    />

                    {mostrarSugerencias && sugerencias.length > 0 && (
                      <ul className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto">
                        {sugerencias.map((cliente) => (
                          <li
                            key={cliente.clienteId}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarCliente(cliente);
                            }}
                            className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {cliente.nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Dirección (4 cols) */}
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-sm md:text-sm outline-none shadow-sm"
                      readOnly
                    />
                  </div>

                  {/* RUC */}
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      placeholder="RUC"
                      value={clienteRuc}
                      onChange={(e) => setClienteRuc(e.target.value)}
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-sm md:text-sm outline-none shadow-sm"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className='className="space-y-2'>
                <label className="block text-s font-normal text-white mb-2">Datos del solicitante</label>

                <div className='grid grid-cols-1 md:grid-cols-12 gap-3'>
                  {/* Nombre de solicitante */}
                  <div className="md:col-span-5 relative">
                    <input
                      type="text"
                      placeholder="Nombre de solicitante"
                      value={solicitanteNombre}
                      onChange={(e) => setSolicitanteNombre(e.target.value)}
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-sm md:text-sm outline-none shadow-sm"
                    />
                  </div>

                  {/* Divisa */}
                  <div className="relative md:col-span-4">
                    <select
                      value={divisa}
                      onChange={(e) => setDivisa(e.target.value)}
                      className="w-full h-10 appearance-none bg-white rounded-full px-4 pr-10 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                    >
                      <option value="" disabled>Seleccionar</option>
                      <option value="SOLES">SOLES</option>
                      <option value="DÓLARES">DÓLARES</option>
                    </select>
                    <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-black pointer-events-none" />
                  </div>

                  {/* Garantía del servicio */}
                  <div className="relative md:col-span-3">
                    <select
                      value={garantiaMeses}
                      onChange={(e) => setGarantiaElegida(Number(e.target.value))}
                      aria-label="Garantía del servicio"
                      title="Garantía del servicio: meses en los que se pueden programar mantenimiento y soporte"
                      className="w-full h-10 appearance-none bg-white rounded-full px-4 pr-10 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                    >
                      {GARANTIA_MESES_OPCIONES.map((meses) => (
                        <option key={meses} value={meses}>Garantía: {meses} meses</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-black pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Estimación de costos (obligatoria, uso interno: no aparece en el PDF) */}
              <HojaCostos
                cargando={cargandoCostos}
                errorTarifario={errorTarifario}
                destinos={tarifario?.destinos ?? [DESTINO_GENERAL]}
                destino={destino}
                onDestino={setDestino}
                moneda={divisa}
                tipoCambio={tipoCambio}
                onTipoCambio={setTipoCambio}
                actividades={actividades}
                onActividades={setActividades}
                resultado={resultado}
              />

              {/* Nombre y tipo del ítem */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2">
                <div className="md:col-span-8">
                  <label className="block text-s font-normal text-white mb-2">Nombre del ítem</label>
                  <input
                    type="text"
                    placeholder="Nombre del ítem"
                    value={nombreItem}
                    onChange={(e) => setNombreItem(e.target.value)}
                    className="w-full h-10 bg-white rounded-full px-5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
                  />
                </div>
                <div className="md:col-span-4 relative">
                  <label className="block text-s font-normal text-white mb-2">Tipo de ítem</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full h-10 appearance-none bg-white rounded-full px-4 pr-10 text-sm text-black shadow-sm cursor-pointer focus:outline-none"
                  >
                    <option value="" disabled>Seleccionar</option>
                    <option value="Producto">Producto</option>
                    <option value="Servicio">Servicio</option>
                    <option value="Alquiler">Alquiler</option>
                    <option value="Impresora">Impresora</option>
                  </select>
                  <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-black pointer-events-none" />
                </div>
              </div>

              {/* Fila de Descripción, Cantidad, Precio y Total */}
              <div className="grid grid-cols-12 gap-4">
                {/* Cuadro de Descripción */}
                <div className="col-span-5">
                  <textarea
                    placeholder="Descripción"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full h-40 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
                  />
                </div>

                {/* Campos numéricos al lado de descripción */}
                <div className="col-span-7 flex flex-col justify-between h-32">
                  <div className="flex gap-3">
                    {/* Cantidad */}
                    <div className="flex-1 space-y-1">
                      <label className="text-s text-white">Cantidad:</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                        className="w-full h-10 bg-white rounded-full px-4 text-black text-center text-sm outline-none shadow-sm my-2"
                      />
                    </div>
                    {/* Precio Unitario */}
                    <div className="flex-1 space-y-1">
                      <label className="text-s text-white">Precio unitario:</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value ? Number(e.target.value) : '')}
                        className="w-full h-10 bg-white rounded-full px-4 text-black text-center text-sm outline-none shadow-sm my-2"
                      />
                    </div>
                    {/* Costo de compra (uso interno): los servicios no lo llevan, su costo es la mano de obra */}
                    {TIPOS_CON_COSTO.includes(tipo) && (
                      <div className="flex-1 space-y-1">
                        <label className="text-s text-white" title="Uso interno: no aparece en el PDF">Costo de compra:</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="0.00"
                          value={costoCompra}
                          onChange={(e) => setCostoCompra(e.target.value ? Number(e.target.value) : '')}
                          className="w-full h-10 bg-white rounded-full px-4 text-black text-center text-sm outline-none shadow-sm my-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* Total del ítem actual */}
                  <div className="space-y-1">
                    <label className="text-s text-white">Subtotal: </label>
                    <div className="w-full bg-[#8E92A7] rounded-full py-2 text-black font-medium text-center text-sm shadow-inner my-2">
                      {totalItemActual.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* DESPLEGABLE: Detalles específicos del ítem */}
              {tipo === 'Impresora' && (
                <div className="mt-2 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    className="w-full bg-[#E2E4E9] rounded-full px-5 py-2.5 flex items-center justify-between text-black hover:bg-white transition-all shadow-sm focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-black" />
                      <span className="text-sm font-medium">Detalles específicos del ítem</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-black transition-transform duration-300 cursor-pointer ${isDetailsOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                    />
                  </button>

                  {(isDetailsOpen) && (
                    <DetalleItemImpresora
                      value={detalleImpresora}
                      onChange={actualizarDetalleImpresora}
                    />
                  )}
                </div>
              )}

              {/* BOTÓN PARA AGREGAR EL ÍTEM A LA LISTA */}
              <div className="pt-2 flex justify-end gap-3">
                {itemEditandoId !== null && (
                  <button
                    type="button"
                    onClick={limpiarFormularioItem}
                    className="px-6 py-2.5 bg-[#E2E4E9] text-gray-900 text-sm font-medium rounded-full hover:bg-white active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] text-white text-sm font-medium rounded-full hover:bg-[#4338CA] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  {itemEditandoId === null ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {itemEditandoId === null ? 'Agregar ítem' : 'Guardar cambios'}
                </button>
              </div>

            </div>

            {/* COLUMNA DERECHA: Lista de ítems añadidos */}
            <div className="lg:col-span-5 flex flex-col h-full justify-between space-y-3">

              {/* Contenedor de lista */}
              <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500 italic text-white">
                    No hay ítems agregados
                  </div>
                ) : (
                  items.map((item) => (
                    <CardItem
                      key={item.id}
                      id_item={item.id}
                      nombre={item.nombre}
                      tipo={item.tipo}
                      cantidad={item.cantidad}
                      total={item.total}
                      costoUnitario={item.costoUnitario}
                      enEdicion={item.id === itemEditandoId}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))
                )}
              </div>

              {/* Costo estimado y margen (uso interno): siempre a la vista mientras se arma la cotización */}
              <ResumenCostos
                resultado={resultado}
                problemas={problemas}
                cargando={cargandoCostos}
                moneda={divisa}
                margenMinimo={margenMinimo}
                errorParametros={errorParametros}
              />

              {/* Servicios cerrados parecidos: contraste del cálculo con la realidad */}
              <PanelAnaloga
                tema="oscuro"
                analoga={analoga}
                error={errorAnaloga}
                // Mientras solo esté el diagnóstico (ya pagado) no hay una estimación que corregir
                costoParametrico={resultado.directosFuturos > 0 ? resultado.costoTotal : 0}
                ventaSoles={resultado.ventaSoles}
                onCopiar={copiarParametros}
              />

              {/* Total acumulado general */}
              <div className='space-y-2.5 overflow-y-auto max-h-[350px] pr-1'>
                <div className="bg-[#8E92A7] rounded-xl p-3.5 flex items-center justify-between text-black font-bold shadow-inner mt-4">
                  <span className="text-sm font-medium">Total (+ IGV)</span>
                  <span className="text-base font-bold tracking-wide">{totalConIGV.toFixed(2)}</span>
                </div>

                {/* El jefe valida al guardar: con el margen bajo el mínimo tiene que dejar su justificación */}
                {exigeJustificacion && (
                  <div className="space-y-1 pt-2">
                    <label className="block text-sm text-white" htmlFor="justificacion-margen">
                      Justificación: el margen queda bajo el mínimo de {margenMinimo} %
                    </label>
                    <textarea
                      id="justificacion-margen"
                      placeholder="Por qué aceptas este margen (queda registrado)"
                      value={justificacion}
                      onChange={(e) => setJustificacion(e.target.value)}
                      className="w-full h-20 bg-white rounded-2xl p-3 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm select-text"
                    />
                  </div>
                )}

                <p className="text-sm text-slate-300 pt-2">
                  {esJefe
                    ? 'Como jefe, la cotización queda validada al guardar y podrás descargar su PDF.'
                    : 'Al guardar, la cotización se envía al jefe para su validación. Podrás descargar el PDF cuando la valide.'}
                </p>

                {/* Botones de acción inferiores */}
                <div className="flex justify-end items-center gap-5 pt-2">
                  <button onClick={guardarCotizacion} disabled={guardando}
                    className="px-8 py-2.5 bg-[#22C55E] text-black font-medium rounded-full hover:bg-[#16A34A] transition-all shadow-md text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {guardando
                      ? 'Guardando cotización...'
                      : esJefe
                        ? 'Guardar y validar'
                        : modoEdicion
                          ? 'Guardar y reenviar a validación'
                          : 'Guardar y enviar a validación'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarCotizacion}
                    className="px-8 py-2.5 bg-[#E2E4E9] text-gray-900 font-medium rounded-full hover:bg-white transition-all shadow-md text-sm border border-gray-300 cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Toast
          show={toast.show}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
};

export default NuevaCotizacionScreen;
