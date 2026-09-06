import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar, Users, Activity, Shield, FileText, ChevronDown } from 'lucide-react';
import AvatarUpload from './AvatarUpload';

const Sidebar = ({ isCheckedIn, isOnBreak }) => {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border-l-4 border-violet-500 text-ink font-semibold'
        : 'text-ink-soft hover:bg-subtle hover:text-ink'
    }`;

  return (
    <aside className="w-full md:w-64 bg-subtle/80 border-b md:border-r border-line flex flex-col justify-between shrink-0">
      <div>
        {/* Logo Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-line">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-brand-ink flex items-center justify-center shadow-lg shadow-brand/20">
            <Clock className="w-5 h-5 text-ink animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink flex items-center gap-1">
              Valen<span className="bg-gradient-to-r from-brand to-brand-ink bg-clip-text text-transparent">Time</span>
            </h1>
            <span className="text-[10px] text-muted font-semibold tracking-widest uppercase">Smart Portal</span>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="p-6 border-b border-line bg-subtle">
          <div className="flex items-center gap-3">
            <AvatarUpload
              size={48}
              status={isCheckedIn ? (isOnBreak ? 'break' : 'active') : 'offline'}
            />
            <div>
              <h3 className="font-semibold text-ink text-sm truncate max-w-[150px]">{user?.name || 'User'}</h3>
            </div>
          </div>
          <div className="mt-4 py-1.5 px-3 rounded-lg bg-subtle/60 border border-line/50 flex items-center justify-between text-xs">
            <span className="text-ink-soft">Status:</span>
            <span className={`font-semibold ${isCheckedIn ? (isOnBreak ? 'text-accent' : 'text-mint-ink') : 'text-ink-soft'}`}>
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
            <span className="px-4 text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Reports</span>
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
            <span className="px-4 text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Collaboration</span>
            <NavLink to="/team" className={linkClass}>
              <Users className="w-4 h-4" />
              My Team
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Sidebar Footer info */}
      <div className="p-6 border-t border-line hidden md:block">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Shield className="w-3.5 h-3.5 text-brand0/60" />
          <span>Secure Enterprise Auth</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
