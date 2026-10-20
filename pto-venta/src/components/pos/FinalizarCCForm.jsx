import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { finalizarCuenta } from '../../api/posApi';
import { nuevaClave } from '../../utils/id';
import { formatoPrecio } from '../../utils/formato';
import { cent } from '../../utils/pagos';

const dinero = (c) => formatoPrecio.format(c / 100);

export default function FinalizarCCForm({ cuenta, hayCaja, onFinalizada, onTerminar, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const claveRef = useRef(nuevaClave());
    const [monto, setMonto] = useState(String(cuenta.totalCargos));
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [resultado, setResultado] = useState(null);

    if (resultado) {
        return (
            <div className="form">
                <p>Cuenta finalizada · {formatoPrecio.format(resultado.total)}</p>
                <div className="form__acciones">
                    <button type="button" className="btn-prim" onClick={onTerminar} autoFocus>Listo</button>
                </div>
            </div>
        );
    }

    const totalC = cent(cuenta.totalCargos);
    const montoC = cent(monto);
    const pagadoC = cent(cuenta.totalPagado);
    const descuentoC = totalC - montoC;
    const faltaC = montoC > pagadoC ? montoC - pagadoC : 0;
    const sobraC = pagadoC > montoC ? pagadoC - montoC : 0;

    const problema =
        !hayCaja ? 'Abrí una caja para poder finalizar la cuenta'
        : montoC <= 0 ? 'El monto a cobrar debe ser mayor a 0'
        : montoC > totalC ? 'El monto a cobrar no puede superar el total de la cuenta'
        : faltaC > 0 ? `Faltan ${dinero(faltaC)}: registrá otro pago antes de finalizar`
        : sobraC > 0 ? `Los pagos superan el monto a cobrar por ${dinero(sobraC)}: subí el monto`
        : null;

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        if (problema) return setError(problema);
        setError(null);
        setGuardando(true);
        onOcupado?.(true);
        try {
            const venta = await finalizarCuenta(empresaActivaId, cuenta._id, {
                claveIdempotencia: claveRef.current,
                ...(descuentoC !== 0 && { montoACobrar: montoC / 100 }),
            });
            setResultado(venta);
            onOcupado?.(false);
            onFinalizada();
        } catch (err) {
            setError(err.timeout ? `${err.message} Podés volver a tocar Finalizar: no se duplica.` : err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="campo">
                    <label htmlFor="fin-monto">Monto a cobrar (podés redondear hacia abajo)</label>
                    <input
                        id="fin-monto" type="number" min="0" max={cuenta.totalCargos} step="any" inputMode="decimal"
                        value={monto} onChange={(e) => setMonto(e.target.value)}
                    />
                </div>

                <div className="resumen">
                    <div className="resumen-fila"><span>Total de la cuenta</span><span>{dinero(totalC)}</span></div>
                    {descuentoC > 0 && <div className="resumen-fila"><span>Descuento</span><span className="dif--menos">{dinero(descuentoC)}</span></div>}
                    <div className="resumen-fila resumen-fila--total"><span>A cobrar</span><span>{dinero(montoC)}</span></div>
                    <div className="resumen-fila"><span>Ya pagado</span><span>{dinero(pagadoC)}</span></div>
                    {faltaC > 0 && <div className="resumen-fila"><span>Falta</span><span className="dif--menos">{dinero(faltaC)}</span></div>}
                </div>

                <p>Al finalizar, los pagos se registran en la caja abierta como una sola venta.</p>

                {(error || problema) && <p className="error-msg">{error || problema}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando || Boolean(problema)}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Finalizando…</> : 'Finalizar cuenta'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}