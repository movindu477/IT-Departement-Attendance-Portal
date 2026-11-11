import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../hooks/useAdminData';
import { useTeam } from '../../hooks/useTeam';
import { Avatar } from '../Layout/Avatar';
import {
  Heart, Home, Users, FolderOpen, Share2, Settings, HelpCircle, LogOut, RefreshCw,
} from 'lucide-react';

const PILL_TABS = [
  { label: 'Dashboard', to: '/admin', end: true },
  { label: 'Payroll', to: '/admin/payroll' },
  { label: 'Attendance', to: '/admin/attendance' },
  { label: 'Presence', to: '/admin/presence' },
  { label: 'Reports', to: '/admin/reports' },
];

const RAIL_ICONS = [
  { icon: Home, to: '/admin', end: true, label: 'Dashboard' },
  { icon: Users, to: '/team', label: 'Team' },
  { icon: Share2, to: '/admin/presence', label: 'Presence' },
  { icon: FolderOpen, to: '/admin/reports', label: 'Reports' },
];

/**
 * Shell shared by every /admin/* page: icon rail, pill nav, and the
 * month-scoped data every page needs. Child routes read it via
 * useAdminShell() below instead of each re-fetching - there is exactly one
 * useAdminData() call for the whole admin section.
 */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [exportError, setExportError] = useState('');

  const { staff, totals, rates, loading, error, monthKey, reload } = useAdminData(monthDate);
  const { online, byActivity } = useTeam();

  const staffByUid = useMemo(() => Object.fromEntries(staff.map(s => [s.uid, s])), [staff]);
  const shiftMonth = (delta) => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const context = {
    monthDate, monthKey, shiftMonth,
    staff, totals, rates, loading, error, reload,
    online, byActivity, staffByUid,
    exportError, setExportError,
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-slate-100 text-slate-900">
      {/* Icon rail */}
      <aside className="hidden md:flex w-[72px] shrink-0 flex-col items-center justify-between py-5 bg-white border-r border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white mb-2">
            <Heart className="w-4.5 h-4.5" fill="currentColor" />
          </div>
          {RAIL_ICONS.map(({ icon: Icon, to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
            </NavLink>
          ))}
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
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-[76px] px-6 flex items-center gap-4">
          <div className="flex-1 flex justify-center">
            <nav className="flex items-center gap-1 bg-white rounded-full p-1.5 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
              {PILL_TABS.map(tab => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={reload}
              title="Refresh"
              className="w-10 h-10 rounded-full bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Avatar user={user} size={40} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {exportError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-rose-100 text-rose-600 text-xs shadow-sm">
              {exportError}
            </div>
          )}

          {error ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-sm">
              <div>
                <h4 className="text-sm font-semibold text-rose-600">Could not load admin data</h4>
                <p className="text-xs text-slate-500 mt-0.5">{error.message}</p>
              </div>
            </div>
          ) : (
            <Outlet context={context} />
          )}
        </div>
      </div>
    </div>
  );
};

export const useAdminShell = () => useOutletContext();

export default AdminLayout;
