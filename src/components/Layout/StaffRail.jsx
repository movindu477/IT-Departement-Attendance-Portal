import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo2 from '../../assets/images/logo2.png';
import {
  Home,
  LayoutGrid,
  ClipboardList,
  Users,
  Calendar,
  Target,
  Headphones,
  LogOut,
} from 'lucide-react';

/**
 * Floating rounded-square icon rail matching the reference UI design:
 * sits directly on the #E2E5EC canvas with individual #F2F4F7 rounded-square
 * tiles and a solid #141619 dark tile for the active view.
 */
const StaffRail = ({ activeSection = 'dashboard', onSelectSection }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isTeamPage = location.pathname === '/team';

  const handleNav = (section, path = '/') => {
    if (location.pathname !== path) {
      navigate(path);
    }
    if (onSelectSection) {
      onSelectSection(section);
    }
  };

  const tileBase =
    'w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-200 cursor-pointer';
  const tileInactive =
    'bg-[#F2F4F7] text-[#2C3137] border border-white/80 shadow-[0_2px_6px_rgba(15,23,42,0.03)] hover:bg-white';
  const tileActive =
    'bg-[#141619] text-white shadow-[0_4px_12px_rgba(20,22,25,0.22)]';

  return (
    <aside className="hidden md:flex w-[72px] shrink-0 flex-col items-center justify-between pb-5 pt-3.5 pl-2 select-none">
      <div className="flex flex-col items-center">
        {/* Top-left brand mark aligned with the top header bar */}
        <button
          type="button"
          onClick={() => handleNav('dashboard', '/')}
          title="APIIT Attendance Portal"
          className="h-[52px] flex items-center justify-center mb-3 cursor-pointer"
        >
          <img src={logo2} alt="APIIT" className="w-9 h-9 object-contain" />
        </button>

        {/* Main 6-icon stack matching the reference image */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleNav('overview', '/')}
            title="Home Overview"
            className={`${tileBase} ${!isTeamPage && activeSection === 'overview' ? tileActive : tileInactive}`}
          >
            <Home className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>

          <button
            type="button"
            onClick={() => handleNav('dashboard', '/')}
            title="Dashboard"
            className={`${tileBase} ${!isTeamPage && activeSection === 'dashboard' ? tileActive : tileInactive}`}
          >
            <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>

          <button
            type="button"
            onClick={() => handleNav('attendance', '/')}
            title="Attendance Overview"
            className={`${tileBase} ${!isTeamPage && activeSection === 'attendance' ? tileActive : tileInactive}`}
          >
            <ClipboardList className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>

          <NavLink
            to="/team"
            title="My Team"
            className={({ isActive }) => `${tileBase} ${isActive ? tileActive : tileInactive}`}
          >
            <Users className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </NavLink>

          <button
            type="button"
            onClick={() => handleNav('schedule', '/')}
            title="Monthly Schedule & Calendar"
            className={`${tileBase} ${!isTeamPage && activeSection === 'schedule' ? tileActive : tileInactive}`}
          >
            <Calendar className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>

          <button
            type="button"
            onClick={() => handleNav('insights', '/')}
            title="Hours & Pace Insights"
            className={`${tileBase} ${!isTeamPage && activeSection === 'insights' ? tileActive : tileInactive}`}
          >
            <Target className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* Bottom 2-icon stack matching the reference image */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={() => handleNav('schedule', '/')}
          title="Support & Quick Log"
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
  );
};

export default StaffRail;
