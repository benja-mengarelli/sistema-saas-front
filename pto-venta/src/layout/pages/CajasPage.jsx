import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listarCajas } from '../../api/cajasApi';
import { formatoPrecio } from '../../utils/formato';
import PantallaCarga from '../PantallaCarga';
import CajaDetalle from '../../components/cajas/CajaDetalle';

const fechaCaja = (f) => new Date(f).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' });

export default function CajasPage() {
    console.log("entrando a cajas page")
    const { empresaActiva, empresaActivaId } = useAuth();
    const navigate = useNavigate();
    const [cajas, setCajas] = useState(null);
    const [error, setError] = useState(null);
    const [seleccion, setSeleccion] = useState(null);

    const cargar = useCallback(async () => {
        try {
            setError(null);
            setCajas(await listarCajas(empresaActivaId));
        } catch (e) {
            setError(e.message);
        }
    }, [empresaActivaId]);

    useEffect(() => { cargar(); }, [cargar]);

    if (!cajas && !error) return <PantallaCarga />;

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div className="cabecera__izq">
                    <button type="button" className="btn-sec btn-volver" onClick={() => navigate('/dashboard')} aria-label="Volver al dashboard">←</button>
                    <div>
                        <h1>Cajas</h1>
                        <p>{empresaActiva?.nombre || empresaActiva?.id} · últimos 15 días</p>
                    </div>
                </div>
            </header>

            {error && (
                <p className="error-msg">{error} <button type="button" className="btn-sec" onClick={cargar}>Reintentar</button></p>
            )}

            {seleccion ? (
                <CajaDetalle cajaId={seleccion} onVolver={() => setSeleccion(null)} />
            ) : cajas && (
                cajas.length === 0 ? <p>No hay cajas en los últimos 15 días.</p> : (
                    <ul className="cc-lista">
                        {cajas.map((c) => {
                            const f = c.facturacion || {};
                            const vendido = (f.productos || 0) + (f.servicios || 0) + (f.alquileres || 0);
                            return (
                                <li key={c._id}>
                                    <button type="button" className="cc-card" onClick={() => setSeleccion(c._id)}>
                                        <strong>{fechaCaja(c.fecha)}</strong>
                                        <span>{c.estado === 'abierta' ? 'Abierta' : 'Cerrada'}</span>
                                        <span className="cc-card__saldo">Vendido {formatoPrecio.format(vendido)}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )
            )}
        </div>
    );
}