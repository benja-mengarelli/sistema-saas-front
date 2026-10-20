import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { abrirCaja } from '../../api/posApi';

export default function AbrirCajaForm({ onAbierta, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const [monto, setMonto] = useState('0');
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const enviar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        setError(null);

        const valor = Number(monto);
        if (monto === '' || !Number.isFinite(valor) || valor < 0) return setError('Ingresá un monto válido');

        setGuardando(true);
        onOcupado?.(true);
        try {
            await abrirCaja(empresaActivaId, valor);
            onAbierta();
        } catch (err) {
            setError(err.message);
            setGuardando(false);
            onOcupado?.(false);
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="campo">
                    <label htmlFor="ac-monto">Efectivo inicial en caja</label>
                    <input id="ac-monto" type="number" min="0" step="any" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando}>
                        {guardando ? <><span className="spinner" aria-hidden="true" />Abriendo…</> : 'Abrir caja'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}