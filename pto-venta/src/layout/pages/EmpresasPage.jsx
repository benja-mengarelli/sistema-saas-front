import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Tarjeta from '../../components/Tarjeta';

export default function EmpresasPage() {
    const { user, datos, empresas, cambiarEmpresaActiva, logout } = useAuth();
    const navigate = useNavigate();

    const nombre = datos?.nombre || user?.displayName || user?.email;

    const elegir = (empresaId) => {
        cambiarEmpresaActiva(empresaId);
        navigate('/dashboard');
    };

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div>
                    <h1>Elegí tu empresa</h1>
                    <p>Hola, {nombre}</p>
                </div>
                <div className="pantalla__acciones">
                    <button type="button" className="btn-sec" onClick={logout}>Salir</button>
                </div>
            </header>

            {empresas.length === 0 ? (
                <p className="vacio">Todavía no pertenecés a ninguna empresa.</p>
            ) : (
                <main className="tarjetas">
                    {empresas.map((e) => (
                        <Tarjeta key={e.id} icono="🏢" label={e.nombre || e.id} onClick={() => elegir(e.id)} />
                    ))}
                </main>
            )}
        </div>
    );
}