import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronDown, List } from 'lucide-react';
import SideBarComponent from '../components/SideBar';
import CardItem from '../components/CotizacionItem';
import { obtenerClientes, type Cliente } from '../services/clientes';
import { useNavigate } from 'react-router-dom';
import {
  crearCotizacion,
  type CotizacionItem,
  type DetalleImpresora,
  type CrearCotizacionPayload,
} from '../services/cotizaciones';

// const TIPO_COTIZACION = ['Producto', 'Servicio', 'Alquiler', 'Impresora'];

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
              className="w-full h-10 bg-white rounded-full px-4 text-black text-xs outline-none shadow-sm"
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
              className="w-full h-10 bg-white rounded-full px-4 text-black text-xs outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Modelo</label>
            <input
              type="text"
              placeholder="Escriba el modelo"
              value={value.modelo}
              onChange={(e) => onChange('modelo', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-xs outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Número de serie</label>
            <input
              type="text"
              placeholder="Escriba el número de serie"
              value={value.numeroSerie}
              onChange={(e) => onChange('numeroSerie', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-xs outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Caso HD</label>
            <input
              type="text"
              placeholder="Escriba el caso HD"
              value={value.casoHD}
              onChange={(e) => onChange('casoHD', e.target.value)}
              className="w-full h-10 bg-white rounded-full px-4 text-black text-xs outline-none shadow-sm"
            />
          </div>
        </div>
      </div>
    </>
  )
}


export const CotizacionesScreen = () => {

  const navigate = useNavigate();

  // Estados globales para los datos del cliente
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [sugerencias, setSugerencias] = useState<Cliente[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const contenedorClienteRef = useRef<HTMLDivElement>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [clienteRuc, setClienteRuc] = useState('');
  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [divisa, setDivisa] = useState('SOLES');

  // Estados del formulario para agregar un ítem
  const [tipo, setTipo] = useState('');
  const [nombreItem, setNombreItem] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [precio, setPrecio] = useState<number | ''>('');

  // Detalles específicos cuando el ítem es de tipo "Impresora"
  const [detalleImpresora, setDetalleImpresora] = useState<DetalleImpresora>(detalleImpresoraVacio);

  const actualizarDetalleImpresora = (campo: keyof DetalleImpresora, valor: string) => {
    setDetalleImpresora((prev) => ({ ...prev, [campo]: valor }));
  };

  // Estado de ejemplo para los ítems agregados
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [guardando, setGuardando] = useState(false);

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
      alert("Ingrese el nombre del ítem");
      return;
    }

    // Si precio y cantidad son 0, es un título
    const esTitulo = Number(cantidad) === 0 && Number(precio) === 0;

    if (cantidad === '' && precio === '') {
      alert("Complete cantidad y precio, o coloque ambos en 0 si el ítem es un título.");
      return;
    }

    const newItem: CotizacionItem = {
      id: Date.now(),
      nombre: nombreItem,
      descripcion: descripcion,
      tipo: esTitulo ? "Título" : tipo,
      cantidad: Number(cantidad),
      precio: Number(precio),
      total: esTitulo ? 0 : totalItemActual,
      ...(tipo === 'Impresora' ? { detalleImpresora } : {}),
    };

    setItems([...items, newItem]);

    // Limpiar formulario de ítem tras agregar
    setNombreItem('');
    setTipo('');
    setDescripcion('');
    setCantidad('');
    setPrecio('');
    setDetalleImpresora(detalleImpresoraVacio);
    setIsDetailsOpen(false);
  };

  // Cálculo del total acumulado general
  const totalGeneral = items.reduce((acc, curr) => (acc + curr.total), 0);
  const subtotal = totalGeneral;
  const igv = subtotal * 0.18;
  const totalConIGV = subtotal + igv;

  // Eliminar un item de la lista
  const handleDeleteItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };


  // Guarda la cotización en el backend y luego navega al documento PDF
  const guardarCotizacion = async () => {
    if (!clienteSeleccionado) {
      alert('Selecciona un cliente de la lista de sugerencias.');
      return;
    }
    if (!solicitanteNombre.trim()) {
      alert('Ingresa el nombre del solicitante.');
      return;
    }
    if (items.length === 0) {
      alert('Agrega al menos un ítem a la cotización.');
      return;
    }

    const fecha = new Date().toISOString().split("T")[0];

    const payload: CrearCotizacionPayload = {
      clienteId: clienteSeleccionado.clienteId,
      fecha,
      solicitante: solicitanteNombre,
      moneda: divisa,
      items: items.map((item, indice) => ({
        tipo: item.tipo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        orden: indice,
        ...(item.tipo === 'Impresora' && item.detalleImpresora
          ? { detalleImpresora: item.detalleImpresora }
          : {}),
      })),
    };

    setGuardando(true);
    try {
      const cotizacion = await crearCotizacion(payload);
      alert(`Cotización ${cotizacion.numeroCotizacion ?? ''} guardada correctamente.`);

      navigate("/cotizacion-pdf", {
        state: {
          data: {
            cliente: clienteNombre,
            direccion: clienteDireccion,
            ruc: clienteRuc,
            fecha,
            solicitante: solicitanteNombre,
            moneda: divisa,
            numeroCotizacion: cotizacion.numeroCotizacion,
            subtotal: cotizacion.subtotal,
            igv: cotizacion.igv,
            total: cotizacion.total,
            items,
          },
        },
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo guardar la cotización.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#DCE4F3] font-sans antialiased text-white select-none">

      {/* 1. SIDEBAR (Menú Lateral) */}
      <SideBarComponent />

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">

        {/* Cabecera: Título */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Cotizaciones</h1>
        </div>

        {/* Contenedor del Formulario Principal */}
        <div className="w-full bg-[#222861] rounded-2xl p-8 shadow-lg flex-1 flex flex-col justify-between">

          {/* Grid central de dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* COLUMNA IZQUIERDA: Formulario de entrada de ítem */}
            <div className="lg:col-span-6 space-y-4">

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
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
                    />

                    {mostrarSugerencias && sugerencias.length > 0 && (
                      <ul className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto">
                        {sugerencias.map((cliente) => (
                          <li
                            key={cliente.clienteId}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Evita que el input pierda el foco antes de tiempo
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
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
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
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
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
                      className="w-full h-10 bg-white rounded-full px-4 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
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
                </div>
              </div>

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
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] text-white text-sm font-medium rounded-full hover:bg-[#4338CA] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Agregar ítem
                </button>
              </div>

            </div>

            {/* COLUMNA DERECHA: Lista de ítems añadidos */}
            <div className="lg:col-span-6 flex flex-col h-full justify-between space-y-3">

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
                      onDelete={handleDeleteItem}
                    />
                  ))
                )}
              </div>

              {/* Total acumulado general */}
              <div className='space-y-2.5 overflow-y-auto max-h-[350px] pr-1'>
                <div className="bg-[#8E92A7] rounded-xl p-3.5 flex items-center justify-between text-black font-bold shadow-inner mt-4">
                  <span className="text-sm font-medium">Total (+ IGV)</span>
                  <span className="text-base font-bold tracking-wide">{totalConIGV.toFixed(2)}</span>
                </div>

                {/* Botones de acción inferiores */}
                <div className="flex justify-end items-center gap-5 pt-2">
                  <button onClick={guardarCotizacion} disabled={guardando}
                    className="px-8 py-2.5 bg-[#22C55E] text-black font-medium rounded-full hover:bg-[#16A34A] transition-all shadow-md text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button className="px-8 py-2.5 bg-[#E2E4E9] text-gray-900 font-medium rounded-full hover:bg-white transition-all shadow-md text-sm border border-gray-300 cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CotizacionesScreen;