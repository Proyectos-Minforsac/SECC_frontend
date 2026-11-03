import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import TarifasVigentesTabla from '../components/TarifasVigentesTabla';
import HistorialTarifasTabla from '../components/HistorialTarifasTabla';
import NuevaTarifaModal from '../components/NuevaTarifaModal';
import ParametrosCostoForm from '../components/ParametrosCostoForm';
import { obtenerTarifario, registrarTarifa, etiquetaInductor, type NuevaTarifa, type Tarifario } from '../services/tarifario';
import { guardarParametros, obtenerParametros, type ParametrosCosto } from '../services/parametrosCosto';

const mensajeDe = (error: unknown, porDefecto: string) => (error instanceof Error ? error.message : porDefecto);

// Pantalla del jefe: tarifas de los inductores de costo (con su historial) y parámetros de control. El trabajador
// usa estos valores al cotizar, pero solo el jefe los modifica.
export default function TarifarioScreen() {
  const [tarifario, setTarifario] = useState<Tarifario | null>(null);
  const [parametros, setParametros] = useState<ParametrosCosto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [guardandoParametros, setGuardandoParametros] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const [tarifasRecibidas, parametrosRecibidos] = await Promise.all([obtenerTarifario(), obtenerParametros()]);
      setTarifario(tarifasRecibidas);
      setParametros(parametrosRecibidos);
    } catch (error) {
      setErrorCarga(mensajeDe(error, 'No se pudo cargar el tarifario.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleRegistrarTarifa = async (nueva: NuevaTarifa) => {
    if (registrando) return;

    setRegistrando(true);
    try {
      const creada = await registrarTarifa(nueva);
      // Se vuelve a pedir el tarifario: la nueva tarifa puede cambiar el estado de otras (reemplazadas) y los destinos.
      setTarifario(await obtenerTarifario());
      setModalAbierto(false);
      setToast({
        show: true,
        type: 'success',
        message:
          creada.estado === 'PROGRAMADA'
            ? `La tarifa de ${etiquetaInductor(creada.inductor).toLowerCase()} quedó programada.`
            : `La tarifa de ${etiquetaInductor(creada.inductor).toLowerCase()} quedó registrada.`,
      });
    } catch (error) {
      setToast({ show: true, type: 'error', message: mensajeDe(error, 'No se pudo registrar la tarifa.') });
    } finally {
      setRegistrando(false);
    }
  };

  const handleGuardarParametros = async (valores: Record<string, number | null>) => {
    if (guardandoParametros) return;

    setGuardandoParametros(true);
    try {
      setParametros(await guardarParametros(valores));
      setToast({ show: true, type: 'success', message: 'Los parámetros se guardaron.' });
    } catch (error) {
      setToast({ show: true, type: 'error', message: mensajeDe(error, 'No se pudieron guardar los parámetros.') });
    } finally {
      setGuardandoParametros(false);
    }
  };

  return (
    <div className="flex flex-1 bg-[#DCE4F3] font-sans antialiased">
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">Tarifario</h1>
          <button
            onClick={() => setModalAbierto(true)}
            disabled={!tarifario}
            className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            Nueva tarifa
          </button>
        </div>

        {cargando ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-gray-600">Cargando tarifario...</p>
          </div>
        ) : errorCarga || !tarifario || !parametros ? (
          <div className="flex flex-col items-center gap-4 h-64 justify-center">
            <p className="text-slate-600">{errorCarga || 'No se pudo cargar el tarifario.'}</p>
            <button
              onClick={cargar}
              className="px-5 py-1.5 bg-[#2A317A] text-white text-sm font-medium rounded-full hover:bg-[#1C2257] transition-colors shadow-sm cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-6xl">
            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Tarifas vigentes</h2>
                <p className="text-sm text-slate-500">
                  Montos por técnico en soles, sin IGV. Se usan al estimar el costo de una cotización.
                </p>
              </div>
              <TarifasVigentesTabla tarifario={tarifario} />
            </section>

            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Parámetros de control</h2>
                <p className="text-sm text-slate-500">
                  Los que no tienen valor por defecto siguen sin definir hasta que los ingreses.
                </p>
              </div>
              <ParametrosCostoForm
                parametros={parametros}
                guardando={guardandoParametros}
                onGuardar={handleGuardarParametros}
              />
            </section>

            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Historial de tarifas</h2>
                <p className="text-sm text-slate-500">Cada cambio queda registrado; las tarifas anteriores nunca se borran.</p>
              </div>
              <HistorialTarifasTabla tarifas={tarifario.tarifas} destinos={tarifario.destinos} />
            </section>
          </div>
        )}

        <NuevaTarifaModal
          isOpen={modalAbierto}
          destinos={tarifario?.destinos ?? []}
          guardando={registrando}
          onClose={() => setModalAbierto(false)}
          onGuardar={handleRegistrarTarifa}
        />

        <Toast
          show={toast.show}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      </main>
    </div>
  );
}
