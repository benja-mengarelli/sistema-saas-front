import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCaja } from '../../hooks/useCaja';
import { useProductos } from '../../hooks/useProductos';
import { useCarrito } from '../../hooks/useCarrito';
import { useCuentasCorrientes } from '../../hooks/useCuentasCorrientes';
import { stockDisponible } from '../../utils/stock';
import { nuevaClave } from '../../utils/id';
import BarraCaja from '../../components/pos/BarraCaja';
import GrillaProductos from '../../components/pos/GrillaProductos';
import CarritoPanel from '../../components/pos/CarritoPanel';
import CobrarForm from '../../components/pos/CobrarForm';
import AgregarACCForm from '../../components/pos/AgregarACCForm';
import CuentasCorrientes from '../../components/pos/CuentasCorrientes';
import Modal from '../../components/Modal';
import PantallaCarga from '../PantallaCarga';

export default function PuntoVentaPage() {
    const { empresaActiva, empresaActivaId } = useAuth();
    const navigate = useNavigate();
    const { caja, resumen, primeraCarga: cargandoCaja, error: errorCaja, recargar: recargarCaja } = useCaja();
    const { productos, primeraCarga: cargandoProductos, error: errorProductos, recargar: recargarProductos } = useProductos();
    const { cuentas, cargando: cargandoCuentas, error: errorCuentas, recargar: recargarCuentas } = useCuentasCorrientes(empresaActivaId);

    const porId = useMemo(() => new Map(productos.map((p) => [p._id, p])), [productos]);
    const carrito = useCarrito(empresaActivaId, porId);

    const [modo, setModo] = useState('VENTA'); // 'VENTA' | 'CC'
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [cobrando, setCobrando] = useState(false);
    const [agregandoCC, setAgregandoCC] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    const claveRef = useRef(null);   // cobro: se conserva hasta que la venta se concreta
    const claveCCRef = useRef(null); // agregar a CC: ídem

    const enCarrito = useMemo(() => new Map(carrito.lineas.map((l) => [l.producto, l.cantidad])), [carrito.lineas]);

    if (cargandoCaja || cargandoProductos) return <PantallaCarga />;

    const disponible = (p) => stockDisponible(p, porId);

    const abrirCobro = () => {
        claveRef.current ??= nuevaClave();
        setCobrando(true);
    };
    const cerrarCobro = () => { setOcupado(false); setCobrando(false); };
    const alVender = () => {
        claveRef.current = null;
        carrito.vaciar();
        recargarCaja();
        recargarProductos();
    };

    const abrirAgregarCC = () => {
        claveCCRef.current ??= nuevaClave();
        setAgregandoCC(true);
    };
    const cerrarAgregarCC = () => { setOcupado(false); setAgregandoCC(false); };
    const alAgregarCC = () => {
        claveCCRef.current = null;
        carrito.vaciar();
        recargarProductos(); // el stock ya salió
        recargarCuentas();
        cerrarAgregarCC();
    };

    const hayError = errorCaja || errorProductos;

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div className="cabecera__izq">
                    <button type="button" className="btn-sec btn-volver" onClick={() => navigate('/dashboard')} aria-label="Volver al dashboard">←</button>
                    <div>
                        <h1>Punto de venta</h1>
                        <p>{empresaActiva?.nombre || empresaActiva?.id}</p>
                    </div>
                </div>
                <div className="modo" role="group" aria-label="Modo">
                    <button type="button" className={modo === 'VENTA' ? 'modo__btn modo__btn--on' : 'modo__btn'}
                        aria-pressed={modo === 'VENTA'} onClick={() => setModo('VENTA')}>Venta</button>
                    <button type="button" className={modo === 'CC' ? 'modo__btn modo__btn--on' : 'modo__btn'}
                        aria-pressed={modo === 'CC'} onClick={() => setModo('CC')}>
                        Cuentas corrientes{cuentas.length > 0 && ` (${cuentas.length})`}
                    </button>
                </div>
            </header>

            {hayError && (
                <p className="error-msg">
                    {hayError}{' '}
                    <button type="button" className="btn-sec" onClick={() => { recargarCaja(); recargarProductos(); }}>Reintentar</button>
                </p>
            )}

            {!errorCaja && <BarraCaja caja={caja} resumen={resumen} onCambio={recargarCaja} />}

            {modo === 'VENTA' ? (
                <>
                    <div className="pv">
                        <section>
                            <GrillaProductos
                                productos={productos}
                                disponible={disponible}
                                enCarrito={enCarrito}
                                onAgregar={(p) => carrito.agregar(p._id, disponible(p))}
                            />
                        </section>

                        <aside className={`pv__carrito${panelAbierto ? ' pv__carrito--abierto' : ''}`}>
                            <CarritoPanel
                                lineas={carrito.lineas}
                                total={carrito.total}
                                hayCaja={Boolean(caja)}
                                disponible={disponible}
                                onSumar={(p) => carrito.agregar(p._id, disponible(p))}
                                onRestar={carrito.restar}
                                onQuitar={carrito.quitar}
                                onVaciar={carrito.vaciar}
                                onCobrar={abrirCobro}
                                onAgregarCC={abrirAgregarCC}
                                onCerrarPanel={() => setPanelAbierto(false)}
                            />
                        </aside>
                    </div>

                    <button type="button" className="pv-fab" onClick={() => setPanelAbierto((o) => !o)} aria-label="Ver carrito">
                        🛒 {carrito.cantidadTotal > 0 && <span>{carrito.cantidadTotal}</span>}
                    </button>
                </>
            ) : (
                <CuentasCorrientes
                    cuentas={cuentas}
                    cargando={cargandoCuentas}
                    error={errorCuentas}
                    onRecargar={recargarCuentas}
                    hayCaja={Boolean(caja)}
                    onCajaCambio={recargarCaja}
                />
            )}

            {cobrando && (
                <Modal titulo="Cobrar" cerrable={!ocupado} onCerrar={cerrarCobro}>
                    <CobrarForm
                        lineas={carrito.lineas}
                        total={carrito.total}
                        clave={claveRef.current}
                        onVendida={alVender}
                        onTerminar={cerrarCobro}
                        onCancelar={cerrarCobro}
                        onOcupado={setOcupado}
                    />
                </Modal>
            )}

            {agregandoCC && (
                <Modal titulo="Agregar a cuenta corriente" cerrable={!ocupado} onCerrar={cerrarAgregarCC}>
                    <AgregarACCForm
                        lineas={carrito.lineas}
                        total={carrito.total}
                        cuentas={cuentas}
                        clave={claveCCRef.current}
                        onAgregado={alAgregarCC}
                        onCancelar={cerrarAgregarCC}
                        onOcupado={setOcupado}
                    />
                </Modal>
            )}
        </div>
    );
}