import { useEffect } from 'react';

export default function Modal({ titulo, onCerrar, cerrable = true, children, ancho }) {
    useEffect(() => {
        const alTeclear = (e) => e.key === 'Escape' && cerrable && onCerrar();
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, [onCerrar, cerrable]);

    return (
        <div className="modal-fondo" onMouseDown={(e) => cerrable && e.target === e.currentTarget && onCerrar()}>
            <div className={`modal${ancho ? ' modal--ancho' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
                <header className="modal__cabecera">
                    <h2>{titulo}</h2>
                    <button type="button" className="btn-sec btn-volver" onClick={onCerrar} disabled={!cerrable} aria-label="Cerrar">✕</button>
                </header>
                {children}
            </div>
        </div>
    );
}