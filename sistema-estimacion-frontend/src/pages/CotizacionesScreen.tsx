import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronDown, List } from 'lucide-react';
import SideBarComponent from '../components/SideBar';
import CardItem from '../components/CotizacionItem';
import { obtenerClientes, type Cliente } from '../services/clientes';
import { useNavigate } from 'react-router-dom';
import type { CotizacionItem } from '../types/types';

export const CotizacionesScreen = () => {

  const navigate = useNavigate();

  // Estados globales para los datos del cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [tipoPersona, setTipoPersona] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sugerencias, setSugerencias] = useState<Cliente[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const inputClienteRef = useRef<HTMLInputElement>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // const [ruc, setRuc] = useState('');

  // Estados del formulario para agregar un ítem
  const [tipo, setTipo] = useState('');
  const [nombreItem, setNombreItem] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [precio, setPrecio] = useState<number | ''>('');

  // Estado de ejemplo para los ítems agregados
  const [items, setItems] = useState<CotizacionItem[]>([]);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const data = await obtenerClientes();
        setClientes(data);
      } catch (error) {
        console.error('Error al cargar clientes', error);
      }
    };

    cargarClientes();
  }, []);

  useEffect(() => {
    const manejarClicFuera = (event: MouseEvent) => {
      if (
        inputClienteRef.current &&
        !inputClienteRef.current.contains(event.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', manejarClicFuera);
    return () => document.removeEventListener('mousedown', manejarClicFuera);
  }, []);

  useEffect(() => {
    if (!clienteNombre.trim()) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const texto = clienteNombre.toLowerCase();
    const filtrados = clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(texto)
    );

    setSugerencias(filtrados.slice(0, 6));
    setMostrarSugerencias(filtrados.length > 0);
  }, [clienteNombre, clientes]);

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteNombre(cliente.nombre);
    setClienteDireccion(cliente.direccion);
    setTipoPersona(cliente.tipo_persona);
    setMostrarSugerencias(false);
  };

  // Cálculo automático del total del ítem actual
  const totalItemActual = (Number(cantidad) || 0) * (Number(precio) || 0);

  // Función para agregar un nuevo ítem a la columna derecha
  const handleAddItem = () => {
    if (!nombreItem || !tipo || !cantidad || !precio) {
      alert('Por favor completa los campos principales del ítem.');
      return;
    }

    const newItem: CotizacionItem = {
      id: Date.now(),
      nombre: nombreItem,
      descripcion: descripcion,
      tipo: tipo === 'producto' ? 'Producto' : 'Servicio',
      cantidad: Number(cantidad),
      precio: Number(precio),
      total: totalItemActual,
    };

    setItems([...items, newItem]);

    // Limpiar formulario de ítem tras agregar
    setNombreItem('');
    setTipo('');
    setDescripcion('');
    setCantidad('');
    setPrecio('');
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


  // Envío a documento PDF
  const enviarParaDocumento = () => {
    if (!clienteNombre || !clienteDireccion || !tipoPersona) {
      alert('Por favor completa los campos principales del ítem.');
      return;
    }

    navigate("/cotizacion-pdf", {
      state: {
        data: {
          cliente: clienteNombre,
          direccion: clienteDireccion,
          tipo_persona: tipoPersona,
          fecha: new Date().toISOString().split("T")[0],
          solicitante: 'Juan Perez',
          moneda: "SOLES",
          items,
        },
      },
    });
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
            <div className="lg:col-span-7 space-y-4">

              {/* SECCIÓN DATOS DEL CLIENTE EN 1 FILA */}
              <div className="space-y-2">
                <label className="block text-s font-normal text-white mb-2">Datos del cliente</label>

                {/* Grid de 3 inputs en la misma fila */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Nombre / Razón Social (5 cols) */}
                  <div className="md:col-span-5 relative">
                    <input
                      ref={inputClienteRef}
                      type="text"
                      placeholder="Nombre/Razón Social"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      onFocus={() => clienteNombre.trim() && setMostrarSugerencias(true)}
                      className="w-full bg-white rounded-full px-4 py-2 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
                    />

                    {mostrarSugerencias && sugerencias.length > 0 && (
                      <ul className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto">
                        {sugerencias.map((cliente) => (
                          <li
                            key={cliente.cliente_id}
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
                      className="w-full bg-white rounded-full px-4 py-2 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
                      readOnly
                    />
                  </div>

                  {/* Tipo Persona */}
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      placeholder="Tipo Persona"
                      value={tipoPersona}
                      onChange={(e) => setTipoPersona(e.target.value)}
                      className="w-full bg-white rounded-full px-4 py-2 text-black placeholder-gray-500 text-xs md:text-sm outline-none shadow-sm"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Ítem */}
              <div className="space-y-2 pt-2">
                <label className="block text-s font-normal text-white mb-2">Tipo de ítem</label>
                <div className="w-44">
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full appearance-none bg-white rounded-full px-4 py-2 pr-10 text-sm text-black shadow-sm cursor-pointer focus:outline-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.8rem_center] bg-no-repeat"
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
              </div>

              {/* Nombre del ítem */}
              <div>
                <input
                  type="text"
                  placeholder="Nombre del ítem"
                  value={nombreItem}
                  onChange={(e) => setNombreItem(e.target.value)}
                  className="w-full bg-white rounded-full px-5 py-2.5 text-black placeholder-gray-500 text-sm outline-none shadow-sm"
                />
              </div>

              {/* Fila de Descripción, Cantidad, Precio y Total */}
              <div className="grid grid-cols-12 gap-4">
                {/* Cuadro de Descripción */}
                <div className="col-span-5">
                  <textarea
                    placeholder="Descripción"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full h-32 bg-white rounded-2xl p-4 text-black placeholder-gray-500 text-sm outline-none resize-none shadow-sm"
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
                        className="w-full bg-white rounded-full px-4 py-1.5 text-black text-center text-sm outline-none shadow-sm"
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
                        className="w-full bg-white rounded-full px-4 py-1.5 text-black text-center text-sm outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Total del ítem actual */}
                  <div className="space-y-1">
                    <label className="text-s text-white">Total:</label>
                    <div className="w-full bg-[#8E92A7] rounded-full py-2 text-black font-medium text-center text-sm shadow-inner">
                      {totalItemActual.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* DESPLEGABLE: Detalles específicos del ítem */}
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
                    className={`w-4 h-4 text-black transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                  />
                </button>

                {isDetailsOpen && (
                  <div className="bg-[#1C204E] rounded-2xl p-4 space-y-3 border border-[#343C8F] transition-all duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Código / SKU</label>
                        <input
                          type="text"
                          placeholder="SKU-0000"
                          className="w-full bg-white rounded-full px-4 py-1.5 text-black text-xs outline-none shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Descuento (%)</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full bg-white rounded-full px-4 py-1.5 text-black text-xs outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Notas internas / Garantía</label>
                      <input
                        type="text"
                        placeholder="Ej. Garantía de 12 meses..."
                        className="w-full bg-white rounded-full px-4 py-1.5 text-black text-xs outline-none shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BOTÓN PARA AGREGAR EL ÍTEM A LA LISTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] active:scale-95 transition-all shadow-md border border-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Agregar ítem
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
                      onDelete={handleDeleteItem}
                    />
                  ))
                )}
              </div>

              {/* Total acumulado general */}
              <div className="bg-[#8E92A7] rounded-xl p-3.5 flex items-center justify-between text-black font-bold shadow-inner mt-4">
                <span className="text-sm font-medium">Total (+ IGV)</span>
                <span className="text-base font-bold tracking-wide">{totalConIGV.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botones de acción inferiores */}
          <div className="flex justify-center items-center gap-5 mt-8 pt-4">
            <button onClick={enviarParaDocumento}
              className="px-8 py-2.5 bg-[#343C8F] text-white font-medium rounded-full hover:bg-[#282E6E] transition-all shadow-md text-sm cursor-pointer">
              Guardar cotización
            </button>
            <button className="px-8 py-2.5 bg-[#E2E4E9] text-gray-900 font-medium rounded-full hover:bg-white transition-all shadow-md text-sm border border-gray-300 cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CotizacionesScreen;