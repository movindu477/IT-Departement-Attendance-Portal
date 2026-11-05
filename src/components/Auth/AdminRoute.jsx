import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Mounted here too (not just in PrivateRoute) so the admin account still
  // shows up online on the team page - AdminRoute is a sibling of
  // PrivateRoute, not nested inside it.
  usePresence();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-ink-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
          <p className="text-sm font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
