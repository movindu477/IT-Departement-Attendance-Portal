import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';

import backgroundImage from './assets/images/image1.jpg';

function SplitLayoutWrapper() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0b0f19] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-sm font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row font-['Poppins',sans-serif] bg-black text-slate-100">
      {/* LEFT PANEL WITH IMAGE BACKGROUND */}
      <div 
        style={{ backgroundImage: `url(${backgroundImage})` }}
        className="w-[30%] min-w-[280px] max-w-[360px] bg-cover bg-center shrink-0 select-none relative border-r border-slate-900 flex flex-col justify-between p-10"
      >
        {/* Semi-transparent dark overlay for high text contrast */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] z-0" />
        
        {/* Top: Title */}
        <div className="relative z-10 w-full text-center mt-6">
          <h1 className="text-2xl font-light tracking-wide text-white drop-shadow-md">
            Attendance Portal
          </h1>
        </div>

        {/* Bottom: Copyright Info */}
        <div className="relative z-10 w-full text-center text-xs text-white/50 mb-6 font-light">
          © 2026 Attendance Portal. All rights reserved.
        </div>
      </div>

      {/* RIGHT MAIN CONTAINER - DARK BACKGROUND */}
      <div className="flex-1 h-full bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-black text-slate-200 flex flex-col overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<SplitLayoutWrapper />}>
            {/* Public forms inside right panel */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected dashboard inside right panel */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Dashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
