import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crearVenta } from '../../api/posApi';
import { formatoPrecio } from '../../utils/formato';

const TIPOS = [
    { id: 'EFECTIVO', label: 'Efectivo' },
    { id: 'TRANSFERENCIA', label: 'Transferencia' },
    { id: 'TARJETA', label: 'Tarjeta' },
];

const cent = (v) => Math.round((Number(v) || 0) * 100);
const dinero = (c) => formatoPrecio.format(c / 100);

let contador = 0;
const nuevaFila = (tipoPago, monto) => ({ key: `pago-${++contador}`, tipoPago, monto });

export default function CobrarForm({ lineas, total, clave, onVendida, onTerminar, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const [monto, setMonto] = useState(String(total)); // monto a cobrar: se puede redondear
    const [filas, setFilas] = useState([nuevaFila('EFECTIVO', null)]); // null = igual al monto a cobrar
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [resultado, setResultado] = useState(null);

    if (resultado) {
        return (
            <div className="form">
                <p>Venta registrada · {formatoPrecio.format(resultado.total)}</p>
                {resultado.vuelto > 0 && (
                    <div className="vuelto">
                        <span>Vuelto</span>
                        <strong>{formatoPrecio.format(resultado.vuelto)}</strong>
                    </div>
                )}
                <div className="form__acciones">
                    <button type="button" className="btn-prim" onClick={onTerminar} autoFocus>Listo</button>
                </div>
            </div>
        );
    }

    const valorDe = (f) => (f.monto === null ? monto : f.monto);
    const valores = filas.map((f) => ({ ...f, c: cent(valorDe(f)) }));

    const totalC = cent(total);
    const montoC = cent(monto);
    const ajusteC = montoC - totalC;
    const entregadoC = valores.reduce((s, f) => s + f.c, 0);
    const efectivoC = valores.filter((f) => f.tipoPago === 'EFECTIVO').reduce((s, f) => s + f.c, 0);
    const excesoC = entregadoC - montoC;
    const faltaC = excesoC < 0 ? -excesoC : 0;
    const vueltoC = excesoC > 0 ? excesoC : 0;

    const problema =
        montoC <= 0 ? 'El monto a cobrar debe ser mayor a 0'
        : faltaC > 0 ? `Faltan ${dinero(faltaC)}`
        : vueltoC > efectivoC ? 'El vuelto solo puede salir de lo pagado en efectivo'
        : null;

    const cambiarFila = (key, cambios) =>
        setFilas((fs) => fs.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
    const quitarFila = (key) => setFilas((fs) => fs.filter((f) => f.key !== key));
    const agregarFila = () => {
        const libre = TIPOS.find((t) => !filas.some((f) => f.tipoPago === t.id))?.id ?? 'EFECTIVO';
        setFilas((fs) => [...fs.map((f) => (f.monto === null ? { ...f, monto } : f)), nuevaFila(libre, '')]);
    };

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        if (problema) return setError(problema);
        setError(null);

        const payload = {
            claveIdempotencia: clave,
            items: lineas.map((l) => ({ producto: l.producto, cantidad: l.cantidad })),
            pagos: valores.filter((f) => f.c > 0).map((f) => ({ tipoPago: f.tipoPago, monto: f.c / 100 })),
            ...(ajusteC !== 0 && { montoACobrar: montoC / 100 }),
        };

        setGuardando(true);
        onOcupado?.(true);
        try {
            const venta = await crearVenta(empresaActivaId, payload);
            setResultado(venta);
            onOcupado?.(false);
            onVendida();
        } catch (err) {
            setError(err.timeout ? `${err.message} Podés volver a tocar Cobrar: la venta no se duplica.` : err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="campo">
                    <label htmlFor="cb-monto">Monto a cobrar (podés redondearlo)</label>
                    <input
                        id="cb-monto" type="number" min="0" step="any" inputMode="decimal"
                        value={monto} onChange={(e) => setMonto(e.target.value)}
                    />
                </div>

                <div className="form">
                    {filas.map((f) => (
                        <div className="fila-pago" key={f.key}>
                            <select
                                value={f.tipoPago} aria-label="Tipo de pago"
                                onChange={(e) => cambiarFila(f.key, { tipoPago: e.target.value })}
                            >
                                {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            <input
                                type="number" min="0" step="any" inputMode="decimal" aria-label="Monto recibido"
                                value={f.monto === null ? monto : f.monto}
                                onChange={(e) => cambiarFila(f.key, { monto: e.target.value })}
                            />
                            {filas.length > 1 && (
                                <button type="button" className="btn-sec" onClick={() => quitarFila(f.key)} aria-label="Quitar pago">✕</button>
                            )}
                        </div>
                    ))}
                    {filas.length < TIPOS.length && (
                        <button type="button" className="btn-sec" onClick={agregarFila}>+ Agregar otro pago</button>
                    )}
                </div>

                <div className="resumen">
                    <div className="resumen-fila"><span>Total calculado</span><span>{formatoPrecio.format(total)}</span></div>
                    {ajusteC !== 0 && (
                        <div className="resumen-fila">
                            <span>{ajusteC > 0 ? 'Recargo' : 'Descuento'}</span>
                            <span className={ajusteC > 0 ? 'dif--mas' : 'dif--menos'}>{dinero(Math.abs(ajusteC))}</span>
                        </div>
                    )}
                    <div className="resumen-fila resumen-fila--total"><span>A cobrar</span><span>{dinero(montoC)}</span></div>
                    <div className="resumen-fila"><span>Recibido</span><span>{dinero(entregadoC)}</span></div>
                    {faltaC > 0 && <div className="resumen-fila"><span>Falta</span><span className="dif--menos">{dinero(faltaC)}</span></div>}
                    {vueltoC > 0 && <div className="resumen-fila"><span>Vuelto</span><span className="dif--mas">{dinero(vueltoC)}</span></div>}
                </div>

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando || Boolean(problema)}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Cobrando…</> : 'Confirmar cobro'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}