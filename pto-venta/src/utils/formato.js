export const ETIQUETA_TIPO = { PRODUCTO: 'Producto', SERVICIO: 'Servicio', ALQUILER: 'Alquiler', COMBO: 'Combo' };
export const formatoPrecio = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }); 
export const ETIQUETA_MOVIMIENTO = {
    VENTA: 'Venta', COMPRA: 'Compra', AJUSTE: 'Ajuste',
    MERMA: 'Merma', DEVOLUCION: 'Devolución', TRASLADO: 'Traslado',
};

export const formatoFechaHora = (fecha) =>
    new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export const redondear = (n) => Number(n.toFixed(3));
export const conSigno = (n) => (n > 0 ? `+${n}` : String(n));
export const claseDiferencia = (n) => (n > 0 ? 'dif--mas' : n < 0 ? 'dif--menos' : 'dif--cero');