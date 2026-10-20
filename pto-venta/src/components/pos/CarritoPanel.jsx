import { formatoPrecio } from '../../utils/formato';

export default function CarritoPanel({
    lineas, total, hayCaja, disponible,
    onSumar, onRestar, onQuitar, onVaciar, onCobrar, onCerrarPanel, onAgregarCC
}) {
    return (
        <div className="carrito">
            <header className="carrito__cabecera">
                <h2>Carrito</h2>
                <button type="button" className="btn-sec carrito__cerrar" onClick={onCerrarPanel} aria-label="Cerrar carrito">✕</button>
            </header>

            {lineas.length === 0 ? (
                <p className="vacio">El carrito está vacío.</p>
            ) : (
                <ul className="carrito__lista">
                    {lineas.map((l) => (
                        <li key={l.producto} className="carrito__item">
                            <div className="carrito__nombre">
                                {l.p.nombre}
                                <span className="ayuda">{formatoPrecio.format(l.p.precioVenta)} c/u</span>
                            </div>
                            <div className="carrito__subtotal">{formatoPrecio.format(l.subtotal)}</div>
                            <div className="carrito__cantidad">
                                <button type="button" className="btn-sec" onClick={() => onRestar(l.producto)} aria-label={`Restar ${l.p.nombre}`}>−</button>
                                <span>{l.cantidad}</span>
                                <button
                                    type="button" className="btn-sec" onClick={() => onSumar(l.p)}
                                    disabled={l.cantidad >= disponible(l.p)} aria-label={`Sumar ${l.p.nombre}`}
                                >
                                    +
                                </button>
                                <button type="button" className="btn-sec" onClick={() => onQuitar(l.producto)} aria-label={`Quitar ${l.p.nombre}`}>🗑</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div className="resumen-fila resumen-fila--total">
                <span>Total</span>
                <span>{formatoPrecio.format(total)}</span>
            </div>

            {!hayCaja && <p className="ayuda">Abrí la caja para poder cobrar.</p>}

            <div className="carrito__botones">
                <button type="button" className="btn-prim" onClick={onCobrar} disabled={!hayCaja || lineas.length === 0}>
                    Cobrar
                </button>
                <button
                    type="button" className="btn-sec"
                    disabled={!hayCaja || lineas.length === 0}
                    onClick={onAgregarCC}
                >
                    Agregar a CC
                </button>
                <button type="button" className="btn-sec" onClick={onVaciar} disabled={lineas.length === 0}>Vaciar carrito</button>
            </div>
        </div>
    );
}