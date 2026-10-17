import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crearProducto } from '../../api/productosApi';
import { ETIQUETA_TIPO, formatoPrecio } from '../../utils/formato';

export default function ComboForm({ productos, onGuardado, onCancelar }) {
    const { empresaActivaId } = useAuth();
    const [nombre, setNombre] = useState('');
    const [precioVenta, setPrecioVenta] = useState('');
    const [lineas, setLineas] = useState([]); // [{ id, cantidad }]
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Un combo puede mezclar productos y servicios, pero no otros combos
    const disponibles = useMemo(() => productos.filter((p) => p.tipo !== 'COMBO'), [productos]);
    const porId = useMemo(() => Object.fromEntries(disponibles.map((p) => [p._id, p])), [disponibles]);

    const candidatos = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return disponibles.filter(
            (p) => !lineas.some((l) => l.id === p._id) && p.nombre.toLowerCase().includes(t)
        );
    }, [disponibles, lineas, busqueda]);

    const sumar = (campo) =>
        lineas.reduce((s, l) => s + (porId[l.id]?.[campo] || 0) * (Number(l.cantidad) || 0), 0);
    const sugeridoVenta = sumar('precioVenta');
    const costo = sumar('precioCompra');

    const agregar = (p) => setLineas((ls) => [...ls, { id: p._id, cantidad: '1' }]);
    const quitar = (id) => setLineas((ls) => ls.filter((l) => l.id !== id));
    const cambiarCantidad = (id, cantidad) =>
        setLineas((ls) => ls.map((l) => (l.id === id ? { ...l, cantidad } : l)));

    const enviar = async (e) => {
        e.preventDefault();
        setError(null);

        if (!nombre.trim()) return setError('El nombre es obligatorio');
        if (lineas.length === 0) return setError('Agregá al menos un producto o servicio');
        if (lineas.some((l) => !(Number(l.cantidad) > 0))) return setError('Cada cantidad debe ser mayor a 0');
        if (precioVenta === '' || Number(precioVenta) < 0) return setError('Ingresá un precio de venta válido');

        setGuardando(true);
        try {
            await crearProducto(empresaActivaId, {
                tipo: 'COMBO',
                nombre: nombre.trim(),
                precioVenta: Number(precioVenta),
                precioCompra: costo,
                productos: lineas.map((l) => ({ producto: l.id, cantidad: Number(l.cantidad) })),
            });
            onGuardado();
        } catch (err) {
            setError(err.message);
            setGuardando(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <div className="campo">
                <label htmlFor="cf-nombre">Nombre del combo</label>
                <input id="cf-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </div>

            <div className="campo">
                <label htmlFor="cf-buscar">Agregar productos o servicios</label>
                <input id="cf-buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar…" />
            </div>

            <ul className="lista-seleccion">
                {candidatos.length === 0 && <li className="ayuda">No hay más para agregar.</li>}
                {candidatos.map((p) => (
                    <li key={p._id}>
                        <button type="button" className="item-seleccion" onClick={() => agregar(p)}>
                            <span>
                                {p.nombre} <span className="badge">{ETIQUETA_TIPO[p.tipo] || p.tipo}</span>
                            </span>
                            <span>{formatoPrecio.format(p.precioVenta)}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {lineas.length > 0 && (
                <div className="form">
                    {lineas.map((l) => {
                        const p = porId[l.id];
                        return (
                            <div className="combo-linea" key={l.id}>
                                <span>
                                    {p.nombre} <span className="badge">{ETIQUETA_TIPO[p.tipo] || p.tipo}</span>
                                </span>
                                <input
                                    type="number" min="0" step="any" value={l.cantidad}
                                    onChange={(e) => cambiarCantidad(l.id, e.target.value)}
                                    aria-label={`Cantidad de ${p.nombre}`}
                                />
                                <button type="button" className="btn-sec" onClick={() => quitar(l.id)} aria-label={`Quitar ${p.nombre}`}>✕</button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="campo">
                <label htmlFor="cf-precio">Precio de venta</label>
                <input id="cf-precio" type="number" min="0" step="any" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
            </div>

            {lineas.length > 0 && (
                <div className="resumen">
                    <p>Suma de precios sueltos: <strong>{formatoPrecio.format(sugeridoVenta)}</strong></p>
                    <p>Costo del combo: <strong>{formatoPrecio.format(costo)}</strong></p>
                    <button type="button" className="btn-sec" onClick={() => setPrecioVenta(String(sugeridoVenta))}>
                        Usar la suma como precio
                    </button>
                </div>
            )}

            {error && <p className="error-msg">{error}</p>}

            <div className="form__acciones">
                <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                <button type="submit" className="btn-prim" disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Crear combo'}
                </button>
            </div>
        </form>
    );
}