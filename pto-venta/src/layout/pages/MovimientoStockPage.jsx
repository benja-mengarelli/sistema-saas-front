import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMovimientos } from '../../hooks/useMovimientos';
import Modal from '../../components/Modal';
import DetalleMovimiento from '../../components/movimientos/DetalleMovimiento';
import PantallaCarga from '../PantallaCarga'; // ajustar nombre y path
import { ETIQUETA_MOVIMIENTO, formatoFechaHora } from '../../utils/formato';

const DIAS = 15;

export default function MovimientosStockPage() {
    const { empresaActiva } = useAuth();
    const navigate = useNavigate();
    const { movimientos, primeraCarga, error, recargar } = useMovimientos(DIAS);
    const [seleccionado, setSeleccionado] = useState(null);

    if (primeraCarga) return <PantallaCarga />;

    const abrirConTeclado = (e, m) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSeleccionado(m);
        }
    };

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div className="cabecera__izq">
                    <button type="button" className="btn-sec btn-volver" onClick={() => navigate('/dashboard')} aria-label="Volver al dashboard">←</button>
                    <div>
                        <h1>Movimientos de stock</h1>
                        <p>{empresaActiva?.nombre || empresaActiva?.id} · últimos {DIAS} días</p>
                    </div>
                </div>
            </header>

            {error && (
                <p className="error-msg">
                    {error}{' '}
                    <button type="button" className="btn-sec" onClick={recargar}>Reintentar</button>
                </p>
            )}

            {!error && movimientos.length === 0 && (
                <p className="vacio">No hay movimientos en los últimos {DIAS} días.</p>
            )}

            {!error && movimientos.length > 0 && (
                <div className="tabla-contenedor">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th className="num">Productos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.map((m) => {
                                const tipo = m.tipo || m.origen?.tipo;
                                return (
                                    <tr
                                        key={m._id}
                                        className="fila-click"
                                        tabIndex={0}
                                        onClick={() => setSeleccionado(m)}
                                        onKeyDown={(e) => abrirConTeclado(e, m)}
                                    >
                                        <td>{formatoFechaHora(m.createdAt)}</td>
                                        <td><span className="badge">{ETIQUETA_MOVIMIENTO[tipo] || tipo || '—'}</span></td>
                                        <td className="num">{m.cantidadProductos}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {seleccionado && (
                <Modal titulo="Detalle del movimiento" ancho onCerrar={() => setSeleccionado(null)}>
                    <DetalleMovimiento resumen={seleccionado} />
                </Modal>
            )}
        </div>
    );
}