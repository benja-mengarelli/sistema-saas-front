import { apiFetch } from './apiFetch';

export const obtenerCaja = (empresaId) => apiFetch(`/pos/${empresaId}/caja`);
export const abrirCaja = (empresaId, efectivoInicial) =>
    apiFetch(`/pos/${empresaId}/caja/abrir`, { method: 'POST', body: { efectivoInicial } });
export const cerrarCaja = (empresaId, efectivoContado) =>
    apiFetch(`/pos/${empresaId}/caja/cerrar`, { method: 'POST', body: { efectivoContado } });
export const crearVenta = (empresaId, datos) =>
    apiFetch(`/pos/${empresaId}/ventas`, { method: 'POST', body: datos, idempotente: true });

export const listarCuentas = (empresaId) =>
    apiFetch(`/pos/${empresaId}/cuentas-corrientes`);

export const obtenerCuenta = (empresaId, cuentaId) =>
    apiFetch(`/pos/${empresaId}/cuentas-corrientes/${cuentaId}`);

export const cargarACuenta = (empresaId, body) =>
    apiFetch(`/pos/${empresaId}/cuentas-corrientes/cargos`, { method: 'POST', body, idempotente: true });

export const pagarCuenta = (empresaId, cuentaId, body) =>
    apiFetch(`/pos/${empresaId}/cuentas-corrientes/${cuentaId}/pagos`, { method: 'POST', body, idempotente: true });

export const finalizarCuenta = async (empresaId, cuentaId, body) =>
    (await apiFetch(`/pos/${empresaId}/cuentas-corrientes/${cuentaId}/finalizar`, { method: 'POST', body, idempotente: true })).venta;