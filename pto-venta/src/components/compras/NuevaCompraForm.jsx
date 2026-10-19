import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProductos } from '../../hooks/useProductos';
import { crearCompra } from '../../api/comprasApi';
import { formatoPrecio } from '../../utils/formato';

let contador = 0;
const nuevoId = () => `linea-${++contador}`;
const subtotal = (l) => (Number(l.cantidad) || 0) * (Number(l.costo) || 0);

export default function NuevaCompraForm({ proveedores = [], onGuardado, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const { productos, cargando: cargandoProductos, error: errorProductos } = useProductos();

    const [proveedor, setProveedor] = useState('');
    const [lineas, setLineas] = useState([]); // { key, producto, nombre, cantidad, costo }
    const [busqueda, setBusqueda] = useState('');
    const [actualizarCosto, setActualizarCosto] = useState(true);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Comprables: con control de stock y que no sean combos
    const comprables = useMemo(
        () => productos.filter((p) => p.stockeable && p.tipo !== 'COMBO'),
        [productos]
    );

    const texto = busqueda.trim();
    const coincidencias = useMemo(() => {
        if (!texto) return [];
        const t = texto.toLowerCase();
        return comprables.filter((p) => p.nombre.toLowerCase().includes(t)).slice(0, 6);
    }, [comprables, texto]);

    const total = lineas.reduce((s, l) => s + subtotal(l), 0);

    const agregarProducto = (p) => {
        setLineas((ls) => {
            const existente = ls.find((l) => l.producto === p._id);
            if (existente) {
                return ls.map((l) =>
                    l === existente ? { ...l, cantidad: String((Number(l.cantidad) || 0) + 1) } : l
                );
            }
            return [...ls, {
                key: nuevoId(), producto: p._id, nombre: p.nombre,
                cantidad: '1', costo: String(p.precioCompra ?? 0),
            }];
        });
        setBusqueda('');
    };

    const agregarLibre = () => {
        setLineas((ls) => [...ls, { key: nuevoId(), producto: null, nombre: texto, cantidad: '1', costo: '' }]);
        setBusqueda('');
    };

    const cambiar = (key, campo, valor) =>
        setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)));
    const quitar = (key) => setLineas((ls) => ls.filter((l) => l.key !== key));

    // Enter en el buscador agrega, no envía el formulario
    const alTeclearBuscador = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (coincidencias.length === 1) agregarProducto(coincidencias[0]);
        else if (coincidencias.length === 0 && texto) agregarLibre();
    };

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        setError(null);

        if (lineas.length === 0) return setError('Agregá al menos un ítem');
        if (lineas.some((l) => !(Number(l.cantidad) > 0))) return setError('Cada cantidad debe ser mayor a 0');
        if (lineas.some((l) => l.costo === '' || Number(l.costo) < 0)) return setError('Completá el costo de cada ítem');

        setGuardando(true);
        onOcupado?.(true);
        try {
            await crearCompra(empresaActivaId, {
                proveedor: { nombre: proveedor.trim() },
                items: lineas.map((l) => ({
                    producto: l.producto || undefined,
                    descripcion: l.producto ? undefined : l.nombre,
                    cantidad: Number(l.cantidad),
                    costoUnitario: Number(l.costo),
                    actualizarPrecioCompra: actualizarCosto && Boolean(l.producto),
                })),
            });
            onGuardado();
        } catch (err) {
            setError(err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="campo">
                    <label htmlFor="nc-proveedor">Proveedor (opcional)</label>
                    <input id="nc-proveedor" type="text" list="nc-proveedores" value={proveedor} onChange={(e) => setProveedor(e.target.value)} autoFocus />
                    <datalist id="nc-proveedores">
                        {proveedores.map((p) => <option key={p} value={p} />)}
                    </datalist>
                </div>

                <div className="campo">
                    <label htmlFor="nc-buscar">Agregar ítem</label>
                    <input
                        id="nc-buscar" type="search" value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)} onKeyDown={alTeclearBuscador}
                        placeholder="Buscá un producto o escribí un ítem nuevo…"
                    />
                    {cargandoProductos && <p className="ayuda">Cargando productos…</p>}
                    {errorProductos && <p className="ayuda">No se pudieron cargar los productos; podés agregar ítems sin producto.</p>}
                </div>

                {texto && (
                    <ul className="lista-seleccion">
                        {coincidencias.map((p) => (
                            <li key={p._id}>
                                <button type="button" className="item-seleccion" onClick={() => agregarProducto(p)}>
                                    <span>{p.nombre}</span>
                                    <span className="ayuda">Stock: {p.stock}</span>
                                </button>
                            </li>
                        ))}
                        <li>
                            <button type="button" className="item-seleccion" onClick={agregarLibre}>
                                <span>Agregar «{texto}» sin producto</span>
                                <span className="ayuda">no mueve stock</span>
                            </button>
                        </li>
                    </ul>
                )}

                {lineas.length > 0 && (
                    <div className="form">
                        {lineas.map((l) => (
                            <div className="linea-compra" key={l.key}>
                                <span>
                                    {l.nombre} {!l.producto && <span className="badge">Sin producto</span>}
                                </span>
                                <input
                                    type="number" min="0" step="any" value={l.cantidad}
                                    onChange={(e) => cambiar(l.key, 'cantidad', e.target.value)}
                                    aria-label={`Cantidad de ${l.nombre}`}
                                />
                                <input
                                    type="number" min="0" step="any" value={l.costo} placeholder="Costo"
                                    onChange={(e) => cambiar(l.key, 'costo', e.target.value)}
                                    aria-label={`Costo unitario de ${l.nombre}`}
                                />
                                <span className="num">{formatoPrecio.format(subtotal(l))}</span>
                                <button type="button" className="btn-sec" onClick={() => quitar(l.key)} aria-label={`Quitar ${l.nombre}`}>✕</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="campo campo--check">
                    <input id="nc-costo" type="checkbox" checked={actualizarCosto} onChange={(e) => setActualizarCosto(e.target.checked)} />
                    <label htmlFor="nc-costo">Actualizar el costo de los productos con esta compra</label>
                </div>

                <div className="resumen">
                    <p>Total: <strong>{formatoPrecio.format(total)}</strong></p>
                </div>

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Guardando…</> : 'Registrar compra'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}

pages/ComprasPage.jsx

jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompras } from '../hooks/useCompras';
import Tarjeta from '../components/Tarjeta';
import Modal from '../components/Modal';
import NuevaCompraForm from '../components/compras/NuevaCompraForm';
import DetalleCompra from '../components/compras/DetalleCompra';
import PantallaCarga from '../components/PantallaCarga'; // ajustar nombre y path
import { formatoFechaHora, formatoPrecio } from '../utils/formato';
import '../styles/pantallas.css';

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