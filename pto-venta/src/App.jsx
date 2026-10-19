import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RutaPublica, RutaProtegida } from './components/guards';
import LoginPage from './layout/pages/Login.jsx';
import EmpresasPage from './layout/pages/EmpresasPage.jsx';
import DashboardPage from './layout/pages/DashboardPage.jsx';
import ProductosPage from './layout/pages/ProductosPage';
import ConteoStockPage from "./layout/pages/ConteoStockPage.jsx"
import MovimientosStockPage from './layout/pages/MovimientoStockPage.jsx';
/* import ComprasPage from "./layout/pages/ComprasPage" */

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<RutaPublica />}>
                        <Route path="/" element={<LoginPage />} />
                    </Route>

                    <Route element={<RutaProtegida />}>
                        <Route path="/empresas" element={<EmpresasPage />} />
                    </Route>

                    <Route element={<RutaProtegida requiereEmpresa />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/productos" element={<ProductosPage />} />
                        <Route path="/productos/conteo" element={<ConteoStockPage />} />
                        <Route path="/movimientos-stock" element={<MovimientosStockPage />} />
                        {/* <Route path="/compras" element={<ComprasPage />} /> */}
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;