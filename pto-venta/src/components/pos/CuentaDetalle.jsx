import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerCuenta } from '../../api/posApi';
import { formatoPrecio } from '../../utils/formato';
import { TIPOS } from '../../utils/pagos';
import Modal from '../Modal';
import PagoCCForm from './PagoCCForm';
import FinalizarCCForm from './FinalizarCCForm';

const fecha = (f) => new Date(f).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const etiqueta = (id) => TIPOS.find((t) => t.id === id)?.label ?? id;

export default function CuentaDetalle({ cuentaId, hayCaja, onVolver, onCambio, onCajaCambio }) {
    const { empresaActivaId } = useAuth();
    const [cuenta, setCuenta] = useState(null);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(null); // null | 'pago' | 'finalizar'
    const [ocupado, setOcupado] = useState(false);

    const cargar = useCallback(async () => {
        try {
            setError(null);
            setCuenta(await obtenerCuenta(empresaActivaId, cuentaId));
        } catch (e) {
            setError(e.message);
        }
    }, [empresaActivaId, cuentaId]);

    useEffect(() => { cargar(); }, [cargar]);

    const cerrarModal = () => { setOcupado(false); setModal(null); cargar(); };
    const pagoHecho = () => { cerrarModal(); onCambio(); };
    const finalizada = () => { onCambio(); onCajaCambio(); };

    if (error) {
        return (
            <p className="error-msg">
                {error} <button type="button" className="btn-sec" onClick={cargar}>Reintentar</button>{' '}
                <button type="button" className="btn-sec" onClick={onVolver}>Volver</button>
            </p>
        );
    }
    if (!cuenta) return <p>Cargando…</p>;

    const abierta = cuenta.estado === 'ABIERTA' || cuenta.estado === 'PARCIAL';

    return (
        <section className="cc-detalle">
            <div className="cc-detalle__cab">
                <button type="button" className="btn-sec" onClick={onVolver} aria-label="Volver a las cuentas">←</button>
                <h2>{cuenta.cliente}</h2>
            </div>

            <div className="resumen">
                <div className="resumen-fila"><span>Total consumido</span><span>{formatoPrecio.format(cuenta.totalCargos)}</span></div>
                <div className="resumen-fila"><span>Pagado</span><span>{formatoPrecio.format(cuenta.totalPagado)}</span></div>
                <div className="resumen-fila resumen-fila--total"><span>Saldo</span><span>{formatoPrecio.format(cuenta.saldo)}</span></div>
            </div>

            {abierta && (
                <div className="form__acciones">
                    <button type="button" className="btn-sec" disabled={cuenta.saldo <= 0} onClick={() => setModal('pago')}>
                        Registrar pago
                    </button>
                    <button type="button" className="btn-prim" onClick={() => setModal('finalizar')}>
                        Finalizar
                    </button>
                </div>
            )}
            {abierta && !hayCaja && <p>Para finalizar la cuenta tiene que haber una caja abierta.</p>}

            <h3>Consumos</h3>
            <ul className="cc-lista-simple">
                {cuenta.ventas.map((v) => (
                    <li key={v._id} className="cc-cargo">
                        <div className="cc-cargo__cab">
                            <span>{fecha(v.createdAt)}</span>
                            <strong>{formatoPrecio.format(v.total)}</strong>
                        </div>
                        <ul>
                            {v.productos.map((p, i) => <li key={i}>{p.cantidad} × {p.nombre}</li>)}
                        </ul>
                    </li>
                ))}
            </ul>

            <h3>Pagos</h3>
            {cuenta.pagos.length === 0 ? <p>Todavía no hay pagos.</p> : (
                <ul className="cc-lista-simple">
                    {cuenta.pagos.map((p) => (
                        <li key={p.clave} className="cc-cargo__cab">
                            <span>{fecha(p.fecha)} · {etiqueta(p.tipoPago)}</span>
                            <strong>{formatoPrecio.format(p.monto)}</strong>
                        </li>
                    ))}
                </ul>
            )}

            {modal === 'pago' && (
                <Modal titulo="Registrar pago" cerrable={!ocupado} onCerrar={cerrarModal}>
                    <PagoCCForm cuenta={cuenta} onHecho={pagoHecho} onCancelar={cerrarModal} onOcupado={setOcupado} />
                </Modal>
            )}
            {modal === 'finalizar' && (
                <Modal titulo="Finalizar cuenta" cerrable={!ocupado} onCerrar={cerrarModal}>
                    <FinalizarCCForm
                        cuenta={cuenta} hayCaja={hayCaja}
                        onFinalizada={finalizada} onTerminar={onVolver}
                        onCancelar={cerrarModal} onOcupado={setOcupado}
                    />
                </Modal>
            )}
        </section>
    );
}