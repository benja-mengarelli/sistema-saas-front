import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cerrarCaja } from '../../api/posApi';
import { formatoPrecio } from '../../utils/formato';

const Fila = ({ etiqueta, valor, total = false }) => (
    <div className={`resumen-fila${total ? ' resumen-fila--total' : ''}`}>
        <span>{etiqueta}</span>
        <span>{formatoPrecio.format(valor)}</span>
    </div>
);

const textoDiferencia = (d) => (d > 0 ? 'Sobrante' : d < 0 ? 'Faltante' : 'Sin diferencia');
const claseDiferencia = (d) => (d > 0 ? 'dif--mas' : d < 0 ? 'dif--menos' : 'dif--cero');

export default function CerrarCajaForm({ resumen, onCerrada, onTerminar, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const [contado, setContado] = useState('');
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [resultado, setResultado] = useState(null);

    // Resultado final: no depende de las props, que cambian cuando se recarga la caja
    if (resultado) {
        const { efectivo } = resultado.resumen;
        const dif = resultado.caja.efectivo.diferencia;
        return (
            <div className="form">
                <p>Caja cerrada.</p>
                <div className="resumen">
                    <Fila etiqueta="Debe haber" valor={efectivo.esperado} />
                    <Fila etiqueta="Efectivo contado" valor={resultado.caja.efectivo.final} />
                    <div className="resumen-fila resumen-fila--total">
                        <span>{textoDiferencia(dif)}</span>
                        <span className={claseDiferencia(dif)}>{formatoPrecio.format(dif)}</span>
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
    const hayContado = contado !== '' && Number.isFinite(Number(contado)) && Number(contado) >= 0;
    const diferencia = hayContado ? Math.round((Number(contado) - efectivo.esperado) * 100) / 100 : null;

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        setError(null);
        if (!hayContado) return setError('Ingresá el efectivo contado');

        setGuardando(true);
        onOcupado?.(true);
        try {
            const r = await cerrarCaja(empresaActivaId, Number(contado));
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
                    <h3 className="resumen__titulo">Facturación</h3>
                    <Fila etiqueta="Productos" valor={facturacion.productos} />
                    <Fila etiqueta="Servicios" valor={facturacion.servicios} />
                    {facturacion.alquileres > 0 && <Fila etiqueta="Alquileres" valor={facturacion.alquileres} />}
                    <Fila etiqueta="Total" valor={facturacion.total} total />
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
                    <label htmlFor="cc-contado">Efectivo contado</label>
                    <input id="cc-contado" type="number" min="0" step="any" inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value)} autoFocus />
                </div>

                {diferencia !== null && (
                    <div className="resumen-fila resumen-fila--total">
                        <span>{textoDiferencia(diferencia)}</span>
                        <span className={claseDiferencia(diferencia)}>{formatoPrecio.format(diferencia)}</span>
                    </div>
                )}

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-peligro" disabled={!hayContado || guardando}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Cerrando…</> : 'Cerrar caja'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}