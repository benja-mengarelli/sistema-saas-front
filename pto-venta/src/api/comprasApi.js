import { apiFetch } from './apiFetch';

export const listarCompras = (empresaId, dias = 15) => apiFetch(`/compras/${empresaId}?dias=${dias}`);
export const obtenerCompra = (empresaId, compraId) => apiFetch(`/compras/${empresaId}/${compraId}`);
export const crearCompra = (empresaId, data) => apiFetch(`/compras/${empresaId}`, { method: 'POST', body: data });