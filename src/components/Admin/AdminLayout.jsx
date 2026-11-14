import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../hooks/useAdminData';
import { useTeam } from '../../hooks/useTeam';
import ThemeToggle from '../Layout/ThemeToggle';
import logo2 from '../../assets/images/logo2.png';
import {
  Home,
  LayoutGrid,
  ClipboardList,
  Users,
  FolderOpen,
  Headphones,
  LogOut,
  RefreshCw,
} from 'lucide-react';

const PILL_TABS = [
  { label: 'Dashboard', to: '/admin', end: true },
  { label: 'Payroll', to: '/admin/payroll' },
  { label: 'Attendance', to: '/admin/attendance' },
  { label: 'Presence', to: '/admin/presence' },
  { label: 'Reports', to: '/admin/reports' },
];

const RAIL_ICONS = [
  { icon: LayoutGrid, to: '/admin', end: true, label: 'Dashboard' },
  { icon: ClipboardList, to: '/admin/attendance', label: 'Attendance Log' },
  { icon: Home, to: '/admin/payroll', label: 'Payroll Analytics' },
  { icon: Users, to: '/admin/presence', label: 'Presence' },
  { icon: FolderOpen, to: '/admin/reports', label: 'Reports' },
];

/**
 * Shell shared by every /admin/* page: floating rounded-square icon rail,
 * centered top tab bar, and month-scoped data matching the reference UI.
 */
const AdminLayout = () => {
  const { logout } = useAuth();
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

  const tileBase =
    'w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-200 cursor-pointer';
  const tileInactive =
    'bg-[#F2F4F7] text-[#2C3137] border border-white/80 shadow-[0_2px_6px_rgba(15,23,42,0.03)] hover:bg-white';
  const tileActive =
    'bg-[#141619] text-white shadow-[0_4px_12px_rgba(20,22,25,0.22)]';

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#E2E5EC] text-[#1A1D21]">
      {/* Floating Icon Rail matching the reference UI */}
      <aside className="hidden md:flex w-[72px] shrink-0 flex-col items-center justify-between pb-5 pt-3.5 pl-2 select-none">
        <div className="flex flex-col items-center">
          <div className="h-[52px] flex items-center justify-center mb-3">
            <img src={logo2} alt="APIIT" className="w-9 h-9 object-contain" />
          </div>

          <div className="flex flex-col items-center gap-2.5">
            {RAIL_ICONS.map(({ icon: Icon, to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) => `${tileBase} ${isActive ? tileActive : tileInactive}`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
              </NavLink>
            ))}

            <NavLink
              to="/team"
              title="Team Workspace"
              className={({ isActive }) => `${tileBase} ${isActive ? tileActive : tileInactive}`}
            >
              <Users className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </NavLink>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={reload}
            title="Refresh data"
            className={`${tileBase} ${tileInactive}`}
          >
            <Headphones className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>
          <button
            type="button"
            title="Sign out"
            onClick={logout}
            className={`${tileBase} ${tileInactive} hover:text-rose-600 hover:border-rose-100`}
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar matching the reference UI */}
        <header className="shrink-0 px-4 sm:px-6 pt-3.5 pb-3 flex items-center justify-between gap-4">
          <div className="hidden lg:flex items-center gap-2 min-w-[120px]">
            <span className="text-[11px] font-medium text-[#6B7280]">Admin Portal</span>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar mx-auto">
            {PILL_TABS.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `px-4 sm:px-5 py-2.5 rounded-[12px] text-[12.5px] font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4A90E2] text-white shadow-[0_4px_12px_rgba(74,144,226,0.28)]'
                      : 'bg-[#F2F4F7] text-[#4B5563] border border-white/80 hover:bg-white'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0 min-w-[100px] justify-end">
            <ThemeToggle />
            <button
              onClick={reload}
              title="Refresh"
              className="relative w-10 h-10 rounded-[12px] bg-[#F2F4F7] border border-white/80 hover:bg-white flex items-center justify-center text-[#1A1D21] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-4">
          {exportError && (
            <div className="flex items-center gap-2 p-3 rounded-[16px] bg-[#F2F4F7] border border-rose-200 text-rose-600 text-xs">
              {exportError}
            </div>
          )}

          {error ? (
            <div className="flex items-start gap-3 p-4 rounded-[20px] bg-[#F2F4F7] border border-rose-200">
              <div>
                <h4 className="text-sm font-semibold text-rose-600">Could not load admin data</h4>
                <p className="text-xs text-[#6B7280] mt-0.5">{error.message}</p>
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
