import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProductos } from '../../hooks/useProductos';
import { guardarConteoStock } from '../../api/movimientosApi';
import PantallaCarga from '../PantallaCarga'; 
import {redondear, conSigno } from "../../utils/formato"


export default function ConteoStockPage() {
    const { empresaActiva, empresaActivaId } = useAuth();
    const navigate = useNavigate();
    const { productos, cargando, primeraCarga, error, recargar } = useProductos();

    const [valores, setValores] = useState({}); // { [productoId]: string }
    const [busqueda, setBusqueda] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorGuardado, setErrorGuardado] = useState(null);
    const [exito, setExito] = useState(null);

    // Solo los que controlan stock: servicios y combos no tienen qué contar
    const stockeables = useMemo(() => productos.filter((p) => p.stockeable), [productos]);

    const todas = useMemo(() => stockeables.map((p) => {
        const crudo = valores[p._id];
        const hayValor = crudo !== undefined && crudo !== '';
        const nuevo = hayValor ? Number(crudo) : null;
        const invalido = hayValor && (!Number.isFinite(nuevo) || nuevo < 0);
        const diferencia = hayValor && !invalido ? redondear(nuevo - p.stock) : null;
        return { p, nuevo, invalido, diferencia };
    }), [stockeables, valores]);

    const cambios = useMemo(
        () => todas.filter((f) => f.diferencia !== null && f.diferencia !== 0),
        [todas]
    );
    const hayInvalidos = todas.some((f) => f.invalido);

    const visibles = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return t ? todas.filter((f) => f.p.nombre.toLowerCase().includes(t)) : todas;
    }, [todas, busqueda]);

    if (primeraCarga) return <PantallaCarga />;

    const bloqueado = guardando || cargando;

    const cambiarValor = (id, valor) => {
        setValores((vs) => ({ ...vs, [id]: valor }));
        setExito(null);
    };

    // Enter pasa al siguiente casillero, cómodo para contar de corrido
    const alTeclear = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('.conteo-input'));
        inputs[inputs.indexOf(e.target) + 1]?.focus();
    };

    const volver = () => {
        if (cambios.length > 0 && !window.confirm(`Hay ${cambios.length} cambio(s) sin guardar. ¿Salir igual?`)) return;
        navigate('/productos');
    };

    const guardar = async () => {
        if (bloqueado || cambios.length === 0 || hayInvalidos) return;
        setGuardando(true);
        setErrorGuardado(null);
        setExito(null);
        try {
            const r = await guardarConteoStock(
                empresaActivaId,
                cambios.map((f) => ({ producto: f.p._id, stockContado: f.nuevo }))
            );
            setExito(
                r.ajustados === 0
                    ? 'No había diferencias para guardar.'
                    : `Conteo guardado: ${r.ajustados} producto(s) ajustado(s).`
            );
            setValores({});
            await recargar();
        } catch (e) {
            setErrorGuardado(e.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div className="cabecera__izq">
                    <button type="button" className="btn-sec btn-volver" onClick={volver} aria-label="Volver a productos">←</button>
                    <div>
                        <h1>Conteo de stock</h1>
                        <p>{empresaActiva?.nombre || empresaActiva?.id}</p>
                    </div>
                </div>
            </header>

            {error && (
                <p className="error-msg">
                    {error}{' '}
                    <button type="button" className="btn-sec" onClick={recargar}>Reintentar</button>
                </p>
            )}

            {!error && stockeables.length === 0 && (
                <p className="vacio">No hay productos con control de stock.</p>
            )}

            {!error && stockeables.length > 0 && (
                <fieldset className="form__campos" disabled={bloqueado}>
                    <input
                        type="search" className="buscador" placeholder="Buscar producto…"
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    />

                    <div className="tabla-contenedor">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th className="num">Stock actual</th>
                                    <th className="num">Nuevo stock</th>
                                    <th className="num">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map(({ p, invalido, diferencia }) => (
                                    <tr key={p._id}>
                                        <td>{p.nombre}</td>
                                        <td>{p.categoria || '—'}</td>
                                        <td className="num">{p.stock}</td>
                                        <td className="num">
                                            <input
                                                className="conteo-input" type="number" min="0" step="any" inputMode="decimal"
                                                placeholder={String(p.stock)}
                                                value={valores[p._id] ?? ''}
                                                onChange={(e) => cambiarValor(p._id, e.target.value)}
                                                onKeyDown={alTeclear}
                                                aria-label={`Nuevo stock de ${p.nombre}`}
                                                aria-invalid={invalido}
                                            />
                                        </td>
                                        <td className="num">
                                            {invalido ? (
                                                <span className="dif--menos">Inválido</span>
                                            ) : diferencia === null ? (
                                                <span className="dif--vacio">—</span>
                                            ) : (
                                                <span className={diferencia > 0 ? 'dif--mas' : diferencia < 0 ? 'dif--menos' : 'dif--cero'}>
                                                    {conSigno(diferencia)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {errorGuardado && <p className="error-msg">{errorGuardado}</p>}
                    {exito && <p className="exito-msg">{exito}</p>}

                    <div className="barra-guardado">
                        <span>
                            {cambios.length === 0
                                ? 'Sin diferencias cargadas'
                                : `${cambios.length} producto(s) con diferencias`}
                            {hayInvalidos && ' · hay valores inválidos'}
                        </span>
                        <div className="form__acciones">
                            <button type="button" className="btn-sec" onClick={() => setValores({})} disabled={Object.keys(valores).length === 0}>
                                Limpiar
                            </button>
                            <button type="button" className="btn-prim" onClick={guardar} disabled={cambios.length === 0 || hayInvalidos}>
                                {guardando
                                    ? <><span className="spinner" aria-hidden="true" />Guardando…</>
                                    : `Guardar conteo (${cambios.length})`}
                            </button>
                        </div>
                    </div>
                </fieldset>
            )}
        </div>
    );
}