import { useMemo, useState } from 'react';
import { formatoPrecio } from '../../utils/formato';

const SIN_CATEGORIA = 'Sin categoría';

export default function GrillaProductos({ productos, disponible, enCarrito, onAgregar }) {
    const [categoria, setCategoria] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    const categorias = useMemo(() => {
        const set = new Set(productos.map((p) => p.categoria || SIN_CATEGORIA));
        return ['Todos', ...[...set].sort((a, b) => a.localeCompare(b))];
    }, [productos]);

    const activa = categorias.includes(categoria) ? categoria : 'Todos';

    const visibles = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return productos.filter(
            (p) =>
                (activa === 'Todos' || (p.categoria || SIN_CATEGORIA) === activa) &&
                (!t || p.nombre.toLowerCase().includes(t))
        );
    }, [productos, activa, busqueda]);

    return (
        <>
            <div className="cat-boxes">
                {categorias.map((c) => (
                    <button
                        key={c} type="button"
                        className={`cat-box${c === activa ? ' cat-box--activa' : ''}`}
                        onClick={() => setCategoria(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <input
                type="search" className="buscador" placeholder="Buscar producto…"
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            />

            {visibles.length === 0 ? (
                <p className="vacio">No hay productos para mostrar.</p>
            ) : (
                <div className="productos-grid">
                    {visibles.map((p) => {
                        const disp = disponible(p);
                        const restante = disp - (enCarrito.get(p._id) || 0);
                        return (
                            <button
                                key={p._id} type="button" className="producto-tile"
                                disabled={restante <= 0} onClick={() => onAgregar(p)}
                            >
                                <span className="producto-tile__nombre">{p.nombre}</span>
                                <span className="producto-tile__precio">{formatoPrecio.format(p.precioVenta)}</span>
                                <span className="producto-tile__pie">
                                    {p.tipo === 'COMBO' && <span className="badge">Combo</span>}
                                    {p.tipo === 'SERVICIO' && <span className="badge">Servicio</span>}
                                    {Number.isFinite(disp) && (
                                        <span className={`badge${disp <= 0 ? ' badge--alerta' : ''}`}>
                                            {disp <= 0 ? 'Sin stock' : `Stock: ${disp}`}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}