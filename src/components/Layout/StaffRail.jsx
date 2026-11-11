import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo2 from '../../assets/images/logo2.png';
import { Home, Users, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Avatar } from './Avatar';

/** Icon rail shared by the staff Dashboard and Team page - same visual
 *  language as the admin panel's rail (AdminLayout.jsx), so both sides of
 *  the app read as one design system. */
const StaffRail = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-[72px] shrink-0 flex-col items-center justify-between py-5 bg-white border-r border-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden mb-2 p-1.5">
          <img src={logo2} alt="APIIT" className="w-full h-full object-contain" />
        </div>
        <NavLink
          to="/"
          end
          title="Dashboard"
          className={({ isActive }) =>
            `w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              isActive ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`
          }
        >
          <Home className="w-4.5 h-4.5" />
        </NavLink>
        <NavLink
          to="/team"
          title="My team"
          className={({ isActive }) =>
            `w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              isActive ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`
          }
        >
          <Users className="w-4.5 h-4.5" />
        </NavLink>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button title="Help" className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
          <HelpCircle className="w-4.5 h-4.5" />
        </button>
        <button title="Settings" className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
          <Settings className="w-4.5 h-4.5" />
        </button>
        <button
          title="Sign out"
          onClick={logout}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
        <div className="pt-2 mt-1 border-t border-slate-100" title={user?.name || 'Me'}>
          <Avatar user={user} size={36} />
        </div>
      </div>
    </aside>
  );
};

export default StaffRail;
