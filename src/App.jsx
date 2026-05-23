import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';

import logoImg from './assets/images/logo.png';
import illustrationImg from './assets/images/image1.png';

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
      {/* LEFT BLACK PANEL */}
      <div className="w-[30%] min-w-[280px] max-w-[360px] bg-black p-10 flex flex-col justify-between items-center shrink-0 select-none border-r border-slate-900">
        
        {/* Top: Logo & Title */}
        <div className="w-full flex flex-col items-center gap-6 mt-6">
          <div className="w-full flex justify-center">
            <img 
              src={logoImg} 
              alt="APIIT Logo" 
              className="h-16 w-auto object-contain"
              draggable="false"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-light tracking-wide text-white">
              Attendance Portal
            </h1>
          </div>
        </div>

        {/* Bottom: Illustrator Image */}
        <div className="w-full flex justify-center mb-6">
          <img 
            src={illustrationImg} 
            alt="Attendance Illustration" 
            className="w-full max-w-[290px] h-auto object-contain opacity-90"
            draggable="false"
          />
        </div>

      </div>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 h-full bg-[#f8fafc] text-slate-800 flex flex-col overflow-hidden relative">
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
