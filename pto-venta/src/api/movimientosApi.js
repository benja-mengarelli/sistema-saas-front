import { apiFetch } from './apiFetch';

export const guardarConteoStock = (empresaId, conteos) =>
    apiFetch(`/movimientos-stock/${empresaId}/ajuste`, { method: 'POST', body: { conteos } });
export const listarMovimientos = (empresaId, dias = 15) =>
    apiFetch(`/movimientos-stock/${empresaId}?dias=${dias}`);
export const obtenerMovimiento = (empresaId, movimientoId) =>
    apiFetch(`/movimientos-stock/${empresaId}/${movimientoId}`);