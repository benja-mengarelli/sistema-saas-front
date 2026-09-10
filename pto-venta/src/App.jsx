import './App.css'
import { authProvider } from './login/authContext';
import { OperadorProvider } from './login/OperadorContext';
import { Routes, Route } from 'react-router-dom';

function App() {

  return (
    <AuthProvider>
      <OperadorProvider>
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/dashboard' element={<DashboardPage />} />
        </Routes>
      </OperadorProvider>
    </AuthProvider>
  )
}

export default App
