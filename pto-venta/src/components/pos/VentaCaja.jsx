import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listarVentas, anularVenta } from '../../api/posApi';
import { formatoPrecio } from '../../utils/formato';
import { TIPOS } from '../../utils/pagos';

const hora = (f) => new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
const etiqueta = (id) => TIPOS.find((t) => t.id === id)?.label ?? id;

export default function VentasCaja({ onCambio, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const [ventas, setVentas] = useState(null);
    const [error, setError] = useState(null);
    const [confirmando, setConfirmando] = useState(null);
    const [anulando, setAnulando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            setError(null);
            setVentas(await listarVentas(empresaActivaId));
        } catch (e) {
            setError(e.message);
        }
    }, [empresaActivaId]);

    useEffect(() => { cargar(); }, [cargar]);

    const anular = async (id) => {
        if (anulando) return;
        setAnulando(true);
        onOcupado?.(true);
        setError(null);
        try {
            await anularVenta(empresaActivaId, id);
            setConfirmando(null);
            await cargar();
            onCambio?.(); // el padre recarga caja y stock
        } catch (e) {
            setError(e.message);
        } finally {
            setAnulando(false);
            onOcupado?.(false);
        }
    };

    if (!ventas && !error) return <p>Cargando ventas…</p>;

    return (
        <div className="form">
            {error && (
                <p className="error-msg">{error} <button type="button" className="btn-sec" onClick={cargar}>Reintentar</button></p>
            )}
            {ventas && ventas.length === 0 && <p>Todavía no hay ventas en esta caja.</p>}

            <ul className="cc-lista-simple">
                {ventas?.map((v) => {
                    const anulada = v.estado === 'ANULADO';
                    const deCuenta = Boolean(v.cuentaCorrienteId);
                    return (
                        <li key={v._id} className={`cc-cargo${anulada ? ' venta--anulada' : ''}`}>
                            <details>
                                <summary className="cc-cargo__cab">
                                    <span>
                                        {hora(v.createdAt)} · {v.cliente}
                                        {deCuenta && ' · Cuenta corriente'}
                                        {anulada && ' · Anulada'}
                                    </span>
                                    <strong>{formatoPrecio.format(v.total)}</strong>
                                </summary>

                                <ul>
                                    {v.productos.map((p, i) => <li key={i}>{p.cantidad} × {p.nombre}</li>)}
                                </ul>
                                <ul>
                                    {v.pagos.map((p, i) => (
                                        <li key={i}>{etiqueta(p.tipoPago)}: {formatoPrecio.format(p.monto)}</li>
                                    ))}
                                </ul>
                                {v.vuelto > 0 && <p>Vuelto: {formatoPrecio.format(v.vuelto)}</p>}
                                {v.descuento > 0 && <p>Descuento: {formatoPrecio.format(v.descuento)}</p>}
                                {v.recargo > 0 && <p>Recargo: {formatoPrecio.format(v.recargo)}</p>}

                                {!anulada && !deCuenta && (
                                    confirmando === v._id ? (
                                        <div>
                                            <p>Se repone el stock y se descuenta de la caja. ¿Anular esta venta?</p>
                                            <div className="form__acciones">
                                                <button type="button" className="btn-sec" disabled={anulando} onClick={() => setConfirmando(null)}>No</button>
                                                <button type="button" className="btn-peligro" disabled={anulando} onClick={() => anular(v._id)}>
                                                    {anulando ? 'Anulando…' : 'Sí, anular'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button type="button" className="btn-sec" onClick={() => setConfirmando(v._id)}>Anular venta</button>
                                    )
                                )}
                            </details>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}