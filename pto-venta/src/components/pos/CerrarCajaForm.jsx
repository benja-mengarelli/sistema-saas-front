import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cerrarCaja } from '../../api/posApi';
import { formatoPrecio } from '../../utils/formato';
import { agruparFacturacion } from '../../utils/facturacion';

const Fila = ({ etiqueta, valor, total = false }) => (
    <div className={`resumen-fila${total ? ' resumen-fila--total' : ''}`}>
        <span>{etiqueta}</span>
        <span>{formatoPrecio.format(valor)}</span>
    </div>
);

const textoDiferencia = (d) => (d > 0 ? 'Sobrante' : d < 0 ? 'Faltante' : 'Sin diferencia');
const claseDiferencia = (d) => (d > 0 ? 'dif--mas' : d < 0 ? 'dif--menos' : 'dif--cero');

const num = (v) => (v === '' ? 0 : Number(v));
const valido = (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0);
const r2 = (n) => Math.round(n * 100) / 100;

export default function CerrarCajaForm({ resumen, onCerrada, onTerminar, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const [saldo, setSaldo] = useState('');
    const [retirado, setRetirado] = useState('');
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [resultado, setResultado] = useState(null);

    // Resultado final: sale de la caja devuelta, no de las props (cambian cuando se recarga la caja)
    if (resultado) {
        const ef = resultado.caja.efectivo;
        return (
            <div className="form">
                <p>Caja cerrada.</p>
                <div className="resumen">
                    <Fila etiqueta="Debe quedar en caja" valor={ef.esperado} />
                    <Fila etiqueta="Saldo en caja" valor={ef.final} />
                    <Fila etiqueta="Retirado" valor={ef.retirado} />
                    <div className="resumen-fila resumen-fila--total">
                        <span>{textoDiferencia(ef.diferencia)}</span>
                        <span className={claseDiferencia(ef.diferencia)}>{formatoPrecio.format(ef.diferencia)}</span>
                    </div>
                </div>
                <div className="form__acciones">
                    <button type="button" className="btn-prim" onClick={onTerminar}>Listo</button>
                </div>
            </div>
        );
    }

    if (!resumen) return <p className="vacio">No hay una caja abierta.</p>;

    const { facturacion, pagos, efectivo } = resumen;
    const vendido = agruparFacturacion(facturacion);

    const listo = saldo !== '' && valido(saldo) && valido(retirado);
    const contado = listo ? r2(num(saldo) + num(retirado)) : null;
    const diferencia = listo ? r2(contado - efectivo.esperado) : null;

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        setError(null);
        if (!listo) return setError('Ingresá el saldo que queda en caja (y el retirado, si hubo)');

        setGuardando(true);
        onOcupado?.(true);
        try {
            const r = await cerrarCaja(empresaActivaId, {
                efectivoEnCaja: num(saldo),
                efectivoRetirado: num(retirado),
            });
            setResultado(r);
            onOcupado?.(false);
            onCerrada(); // el padre recarga el estado de la caja
        } catch (err) {
            setError(err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="resumen">
                    <h3 className="resumen__titulo">Vendido</h3>
                    <Fila etiqueta="Productos (incluye servicio de mesa)" valor={vendido.productos} />
                    <Fila etiqueta="Alquileres" valor={vendido.alquileres} />
                    <Fila etiqueta="Total" valor={vendido.total} total />
                </div>

                <div className="resumen">
                    <h3 className="resumen__titulo">Cobros</h3>
                    <Fila etiqueta="Efectivo" valor={pagos.efectivo} />
                    <Fila etiqueta="Transferencia" valor={pagos.transferencia} />
                    <Fila etiqueta="Tarjeta" valor={pagos.tarjeta} />
                    <Fila etiqueta="Total" valor={pagos.total} total />
                </div>

                <div className="resumen">
                    <h3 className="resumen__titulo">Efectivo en caja</h3>
                    <Fila etiqueta="Inicial" valor={efectivo.inicial} />
                    <Fila etiqueta="Cobrado en efectivo" valor={efectivo.cobrado} />
                    {efectivo.ingresos > 0 && <Fila etiqueta="Ingresos" valor={efectivo.ingresos} />}
                    {efectivo.egresos > 0 && <Fila etiqueta="Egresos" valor={-efectivo.egresos} />}
                    {efectivo.retirado > 0 && <Fila etiqueta="Retiros" valor={-efectivo.retirado} />}
                    <Fila etiqueta="Debe haber" valor={efectivo.esperado} total />
                </div>

                <div className="campo">
                    <label htmlFor="cc-saldo">Saldo en caja (efectivo que queda)</label>
                    <input id="cc-saldo" type="number" min="0" step="any" inputMode="decimal"
                        value={saldo} onChange={(e) => setSaldo(e.target.value)} autoFocus />
                </div>
                <div className="campo">
                    <label htmlFor="cc-retirado">Efectivo retirado</label>
                    <input id="cc-retirado" type="number" min="0" step="any" inputMode="decimal"
                        value={retirado} onChange={(e) => setRetirado(e.target.value)} />
                </div>

                {listo && (
                    <>
                        <Fila etiqueta="Efectivo contado (saldo + retirado)" valor={contado} />
                        <div className="resumen-fila resumen-fila--total">
                            <span>{textoDiferencia(diferencia)}</span>
                            <span className={claseDiferencia(diferencia)}>{formatoPrecio.format(diferencia)}</span>
                        </div>
                    </>
                )}

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-peligro" disabled={!listo || guardando}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Cerrando…</> : 'Cerrar caja'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}