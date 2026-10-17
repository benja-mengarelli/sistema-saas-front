import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PantallaCarga from '../layout/PantallaCarga';


// Solo para usuarios sin sesión (login). Si ya hay sesión, va a elegir empresa.
export function RutaPublica() {
    const { user, cargando } = useAuth();
    if (cargando) return <PantallaCarga />;
    if (user) return <Navigate to="/empresas" replace />;
    return <Outlet />;
}

// Requiere sesión; con requiereEmpresa, además una empresa elegida.
export function RutaProtegida({ requiereEmpresa = false }) {
    const { user, empresaActivaId, cargando } = useAuth();
    if (cargando) return <PantallaCarga />;
    if (!user) return <Navigate to="/" replace />;
    if (requiereEmpresa && !empresaActivaId) return <Navigate to="/empresas" replace />;
    return <Outlet />;
}