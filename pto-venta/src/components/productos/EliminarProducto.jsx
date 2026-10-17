import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eliminarProducto } from '../../api/productosApi';
import { ETIQUETA_TIPO } from '../../utils/formato';

export default function EliminarProducto({ productos, onEliminado, onCancelar }) {
    const { empresaActivaId } = useAuth();
    const [busqueda, setBusqueda] = useState('');
    const [elegido, setElegido] = useState(null);
    const [error, setError] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const filtrados = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return productos.filter((p) => p.nombre.toLowerCase().includes(t));
    }, [productos, busqueda]);

    const confirmar = async () => {
        setEliminando(true);
        setError(null);
        try {
            await eliminarProducto(empresaActivaId, elegido._id);
            onEliminado();
        } catch (e) {
            setError(e.message); // ej. 409 si forma parte de un combo
            setEliminando(false);
        }
    };

    if (elegido) {
        return (
            <div className="form">
                <p>¿Eliminar <strong>{elegido.nombre}</strong>?</p>
                <p className="ayuda">
                    Dejará de aparecer en el listado. El historial de ventas y movimientos se conserva.
                </p>
                {error && <p className="error-msg">{error}</p>}
                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={() => { setElegido(null); setError(null); }}>
                        Volver
                    </button>
                    <button type="button" className="btn-peligro" onClick={confirmar} disabled={eliminando}>
                        {eliminando ? 'Eliminando…' : 'Eliminar'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="form">
            <div className="campo">
                <label htmlFor="el-buscar">Elegí el producto a eliminar</label>
                <input id="el-buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar…" autoFocus />
            </div>
            <ul className="lista-seleccion">
                {filtrados.length === 0 && <li className="ayuda">No hay productos.</li>}
                {filtrados.map((p) => (
                    <li key={p._id}>
                        <button type="button" className="item-seleccion" onClick={() => setElegido(p)}>
                            <span>{p.nombre}</span>
                            <span className="badge">{ETIQUETA_TIPO[p.tipo] || p.tipo}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="form__acciones">
                <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
            </div>
        </div>
    );
}