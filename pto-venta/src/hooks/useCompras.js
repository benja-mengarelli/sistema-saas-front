import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarCompras } from '../api/comprasApi';

export function useCompras(dias = 15) {
    const { empresaActivaId } = useAuth();
    const [compras, setCompras] = useState([]);
    const [primeraCarga, setPrimeraCarga] = useState(true);
    const [error, setError] = useState(null);

    const recargar = useCallback(async () => {
        if (!empresaActivaId) return;
        setError(null);
        try {
            setCompras(await listarCompras(empresaActivaId, dias));
        } catch (e) {
            setError(e.message);
        } finally {
            setPrimeraCarga(false);
        }
    }, [empresaActivaId, dias]);

    useEffect(() => { recargar(); }, [recargar]);

    return { compras, primeraCarga, error, recargar };
}