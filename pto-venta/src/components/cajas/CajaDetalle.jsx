import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerDetalleCaja } from '../../api/cajasApi';
import { formatoPrecio } from '../../utils/formato';
import { agruparFacturacion } from '../../utils/facturacion';
import { listarVentasPorCaja } from '../../api/posApi';
import { TIPOS } from '../../utils/pagos';

const SECCIONES = [
    { id: 'productos', titulo: 'Productos', tipos: ['PRODUCTO', 'COMBO'] },
    { id: 'servicios', titulo: 'Servicios de mesa', tipos: ['SERVICIO'] },
    { id: 'alquileres', titulo: 'Alquileres', tipos: ['ALQUILER'] },
];
const hora = (f) => new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
const etiqueta = (id) => TIPOS.find((t) => t.id === id)?.label ?? id;
const $ = (n) => formatoPrecio.format(n || 0);

function Fila({ etiqueta, valor, total }) {
    return (
        <div className={total ? 'resumen-fila resumen-fila--total' : 'resumen-fila'}>
            <span>{etiqueta}</span><span>{valor}</span>
        </div>
    );
}

export default function CajaDetalle({ cajaId, onVolver }) {
    const { empresaActivaId } = useAuth();
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [listaVentas, setVentas] = useState(null);

    const cargar = useCallback(async () => {
        try {
            setError(null);
            setDatos(await obtenerDetalleCaja(empresaActivaId, cajaId));
            setVentas(await listarVentasPorCaja(empresaActivaId, cajaId));
        } catch (e) {
            setError(e.message);
        }
    }, [empresaActivaId, cajaId]);

    useEffect(() => { cargar(); }, [cargar]);

    if (error) {
        return (
            <p className="error-msg">
                {error} <button type="button" className="btn-sec" onClick={cargar}>Reintentar</button>{' '}
                <button type="button" className="btn-sec" onClick={onVolver}>Volver</button>
            </p>
        );
    }
    if (!datos && !listaVentas) return <p>Cargando…</p>;

    const { caja, lineas, ventas } = datos;
    const f = caja.facturacion || {};
    const ef = caja.efectivo || {};
    const pg = caja.pagos || {};
    const cerrada = caja.estado === 'cerrada';

    console.log(cajaId)

    // El servicio de mesa se suma a lo vendido en productos; el alquiler va aparte
    const v = agruparFacturacion(f)
    const ajuste = (ventas.recargo || 0) - (ventas.descuento || 0);

    return (
        <section className="cc-detalle">
            <div className="cc-detalle__cab">
                <button type="button" className="btn-sec" onClick={onVolver} aria-label="Volver a las cajas">←</button>
                <h2>{new Date(caja.fecha).toLocaleDateString('es-AR', { dateStyle: 'long' })} · {cerrada ? 'Cerrada' : 'Abierta'}</h2>
            </div>

            <h3>Resumen de caja:</h3>
            <div className="resumen">
                <Fila etiqueta="Efectivo inicial" valor={$(ef.inicial)} />
                <Fila etiqueta="Efectivo final (en caja)" valor={cerrada ? $(ef.final) : '—'} />
                <Fila etiqueta="Efectivo retirado" valor={cerrada ? $(ef.retirado) : '—'} />
                <Fila etiqueta="Transferencias" valor={$(pg.transferencia)} />
                <Fila etiqueta="Tarjetas" valor={$(pg.tarjeta)} />
                {cerrada && <Fila etiqueta="Diferencia de efectivo" valor={$(ef.diferencia)} />}
            </div>
            {!cerrada && <p>El efectivo final y el retirado se cargan al cerrar la caja.</p>}

            <br />
            

            <h3>Vendido</h3>
            <div className="resumen">
                <Fila etiqueta="Productos (incluye servicio de mesa)" valor={$(v.productos)} />
                <Fila etiqueta="Alquileres" valor={$(v.alquileres)} />
                <Fila etiqueta="Total vendido" valor={$(v.total)} total />
            </div> <br />

            <h3>Listado de ventas:</h3>
            <ul className="cc-lista-simple">
                {listaVentas?.map((v) => {
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
                            </details>
                        </li>
                    );
                })}
            </ul> <br />


            <h3>Detalle de lo vendido:</h3> <br />
            {lineas.length === 0 && <p>No hubo ventas en esta caja.</p>}
            {SECCIONES.map((s) => {
                const items = lineas.filter((l) => s.tipos.includes(l.tipo));
                if (items.length === 0) return null;
                const subtotal = items.reduce((acc, l) => acc + l.subtotal, 0);
                return (
                    <div key={s.id}>
                        <h4>{s.titulo}</h4>
                        <ul className="cc-lista-simple">
                            {items.map((l) => (
                                <li key={`${l.producto}`} className="cc-cargo__cab">
                                    <span>{l.cantidad} × {l.nombre}</span>
                                    <strong>{$(l.subtotal)}</strong>
                                </li>
                            ))}
                            <li className="cc-cargo__cab"><span>Subtotal</span><strong>{$(subtotal)}</strong></li>
                            <br />
                        </ul>
                    </div>
                );
            })}
            {ajuste !== 0 && (
                <p>{ajuste > 0 ? 'Recargos' : 'Descuentos'} por redondeo: {$(Math.abs(ajuste))}</p>
            )}
        </section>
    );
}