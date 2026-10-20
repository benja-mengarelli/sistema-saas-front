import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerCaja } from '../api/posApi';

export function useCaja() {
    const { empresaActivaId } = useAuth();
    const [estado, setEstado] = useState({ caja: null, resumen: null });
    const [primeraCarga, setPrimeraCarga] = useState(true);
    const [error, setError] = useState(null);

    const recargar = useCallback(async () => {
        if (!empresaActivaId) return;
        setError(null);
        try {
            setEstado(await obtenerCaja(empresaActivaId));
        } catch (e) {
            setError(e.message);
        } finally {
            setPrimeraCarga(false);
        }
    }, [empresaActivaId]);

    useEffect(() => { recargar(); }, [recargar]);

    return { caja: estado.caja, resumen: estado.resumen, primeraCarga, error, recargar };
}