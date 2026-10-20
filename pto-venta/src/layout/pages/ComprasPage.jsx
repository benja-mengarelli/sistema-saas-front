import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompras } from '../../hooks/useCompras';
import Tarjeta from '../../components/Tarjeta';
import Modal from '../../components/Modal';
import NuevaCompraForm from '../../components/compras/NuevaCompraForm';
import DetalleCompra from '../../components/compras/DetalleCompra';
import PantallaCarga from '../PantallaCarga'; 
import { formatoFechaHora, formatoPrecio } from '../../utils/formato';

const DIAS = 15;

export default function ComprasPage() {
    const { empresaActiva } = useAuth();
    const navigate = useNavigate();
    const { compras, primeraCarga, error, recargar } = useCompras(DIAS);

    const [busqueda, setBusqueda] = useState('');
    const [nueva, setNueva] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    const [seleccionada, setSeleccionada] = useState(null);

    const proveedores = useMemo(
        () => [...new Set(compras.map((c) => c.proveedorNombre).filter(Boolean))].sort(),
        [compras]
    );

    const filtradas = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return t ? compras.filter((c) => (c.proveedorNombre || '').toLowerCase().includes(t)) : compras;
    }, [compras, busqueda]);

    if (primeraCarga) return <PantallaCarga />;

    const cerrarNueva = () => { setOcupado(false); setNueva(false); };
    const alGuardar = () => { cerrarNueva(); recargar(); };

    const abrirConTeclado = (e, c) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSeleccionada(c);
        }
    };

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div className="cabecera__izq">
                    <button type="button" className="btn-sec btn-volver" onClick={() => navigate('/dashboard')} aria-label="Volver al dashboard">←</button>
                    <div>
                        <h1>Compras</h1>
                        <p>{empresaActiva?.nombre || empresaActiva?.id} · últimos {DIAS} días</p>
                    </div>
                </div>
            </header>

            <section className="tarjetas tarjetas--compactas">
                <Tarjeta icono="➕" label="Nueva compra" onClick={() => setNueva(true)} />
            </section>

            <section className="productos__lista">
                <input
                    type="search" className="buscador" placeholder="Buscar por proveedor…"
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                />

                {error && (
                    <p className="error-msg">
                        {error}{' '}
                        <button type="button" className="btn-sec" onClick={recargar}>Reintentar</button>
                    </p>
                )}

                {!error && compras.length === 0 && (
                    <p className="vacio">No hay compras en los últimos {DIAS} días.</p>
                )}

                {!error && compras.length > 0 && filtradas.length === 0 && (
                    <p className="vacio">No hay compras de ese proveedor.</p>
                )}

                {!error && filtradas.length > 0 && (
                    <div className="tabla-contenedor">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Proveedor</th>
                                    <th className="num">Ítems</th>
                                    <th className="num">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtradas.map((c) => (
                                    <tr
                                        key={c._id} className="fila-click" tabIndex={0}
                                        onClick={() => setSeleccionada(c)} onKeyDown={(e) => abrirConTeclado(e, c)}
                                    >
                                        <td>{formatoFechaHora(c.createdAt)}</td>
                                        <td>
                                            {c.proveedorNombre || 'Proveedor'}{' '}
                                            {c.estado === 'ANULADA' && <span className="badge badge--alerta">Anulada</span>}
                                        </td>
                                        <td className="num">{c.cantidadItems}</td>
                                        <td className="num">{formatoPrecio.format(c.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {nueva && (
                <Modal titulo="Nueva compra" ancho cerrable={!ocupado} onCerrar={cerrarNueva}>
                    <NuevaCompraForm
                        proveedores={proveedores}
                        onGuardado={alGuardar}
                        onCancelar={cerrarNueva}
                        onOcupado={setOcupado}
                    />
                </Modal>
            )}

            {seleccionada && (
                <Modal titulo="Detalle de la compra" ancho onCerrar={() => setSeleccionada(null)}>
                    <DetalleCompra resumen={seleccionada} />
                </Modal>
            )}
        </div>
    );
}