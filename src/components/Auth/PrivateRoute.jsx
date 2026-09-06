import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Single presence writer for the whole authenticated tree — calling this
  // per-page would register redundant listeners. Must sit above the early
  // returns below so hook order stays stable across renders.
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

  return children ? children : <Outlet />;
};

export default PrivateRoute;
