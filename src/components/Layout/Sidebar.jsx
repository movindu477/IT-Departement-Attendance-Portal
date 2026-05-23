import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar, Users, Activity, Shield, FileText, ChevronDown } from 'lucide-react';

const Sidebar = ({ isCheckedIn, isOnBreak }) => {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border-l-4 border-violet-500 text-white font-semibold'
        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    }`;

  return (
    <aside className="w-full md:w-64 bg-slate-950/80 border-b md:border-r border-slate-800/80 flex flex-col justify-between shrink-0">
      <div>
        {/* Logo Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-900">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Clock className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Valen<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Time</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Smart Portal</span>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="p-6 border-b border-slate-900 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                alt="User Avatar"
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-violet-500/30"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${isCheckedIn ? (isOnBreak ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm truncate max-w-[130px]">{user?.name || 'Marcus Vance'}</h3>
              <p className="text-xs text-slate-400 truncate max-w-[130px]">{user?.role || 'Senior UI Architect'}</p>
            </div>
          </div>
          <div className="mt-4 py-1.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800/50 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className={`font-semibold ${isCheckedIn ? (isOnBreak ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'}`}>
              {isCheckedIn ? (isOnBreak ? 'On Break' : 'Active Working') : 'Offline'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          <NavLink to="/" className={linkClass}>
            <Activity className="w-4 h-4" />
            Dashboard
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            <Calendar className="w-4 h-4" />
            Attendance History
          </NavLink>
          
          {/* Reports Navigation Section */}
          <div className="space-y-1 pt-1">
            <span className="px-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Reports</span>
            <NavLink to="/reports/monthly" className={linkClass}>
              <FileText className="w-4 h-4" />
              Monthly Overview
            </NavLink>
            <NavLink to="/reports/generator" className={linkClass}>
              <FileText className="w-4 h-4" />
              Report Generator
            </NavLink>
          </div>

          <div className="pt-2">
            <span className="px-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Collaboration</span>
            <NavLink to="/team" className={linkClass}>
              <Users className="w-4 h-4" />
              My Team
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Sidebar Footer info */}
      <div className="p-6 border-t border-slate-900 hidden md:block">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Shield className="w-3.5 h-3.5 text-violet-500/60" />
          <span>Secure Enterprise Auth</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
