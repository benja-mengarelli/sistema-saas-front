import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crearProducto } from '../../api/productosApi';

const num = (v) => (v === '' ? 0 : Number(v));

export default function ProductoForm({ tipo, categorias = [], onGuardado, onCancelar, onOcupado }) {
    const { empresaActivaId } = useAuth();
    const esServicio = tipo === 'SERVICIO';

    const [form, setForm] = useState({
        nombre: '', categoria: '', precioCompra: '', precioVenta: '',
        stockeable: !esServicio, stock: '', avisarStockMinimo: false, stockMinimo: '',
    });
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const cambiar = (campo) => (e) => {
        const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    const enviar = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.nombre.trim()) return setError('El nombre es obligatorio');
        if (form.precioVenta === '' || num(form.precioVenta) < 0) return setError('Ingresá un precio de venta válido');
        if (num(form.precioCompra) < 0 || num(form.stock) < 0 || num(form.stockMinimo) < 0) {
            return setError('No se permiten valores negativos');
        }

        const payload = {
            tipo,
            nombre: form.nombre.trim(),
            categoria: form.categoria.trim() || undefined,
            precioCompra: num(form.precioCompra),
            precioVenta: num(form.precioVenta),
        };
        if (!esServicio) {
            payload.stockeable = form.stockeable;
            if (form.stockeable) {
                payload.stock = num(form.stock);
                payload.avisarStockMinimo = form.avisarStockMinimo;
                payload.stockMinimo = form.avisarStockMinimo ? num(form.stockMinimo) : 0;
            }
        }

        setGuardando(true);
        onOcupado?.(true)
        try {
            await crearProducto(empresaActivaId, payload);
            onGuardado();
        } catch (err) {
            setError(err.message);
            setGuardando(false);
            onOcupado?.(false)
        }
    };

    return (
        <form className="form" onSubmit={enviar}>
            <fieldset className="form__campos" disabled={guardando}>
                <div className="campo">
                    <label htmlFor="pf-nombre">Nombre</label>
                    <input id="pf-nombre" type="text" value={form.nombre} onChange={cambiar('nombre')} autoFocus />
                </div>

                <div className="campo">
                    <label htmlFor="pf-categoria">Categoría (opcional)</label>
                    <input id="pf-categoria" type="text" list="pf-categorias" value={form.categoria} onChange={cambiar('categoria')} />
                    <datalist id="pf-categorias">
                        {categorias.map((c) => <option key={c} value={c} />)}
                    </datalist>
                </div>

                <div className="fila-campos">
                    <div className="campo">
                        <label htmlFor="pf-costo">Costo</label>
                        <input id="pf-costo" type="number" min="0" step="any" value={form.precioCompra} onChange={cambiar('precioCompra')} />
                    </div>
                    <div className="campo">
                        <label htmlFor="pf-venta">Precio de venta</label>
                        <input id="pf-venta" type="number" min="0" step="any" value={form.precioVenta} onChange={cambiar('precioVenta')} />
                    </div>
                </div>

                {!esServicio && (
                    <>
                        <div className="campo campo--check">
                            <input id="pf-stockeable" type="checkbox" checked={form.stockeable} onChange={cambiar('stockeable')} />
                            <label htmlFor="pf-stockeable">Controla stock</label>
                        </div>

                        {form.stockeable && (
                            <>
                                <div className="campo">
                                    <label htmlFor="pf-stock">Stock inicial</label>
                                    <input id="pf-stock" type="number" min="0" step="any" value={form.stock} onChange={cambiar('stock')} />
                                </div>
                                <div className="campo campo--check">
                                    <input id="pf-avisar" type="checkbox" checked={form.avisarStockMinimo} onChange={cambiar('avisarStockMinimo')} />
                                    <label htmlFor="pf-avisar">Avisar cuando el stock sea bajo</label>
                                </div>
                                {form.avisarStockMinimo && (
                                    <div className="campo">
                                        <label htmlFor="pf-minimo">Stock mínimo</label>
                                        <input id="pf-minimo" type="number" min="0" step="any" value={form.stockMinimo} onChange={cambiar('stockMinimo')} />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {error && <p className="error-msg">{error}</p>}

                <div className="form__acciones">
                    <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
                    <button type="submit" className="btn-prim" disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </fieldset>
        </form>
    );
}