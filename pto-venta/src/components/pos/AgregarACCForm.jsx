import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cargarACuenta } from '../../api/posApi';
import { formatoPrecio } from '../../utils/formato';

const NUEVA = '__nueva__';

export default function AgregarACCForm({ lineas, total, cuentas, clave, onAgregado, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const [destino, setDestino] = useState(cuentas.length ? cuentas[0]._id : NUEVA);
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const nueva = destino === NUEVA;
    const problema = nueva && !nombre.trim() ? 'Escribí un nombre para la cuenta' : null;

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        if (problema) return setError(problema);
        setError(null);

        const payload = {
            claveIdempotencia: clave,
            items: lineas.map((l) => ({ producto: l.producto, cantidad: l.cantidad })),
            ...(nueva ? { cliente: nombre.trim() } : { cuentaId: destino }),
        };

        setGuardando(true);
        onOcupado?.(true);
        try {
            await cargarACuenta(empresaActivaId, payload);
            onAgregado();
        } catch (err) {
            setError(err.timeout ? `${err.message} Podés volver a tocar Agregar: no se duplica.` : err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <p>Se suman {formatoPrecio.format(total)} a la cuenta.</p>

                <div className="campo">
                    <label htmlFor="acc-destino">Cuenta</label>
                    <select id="acc-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
                        {cuentas.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.cliente} · debe {formatoPrecio.format(c.saldo)}
                            </option>
                        ))}
                        <option value={NUEVA}>+ Nueva cuenta…</option>
                    </select>
                </div>

                {nueva && (
                    <div className="campo">
                        <label htmlFor="acc-nombre">Nombre (persona o mesa)</label>
                        <input
                            id="acc-nombre" type="text" maxLength={80} autoFocus
                            value={nombre} onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                )}

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando || Boolean(problema)}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Agregando…</> : 'Agregar a la cuenta'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}