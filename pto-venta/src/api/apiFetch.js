import { auth } from '../firebase/firebase.config';
import { API_URL } from '../config/api_config';

export async function apiFetch(ruta, { method = 'GET', body, timeoutMs = 30000 } = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error('Sesión no iniciada');

    const idToken = await user.getIdToken();
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), timeoutMs);

    try {
        const res = await fetch(`${API_URL}/api${ruta}`, {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controlador.signal,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            const error = new Error(data?.message || data?.error || `Error ${res.status}`);
            error.status = res.status;
            throw error;
        }
        return data;
    } catch (e) {
        if (e.name === 'AbortError') {
            const aviso = method === 'GET'
                ? ''
                : ' Antes de reintentar, revisá el listado: puede que se haya guardado igual.';
            throw Object.assign(
                new Error(`El servidor tardó demasiado en responder (puede estar iniciándose).${aviso}`),
                { timeout: true }
            );
        }
        if (e instanceof TypeError) {
            throw new Error('No se pudo conectar con el servidor. Revisá tu conexión.');
        }
        throw e;
    } finally {
        clearTimeout(timer);
    }
}