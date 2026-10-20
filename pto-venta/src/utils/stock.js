export function stockDisponible(p, porId) {
    if (p.tipo === 'COMBO') {
        const comps = (p.productos || [])
            .map((c) => ({ comp: porId.get(c.producto), cantidad: c.cantidad }))
            .filter((c) => c.comp?.stockeable && c.cantidad > 0);
        if (comps.length === 0) return Infinity;
        return Math.min(...comps.map((c) => Math.floor(c.comp.stock / c.cantidad)));
    }
    return p.stockeable ? p.stock : Infinity;
}