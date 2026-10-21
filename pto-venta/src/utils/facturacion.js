const r2 = (n) => Math.round(n * 100) / 100;

// El servicio de mesa se cuenta junto a los productos; el alquiler va aparte
export function agruparFacturacion(f = {}) {
    const productos = r2((f.productos || 0) + (f.servicios || 0));
    const alquileres = r2(f.alquileres || 0);
    return { productos, alquileres, total: r2(productos + alquileres) };
}