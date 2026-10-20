export const TIPOS = [
    { id: 'EFECTIVO', label: 'Efectivo' },
    { id: 'TRANSFERENCIA', label: 'Transferencia' },
    { id: 'TARJETA', label: 'Tarjeta' },
];
export const cent = (v) => Math.round((Number(v) || 0) * 100);