import { useCallback, useEffect, useMemo, useState } from 'react';

const leer = (clave) => {
    try { return JSON.parse(sessionStorage.getItem(clave)) || []; } catch { return []; }
};
const redondear2 = (n) => Math.round(n * 100) / 100;

export function useCarrito(empresaId, porId) {
    const clave = `carrito:${empresaId}`;
    // La página se desmonta al cambiar de empresa, por eso alcanza con leer una vez
    const [items, setItems] = useState(() => leer(clave));

    useEffect(() => {
        try { sessionStorage.setItem(clave, JSON.stringify(items)); } catch { /* storage bloqueado */ }
    }, [clave, items]);

    const lineas = useMemo(
        () => items
            .filter((i) => porId.has(i.producto))
            .map((i) => {
                const p = porId.get(i.producto);
                return { producto: i.producto, cantidad: i.cantidad, p, subtotal: redondear2(p.precioVenta * i.cantidad) };
            }),
        [items, porId]
    );

    const total = redondear2(lineas.reduce((s, l) => s + l.subtotal, 0));
    const cantidadTotal = lineas.reduce((s, l) => s + l.cantidad, 0);

    const agregar = useCallback((producto, max = Infinity) => {
        setItems((its) => {
            const existente = its.find((i) => i.producto === producto);
            if (existente) {
                return existente.cantidad + 1 > max
                    ? its
                    : its.map((i) => (i === existente ? { ...i, cantidad: i.cantidad + 1 } : i));
            }
            return max < 1 ? its : [...its, { producto, cantidad: 1 }];
        });
    }, []);

    const restar = useCallback((producto) => {
        setItems((its) => its.flatMap((i) => {
            if (i.producto !== producto) return [i];
            return i.cantidad > 1 ? [{ ...i, cantidad: i.cantidad - 1 }] : [];
        }));
    }, []);

    const quitar = useCallback((producto) => setItems((its) => its.filter((i) => i.producto !== producto)), []);
    const vaciar = useCallback(() => setItems([]), []);

    return { lineas, total, cantidadTotal, agregar, restar, quitar, vaciar };
}