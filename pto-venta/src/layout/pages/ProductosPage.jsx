import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMemo, useState } from 'react';
import { useProductos } from '../../hooks/useProductos';
import Tarjeta from '../../components/Tarjeta';
import Modal from '../../components/Modal';
import ProductoForm from '../../components/productos/ProductoForm';
import ComboForm from '../../components/productos/ComboForm';
import EliminarProducto from '../../components/productos/EliminarProducto';
import { ETIQUETA_TIPO, formatoPrecio } from '../../utils/formato';

const ACCIONES = [
    { id: 'producto', label: 'Agregar producto', icono: '➕' },
    { id: 'combo', label: 'Crear combo', icono: '🎁' },
    { id: 'servicio', label: 'Agregar servicio', icono: '🛎️' },
    { id: 'eliminar', label: 'Eliminar producto', icono: '🗑️', peligro: true },
    { id: 'conteo', label: 'Conteo de stock', icono: '📋', path: "/productos/conteo"},
];

export default function ProductosPage() {
    const { empresaActiva } = useAuth();
    const navigate = useNavigate();
    const { productos, cargando, error, recargar } = useProductos();
    const [busqueda, setBusqueda] = useState('');

    const [accion, setAccion] = useState(null); // 'producto' | 'servicio' | 'combo' | 'eliminar' | null
    const [ocupado, setOcupado] = useState(false);
    const cerrar = () => { setOcupado(false); setAccion(null); };
    const alGuardar = () => { cerrar(); recargar(); };

    const categorias = useMemo(
        () => [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort(),
        [productos]
    );

    const filtrados = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return t ? productos.filter((p) => p.nombre.toLowerCase().includes(t)) : productos;
    }, [productos, busqueda]);

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div className="cabecera__izq">
                    <button
                        type="button"
                        className="btn-sec btn-volver"
                        onClick={() => navigate('/dashboard')}
                        aria-label="Volver al dashboard"
                    >
                        ←
                    </button>
                    <div>
                        <h1>Productos</h1>
                        <p>{empresaActiva?.nombre || empresaActiva?.id}</p>
                    </div>
                </div>
            </header>

            <section className="tarjetas tarjetas--compactas">
                {ACCIONES.map((a) => (
                    <Tarjeta
                        key={a.id}
                        icono={a.icono}
                        label={a.label}
                        peligro={a.peligro}
                        onClick={() => (a.path ? navigate(a.path) : setAccion(a.id))}
                    />
                ))}
            </section>

            <section className="productos__lista">
                <input
                    type="search"
                    className="buscador"
                    placeholder="Buscar producto…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />

                {cargando && <p className="vacio">Cargando productos…</p>}

                {error && (
                    <p className="error-msg">
                        {error}{' '}
                        <button type="button" className="btn-sec" onClick={recargar}>Reintentar</button>
                    </p>
                )}

                {!cargando && !error && productos.length === 0 && (
                    <p className="vacio">Todavía no cargaste productos.</p>
                )}

                {!cargando && !error && productos.length > 0 && filtrados.length === 0 && (
                    <p className="vacio">No hay productos que coincidan con la búsqueda.</p>
                )}

                {!cargando && !error && filtrados.length > 0 && (
                    <div className="tabla-contenedor">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Categoría</th>
                                    <th className="num">Precio</th>
                                    <th className="num">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((p) => {
                                    const stockBajo = p.stockeable && p.avisarStockMinimo && p.stock <= p.stockMinimo;
                                    return (
                                        <tr key={p._id}>
                                            <td>{p.nombre}</td>
                                            <td>
                                                <span className="badge">
                                                    {ETIQUETA_TIPO[p.tipo] || p.tipo}
                                                    {p.tipo === 'COMBO' && ` (${p.productos?.length ?? 0})`}
                                                </span>
                                            </td>
                                            <td>{p.categoria || '—'}</td>
                                            <td className="num">{formatoPrecio.format(p.precioVenta)}</td>
                                            <td className="num">
                                                {p.stockeable ? p.stock : '—'}{' '}
                                                {stockBajo && <span className="badge badge--alerta">Stock bajo</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {accion === 'producto' && (
                <Modal titulo="Agregar producto" onCerrar={cerrar} cerrable={!ocupado}>
                    <ProductoForm tipo="PRODUCTO" categorias={categorias} onGuardado={alGuardar} onCancelar={cerrar} onOcupado={setOcupado} />
                </Modal>
            )}
            {accion === 'servicio' && (
                <Modal titulo="Agregar servicio" onCerrar={cerrar} cerrable={!ocupado}>
                    <ProductoForm tipo="SERVICIO" categorias={categorias} onGuardado={alGuardar} onCancelar={cerrar} onOcupado={setOcupado} />
                </Modal>
            )}
            {accion === 'combo' && (
                <Modal titulo="Crear combo" onCerrar={cerrar}>
                    <ComboForm productos={productos} onGuardado={alGuardar} onCancelar={cerrar} />
                </Modal>
            )}
            {accion === 'eliminar' && (
                <Modal titulo="Eliminar producto" onCerrar={cerrar}>
                    <EliminarProducto productos={productos} onEliminado={alGuardar} onCancelar={cerrar} />
                </Modal>
            )}

        </div>
    );
}