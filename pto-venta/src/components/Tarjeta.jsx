export default function Tarjeta({ icono, label, bloqueado = false, peligro = false, onClick }) {
    const clases = ['tarjeta', bloqueado && 'tarjeta--bloqueada', peligro && 'tarjeta--peligro']
        .filter(Boolean)
        .join(' ');

    return (
        <button type="button" className={clases} onClick={onClick} disabled={bloqueado}>
            <span className="tarjeta__icono" aria-hidden="true">{icono}</span>
            <span>{label}</span>
            {bloqueado && <span className="tarjeta__candado" aria-label="Bloqueado">🔒</span>}
        </button>
    );
}