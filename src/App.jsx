import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
      <div className="h-screen w-screen bg-[#E2E5EC] flex items-center justify-center text-[#4B5563] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#4A90E2]/25 border-t-[#4A90E2] animate-spin" />
          <p className="text-sm font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-['Poppins',sans-serif] bg-[#E2E5EC] text-[#1A1D21] transition-colors duration-300">
      <Outlet />
    </div>
  );
}

// Admin has no staff dashboard of its own - "/" must never render it for
// that account, regardless of how the account got there (browser back
// button, a bookmark, a typed URL). Login.jsx's post-login redirect only
// covers the sign-in moment; this covers every other path into "/".
function RootRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />;
}

function App() {
  if (configError) {
    return <SetupGuide error={configError} />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<LayoutWrapper />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<PrivateRoute />}>
                <Route path="/" element={<RootRoute />} />
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
    </ThemeProvider>
  );
}

export default App;
