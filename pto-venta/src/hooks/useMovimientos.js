import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarMovimientos } from '../api/movimientosApi';

export function useMovimientos(dias = 15) {
    const { empresaActivaId } = useAuth();
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [primeraCarga, setPrimeraCarga] = useState(true);
    const [error, setError] = useState(null);

    const recargar = useCallback(async () => {
        if (!empresaActivaId) return;
        setCargando(true);
        setError(null);
        try {
            setMovimientos(await listarMovimientos(empresaActivaId, dias));
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
            setPrimeraCarga(false);
        }
    }, [empresaActivaId, dias]);

    useEffect(() => { recargar(); }, [recargar]);

    return { movimientos, cargando, primeraCarga, error, recargar };
}