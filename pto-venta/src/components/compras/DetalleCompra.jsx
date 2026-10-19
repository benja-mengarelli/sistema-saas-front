import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerCompra } from '../../api/comprasApi';
import { formatoFechaHora, formatoPrecio } from '../../utils/formato';

export default function DetalleCompra({ resumen }) {
    const { empresaActivaId } = useAuth();
    const [compra, setCompra] = useState(null);
    const [error, setError] = useState(null);

    const cargar = useCallback(async () => {
        setError(null);
        setCompra(null);
        try {
            setCompra(await obtenerCompra(empresaActivaId, resumen._id));
        } catch (e) {
            setError(e.message);
        }
    }, [empresaActivaId, resumen._id]);

    useEffect(() => { cargar(); }, [cargar]);

    return (
        <div className="form">
            <p className="ayuda">
                {formatoFechaHora(resumen.createdAt)} · {resumen.proveedorNombre || 'Proveedor'}
                {resumen.estado === 'ANULADA' && <> · <span className="badge badge--alerta">Anulada</span></>}
            </p>

            {!compra && !error && <p className="vacio">Cargando…</p>}

            {error && (
                <p className="error-msg">
                    {error}{' '}
                    <button type="button" className="btn-sec" onClick={cargar}>Reintentar</button>
                </p>
            )}

            {compra && (
                <div className="tabla-contenedor">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Ítem</th>
                                <th className="num">Cantidad</th>
                                <th className="num">Costo unitario</th>
                                <th className="num">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compra.productos.map((l, i) => (
                                <tr key={l._id || i}>
                                    <td>
                                        {l.descripcion || 'Producto'}{' '}
                                        {!l.producto && <span className="badge">Sin producto</span>}
                                    </td>
                                    <td className="num">{l.cantidad}</td>
                                    <td className="num">{formatoPrecio.format(l.costoUnitario)}</td>
                                    <td className="num">{formatoPrecio.format(l.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="num"><strong>Total</strong></td>
                                <td className="num"><strong>{formatoPrecio.format(compra.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}