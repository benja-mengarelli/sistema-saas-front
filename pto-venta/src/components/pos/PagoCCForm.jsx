import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pagarCuenta } from '../../api/posApi';
import { nuevaClave } from '../../utils/id';
import { formatoPrecio } from '../../utils/formato';
import { TIPOS, cent } from '../../utils/pagos';

const dinero = (c) => formatoPrecio.format(c / 100);

export default function PagoCCForm({ cuenta, onHecho, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const claveRef = useRef(nuevaClave()); // se conserva si hay timeout, así el reintento no duplica
    const [tipoPago, setTipoPago] = useState('EFECTIVO');
    const [recibido, setRecibido] = useState(String(cuenta.saldo));
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const saldoC = cent(cuenta.saldo);
    const recibidoC = cent(recibido);
    const aplicadoC = Math.min(recibidoC, saldoC);
    const vueltoC = Math.max(recibidoC - saldoC, 0);
    const quedaC = saldoC - aplicadoC;

    const problema =
        recibidoC <= 0 ? 'Ingresá un monto mayor a 0'
        : vueltoC > 0 && tipoPago !== 'EFECTIVO' ? 'Solo en efectivo se puede dar vuelto: el pago no puede superar el saldo'
        : null;

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        if (problema) return setError(problema);
        setError(null);
        setGuardando(true);
        onOcupado?.(true);
        try {
            await pagarCuenta(empresaActivaId, cuenta._id, {
                claveIdempotencia: claveRef.current,
                tipoPago,
                monto: aplicadoC / 100,
            });
            onHecho();
        } catch (err) {
            setError(err.timeout ? `${err.message} Podés volver a tocar Registrar: no se duplica.` : err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="fila-pago">
                    <select value={tipoPago} aria-label="Tipo de pago" onChange={(e) => setTipoPago(e.target.value)}>
                        {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <input
                        type="number" min="0" step="any" inputMode="decimal" aria-label="Monto recibido" autoFocus
                        value={recibido} onChange={(e) => setRecibido(e.target.value)}
                    />
                </div>

                <div className="resumen">
                    <div className="resumen-fila"><span>Saldo actual</span><span>{dinero(saldoC)}</span></div>
                    <div className="resumen-fila"><span>Se aplica</span><span>{dinero(aplicadoC)}</span></div>
                    {vueltoC > 0 && <div className="resumen-fila"><span>Vuelto</span><span className="dif--mas">{dinero(vueltoC)}</span></div>}
                    <div className="resumen-fila resumen-fila--total"><span>Queda debiendo</span><span>{dinero(quedaC)}</span></div>
                </div>

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando || Boolean(problema)}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Registrando…</> : 'Registrar pago'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}