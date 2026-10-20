import { useState } from 'react';
import { formatoPrecio } from '../../utils/formato';
import CuentaDetalle from './CuentaDetalle';

export default function CuentasCorrientes({ cuentas, cargando, error, onRecargar, hayCaja, onCajaCambio }) {
    const [seleccion, setSeleccion] = useState(null);

    if (seleccion) {
        return (
            <CuentaDetalle
                cuentaId={seleccion} hayCaja={hayCaja}
                onVolver={() => { setSeleccion(null); onRecargar(); }}
                onCambio={onRecargar} onCajaCambio={onCajaCambio}
            />
        );
    }

    if (cargando) return <p>Cargando cuentas…</p>;
    if (error) {
        return <p className="error-msg">{error} <button type="button" className="btn-sec" onClick={onRecargar}>Reintentar</button></p>;
    }
    if (cuentas.length === 0) {
        return <p>No hay cuentas corrientes abiertas. Sumá un carrito desde la pestaña Venta con “Agregar a CC”.</p>;
    }

    return (
        <ul className="cc-lista">
            {cuentas.map((c) => (
                <li key={c._id}>
                    <button type="button" className="cc-card" onClick={() => setSeleccion(c._id)}>
                        <strong>{c.cliente}</strong>
                        <span>{c.estado === 'PARCIAL' ? 'Con pagos' : 'Sin pagos'}</span>
                        <span className="cc-card__saldo">Debe {formatoPrecio.format(c.saldo)}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}