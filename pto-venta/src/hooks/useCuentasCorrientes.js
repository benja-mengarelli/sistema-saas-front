import { useCallback, useEffect, useState } from 'react';
import { listarCuentas } from '../api/posApi';

export function useCuentasCorrientes(empresaId) {
    const [cuentas, setCuentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const recargar = useCallback(async () => {
        try {
            setError(null);
            setCuentas(await listarCuentas(empresaId));
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [empresaId]);

    useEffect(() => { if (empresaId) recargar(); }, [empresaId, recargar]);

    return { cuentas, cargando, error, recargar };
}