import { apiFetch } from './apiFetch';

const base = (empresaId) => `/products/${empresaId}`;

export const listarProductos = (empresaId, q = '') =>
    apiFetch(`${base(empresaId)}${q ? `?q=${encodeURIComponent(q)}` : ''}`, { timeoutMs: 60000 });

export const obtenerProducto = (empresaId, pid) => apiFetch(`${base(empresaId)}/${pid}`);

export const crearProducto = (empresaId, data) => apiFetch(base(empresaId), { method: 'POST', body: data });

export const actualizarProducto = (empresaId, pid, data) =>
    apiFetch(`${base(empresaId)}/${pid}`, { method: 'PUT', body: data });

export const eliminarProducto = (empresaId, pid) =>
    apiFetch(`${base(empresaId)}/${pid}`, { method: 'DELETE' });