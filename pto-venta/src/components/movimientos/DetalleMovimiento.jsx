import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerMovimiento } from '../../api/movimientosApi';
import { ETIQUETA_MOVIMIENTO, formatoFechaHora, redondear, conSigno, claseDiferencia } from '../../utils/formato';

export default function DetalleMovimiento({ resumen }) {
    const { empresaActivaId } = useAuth();
    const [mov, setMov] = useState(null);
    const [error, setError] = useState(null);

    const cargar = useCallback(async () => {
        setError(null);
        setMov(null);
        try {
            setMov(await obtenerMovimiento(empresaActivaId, resumen._id));
        } catch (e) {
            setError(e.message);
        }
    }, [empresaActivaId, resumen._id]);

    useEffect(() => { cargar(); }, [cargar]);

    const tipo = resumen.tipo || resumen.origen?.tipo;

    return (
        <div className="form">
            <p className="ayuda">
                {formatoFechaHora(resumen.createdAt)} ·{' '}
                <span className="badge">{ETIQUETA_MOVIMIENTO[tipo] || tipo || '—'}</span>
                {resumen.origen?.tipo === 'CAJA' && ' · Cierre de caja'}
            </p>

            {!mov && !error && <p className="vacio">Cargando…</p>}

            {error && (
                <p className="error-msg">
                    {error}{' '}
                    <button type="button" className="btn-sec" onClick={cargar}>Reintentar</button>
                </p>
            )}

            {mov && (
                <div className="tabla-contenedor">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th className="num">Stock anterior</th>
                                <th className="num">Stock nuevo</th>
                                <th className="num">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mov.productos.map((l, i) => {
                                const dif = redondear(l.cantidad ?? l.stockActual - l.stockAnterior);
                                return (
                                    <tr key={l._id || i}>
                                        <td>{l.producto?.nombre ?? 'Producto eliminado'}</td>
                                        <td className="num">{l.stockAnterior}</td>
                                        <td className="num">{l.stockActual}</td>
                                        <td className="num">
                                            <span className={claseDiferencia(dif)}>{conSigno(dif)}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}