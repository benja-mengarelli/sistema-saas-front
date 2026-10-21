import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Tarjeta from '../../components/Tarjeta';
import { BOXES } from '../../config/dashboardBoxes';

export default function DashboardPage() {
    const { user, datos, empresas, empresaActiva, logout } = useAuth();
    const navigate = useNavigate();

    const nombre = datos?.nombre || user?.displayName || user?.email;


    // Cuando exista el rol del operador:
    // const bloqueado = (box) => !box.roles.includes(rolOperador);
    const bloqueado = () => false;

    return (
        <div className="pantalla">
            <header className="pantalla__cabecera">
                <div>
                    <h1>{empresaActiva?.nombre || empresaActiva?.id}</h1>
                    <p>Hola, {nombre}</p>
                </div>
                <div className="pantalla__acciones">

                    <button type="button" className="btn-sec" onClick={() => navigate('/empresas')}>
                        Cambiar empresa
                    </button>

                    <button type="button" className="btn-sec" onClick={logout}>Salir</button>
                </div>
            </header>

            <main className="tarjetas">
                {BOXES.map((box) => (
                    <Tarjeta
                        key={box.id}
                        icono={box.icono}
                        label={box.label}
                        bloqueado={bloqueado(box)}
                        onClick={() => navigate(box.path)}
                    />
                ))}
            </main>
        </div>
    );
}