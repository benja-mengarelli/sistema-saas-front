import { apiFetch } from './apiFetch';

export const listarCajas = (empresaId) => apiFetch(`/pos/${empresaId}/cajas`);
export const obtenerDetalleCaja = (empresaId, cajaId) => apiFetch(`/pos/${empresaId}/cajas/${cajaId}`)