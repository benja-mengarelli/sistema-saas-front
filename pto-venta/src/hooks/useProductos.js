import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarProductos } from '../api/productosApi';

export function useProductos() {
    const { empresaActivaId } = useAuth();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const recargar = useCallback(async () => {
        if (!empresaActivaId) return;
        setCargando(true);
        setError(null);
        try {
            setProductos(await listarProductos(empresaActivaId));
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [empresaActivaId]);

    useEffect(() => { recargar(); }, [recargar]);

    return { productos, cargando, error, recargar };
}

export function agregarProducto() {
    
}