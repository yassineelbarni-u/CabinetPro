import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { PageTransition } from './components/common/PageTransition';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import SessionCreatePage from './pages/SessionCreatePage';
import AppointmentsPage from './pages/AppointmentsPage';
import PaymentsPage from './pages/PaymentsPage';
import AccountingPage from './pages/AccountingPage';
import SettingsPage from './pages/SettingsPage';

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
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={
                <PageTransition>
                  <LoginPage />
                </PageTransition>
              } />

              <Route path="/" element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }>
                <Route index element={
                  <PageTransition>
                    <DashboardPage />
                  </PageTransition>
                } />
                <Route path="patients" element={
                  <PageTransition>
                    <PatientsPage />
                  </PageTransition>
                } />
                <Route path="patients/:id" element={
                  <PageTransition>
                    <PatientDetailPage />
                  </PageTransition>
                } />
                <Route path="patients/:patient_id/sessions/new" element={
                  <PageTransition>
                    <SessionCreatePage />
                  </PageTransition>
                } />
                <Route path="appointments" element={
                  <PageTransition>
                    <AppointmentsPage />
                  </PageTransition>
                } />
                <Route path="payments" element={
                  <PageTransition>
                    <PaymentsPage />
                  </PageTransition>
                } />
                <Route path="accounting" element={
                  <PageTransition>
                    <AccountingPage />
                  </PageTransition>
                } />
                <Route path="settings" element={
                  <PageTransition>
                    <SettingsPage />
                  </PageTransition>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
