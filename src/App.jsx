import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import AdminRoute from './components/Auth/AdminRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import TeamPage from './components/Team/TeamPage';
import AdminLayout from './components/Admin/AdminLayout';
import AdminOverviewPage from './components/Admin/pages/AdminOverviewPage';
import PayrollAnalyticsPage from './components/Admin/pages/PayrollAnalyticsPage';
import AttendanceLogPage from './components/Admin/pages/AttendanceLogPage';
import PresencePage from './components/Admin/pages/PresencePage';
import ReportsPage from './components/Admin/pages/ReportsPage';
import { configError } from './firebase';
import SetupGuide from './components/SetupGuide';

// Full-width shell. The old split panel with the background image has been
// removed — the app now runs edge to edge on the dark canvas.
function LayoutWrapper() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-canvas flex items-center justify-center text-ink-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-soft border-t-brand animate-spin" />
          <p className="text-sm font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-['Poppins',sans-serif] bg-canvas text-ink">
      <Outlet />
    </div>
  );
}

function App() {
  if (configError) {
    return <SetupGuide error={configError} />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<LayoutWrapper />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/team" element={<TeamPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="payroll" element={<PayrollAnalyticsPage />} />
                <Route path="attendance" element={<AttendanceLogPage />} />
                <Route path="presence" element={<PresencePage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
