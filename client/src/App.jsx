import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import SessionCreatePage from './pages/SessionCreatePage';
import AppointmentsPage from './pages/AppointmentsPage';

import { LanguageProvider } from './context/LanguageContext';

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="patients/:patient_id/sessions/new" element={<SessionCreatePage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="payments" element={<div className="p-6"><h1 className="text-2xl font-bold">Paiements (En construction)</h1></div>} />
            <Route path="accounting" element={<div className="p-6"><h1 className="text-2xl font-bold">Comptabilité (En construction)</h1></div>} />
            <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Paramètres (En construction)</h1></div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
