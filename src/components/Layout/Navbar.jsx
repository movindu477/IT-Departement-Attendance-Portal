import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Calendar } from 'lucide-react';

const Navbar = ({ title, currentDate }) => {
  const { logout } = useAuth();

  return (
    <header className="h-16 border-b border-line bg-subtle flex items-center justify-between px-6 md:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-ink tracking-tight capitalize hidden sm:block">
          {title} Overview
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time calendar display */}
        {currentDate && (
          <div className="hidden lg:flex items-center gap-2 bg-subtle/50 border border-line px-3 py-1.5 rounded-lg text-xs text-ink-soft">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span>{currentDate}</span>
          </div>
        )}

        {/* Notification Bell */}
        <button className="relative p-2 text-ink-soft hover:text-ink hover:bg-subtle rounded-lg transition-colors duration-200">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500/100 animate-ping" />
        </button>

        {/* Logout Icon */}
        <button 
          onClick={logout}
          className="p-2 text-ink-soft hover:text-accent hover:bg-subtle rounded-lg transition-colors duration-200"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
